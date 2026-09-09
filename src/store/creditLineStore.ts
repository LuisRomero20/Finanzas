import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { LINE_OVERRIDES, ACCOUNT_LABELS } from '../utils/masterData';
import {
  saveCreditLinesConfigToSupabase,
  fetchCreditLinesConfigFromSupabase,
} from '../services/supabaseService';

interface CreditLineState {
  lines: Record<string, number>;
  labels: Record<string, string>;
  setCreditLine: (entity: string, amount: number) => void;
  setAccountLabel: (entity: string, label: string) => void;
  resetDefaults: () => void;
  syncFromSupabase: () => Promise<void>;
}

export const useCreditLineStore = create<CreditLineState>()(
  persist(
    (set, get) => ({
      lines: { ...LINE_OVERRIDES },
      labels: { ...ACCOUNT_LABELS },
      setCreditLine: (entity, amount) =>
        set((state) => {
          const updated = { ...state.lines, [entity]: Math.max(0, amount) };
          try {
            localStorage.setItem('finper_line_overrides', JSON.stringify(updated));
          } catch {}
          // Sincronizar con Supabase para otros dispositivos
          saveCreditLinesConfigToSupabase(updated, get().labels).catch(() => {});
          return { lines: updated };
        }),
      setAccountLabel: (entity, label) =>
        set((state) => {
          const updated = { ...state.labels, [entity]: label };
          try {
            localStorage.setItem('finper_account_labels', JSON.stringify(updated));
          } catch {}
          // Sincronizar con Supabase para otros dispositivos
          saveCreditLinesConfigToSupabase(get().lines, updated).catch(() => {});
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
      syncFromSupabase: async () => {
        try {
          const cloudConfig = await fetchCreditLinesConfigFromSupabase();
          if (cloudConfig) {
            set((state) => ({
              lines: { ...state.lines, ...cloudConfig.lines },
              labels: { ...state.labels, ...cloudConfig.labels },
            }));
          }
        } catch (e) {
          console.warn('Error syncing credit lines from Supabase:', e);
        }
      },
    }),
    {
      name: 'finper_credit_lines_v2',
    }
  )
);
