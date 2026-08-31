import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
    (set) => ({
      goals: DEFAULT_GOALS,

      addGoal: (goalData) =>
        set((state) => ({
          goals: [
            ...state.goals,
            {
              ...goalData,
              id: `goal-${Date.now()}`,
              createdAt: new Date().toISOString().split('T')[0],
            },
          ],
        })),

      depositToGoal: (id, amount) =>
        set((state) => ({
          goals: state.goals.map((g) =>
            g.id === id ? { ...g, currentAmount: Math.max(0, g.currentAmount + amount) } : g
          ),
        })),

      withdrawFromGoal: (id, amount) =>
        set((state) => ({
          goals: state.goals.map((g) =>
            g.id === id ? { ...g, currentAmount: Math.max(0, g.currentAmount - amount) } : g
          ),
        })),

      updateGoal: (id, updates) =>
        set((state) => ({
          goals: state.goals.map((g) => (g.id === id ? { ...g, ...updates } : g)),
        })),

      deleteGoal: (id) =>
        set((state) => ({
          goals: state.goals.filter((g) => g.id !== id),
        })),
    }),
    {
      name: 'finper_savings_goals',
    }
  )
);
