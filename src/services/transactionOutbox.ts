import type { Transaction } from '../utils/masterData';
import { insertTransactionToSupabase, deleteTransactionFromSupabase } from './supabaseService';
import { broadcastRealtimeSync } from '../utils/syncBus';

export interface TransactionOutboxOperation {
  token: string;
  id: string;
  action: 'insert' | 'delete';
  transaction?: Transaction;
  userId?: string;
  attempts: number;
  lastError?: string;
  timestamp: number;
}

const STORAGE_KEY = 'finper_transaction_outbox_v1';

function normalizeOperation(raw: any): TransactionOutboxOperation {
  return {
    token: raw.token || crypto.randomUUID(),
    id: String(raw.id || ''),
    action: raw.action || (raw.transaction ? 'insert' : 'delete'),
    transaction: raw.transaction,
    userId: raw.userId,
    attempts: typeof raw.attempts === 'number' ? raw.attempts : 0,
    lastError: raw.lastError,
    timestamp: typeof raw.timestamp === 'number' ? raw.timestamp : Date.now(),
  };
}

function load(): TransactionOutboxOperation[] {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map(normalizeOperation);
      }
    }
  } catch {
    /* surfaced by pending count */
  }
  return [];
}

let pending: TransactionOutboxOperation[] = load();
let revision = 0;
let running: Promise<{ flushed: number; remaining: number }> | null = null;

function persist(): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pending));
    }
  } catch {
    /* surfaced by pending count */
  }
}

export function clearTransactionOutboxForTesting(): void {
  pending = [];
  revision = 0;
  running = null;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {}
}

export function enqueueTransaction(id: string, transaction?: Transaction, userId?: string): void {
  revision++;
  const action: 'insert' | 'delete' = transaction ? 'insert' : 'delete';
  pending = [
    ...pending.filter(op => op.id !== id),
    {
      id,
      transaction,
      token: crypto.randomUUID(),
      action,
      userId,
      attempts: 0,
      timestamp: Date.now(),
    },
  ];
  persist();
  void flushTransactions();
}

export const transactionRevision = (): number => revision;

export function pendingTransactions(): TransactionOutboxOperation[] {
  return [...pending];
}

export function getTransactionOutboxCount(): number {
  return pending.length;
}

/**
 * Procesa la cola de transacciones pendientes de forma atómica y secuencial.
 * Requiere sesión autenticada activa antes del despacho para prevenir rechazos RLS 42501.
 */
export async function flushTransactions(force = false): Promise<{ flushed: number; remaining: number }> {
  if (running) return running;

  running = (async () => {
    let flushedCount = 0;
    try {
      while (pending.length > 0) {
        const op = pending[0];

        // Backoff exponencial para operaciones con 3 o más intentos fallidos
        if (!force && op.attempts >= 3) {
          const backoffMs = Math.min(30000, 1000 * Math.pow(2, Math.min(op.attempts - 3, 5)));
          if (Date.now() - op.timestamp < backoffMs) {
            break;
          }
        }

        try {
          let success = false;
          if (op.action === 'insert' && op.transaction) {
            const res = await insertTransactionToSupabase(op.transaction);
            success = res.success;
            if (!success && res.error) {
              op.lastError = res.error;
            }
          } else {
            success = await deleteTransactionFromSupabase(op.id);
          }

          if (success) {
            pending = pending.filter(current => current.token !== op.token);
            persist();
            flushedCount++;
            broadcastRealtimeSync('transactions');
          } else {
            op.attempts += 1;
            op.timestamp = Date.now();
            persist();
            break;
          }
        } catch (err: any) {
          op.attempts += 1;
          op.lastError = err?.message || 'Error de red en cola de transacciones';
          op.timestamp = Date.now();
          persist();
          break;
        }
      }
      return { flushed: flushedCount, remaining: pending.length };
    } finally {
      running = null;
    }
  })();

  return running;
}
