import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  saveSavingsGoalsToSupabase,
  fetchSavingsGoalsFromSupabase,
} from '../services/supabaseService';

export interface SavingsGoal {
  id: string;
  title: string;
  emoji: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  category?: string;
  createdAt: string;
}

interface SavingsGoalsState {
  goals: SavingsGoal[];
  addGoal: (goal: Omit<SavingsGoal, 'id' | 'createdAt'>) => void;
  depositToGoal: (id: string, amount: number) => void;
  withdrawFromGoal: (id: string, amount: number) => void;
  updateGoal: (id: string, updates: Partial<SavingsGoal>) => void;
  deleteGoal: (id: string) => void;
  syncFromSupabase: () => Promise<void>;
  saveToSupabase: () => Promise<void>;
}

const DEFAULT_GOALS: SavingsGoal[] = [
  {
    id: 'goal-1',
    title: 'Fondo de Emergencia',
    emoji: '🛡️',
    targetAmount: 6000,
    currentAmount: 2400,
    deadline: '2026-12-31',
    category: 'Seguridad',
    createdAt: '2026-01-01',
  },
  {
    id: 'goal-2',
    title: 'Equipamiento & Laptop Pro',
    emoji: '💻',
    targetAmount: 4500,
    currentAmount: 1800,
    deadline: '2026-11-30',
    category: 'Tecnología',
    createdAt: '2026-03-01',
  },
  {
    id: 'goal-3',
    title: 'Vacaciones & Viaje',
    emoji: '✈️',
    targetAmount: 2500,
    currentAmount: 950,
    deadline: '2027-02-28',
    category: 'Ocio',
    createdAt: '2026-05-01',
  },
];

export const useSavingsGoalsStore = create<SavingsGoalsState>()(
  persist(
    (set, get) => ({
      goals: DEFAULT_GOALS,

      addGoal: (goalData) => {
        const newGoal: SavingsGoal = {
          ...goalData,
          id: `goal-${Date.now()}`,
          createdAt: new Date().toISOString().split('T')[0],
        };
        set((state) => {
          const updated = [...state.goals, newGoal];
          saveSavingsGoalsToSupabase(updated).catch(() => {});
          return { goals: updated };
        });
      },

      depositToGoal: (id, amount) => {
        set((state) => {
          const updated = state.goals.map((g) =>
            g.id === id ? { ...g, currentAmount: Math.max(0, g.currentAmount + amount) } : g
          );
          saveSavingsGoalsToSupabase(updated).catch(() => {});
          return { goals: updated };
        });
      },

      withdrawFromGoal: (id, amount) => {
        set((state) => {
          const updated = state.goals.map((g) =>
            g.id === id ? { ...g, currentAmount: Math.max(0, g.currentAmount - amount) } : g
          );
          saveSavingsGoalsToSupabase(updated).catch(() => {});
          return { goals: updated };
        });
      },

      updateGoal: (id, updates) => {
        set((state) => {
          const updated = state.goals.map((g) => (g.id === id ? { ...g, ...updates } : g));
          saveSavingsGoalsToSupabase(updated).catch(() => {});
          return { goals: updated };
        });
      },

      deleteGoal: (id) => {
        set((state) => {
          const updated = state.goals.filter((g) => g.id !== id);
          saveSavingsGoalsToSupabase(updated).catch(() => {});
          return { goals: updated };
        });
      },

      syncFromSupabase: async () => {
        try {
          const remote = await fetchSavingsGoalsFromSupabase();
          if (remote && Array.isArray(remote) && remote.length > 0) {
            set({ goals: remote });
          } else {
            const currentGoals = get().goals;
            if (currentGoals && currentGoals.length > 0) {
              saveSavingsGoalsToSupabase(currentGoals).catch(() => {});
            }
          }
        } catch (err) {
          console.warn('syncFromSupabase savings goals error:', err);
        }
      },

      saveToSupabase: async () => {
        const { goals } = get();
        await saveSavingsGoalsToSupabase(goals);
      },
    }),
    {
      name: 'finper_savings_goals',
    }
  )
);
