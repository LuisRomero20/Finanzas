import { create } from 'zustand';
import type { Transaction } from '../store/financeStore';
import {
  saveBridgeConfigToSupabase,
  fetchBridgeConfigFromSupabase,
} from '../services/supabaseService';

export type BridgeMovementType = 'Ambos' | 'Ingresos' | 'Egresos';

export interface MonthBridgeConfig {
  targetMonth?: string;
  enabled: boolean;
  includedDays: number[];
  movementType: BridgeMovementType;
  includeInDashboardTotals: boolean;
}

interface PrevMonthBridgeState {
  configs: Record<string, MonthBridgeConfig>;
  getConfig: (currentMonth: string) => MonthBridgeConfig;
  setEnabled: (currentMonth: string, enabled: boolean) => void;
  setMovementType: (currentMonth: string, type: BridgeMovementType) => void;
  setIncludeInDashboardTotals: (currentMonth: string, include: boolean) => void;
  setIncludedDays: (currentMonth: string, days: number[]) => void;
  toggleDay: (currentMonth: string, day: number) => void;
  getPreviousMonthName: (currentMonth: string) => string;
  getBridgedTransactions: (currentMonth: string, allTransactions: Transaction[]) => Transaction[];
  syncFromSupabase: () => Promise<void>;
}

const STORAGE_KEY = 'finper_prev_month_bridge_v1';

export const MESES_ORDENADOS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Setiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export function getPreviousMonth(currentMonth: string): string {
  const normalized = currentMonth === 'Septiembre' ? 'Setiembre' : currentMonth;
  const idx = MESES_ORDENADOS.indexOf(normalized);
  if (idx <= 0) return 'Diciembre';
  return MESES_ORDENADOS[idx - 1];
}

const DEFAULT_CONFIG: MonthBridgeConfig = {
  enabled: false,
  includedDays: [31],
  movementType: 'Ambos',
  includeInDashboardTotals: true,
};

function loadStoredConfigs(): Record<string, MonthBridgeConfig> {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    }
  } catch (e) {
    console.warn('Error reading prev_month_bridge configs:', e);
  }
  return {
    Setiembre: {
      enabled: false,
      includedDays: [31],
      movementType: 'Ambos',
      includeInDashboardTotals: true,
    },
  };
}

function saveConfigs(configs: Record<string, MonthBridgeConfig>) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
    }
  } catch (e) {
    console.warn('Error saving prev_month_bridge configs:', e);
  }
  saveBridgeConfigToSupabase(configs).catch(() => {});
}

export const usePrevMonthBridgeStore = create<PrevMonthBridgeState>((set, get) => ({
  configs: loadStoredConfigs(),

  getConfig: (currentMonth: string) => {
    const active = currentMonth === 'Todos' ? 'Setiembre' : currentMonth;
    const found = get().configs[active];
    return {
      ...DEFAULT_CONFIG,
      targetMonth: active,
      ...(found || {}),
    };
  },

  setEnabled: (currentMonth: string, enabled: boolean) => {
    const active = currentMonth === 'Todos' ? 'Setiembre' : currentMonth;
    set((state) => {
      const current = state.configs[active] || { ...DEFAULT_CONFIG };
      const updated = {
        ...state.configs,
        [active]: { ...current, enabled },
      };
      saveConfigs(updated);
      return { configs: updated };
    });
  },

  setMovementType: (currentMonth: string, movementType: BridgeMovementType) => {
    const active = currentMonth === 'Todos' ? 'Setiembre' : currentMonth;
    set((state) => {
      const current = state.configs[active] || { ...DEFAULT_CONFIG };
      const updated = {
        ...state.configs,
        [active]: { ...current, movementType },
      };
      saveConfigs(updated);
      return { configs: updated };
    });
  },

  setIncludeInDashboardTotals: (currentMonth: string, includeInDashboardTotals: boolean) => {
    const active = currentMonth === 'Todos' ? 'Setiembre' : currentMonth;
    set((state) => {
      const current = state.configs[active] || { ...DEFAULT_CONFIG };
      const updated = {
        ...state.configs,
        [active]: { ...current, includeInDashboardTotals },
      };
      saveConfigs(updated);
      return { configs: updated };
    });
  },

  setIncludedDays: (currentMonth: string, days: number[]) => {
    const active = currentMonth === 'Todos' ? 'Setiembre' : currentMonth;
    set((state) => {
      const current = state.configs[active] || { ...DEFAULT_CONFIG };
      const updated = {
        ...state.configs,
        [active]: { ...current, includedDays: [...days].sort((a, b) => a - b) },
      };
      saveConfigs(updated);
      return { configs: updated };
    });
  },

  toggleDay: (currentMonth: string, day: number) => {
    const active = currentMonth === 'Todos' ? 'Setiembre' : currentMonth;
    set((state) => {
      const current = state.configs[active] || { ...DEFAULT_CONFIG };
      const exists = current.includedDays.includes(day);
      const newDays = exists
        ? current.includedDays.filter((d) => d !== day)
        : [...current.includedDays, day].sort((a, b) => a - b);
      const updated = {
        ...state.configs,
        [active]: {
          ...current,
          includedDays: newDays,
          enabled: newDays.length > 0 ? true : current.enabled,
        },
      };
      saveConfigs(updated);
      return { configs: updated };
    });
  },

  getPreviousMonthName: (currentMonth: string) => {
    const active = currentMonth === 'Todos' ? 'Setiembre' : currentMonth;
    return getPreviousMonth(active);
  },

  getBridgedTransactions: (currentMonth: string, allTransactions: Transaction[]) => {
    const active = currentMonth === 'Todos' ? 'Setiembre' : currentMonth;
    const config = get().configs[active];
    if (!config || !config.enabled || config.includedDays.length === 0) {
      return [];
    }

    const prevMonthName = getPreviousMonth(active);
    const daySet = new Set(config.includedDays);

    return (allTransactions || [])
      .filter((t) => {
        const mes = t.Mes || (t as any).mes;
        if (mes !== prevMonthName) return false;

        const fecha = t.Fecha || (t as any).fecha || '';
        let day = 0;
        if (fecha.includes('-')) {
          day = parseInt(fecha.split('-')[2], 10);
        } else if (fecha.includes('/')) {
          day = parseInt(fecha.split('/')[0], 10);
        }

        if (!daySet.has(day)) return false;

        const tipo = t.Tipo || (t as any).tipo;
        if (config.movementType === 'Ingresos' && tipo !== 'Ingreso') return false;
        if (config.movementType === 'Egresos' && tipo !== 'Egreso') return false;

        return true;
      })
      .map((t) => ({
        ...t,
        isBridgedFromPrevMonth: true,
        bridgedTargetMonth: active,
      }));
  },

  syncFromSupabase: async () => {
    try {
      const cloudConfigs = await fetchBridgeConfigFromSupabase();
      if (cloudConfigs && Object.keys(cloudConfigs).length > 0) {
        set((state) => ({
          configs: { ...state.configs, ...cloudConfigs },
        }));
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...get().configs, ...cloudConfigs }));
        }
      }
    } catch (e) {
      console.warn('Error syncing bridge configs from Supabase:', e);
    }
  },
}));
