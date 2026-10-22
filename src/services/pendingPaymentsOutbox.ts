import type { PendingPaymentItem } from '../store/pendingPaymentsStore';
import { savePendingPaymentToSupabase, deletePendingPaymentFromSupabase } from './supabaseService';
import { broadcastRealtimeSync } from '../utils/syncBus';
import { getValidatedSession } from './authService';

export interface PendingOutboxOperation {
  token: string;
  id: string;
  action: 'save' | 'delete';
  item?: PendingPaymentItem;
  matchCriteria?: {
    fecha?: string;
    concepto?: string;
    entidad?: string;
    monto?: number;
  };
  attempts: number;
  lastError?: string;
  timestamp: number;
}

const STORAGE_KEY = 'finper_pending_payments_outbox_v1';

function loadOutbox(): PendingOutboxOperation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

let queue: PendingOutboxOperation[] = loadOutbox();
let revision = 0;
let activeFlushPromise: Promise<{ flushed: number; remaining: number }> | null = null;

function persist(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch {}
}

export function clearPendingOutboxForTesting(): void {
  queue = [];
  revision = 0;
  activeFlushPromise = null;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

export function getPendingOutboxCount(): number {
  return queue.length;
}

export function pendingOutboxRevision(): number {
  return revision;
}

export function getPendingOutboxItems(): PendingOutboxOperation[] {
  return [...queue];
}

export function enqueuePendingSave(item: PendingPaymentItem): void {
  revision++;
  const cleanId = String(item.id).replace(/^(pending-|pend-)/, '');
  // Reemplazar cualquier operación previa sobre el mismo ítem
  queue = [
    ...queue.filter(op => op.id !== cleanId && op.id !== item.id),
    {
      token: crypto.randomUUID(),
      id: cleanId,
      action: 'save',
      item,
      attempts: 0,
      timestamp: Date.now(),
    },
  ];
  persist();
  void flushPendingPaymentsOutbox();
}

export function enqueuePendingDelete(
  id: string,
  matchCriteria?: { fecha?: string; concepto?: string; entidad?: string; monto?: number }
): void {
  revision++;
  const cleanId = String(id).replace(/^(pending-|pend-)/, '');
  queue = [
    ...queue.filter(op => op.id !== cleanId && op.id !== id),
    {
      token: crypto.randomUUID(),
      id: cleanId,
      action: 'delete',
      matchCriteria,
      attempts: 0,
      timestamp: Date.now(),
    },
  ];
  persist();
  void flushPendingPaymentsOutbox();
}

/**
 * Procesa la cola de operaciones pendientes de forma secuencial y atómica.
 * Si no hay sesión válida o hay fallo de red, conserva la cola para reintento.
 */
export async function flushPendingPaymentsOutbox(): Promise<{ flushed: number; remaining: number }> {
  if (activeFlushPromise) {
    return activeFlushPromise;
  }

  activeFlushPromise = (async () => {
    let flushedCount = 0;

    try {
      // Validar si existe sesión activa antes de intentar enviar
      const session = await getValidatedSession();
      if (!session) {
        return { flushed: 0, remaining: queue.length };
      }

      while (queue.length > 0) {
        const op = queue[0];
        try {
          let success = false;
          if (op.action === 'save' && op.item) {
            success = await savePendingPaymentToSupabase(op.item);
          } else if (op.action === 'delete') {
            success = await deletePendingPaymentFromSupabase(op.id, op.matchCriteria);
          }

          if (success) {
            queue = queue.filter(curr => curr.token !== op.token);
            persist();
            flushedCount++;
            broadcastRealtimeSync('pending_payments');
          } else {
            // Si falló, incrementar intentos y detener la cola hasta el próximo ciclo
            op.attempts += 1;
            op.lastError = 'Fallo en la respuesta del servidor al guardar pago pendiente';
            persist();
            break;
          }
        } catch (err: any) {
          op.attempts += 1;
          op.lastError = err?.message || 'Error de red en cola de pendientes';
          persist();
          break;
        }
      }
      return { flushed: flushedCount, remaining: queue.length };
    } finally {
      activeFlushPromise = null;
    }
  })();

  return activeFlushPromise;
}
