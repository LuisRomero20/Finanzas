import React, { useState, useMemo } from 'react';
import { useBudgetStore } from '../store/budgetStore';
import { useFinanceStore, type Transaction } from '../store/financeStore';
import { CATEGORIAS_PERSONALES, autoClassify, getCategoryByIdOrLabel } from '../utils/categoryClassification';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import {
  Target,
  AlertTriangle,
  CheckCircle2,
  SlidersHorizontal,
  Edit2,
  X,
  RotateCcw,
  TrendingDown,
  Sparkles,
} from 'lucide-react';

const fmt = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' });

export const BudgetOverviewWidget: React.FC = () => {
  const { budgets, setBudget, resetToDefaults } = useBudgetStore();
  const { transactions, selectedMonth } = useFinanceStore();
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [tempAmount, setTempAmount] = useState<string>('');
  const [soloAlertas, setSoloAlertas] = useState(false);

  // Calcular gasto real del mes seleccionado por categoría
  const categorySpent = useMemo(() => {
    const map: Record<string, number> = {};
    const monthTxs = transactions.filter(t => t.Mes === selectedMonth && t.Tipo === 'Egreso');
    
    monthTxs.forEach(t => {
      const catId = autoClassify(t);
      if (catId) {
        map[catId] = (map[catId] || 0) + t.Monto;
      }
    });
    return map;
  }, [transactions, selectedMonth]);

  // Lista de categorías de egresos con sus presupuestos y consumos
  const budgetList = useMemo(() => {
    return CATEGORIAS_PERSONALES
      .filter(c => c.tipo === 'Egreso' || c.tipo === 'Ambos')
      .map(cat => {
        const spent = categorySpent[cat.id] || 0;
        const limit = budgets[cat.id] || 0;
        const pct = limit > 0 ? Math.round((spent / limit) * 100) : 0;
        const diff = limit - spent;
        
        let status: 'normal' | 'warning' | 'danger' = 'normal';
        if (pct >= 100) status = 'danger';
        else if (pct >= 75) status = 'warning';

        return {
          cat,
          spent,
          limit,
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
  }, [categorySpent, budgets, soloAlertas]);

  const totalBudget = useMemo(() => {
    return Object.values(budgets).reduce((acc, val) => acc + val, 0);
  }, [budgets]);

  const totalSpentInMonth = useMemo(() => {
    return Object.values(categorySpent).reduce((acc, val) => acc + val, 0);
  }, [categorySpent]);

  const totalPct = totalBudget > 0 ? Math.round((totalSpentInMonth / totalBudget) * 100) : 0;
  const countAlerts = budgetList.filter(b => b.status === 'danger' || b.status === 'warning').length;

  const handleSaveBudget = (catId: string) => {
    const val = parseFloat(tempAmount);
    if (!isNaN(val) && val >= 0) {
      setBudget(catId, val);
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

        <div className="flex items-center gap-3 flex-wrap">
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
              if (confirm('¿Restablecer presupuestos a los valores estándar sugeridos?')) {
                resetToDefaults();
              }
            }}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-xl transition cursor-pointer"
            title="Restablecer presupuestos por defecto"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* Global Month Budget Summary Meter */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Sparkles size={14} className="text-emerald-600" />
            Consumo Presupuestario Global del Mes ({selectedMonth})
          </span>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 max-h-[460px] overflow-y-auto pr-1">
        {budgetList.map(item => {
          const isEditing = editingCatId === item.cat.id;

          let statusBg = 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#141E22]';
          let badgeVariant: 'success' | 'warning' | 'error' = 'success';
          let progressBg = 'bg-emerald-500';

          if (item.status === 'danger') {
            statusBg = 'border-rose-300 dark:border-rose-900 bg-rose-50/40 dark:bg-rose-950/20';
            badgeVariant = 'error';
            progressBg = 'bg-rose-500';
          } else if (item.status === 'warning') {
            statusBg = 'border-amber-300 dark:border-amber-900 bg-amber-50/40 dark:bg-amber-950/20';
            badgeVariant = 'warning';
            progressBg = 'bg-amber-500';
          }

          return (
            <div
              key={item.cat.id}
              className={`p-4 rounded-2xl border ${statusBg} transition-all shadow-xs flex flex-col justify-between space-y-3`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xl">{item.cat.emoji}</span>
                  <div className="min-w-0">
                    <p className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate">
                      {item.cat.nombre}
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">
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
                    title="Editar límite mensual"
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
                  <span>Tope: {fmt.format(item.limit)}</span>
                  <span className={item.diff < 0 ? 'text-rose-600 dark:text-rose-400 font-bold' : ''}>
                    {item.diff >= 0 ? `Quedan ${fmt.format(item.diff)}` : `Excedido +${fmt.format(Math.abs(item.diff))}`}
                  </span>
                </div>
              </div>

              {/* Form de edición rápida */}
              {isEditing && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center gap-2 animate-in fade-in">
                  <span className="text-xs font-bold text-slate-400">S/</span>
                  <input
                    type="number"
                    step="10"
                    autoFocus
                    value={tempAmount}
                    onChange={e => setTempAmount(e.target.value)}
                    className="w-20 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-1 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <button
                    onClick={() => handleSaveBudget(item.cat.id)}
                    className="px-2 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition cursor-pointer"
                  >
                    OK
                  </button>
                  <button
                    onClick={() => setEditingCatId(null)}
                    className="p-1 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
