import { create } from 'zustand';

export type BudgetMode = 'sugerido' | 'manual';

export interface CategoryBudget {
  categoryId: string; // e.g. 'comida', 'supermercado'
  monthlyLimit: number;
  mode?: BudgetMode;
}

const LS_BUDGETS_KEY = 'finper_category_budgets_v1';
const LS_BUDGET_MODES_KEY = 'finper_category_budget_modes_v1';

export const DEFAULT_BUDGETS: Record<string, number> = {
  comida: 500,
  supermercado: 350,
  servicios_facturas: 450,
  hogar: 150,
  ropa: 250,
  entretenimiento: 120,
  tecnologia: 200,
  conciertos: 300,
  regalos: 200,
  viajes: 500,
  salud: 200,
  cuidado_personal: 150,
  transporte: 150,
  bazar: 150,
  salidas: 250,
  ocio: 200,
  tramites: 100,
  transferencias: 300,
  deudas: 1000,
};

function loadInitialBudgets(): Record<string, number> {
  try {
    const saved = localStorage.getItem(LS_BUDGETS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (typeof parsed === 'object' && parsed !== null) {
        return { ...DEFAULT_BUDGETS, ...parsed };
      }
    }
  } catch {
    /* ignore storage error */
  }
  return DEFAULT_BUDGETS;
}

function loadInitialModes(): Record<string, BudgetMode> {
  try {
    const saved = localStorage.getItem(LS_BUDGET_MODES_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (typeof parsed === 'object' && parsed !== null) {
        return parsed;
      }
    }
  } catch {
    /* ignore storage error */
  }
  const initialBudgets = loadInitialBudgets();
  const modes: Record<string, BudgetMode> = {};
  for (const catId of Object.keys(DEFAULT_BUDGETS)) {
    modes[catId] = initialBudgets[catId] === DEFAULT_BUDGETS[catId] ? 'sugerido' : 'manual';
  }
  return modes;
}

interface BudgetState {
  budgets: Record<string, number>;
  budgetModes: Record<string, BudgetMode>;
  setBudget: (categoryId: string, limit: number, mode?: BudgetMode) => void;
  setAllBudgets: (newBudgets: Record<string, number>, newModes?: Record<string, BudgetMode>) => void;
  applySuggested: (categoryId: string) => void;
  applyAllSuggested: () => void;
  resetToDefaults: () => void;
}

export const useBudgetStore = create<BudgetState>((set) => ({
  budgets: loadInitialBudgets(),
  budgetModes: loadInitialModes(),

  setBudget: (categoryId, limit, mode) => {
    set((state) => {
      const cleanLimit = Math.max(0, limit);
      const updatedBudgets = { ...state.budgets, [categoryId]: cleanLimit };
      const determinedMode = mode || (cleanLimit === (DEFAULT_BUDGETS[categoryId] ?? -1) ? 'sugerido' : 'manual');
      const updatedModes = { ...state.budgetModes, [categoryId]: determinedMode };
      try {
        localStorage.setItem(LS_BUDGETS_KEY, JSON.stringify(updatedBudgets));
        localStorage.setItem(LS_BUDGET_MODES_KEY, JSON.stringify(updatedModes));
      } catch {
        /* ignore storage error */
      }
      return { budgets: updatedBudgets, budgetModes: updatedModes };
    });
  },

  setAllBudgets: (newBudgets, newModes) => {
    set((state) => {
      const updatedModes = newModes || { ...state.budgetModes };
      if (!newModes) {
        for (const catId of Object.keys(newBudgets)) {
          updatedModes[catId] = newBudgets[catId] === (DEFAULT_BUDGETS[catId] ?? -1) ? 'sugerido' : 'manual';
        }
      }
      try {
        localStorage.setItem(LS_BUDGETS_KEY, JSON.stringify(newBudgets));
        localStorage.setItem(LS_BUDGET_MODES_KEY, JSON.stringify(updatedModes));
      } catch {
        /* ignore storage error */
      }
      return { budgets: newBudgets, budgetModes: updatedModes };
    });
  },

  applySuggested: (categoryId) => {
    const suggestedVal = DEFAULT_BUDGETS[categoryId] || 0;
    set((state) => {
      const updatedBudgets = { ...state.budgets, [categoryId]: suggestedVal };
      const updatedModes = { ...state.budgetModes, [categoryId]: 'sugerido' as BudgetMode };
      try {
        localStorage.setItem(LS_BUDGETS_KEY, JSON.stringify(updatedBudgets));
        localStorage.setItem(LS_BUDGET_MODES_KEY, JSON.stringify(updatedModes));
      } catch {
        /* ignore storage error */
      }
      return { budgets: updatedBudgets, budgetModes: updatedModes };
    });
  },

  applyAllSuggested: () => {
    const allModes: Record<string, BudgetMode> = {};
    for (const k of Object.keys(DEFAULT_BUDGETS)) {
      allModes[k] = 'sugerido';
    }
    try {
      localStorage.setItem(LS_BUDGETS_KEY, JSON.stringify(DEFAULT_BUDGETS));
      localStorage.setItem(LS_BUDGET_MODES_KEY, JSON.stringify(allModes));
    } catch {
      /* ignore storage error */
    }
    set({ budgets: DEFAULT_BUDGETS, budgetModes: allModes });
  },

  resetToDefaults: () => {
    const allModes: Record<string, BudgetMode> = {};
    for (const k of Object.keys(DEFAULT_BUDGETS)) {
      allModes[k] = 'sugerido';
    }
    try {
      localStorage.setItem(LS_BUDGETS_KEY, JSON.stringify(DEFAULT_BUDGETS));
      localStorage.setItem(LS_BUDGET_MODES_KEY, JSON.stringify(allModes));
    } catch {
      /* ignore storage error */
    }
    set({ budgets: DEFAULT_BUDGETS, budgetModes: allModes });
  },
}));
