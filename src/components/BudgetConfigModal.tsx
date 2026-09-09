import React, { useState, useEffect, useMemo } from 'react';
import { useBudgetStore, DEFAULT_BUDGETS, type BudgetMode } from '../store/budgetStore';
import { CATEGORIAS_PERSONALES } from '../utils/categoryClassification';
import {
  X,
  Sparkles,
  Edit3,
  Check,
  RotateCcw,
  SlidersHorizontal,
  Search,
  CheckCircle2,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  selectedMonth: string;
  categorySpent: Record<string, number>;
}

const fmt = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' });

export const BudgetConfigModal: React.FC<Props> = ({
  isOpen,
  onClose,
  selectedMonth,
  categorySpent,
}) => {
  const { budgets, budgetModes, setAllBudgets } = useBudgetStore();
  const [draftBudgets, setDraftBudgets] = useState<Record<string, number>>({});
  const [draftModes, setDraftModes] = useState<Record<string, BudgetMode>>({});
  const [searchQuery, setSearchQuery] = useState('');

  // Sincronizar estado inicial al abrir
  useEffect(() => {
    if (isOpen) {
      setDraftBudgets({ ...budgets });
      setDraftModes({ ...budgetModes });
      setSearchQuery('');
    }
  }, [isOpen, budgets, budgetModes]);

  const categories = useMemo(() => {
    return CATEGORIAS_PERSONALES.filter(c => c.tipo === 'Egreso' || c.tipo === 'Ambos');
  }, []);

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const q = searchQuery.toLowerCase();
    return categories.filter(c => c.nombre.toLowerCase().includes(q));
  }, [categories, searchQuery]);

  if (!isOpen) return null;

  const handleApplyAllSuggested = () => {
    const newBudgets: Record<string, number> = {};
    const newModes: Record<string, BudgetMode> = {};
    for (const cat of categories) {
      newBudgets[cat.id] = DEFAULT_BUDGETS[cat.id] || 0;
      newModes[cat.id] = 'sugerido';
    }
    setDraftBudgets(newBudgets);
    setDraftModes(newModes);
  };

  const handleApplySingleSuggested = (catId: string) => {
    const suggested = DEFAULT_BUDGETS[catId] || 0;
    setDraftBudgets(prev => ({ ...prev, [catId]: suggested }));
    setDraftModes(prev => ({ ...prev, [catId]: 'sugerido' }));
  };

  const handleSetManualMode = (catId: string) => {
    setDraftModes(prev => ({ ...prev, [catId]: 'manual' }));
  };

  const handleCustomAmountChange = (catId: string, value: string) => {
    const num = parseFloat(value);
    setDraftBudgets(prev => ({ ...prev, [catId]: isNaN(num) ? 0 : Math.max(0, num) }));
    setDraftModes(prev => ({ ...prev, [catId]: 'manual' }));
  };

  const handleSave = () => {
    setAllBudgets(draftBudgets, draftModes);
    onClose();
  };

  const totalDraftBudget = Object.values(draftBudgets).reduce((a, b) => a + b, 0);
  const countSugeridos = Object.values(draftModes).filter(m => m === 'sugerido').length;
  const countManual = categories.length - countSugeridos;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#11191D] w-full max-w-4xl max-h-[92vh] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/30">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-emerald-700 flex items-center justify-center text-white shadow-md shadow-emerald-700/20">
              <SlidersHorizontal size={20} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                Configuración de Presupuestos Semafóricos
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  {selectedMonth}
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Indica por cada presupuesto si deseas aplicar el <strong>valor sugerido</strong> o ingresarlo <strong>por tu cuenta</strong>.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Global Toolbar */}
        <div className="px-5 sm:px-6 py-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-[#11191D] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar categoría..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleApplyAllSuggested}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold transition cursor-pointer shadow-xs"
              title="Aplicar valores recomendados en todas las categorías"
            >
              <Sparkles size={13} />
              <span>Aplicar todos los sugeridos</span>
            </button>
          </div>
        </div>

        {/* Categories List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredCategories.map(cat => {
              const spent = categorySpent[cat.id] || 0;
              const currentVal = draftBudgets[cat.id] ?? 0;
              const suggestedVal = DEFAULT_BUDGETS[cat.id] || 0;
              const mode = draftModes[cat.id] || (currentVal === suggestedVal ? 'sugerido' : 'manual');
              const isSuggestedActive = mode === 'sugerido';

              return (
                <div
                  key={cat.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isSuggestedActive
                      ? 'border-emerald-200/80 dark:border-emerald-900/60 bg-emerald-50/20 dark:bg-emerald-950/10'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#141E22]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-2xl shrink-0">{cat.emoji}</span>
                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                          {cat.nombre}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Gastado en {selectedMonth}: <strong className="text-slate-700 dark:text-slate-200">{fmt.format(spent)}</strong>
                        </p>
                      </div>
                    </div>

                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0 ${
                      isSuggestedActive
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                    }`}>
                      {isSuggestedActive ? '✨ Sugerido' : '✏️ Por mi cuenta'}
                    </span>
                  </div>

                  {/* Selector: ¿Sugerido o Por mi cuenta? */}
                  <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="grid grid-cols-2 gap-2">
                      {/* Opción 1: Valor Sugerido */}
                      <button
                        type="button"
                        onClick={() => handleApplySingleSuggested(cat.id)}
                        className={`p-2 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                          isSuggestedActive
                            ? 'border-emerald-500 bg-emerald-500/10 text-emerald-900 dark:text-emerald-300 font-bold ring-2 ring-emerald-500/20'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase tracking-wider font-extrabold flex items-center gap-1">
                            <Sparkles size={11} className={isSuggestedActive ? 'text-emerald-600' : 'text-slate-400'} />
                            Sugerido
                          </span>
                          {isSuggestedActive && <CheckCircle2 size={12} className="text-emerald-600" />}
                        </div>
                        <span className="text-xs font-black mt-1 text-slate-900 dark:text-white">
                          {fmt.format(suggestedVal)}
                        </span>
                      </button>

                      {/* Opción 2: Por mi cuenta */}
                      <button
                        type="button"
                        onClick={() => handleSetManualMode(cat.id)}
                        className={`p-2 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                          !isSuggestedActive
                            ? 'border-purple-500 bg-purple-500/10 text-purple-900 dark:text-purple-300 font-bold ring-2 ring-purple-500/20'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase tracking-wider font-extrabold flex items-center gap-1">
                            <Edit3 size={11} className={!isSuggestedActive ? 'text-purple-600' : 'text-slate-400'} />
                            Por mi cuenta
                          </span>
                          {!isSuggestedActive && <CheckCircle2 size={12} className="text-purple-600" />}
                        </div>
                        <span className="text-xs font-black mt-1 text-slate-900 dark:text-white truncate">
                          {!isSuggestedActive ? fmt.format(currentVal) : 'Personalizar'}
                        </span>
                      </button>
                    </div>

                    {/* Input para ingresar valor personalizado si está en "Por mi cuenta" */}
                    {!isSuggestedActive && (
                      <div className="flex items-center gap-2 pt-1 animate-in fade-in">
                        <span className="text-xs font-bold text-slate-400">Tope:</span>
                        <div className="relative flex-1">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">S/</span>
                          <input
                            type="number"
                            step="10"
                            min="0"
                            value={currentVal || ''}
                            onChange={e => handleCustomAmountChange(cat.id, e.target.value)}
                            placeholder="0.00"
                            className="w-full pl-7 pr-3 py-1.5 bg-white dark:bg-slate-800 border border-purple-300 dark:border-purple-800 rounded-xl text-xs font-black text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            <span>Presupuesto Total: <strong className="text-slate-900 dark:text-white font-black">{fmt.format(totalDraftBudget)}</strong></span>
            <span className="mx-2">•</span>
            <span>{countSugeridos} sugeridos</span>
            <span className="mx-1">/</span>
            <span>{countManual} por tu cuenta</span>
          </div>

          <div className="flex items-center gap-2.5 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm cursor-pointer"
            >
              <Check size={14} />
              <span>Guardar Presupuestos</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
