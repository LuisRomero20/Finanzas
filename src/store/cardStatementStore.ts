import { create } from 'zustand';
import { broadcastRealtimeSync } from '../utils/syncBus';

export type VerificationStatus = 'draft' | 'user_declared' | 'statement_verified' | 'disputed';
export type StatementSource = 'manual_entry' | 'statement_file' | 'external';

export interface VerifiedStatement {
  id: string;
  cardEntity: string;
  cycleKey: string;
  dueDate?: string; // YYYY-MM-DD
  cutoffDate?: string; // YYYY-MM-DD
  periodStart?: string;
  periodEnd?: string;
  finalDebt: number;
  minPayment?: number;
  fileName: string;
  documentReference?: string;
  source?: StatementSource;
  verificationStatus?: VerificationStatus;
  matchedCount: number;
  totalStatementItems: number;
  totalAppItems: number;
  totalStatementCargos: number;
  totalAppCargos: number;
  diferenciaGastos: number;
  variance?: number;
  reconciliationStatus?: 'CONCILIADO' | 'DISCREPANCIA_MAYOR_BANCO' | 'DISCREPANCIA_MAYOR_FINPER';
  diagnosticMessage?: string;
  verifiedAt: string;
  notes?: string;
}

/**
 * Estado de persistencia informática de las conciliaciones (NO es verificación bancaria).
 * `verificationStatus` (statement_verified, etc.) describe la evidencia bancaria;
 * `syncInfo.state` describe únicamente dónde está guardada la información.
 */
export type StatementSyncState =
  | 'idle'
  | 'syncing'
  | 'remote_confirmed'
  | 'local_pending'
  | 'sync_failed'
  | 'conflict';

export interface StatementSyncInfo {
  state: StatementSyncState;
  message?: string;
  updatedAt?: string;
}

export interface SaveStatementResult {
  /** true solo si el almacenamiento local se completó y fue releído correctamente. */
  localSaved: boolean;
  key: string;
  error?: string;
}

export interface StatementSyncOutcomeLike {
  state: 'remote_confirmed' | 'local_pending' | 'sync_failed' | 'conflict';
  message: string;
  at?: string;
}

interface CardStatementStore {
  statements: Record<string, VerifiedStatement>;
  syncInfo: StatementSyncInfo;
  saveVerifiedStatement: (statement: VerifiedStatement) => SaveStatementResult;
  saveVerifiedStatementAndSync: (statement: VerifiedStatement) => Promise<SaveStatementResult & { sync?: StatementSyncOutcomeLike }>;
  removeVerifiedStatement: (key: string) => void;
  getVerifiedStatement: (cardEntity: string, cyclePayDate?: Date, cycleEndDate?: Date) => VerifiedStatement | undefined;
  getVerifiedDebt: (cardEntity: string, cyclePayDate?: Date, cycleEndDate?: Date) => number | undefined;
  clearAll: () => void;
  markSyncing: () => void;
  applySyncOutcome: (outcome: StatementSyncOutcomeLike) => void;
  retrySync: () => Promise<StatementSyncOutcomeLike>;
}

const STORAGE_KEY = 'finper_verified_card_statements';
const PENDING_KEY = 'finper_verified_card_statements_pending_v1';

function loadFromStorage(): Record<string, VerifiedStatement> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      const migrated: Record<string, VerifiedStatement> = {};
      for (const [k, v] of Object.entries(parsed as Record<string, any>)) {
        if (!v || typeof v !== 'object') continue;
        const isExternal = v.source === 'external' || (typeof v.id === 'string' && v.id.startsWith('cancel-'));
        const hasDoc = Boolean(v.documentReference || (v.fileName && !v.fileName.includes('Manual') && !v.fileName.includes('Regularización')));
        migrated[k] = {
          ...v,
          source: v.source || (isExternal ? 'external' : (hasDoc ? 'statement_file' : 'manual_entry')),
          verificationStatus: v.verificationStatus || (isExternal ? 'user_declared' : (hasDoc ? 'statement_verified' : 'user_declared')),
          documentReference: v.documentReference || (hasDoc && v.fileName ? v.fileName : undefined),
        };
      }
      return migrated;
    }
    return {};
  } catch (e) {
    console.error('Error al cargar estados de cuenta desde localStorage:', e);
    return {};
  }
}

