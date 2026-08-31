import { create } from 'zustand';
import type { Transaction, CategoriaType } from '../utils/masterData';
import { masterTransactions, MESES, ENTIDADES, CATEGORIAS } from '../utils/masterData';
import {
  insertTransactionToSupabase,
  deleteTransactionFromSupabase,
  fetchTransactionsFromSupabase,
} from '../services/supabaseService';

export type { Transaction, CategoriaType };
export { MESES, ENTIDADES, CATEGORIAS };

const LS_TX_KEY = 'finper_master_transactions_v1';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Setiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export function getMonthNameFromDate(dateStr: string): string {
  const parts = dateStr.split('-').map(Number);
  if (parts.length >= 2) {
    const m = parts[1];
    if (m >= 1 && m <= 12) return MONTH_NAMES[m - 1];
  }
  return 'Octubre';
}

function safeGetStorage(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem(key);
    }
  } catch {}
  return null;
}

function safeSetStorage(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(key, value);
    }
  } catch {}
}

function safeRemoveStorage(key: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(key);
    }
  } catch {}
}

function loadInitialTransactions(): Transaction[] {
  try {
    const saved = safeGetStorage(LS_TX_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading custom transactions from storage', e);
  }
  return masterTransactions;
}

interface FinanceState {
  transactions: Transaction[];
  selectedMonth: string;
  selectedEntity: string;
  isSyncingCloud: boolean;
  setMonth: (month: string) => void;
  setEntity: (entity: string) => void;
  addTransaction: (tx: Omit<Transaction, 'id'> & { id?: string }) => Transaction;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  confirmTransaction: (id: string) => void;
  deleteTransaction: (id: string) => void;
  getFilteredTransactions: () => Transaction[];
  syncFromSupabase: () => Promise<number>;
  setAllTransactions: (list: Transaction[]) => void;
  resetToMasterData: () => void;
}

export const useFinanceStore = create<FinanceState>((set, get) => ({
  transactions: loadInitialTransactions(),
  selectedMonth: 'Octubre', // Default to current operational month
  selectedEntity: 'Todas',
  isSyncingCloud: false,

  setMonth: (month) => set({ selectedMonth: month }),
  setEntity: (entity) => set({ selectedEntity: entity }),

  addTransaction: (txData) => {
    const id = txData.id || `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const mes = txData.Mes || getMonthNameFromDate(txData.Fecha);
    const newTx: Transaction = {
      id,
      Tipo: txData.Tipo,
      Fecha: txData.Fecha,
      Categoria: txData.Categoria,
      Concepto: txData.Concepto,
      Monto: Number(txData.Monto),
      Entidad: txData.Entidad,
      Mes: mes,
      estado: txData.estado || 'confirmado',
    };

    set((state) => {
      const updated = [newTx, ...state.transactions];
      safeSetStorage(LS_TX_KEY, JSON.stringify(updated));
      return { transactions: updated };
    });

    // Enviar asíncronamente a Supabase en segundo plano
    insertTransactionToSupabase(newTx).catch(err => console.warn('Cloud sync error:', err));

    return newTx;
  },

  updateTransaction: (id: string, updates: Partial<Transaction>) => {
    set((state) => {
      let updatedTx: Transaction | null = null;
      const updated = state.transactions.map((t) => {
        if (t.id === id) {
          updatedTx = { ...t, ...updates };
          return updatedTx;
        }
        return t;
      });
      safeSetStorage(LS_TX_KEY, JSON.stringify(updated));
      if (updatedTx) {
        insertTransactionToSupabase(updatedTx).catch(err => console.warn('Cloud sync update error:', err));
      }
      return { transactions: updated };
    });
  },

  confirmTransaction: (id: string) => {
    get().updateTransaction(id, { estado: 'confirmado' });
  },

  deleteTransaction: (id: string) => {
    set((state) => {
      const updated = state.transactions.filter(t => t.id !== id);
      safeSetStorage(LS_TX_KEY, JSON.stringify(updated));
      return { transactions: updated };
    });

    // Eliminar de Supabase en segundo plano
    deleteTransactionFromSupabase(id).catch(err => console.warn('Cloud delete error:', err));
  },

  getFilteredTransactions: () => {
    const { transactions, selectedMonth, selectedEntity } = get();
    return transactions
      .filter(t => {
        const matchMonth = selectedMonth === 'Todos' || t.Mes === selectedMonth;
        const matchEntity = selectedEntity === 'Todas' || t.Entidad === selectedEntity;
        return matchMonth && matchEntity;
      })
      .sort((a, b) => a.Fecha.localeCompare(b.Fecha));
  },

  syncFromSupabase: async () => {
    set({ isSyncingCloud: true });
    try {
      const cloudData = await fetchTransactionsFromSupabase();
      if (cloudData && cloudData.length > 0) {
        set({ transactions: cloudData, isSyncingCloud: false });
        safeSetStorage(LS_TX_KEY, JSON.stringify(cloudData));
        return cloudData.length;
      }
    } catch (e) {
      console.error('Error syncing from Supabase', e);
    }
    set({ isSyncingCloud: false });
    return 0;
  },

  setAllTransactions: (list: Transaction[]) => {
    safeSetStorage(LS_TX_KEY, JSON.stringify(list));
    set({ transactions: list });
  },

  resetToMasterData: () => {
    safeRemoveStorage(LS_TX_KEY);
    set({ transactions: masterTransactions });
  }
}));
