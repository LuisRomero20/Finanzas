import { create } from 'zustand';
import type { Transaction, CategoriaType } from '../utils/masterData';
import { masterTransactions, MESES, ENTIDADES, CATEGORIAS } from '../utils/masterData';
import {
  fetchTransactionsFromSupabase,
} from '../services/supabaseService';
import { broadcastRealtimeSync } from '../utils/syncBus';
import { enqueueTransaction, flushTransactions, pendingTransactions, transactionRevision } from '../services/transactionOutbox';

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
  return getCurrentMonthName();
}

export function getCurrentMonthName(): string {
  const currentMonthIdx = new Date().getMonth();
  return MONTH_NAMES[currentMonthIdx] || 'Octubre';
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
  addTransaction: (tx: Omit<Transaction, 'id' | 'Mes'> & { id?: string; Mes?: string; idempotencyToken?: string; syncStatus?: Transaction['syncStatus'] }) => Transaction;
  registerPaymentTransaction: (
    tx: Omit<Transaction, 'id' | 'Mes'> & { id?: string; Mes?: string; idempotencyToken?: string; syncStatus?: Transaction['syncStatus'] },
    options?: { skipImmediateFlush?: boolean }
  ) => Promise<{
    transaction: Transaction;
    persistenceState: 'remote_confirmed' | 'local_pending' | 'sync_failed';
    message: string;
  }>;
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
  selectedMonth: getCurrentMonthName(),
  selectedEntity: 'Todas',
  isSyncingCloud: false,

  setMonth: (month) => set({ selectedMonth: month }),
  setEntity: (entity) => set({ selectedEntity: entity }),

  addTransaction: (txData) => {
    const isProvisional = txData.estado === 'provisional' || txData.estado === 'pendiente';
    const id = txData.id || (
      isProvisional
        ? `proy-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
        : `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    );
    const mes = txData.Mes || getMonthNameFromDate(txData.Fecha);
    // Detección automática de cuotas en concepto si no viene explícito
    let detectedCuotas = txData.cuotas;
    if (!detectedCuotas && txData.Concepto) {
      const match = txData.Concepto.match(/\[(\d+)\s*cuotas?\]|\((\d+)\s*cuotas?\)/i);
      if (match) {
        detectedCuotas = parseInt(match[1] || match[2], 10);
      }
    }

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
      createdAt: (txData as any).createdAt || new Date().toISOString(),
      cuotas: detectedCuotas && detectedCuotas > 1 ? detectedCuotas : undefined,
      esCuotas: Boolean(detectedCuotas && detectedCuotas > 1),
      montoTotal: txData.montoTotal ?? (detectedCuotas && detectedCuotas > 1 ? Number(txData.Monto) : undefined),
      montoCuota: txData.montoCuota ?? (detectedCuotas && detectedCuotas > 1 ? Math.round((Number(txData.Monto) / detectedCuotas) * 100) / 100 : undefined),
      mesInicioFacturacion: txData.mesInicioFacturacion,
      syncStatus: txData.syncStatus || 'local_pending',
      idempotencyToken: txData.idempotencyToken,
    };

    set((state) => {
      const existingIdx = state.transactions.findIndex(t => t.id === newTx.id);
      const updated = existingIdx >= 0
        ? state.transactions.map((t, idx) => (idx === existingIdx ? newTx : t))
        : [newTx, ...state.transactions];
      safeSetStorage(LS_TX_KEY, JSON.stringify(updated));
      return { transactions: updated };
    });

    // Enviar asíncronamente a Supabase en segundo plano y notificar en tiempo real
    enqueueTransaction(newTx.id, newTx);
    broadcastRealtimeSync('transactions');

    return newTx;
  },

  registerPaymentTransaction: async (txData, options) => {
    // 1. Guardar localmente de forma idempotente con estado inicial 'local_pending'
    const tx = get().addTransaction({
      ...txData,
      syncStatus: txData.syncStatus || 'local_pending',
    });

    if (options?.skipImmediateFlush) {
      return {
        transaction: tx,
        persistenceState: 'local_pending',
        message: 'Pago guardado en este dispositivo (en cola para sincronizar con la nube).',
      };
    }

    // 2. Intentar confirmación inmediata con Supabase
    try {
      await flushTransactions(true);
      const remainingPending = pendingTransactions();
      const stillPending = remainingPending.find(op => op.id === tx.id);

      if (!stillPending) {
        // Confirmado exitosamente en Supabase (retirado del outbox)
        const confirmedTx: Transaction = {
          ...tx,
          syncStatus: 'remote_confirmed',
        };
        set((state) => {
          const updated = state.transactions.map(t => (t.id === tx.id ? confirmedTx : t));
          safeSetStorage(LS_TX_KEY, JSON.stringify(updated));
          return { transactions: updated };
        });
        return {
          transaction: confirmedTx,
          persistenceState: 'remote_confirmed',
          message: 'Pago confirmado por Supabase y sincronizado con la nube.',
        };
      } else {
        // Sigue en la cola outbox (falla de red o sin sesión activa)
        const stateTag = stillPending.attempts >= 3 ? 'sync_failed' : 'local_pending';
        return {
          transaction: tx,
          persistenceState: stateTag,
          message: 'Pago guardado localmente en este dispositivo. Se sincronizará automáticamente cuando haya conexión autenticada.',
        };
      }
    } catch {
      return {
        transaction: tx,
        persistenceState: 'local_pending',
        message: 'Pago guardado localmente en este dispositivo. Pendiente de sincronizar a la nube.',
      };
    }
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
        enqueueTransaction(id, updatedTx);
      }
      return { transactions: updated };
    });
    broadcastRealtimeSync('transactions');
  },

  confirmTransaction: (id: string) => {
    const currentTx = get().transactions.find((t) => t.id === id);
    if (!currentTx) return;

    const isProyId = id.startsWith('proy-');
    const newId = isProyId ? `custom-${id.replace(/^proy-/, '')}` : id;
    const cleanConcept = currentTx.Concepto.replace(/\s*[-_]?\s*(?:\[proy\]|\(proy\)|\bproy\b\.?)/gi, '').trim() || currentTx.Concepto;

    const confirmedTx: Transaction = {
      ...currentTx,
      id: newId,
      Concepto: cleanConcept,
      estado: 'confirmado',
    };

    set((state) => {
      const updated = state.transactions.map((t) => (t.id === id ? confirmedTx : t));
      safeSetStorage(LS_TX_KEY, JSON.stringify(updated));
      return { transactions: updated };
    });

    if (isProyId) {
      enqueueTransaction(id);
    }
    enqueueTransaction(confirmedTx.id, confirmedTx);
    broadcastRealtimeSync('transactions');
  },

  deleteTransaction: (id: string) => {
    set((state) => {
      const updated = state.transactions.filter(t => t.id !== id);
      safeSetStorage(LS_TX_KEY, JSON.stringify(updated));
      return { transactions: updated };
    });

    // Eliminar de Supabase en segundo plano y notificar
    enqueueTransaction(id);
    broadcastRealtimeSync('transactions');
  },

  getFilteredTransactions: () => {
    const { transactions, selectedMonth, selectedEntity } = get();
    const list = Array.isArray(transactions) ? transactions : masterTransactions;
    return list
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
      await flushTransactions();
      const beforeRead = transactionRevision();
      const cloudData = await fetchTransactionsFromSupabase();
      // An edit made during the request will be read again on the next sync.
      if (cloudData !== null && beforeRead === transactionRevision()) {
        const merged = new Map(cloudData.map(tx => [tx.id, tx]));
        for (const operation of pendingTransactions()) {
          if (operation.transaction) merged.set(operation.id, operation.transaction);
          else merged.delete(operation.id);
        }
        const transactions = [...merged.values()];
        // Preserve pre-migration local data before the first cloud replacement.
        if (!safeGetStorage('finper_transactions_before_sync_v2')) {
          safeSetStorage('finper_transactions_before_sync_v2', JSON.stringify(get().transactions));
        }
        safeSetStorage(LS_TX_KEY, JSON.stringify(transactions));
        set({ transactions, isSyncingCloud: false });
        return transactions.length;
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
    broadcastRealtimeSync('transactions');
  },

  resetToMasterData: () => {
    safeRemoveStorage(LS_TX_KEY);
    set({ transactions: masterTransactions });
  }
}));