interface SaveToStorageResult {
  ok: boolean;
  error?: string;
}

/** Guarda y RELEE el almacenamiento local: solo `ok: true` si el contenido persistido coincide. */
function saveToStorage(data: Record<string, VerifiedStatement>): SaveToStorageResult {
  if (typeof window === 'undefined') return { ok: false, error: 'Almacenamiento local no disponible en este entorno.' };
  try {
    const raw = JSON.stringify(data);
    localStorage.setItem(STORAGE_KEY, raw);
    if (localStorage.getItem(STORAGE_KEY) !== raw) {
      return { ok: false, error: 'El navegador no conservó los datos guardados (verificación de lectura fallida).' };
    }
    return { ok: true };
  } catch (e) {
    console.error('Error al guardar estados de cuenta en localStorage:', e);
    return { ok: false, error: e instanceof Error ? e.message : 'No se pudo escribir en el almacenamiento local.' };
  }
}

// ── Marcador persistente de cambios sin confirmar en Supabase (sobrevive a recargas) ──
function readPending(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed?.keys) ? parsed.keys : [];
  } catch {
    return [];
  }
}

function addPending(keys: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    const merged = Array.from(new Set([...readPending(), ...keys]));
    localStorage.setItem(PENDING_KEY, JSON.stringify({ keys: merged, since: new Date().toISOString() }));
  } catch {
    /* el estado en memoria sigue reflejando la condición pendiente */
  }
}

function clearPending(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(PENDING_KEY);
  } catch {
    /* sin acción */
  }
}

function initialSyncInfo(): StatementSyncInfo {
  return readPending().length > 0
    ? { state: 'local_pending', message: 'Cambios guardados en este dispositivo; pendientes de confirmar en Supabase.' }
    : { state: 'idle' };
}

/**
 * Sincroniza las conciliaciones por la ruta autoritativa existente (manifiesto + fragmentos en
 * `transacciones`, con `personal_settings` solo como espejo opcional) y devuelve un resultado
 * verificable. Nunca silencia errores: cualquier fallo queda registrado en `syncInfo`.
 */
type StatementSyncTransport = () => Promise<StatementSyncOutcomeLike>;
let registeredTransport: StatementSyncTransport | null = null;

/** El servicio de sincronización se registra a sí mismo al cargarse (evita importaciones circulares ocultas). */
export function registerStatementSyncTransport(transport: StatementSyncTransport | null): void {
  registeredTransport = transport;
}

export async function syncStatementsToCloud(): Promise<StatementSyncOutcomeLike> {
  useCardStatementStore.getState().markSyncing();
  try {
    const run: StatementSyncTransport = registeredTransport
      ?? (await import('../services/personalSettingsSync')).syncStatementsWithOutcome;
    const outcome = await run();
    useCardStatementStore.getState().applySyncOutcome(outcome);
    return outcome;
  } catch (error) {
    console.warn('[cardStatementStore] La sincronización de conciliaciones falló:', error);
    const outcome: StatementSyncOutcomeLike = {
      state: 'sync_failed',
      message: `No se pudo sincronizar: ${error instanceof Error ? error.message.slice(0, 120) : 'error desconocido'}. La conciliación sigue guardada en este dispositivo.`,
      at: new Date().toISOString(),
    };
    useCardStatementStore.getState().applySyncOutcome(outcome);
    return outcome;
  }
}

