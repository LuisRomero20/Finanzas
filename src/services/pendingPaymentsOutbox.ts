import type { PendingPaymentItem } from '../store/pendingPaymentsStore';
import { savePendingPaymentToSupabase, deletePendingPaymentFromSupabase } from './supabaseService';
import { broadcastRealtimeSync } from '../utils/syncBus';
import { getValidatedSession } from './authService';

export interface PendingOutboxOperation {
  token: string;
  id: string;
  action: 'save' | 'delete';
  userId?: string;
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
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
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
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    }
  } catch {}
}

export function clearPendingOutboxForTesting(): void {
  queue = [];
  revision = 0;
  activeFlushPromise = null;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
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

/**
 * Encola una operación de guardado o actualización de pago pendiente.
 * Si ya existía una operación previa sobre el mismo ID, la reemplaza atómicamente.
 */
export function enqueuePendingSave(item: PendingPaymentItem, userId?: string): void {
  revision++;
  const cleanId = String(item.id).replace(/^(pending-|pend-)/, '');

  queue = [
    ...queue.filter(op => op.id !== cleanId && op.id !== item.id),
    {
      token: crypto.randomUUID(),
      id: cleanId,
      action: 'save',
      userId,
      item,
      attempts: 0,
      timestamp: Date.now(),
    },
  ];
  persist();
  void flushPendingPaymentsOutbox();
}

/**
 * Encola una eliminación de pago pendiente.
 * Si el ítem estaba únicamente en cola de guardado local y nunca se envió a Supabase
 * (sin matchCriteria), cancela la operación de forma inmediata sin emitir llamadas redundantes.
 */
export function enqueuePendingDelete(
  id: string,
  matchCriteria?: { fecha?: string; concepto?: string; entidad?: string; monto?: number },
  userId?: string
): void {
  revision++;
  const cleanId = String(id).replace(/^(pending-|pend-)/, '');

  const existingSaveIndex = queue.findIndex(op => (op.id === cleanId || op.id === id) && op.action === 'save');

  // Cancelación limpia en cola si nunca llegó a tocar la nube y no hay matchCriteria
  if (existingSaveIndex !== -1 && queue[existingSaveIndex].attempts === 0 && !matchCriteria) {
    queue = queue.filter(op => op.id !== cleanId && op.id !== id);
    persist();
    return;
  }

  // De lo contrario, encolar eliminación segura e idempotente en Supabase
  queue = [
    ...queue.filter(op => op.id !== cleanId && op.id !== id),
    {
      token: crypto.randomUUID(),
      id: cleanId,
      action: 'delete',
      userId,
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
export async function flushPendingPaymentsOutbox(force = false): Promise<{ flushed: number; remaining: number }> {
  if (activeFlushPromise) {
    return activeFlushPromise;
  }

  activeFlushPromise = (async () => {
    let flushedCount = 0;

    try {
      // 1. Validar si existe sesión activa antes de despachar operaciones
      const session = await getValidatedSession();
      if (!session) {
        return { flushed: 0, remaining: queue.length };
      }

      const activeUserId = session.user?.id;

      while (queue.length > 0) {
        const op = queue[0];

        // Validar que la operación pertenezca al usuario autenticado (si está etiquetada)
        if (op.userId && activeUserId && op.userId !== activeUserId) {
          // No despachar operaciones de otro usuario
          break;
        }

        // Backoff exponencial para operaciones que fallaron persistentemente (a partir de 3 intentos)
        if (!force && op.attempts >= 3) {
          const backoffMs = Math.min(30000, 1000 * Math.pow(2, Math.min(op.attempts - 3, 5)));
          if (Date.now() - op.timestamp < backoffMs) {
            break;
          }
        }

        try {
          let success = false;
          if (op.action === 'save' && op.item) {
            success = await savePendingPaymentToSupabase(op.item);
          } else if (op.action === 'delete') {
            success = await deletePendingPaymentFromSupabase(op.id, op.matchCriteria);
          }

          if (success) {
            // Remoción atómica por token
            queue = queue.filter(curr => curr.token !== op.token);
            persist();
            flushedCount++;
            broadcastRealtimeSync('pending_payments');
          } else {
            // Incrementar reintentos y suspender hasta el próximo ciclo
            op.attempts += 1;
            op.lastError = 'Respuesta no exitosa del servidor al procesar pago pendiente';
            op.timestamp = Date.now();
            persist();
            break;
          }
        } catch (err: any) {
          op.attempts += 1;
          op.lastError = err?.message || 'Error de red en cola de pendientes';
          op.timestamp = Date.now();
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
