import { create } from 'zustand';

export interface CategoryBudget {
  categoryId: string; // e.g. 'comida', 'supermercado'
  monthlyLimit: number;
}

const LS_BUDGETS_KEY = 'finper_category_budgets_v1';

export const DEFAULT_BUDGETS: Record<string, number> = {
  comida: 800,
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
  } catch {}
  return DEFAULT_BUDGETS;
}

interface BudgetState {
  budgets: Record<string, number>;
  setBudget: (categoryId: string, limit: number) => void;
  setAllBudgets: (newBudgets: Record<string, number>) => void;
  resetToDefaults: () => void;
}

export const useBudgetStore = create<BudgetState>((set) => ({
  budgets: loadInitialBudgets(),

  setBudget: (categoryId, limit) => {
    set((state) => {
      const updated = { ...state.budgets, [categoryId]: Math.max(0, limit) };
      try {
        localStorage.setItem(LS_BUDGETS_KEY, JSON.stringify(updated));
      } catch {}
      return { budgets: updated };
    });
  },

  setAllBudgets: (newBudgets) => {
    try {
      localStorage.setItem(LS_BUDGETS_KEY, JSON.stringify(newBudgets));
    } catch {}
    set({ budgets: newBudgets });
  },

  resetToDefaults: () => {
    try {
      localStorage.setItem(LS_BUDGETS_KEY, JSON.stringify(DEFAULT_BUDGETS));
    } catch {}
    set({ budgets: DEFAULT_BUDGETS });
  },
}));