export const useCardStatementStore = create<CardStatementStore>((set, get) => {
  /** Persiste localmente (con relectura) y solo entonces actualiza el estado en memoria. */
  const persistStatement = (statement: VerifiedStatement): SaveStatementResult => {
    // Clave estable por tarjeta y ciclo: reintentar el mismo guardado reemplaza, nunca duplica.
    const key = statement.cycleKey || `${statement.cardEntity}_${statement.dueDate || statement.cutoffDate || statement.id}`;
    const updated = { ...get().statements, [key]: statement };
    const persisted = saveToStorage(updated);
    if (!persisted.ok) {
      set({ syncInfo: { state: 'sync_failed', message: `No se pudo guardar en este dispositivo: ${persisted.error}`, updatedAt: new Date().toISOString() } });
      return { localSaved: false, key, error: persisted.error };
    }
    addPending([key]);
    set({
      statements: updated,
      syncInfo: { state: 'local_pending', message: 'Guardada en este dispositivo; pendiente de confirmar en Supabase.', updatedAt: new Date().toISOString() },
    });
    broadcastRealtimeSync('statements');
    return { localSaved: true, key };
  };

  return {
  statements: loadFromStorage(),
  syncInfo: initialSyncInfo(),

  saveVerifiedStatement: (statement) => {
    const result = persistStatement(statement);
    if (result.localSaved) void syncStatementsToCloud();
    return result;
  },

  saveVerifiedStatementAndSync: async (statement) => {
    const result = persistStatement(statement);
    if (!result.localSaved) return result;
    const sync = await syncStatementsToCloud();
    return { ...result, sync };
  },

  removeVerifiedStatement: (key) => {
    const updated = { ...get().statements };
    delete updated[key];
    // También limpiar si se pasó solo el cardEntity
    Object.keys(updated).forEach(k => {
      if (k.startsWith(`${key}_`) || updated[k].cardEntity === key) {
        delete updated[k];
      }
    });
    const persisted = saveToStorage(updated);
    if (!persisted.ok) {
      set({ syncInfo: { state: 'sync_failed', message: `No se pudo guardar en este dispositivo: ${persisted.error}`, updatedAt: new Date().toISOString() } });
      return;
    }
    addPending([key]);
    set({
      statements: updated,
      syncInfo: { state: 'local_pending', message: 'Cambio guardado en este dispositivo; pendiente de confirmar en Supabase.', updatedAt: new Date().toISOString() },
    });
    broadcastRealtimeSync('statements');
    void syncStatementsToCloud();
  },

  getVerifiedStatement: (cardEntity, cyclePayDate, cycleEndDate) => {
    const { statements } = get();
    const all = Object.values(statements).filter(s => s.cardEntity === cardEntity);
    if (all.length === 0) return undefined;

    // Si se pasa la fecha de pago del ciclo, buscar la coincidencia exacta o más cercana (+- 5 días)
    if (cyclePayDate) {
      const targetTime = cyclePayDate.getTime();
      for (const stmt of all) {
        if (stmt.dueDate) {
          const [y, m, d] = stmt.dueDate.split('-').map(Number);
          const stmtPayTime = new Date(y, m - 1, d).getTime();
          const diffDays = Math.abs(targetTime - stmtPayTime) / (1000 * 60 * 60 * 24);
          if (diffDays <= 5) {
            return stmt;
          }
        }
      }
    }

    // Si se pasa la fecha de corte del ciclo, buscar por fecha de corte (+- 5 días)
    if (cycleEndDate) {
      const targetEndTime = cycleEndDate.getTime();
      for (const stmt of all) {
        if (stmt.cutoffDate) {
          const [y, m, d] = stmt.cutoffDate.split('-').map(Number);
          const stmtCutTime = new Date(y, m - 1, d).getTime();
          const diffDays = Math.abs(targetEndTime - stmtCutTime) / (1000 * 60 * 60 * 24);
          if (diffDays <= 5) {
            return stmt;
          }
        }
      }
    }

    // Si no se pasaron fechas, devolver el más reciente para esa tarjeta
    return undefined;
  },

  getVerifiedDebt: (cardEntity, cyclePayDate, cycleEndDate) => {
    const stmt = get().getVerifiedStatement(cardEntity, cyclePayDate, cycleEndDate);
    return stmt ? stmt.finalDebt : undefined;
  },

  clearAll: () => {
    // Reinicio local (uso de mantenimiento/pruebas): no envía borrados masivos a la nube.
    saveToStorage({});
    clearPending();
    set({ statements: {}, syncInfo: { state: 'idle' } });
    broadcastRealtimeSync('statements');
  },

  markSyncing: () => {
    set(state => ({ syncInfo: { ...state.syncInfo, state: 'syncing', message: 'Sincronizando con Supabase…', updatedAt: new Date().toISOString() } }));
  },

  applySyncOutcome: (outcome) => {
    if (outcome.state === 'remote_confirmed') clearPending();
    set({ syncInfo: { state: outcome.state, message: outcome.message, updatedAt: outcome.at || new Date().toISOString() } });
  },

  retrySync: () => syncStatementsToCloud(),
  };
});
