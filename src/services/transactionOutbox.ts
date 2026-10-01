import type { Transaction } from '../utils/masterData';
import { insertTransactionToSupabase, deleteTransactionFromSupabase } from './supabaseService';
import { broadcastRealtimeSync } from '../utils/syncBus';

type Operation = { token: string; id: string; transaction?: Transaction };
const STORAGE_KEY = 'finper_transaction_outbox_v1';
function load(): Operation[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}
let pending: Operation[] = load();
let revision = 0;
let running: Promise<void> | null = null;
function persist() {
  // Keep the in-memory queue even if browser storage is unavailable.
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(pending)); } catch { /* surfaced by pending count */ }
}
export function enqueueTransaction(id: string, transaction?: Transaction): void {
  revision++;
  pending = [...pending.filter(op => op.id !== id), { id, transaction, token: crypto.randomUUID() }];
  persist();
  void flushTransactions();
}
export const transactionRevision = () => revision;
export function pendingTransactions(): Operation[] { return pending; }
export async function flushTransactions(): Promise<void> {
  if (running) return running;
  running = (async () => {
    while (pending.length) {
      const op = pending[0];
      try {
        const success = op.transaction ? (await insertTransactionToSupabase(op.transaction)).success : await deleteTransactionFromSupabase(op.id);
        if (!success) return;
        pending = pending.filter(current => current.token !== op.token);
        persist();
        broadcastRealtimeSync('transactions');
      } catch { return; }
    }
  })();
  try { await running; } finally { running = null; }
}
