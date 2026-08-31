import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { LINE_OVERRIDES, ACCOUNT_LABELS } from '../utils/masterData';

interface CreditLineState {
  lines: Record<string, number>;
  labels: Record<string, string>;
  setCreditLine: (entity: string, amount: number) => void;
  setAccountLabel: (entity: string, label: string) => void;
  resetDefaults: () => void;
}

export const useCreditLineStore = create<CreditLineState>()(
  persist(
    (set) => ({
      lines: { ...LINE_OVERRIDES },
      labels: { ...ACCOUNT_LABELS },
      setCreditLine: (entity, amount) =>
        set((state) => {
          const updated = { ...state.lines, [entity]: Math.max(0, amount) };
          try {
            localStorage.setItem('finper_line_overrides', JSON.stringify(updated));
          } catch {}
          return { lines: updated };
        }),
      setAccountLabel: (entity, label) =>
        set((state) => {
          const updated = { ...state.labels, [entity]: label };
          try {
            localStorage.setItem('finper_account_labels', JSON.stringify(updated));
          } catch {}
          return { labels: updated };
        }),
      resetDefaults: () =>
        set(() => {
          try {
            localStorage.removeItem('finper_line_overrides');
            localStorage.removeItem('finper_account_labels');
          } catch {}
          return {
            lines: { ...LINE_OVERRIDES },
            labels: { ...ACCOUNT_LABELS },
          };
        }),
    }),
    {
      name: 'finper_credit_lines_v2',
    }
  )
);
