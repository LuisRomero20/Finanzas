import React, { useState, useMemo } from 'react';
import { useBudgetStore, DEFAULT_BUDGETS } from '../store/budgetStore';
import { useFinanceStore } from '../store/financeStore';
import { CATEGORIAS_PERSONALES, getEffectiveCategory } from '../utils/categoryClassification';
import { BudgetConfigModal } from './BudgetConfigModal';
import { Badge } from './ui/Badge';
import {
  Target,
  SlidersHorizontal,
  Edit2,
  X,
  RotateCcw,
  Sparkles,
  Check,
} from 'lucide-react';

const fmt = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' });

export const BudgetOverviewWidget: React.FC = () => {
  const { budgets, budgetModes, setBudget, applySuggested, resetToDefaults } = useBudgetStore();
  const { transactions, selectedMonth } = useFinanceStore();
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [tempAmount, setTempAmount] = useState<string>('');
  const [soloAlertas, setSoloAlertas] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  // Calcular gasto real del mes seleccionado por categoría usando categoría efectiva
  const categorySpent = useMemo(() => {
    const map: Record<string, number> = {};
    const monthTxs = transactions.filter(t => t.Mes === selectedMonth && t.Tipo === 'Egreso');
    
    monthTxs.forEach(t => {
      const cat = getEffectiveCategory(t);
      if (cat) {
        map[cat.id] = (map[cat.id] || 0) + t.Monto;
      }
    });
    return map;
  }, [transactions, selectedMonth]);

  // Todas las categorías de egreso disponibles
  const expenseCategories = useMemo(() => {
    return CATEGORIAS_PERSONALES.filter(c => c.tipo === 'Egreso' || c.tipo === 'Ambos');
  }, []);

  // Lista de categorías de egresos con sus presupuestos, modos y consumos
  const budgetList = useMemo(() => {
    return expenseCategories
      .map(cat => {
        const spent = categorySpent[cat.id] || 0;
        const limit = budgets[cat.id] ?? 0;
        const suggestedVal = DEFAULT_BUDGETS[cat.id] ?? 0;
        const mode = budgetModes[cat.id] || (limit === suggestedVal ? 'sugerido' : 'manual');
        const pct = limit > 0 ? Math.round((spent / limit) * 100) : 0;
        const diff = limit - spent;
        
        let status: 'normal' | 'warning' | 'danger' = 'normal';
        if (pct >= 100) status = 'danger';
        else if (pct >= 75) status = 'warning';

        return {
          cat,
          spent,
          limit,
          suggestedVal,
          mode,
          pct,
          diff,
          status,
        };
      })
      .filter(item => {
        if (soloAlertas && item.status === 'normal') return false;
        return true;
      })
      .sort((a, b) => b.pct - a.pct);
  }, [expenseCategories, categorySpent, budgets, budgetModes, soloAlertas]);

  const totalBudget = useMemo(() => {
    return Object.values(budgets).reduce((acc, val) => acc + val, 0);
  }, [budgets]);

  const totalSpentInMonth = useMemo(() => {
    return Object.values(categorySpent).reduce((acc, val) => acc + val, 0);
  }, [categorySpent]);

  const totalPct = totalBudget > 0 ? Math.round((totalSpentInMonth / totalBudget) * 100) : 0;
  const countAlerts = budgetList.filter(b => b.status === 'danger' || b.status === 'warning').length;

  const countSugeridos = expenseCategories.filter(cat => {
    const limit = budgets[cat.id] ?? 0;
    const suggestedVal = DEFAULT_BUDGETS[cat.id] ?? 0;
    const mode = budgetModes[cat.id] || (limit === suggestedVal ? 'sugerido' : 'manual');
    return mode === 'sugerido';
  }).length;
  const countManual = expenseCategories.length - countSugeridos;

  const handleSaveBudget = (catId: string) => {
    const val = parseFloat(tempAmount);
    if (!isNaN(val) && val >= 0) {
      setBudget(catId, val, 'manual');
    }
    setEditingCatId(null);
  };

  return (
    <div className="bg-white dark:bg-[#11191D] rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors space-y-5">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-700 text-white shadow-xs">
              <Target size={20} />
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Control de Presupuestos Semafórico
            </h2>
            <Badge variant={countAlerts > 0 ? 'warning' : 'success'}>
              {countAlerts > 0 ? `${countAlerts} en atención` : 'Todo en regla'}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Límites mensuales para <strong>{selectedMonth}</strong> con alertas semafóricas automáticas.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setIsConfigModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-xs font-bold transition cursor-pointer shadow-xs"
            title="Configurar por cada categoría: Valores sugeridos vs por mi cuenta"
          >
            <SlidersHorizontal size={13} />
            <span>Sugeridos vs Por mi cuenta</span>
          </button>

          <label className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={soloAlertas}
              onChange={e => setSoloAlertas(e.target.checked)}
              className="accent-emerald-600 w-4 h-4 rounded cursor-pointer"
            />
            <span>Solo en alerta (🟡 / 🔴)</span>
          </label>

          <button
            onClick={() => {
              if (confirm('¿Restablecer todos los presupuestos a los valores estándar sugeridos?')) {
                resetToDefaults();
              }
            }}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-xl transition cursor-pointer"
            title="Restablecer todos a valores sugeridos"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* Global Month Budget Summary Meter */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
        <div className="flex items-center justify-between text-xs font-bold">
          <div className="flex items-center gap-2">
            <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5 font-black">
              <Sparkles size={14} className="text-emerald-600" />
              Consumo Presupuestario Global ({selectedMonth})
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
              {countSugeridos} sugeridos • {countManual} manuales
            </span>
          </div>
          <span className={totalPct >= 90 ? 'text-rose-600 dark:text-rose-400 font-black' : 'text-emerald-700 dark:text-emerald-400 font-black'}>
            {fmt.format(totalSpentInMonth)} de {fmt.format(totalBudget)} ({totalPct}%)
          </span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              totalPct >= 90
                ? 'bg-rose-500'
                : totalPct >= 75
                ? 'bg-amber-500'
                : 'bg-emerald-600'
            }`}
            style={{ width: `${Math.min(100, totalPct)}%` }}
          />
        </div>
      </div>

      {/* Cards Grid de Categorías */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 max-h-[480px] overflow-y-auto pr-1">
        {budgetList.map(item => {
          const isEditing = editingCatId === item.cat.id;
          const isSuggested = item.mode === 'sugerido';

          let statusBg = 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#141E22]';
          let progressBg = 'bg-emerald-500';

          if (item.status === 'danger') {
            statusBg = 'border-rose-300 dark:border-rose-900 bg-rose-50/40 dark:bg-rose-950/20';
            progressBg = 'bg-rose-500';
          } else if (item.status === 'warning') {
            statusBg = 'border-amber-300 dark:border-amber-900 bg-amber-50/40 dark:bg-amber-950/20';
            progressBg = 'bg-amber-500';
          }

          return (
            <div
              key={item.cat.id}
              className={`p-4 rounded-2xl border ${statusBg} transition-all shadow-xs flex flex-col justify-between space-y-3`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xl shrink-0">{item.cat.emoji}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate">
                        {item.cat.nombre}
                      </p>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold tracking-wide ${
                        isSuggested
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                      }`}>
                        {isSuggested ? '✨ Sugerido' : '✏️ Por mi cuenta'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                      Gastado: <strong className="text-slate-700 dark:text-slate-300">{fmt.format(item.spent)}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    item.status === 'danger'
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      : item.status === 'warning'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  }`}>
                    {item.pct}%
                  </span>

                  <button
                    onClick={() => {
                      setEditingCatId(item.cat.id);
                      setTempAmount(item.limit.toString());
                    }}
                    className="p-1 text-slate-400 hover:text-emerald-600 transition cursor-pointer"
                    title="Editar límite o cambiar entre sugerido y manual"
                  >
                    <Edit2 size={13} />
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${progressBg}`}
                    style={{ width: `${Math.min(100, item.pct)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                  <span className="font-semibold text-slate-600 dark:text-slate-300">Tope: {fmt.format(item.limit)}</span>
                  <span className={item.diff < 0 ? 'text-rose-600 dark:text-rose-400 font-bold' : ''}>
                    {item.diff >= 0 ? `Quedan ${fmt.format(item.diff)}` : `Excedido +${fmt.format(Math.abs(item.diff))}`}
                  </span>
                </div>
              </div>

              {/* Quick Action: if manual, allow 1-click apply suggested */}
              {!isEditing && !isSuggested && item.suggestedVal > 0 && (
                <div className="flex items-center justify-end">
                  <button
                    onClick={() => applySuggested(item.cat.id)}
                    className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-1 font-bold cursor-pointer transition"
                    title={`Restablecer al valor sugerido: ${fmt.format(item.suggestedVal)}`}
                  >
                    <Sparkles size={10} />
                    <span>Usar sugerido ({fmt.format(item.suggestedVal)})</span>
                  </button>
                </div>
              )}

              {/* Form de edición rápida con opción Sugerido vs Manual */}
              {isEditing && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-2 animate-in fade-in">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        applySuggested(item.cat.id);
                        setEditingCatId(null);
                      }}
                      className="flex-1 flex items-center justify-center gap-1 py-1 px-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-[11px] font-bold transition cursor-pointer"
                      title={`Aplicar valor sugerido: ${fmt.format(item.suggestedVal)}`}
                    >
                      <Sparkles size={11} />
                      <span>Sugerido ({fmt.format(item.suggestedVal)})</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-slate-400 shrink-0">Manual: S/</span>
                    <input
                      type="number"
                      step="10"
                      autoFocus
                      value={tempAmount}
                      onChange={e => setTempAmount(e.target.value)}
                      className="w-20 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-0.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                    <button
                      onClick={() => handleSaveBudget(item.cat.id)}
                      className="px-2 py-0.5 bg-purple-600 text-white rounded-lg text-xs font-bold hover:bg-purple-700 transition cursor-pointer flex items-center gap-1"
                      title="Guardar por mi cuenta"
                    >
                      <Check size={12} />
                      <span>OK</span>
                    </button>
                    <button
                      onClick={() => setEditingCatId(null)}
                      className="p-1 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal de Configuración por Cada Presupuesto */}
      <BudgetConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        selectedMonth={selectedMonth}
        categorySpent={categorySpent}
      />
    </div>
  );
};
