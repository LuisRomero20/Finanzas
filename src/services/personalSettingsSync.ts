import { create } from 'zustand';
import { useBudgetStore, DEFAULT_BUDGETS } from '../store/budgetStore';
import { useProjectionStore, INITIAL_PROJECTIONS, fetchProjectionsFromSupabase } from '../store/projectionStore';
import { canonical, decideSync, readSnapshot, writeSnapshot } from './settingsSnapshot';
import {
  generateDiffReport,
  computeSmartMerge,
  computeAssistedMerge,
  buildDownloadableDiffBackup,
  type DiffReport,
  type ItemResolution,
  type FinancialImpactSimulation,
} from '../domain/sync/diffComparison';
import { getValidatedSession } from './authService';
import { broadcastRealtimeSync } from '../utils/syncBus';
import { useCardStatementStore, registerStatementSyncTransport } from '../store/cardStatementStore';
import { useFinanceStore } from '../store/financeStore';
import { CLASIFICACIONES_STORAGE_KEY, getStoredClasificaciones } from '../utils/categoryClassification';

type Name = 'budgets' | 'projections' | 'statements' | 'classifications';
export type SettingsName = Name;

/**
 * Resultado estructurado de una sincronización. La ausencia de excepciones NO equivale a
 * confirmación remota: solo `remote_confirmed` indica que Supabase aceptó (y, para conciliaciones,
 * devolvió al releerse) exactamente la versión local.
 */
export type SyncState = 'remote_confirmed' | 'local_pending' | 'sync_failed' | 'conflict';
export type SyncErrorKind = 'network' | 'auth' | 'rls' | 'concurrency' | 'integrity' | 'other';
export interface SyncOutcome {
  name: Name;
  state: SyncState;
  message: string;
  at: string;
  errorKind?: SyncErrorKind;
  /** true cuando los datos cambiaron durante la sincronización y conviene reintentar con la versión más reciente. */
  stale?: boolean;
}

export type Entry = {
  status: 'waiting' | 'syncing' | 'synced' | 'conflict' | 'error';
  message?: string;
  lastSync?: string;
  localSummary?: string;
  remoteSummary?: string;
  localValueRaw?: string;
  remoteValueRaw?: string;
  diffReport?: DiffReport;
};

export const useSettingsSync = create<{ entries: Record<Name, Entry> }>(() => ({
  entries: {
    budgets: { status: 'waiting' },
    projections: { status: 'waiting' },
    statements: { status: 'waiting' },
    classifications: { status: 'waiting' },
  },
}));

function status(name: Name, entry: Entry) {
  useSettingsSync.setState(s => ({ entries: { ...s.entries, [name]: entry } }));
}

const key = (name: Name) => `finper_sync_baseline_${name}_v2`;

function localValue(name: Name): string {
  if (name === 'statements') return canonical(useCardStatementStore.getState().statements);
  if (name === 'classifications') return canonical(getStoredClasificaciones());
  if (name === 'budgets') {
    const { budgets, budgetModes } = useBudgetStore.getState();
    return canonical({ budgets, budgetModes });
  }
  const { items, probabilidadSueldoPorMes } = useProjectionStore.getState();
  return canonical({ items, probabilidadSueldoPorMes });
}

function customized(name: Name): boolean {
  if (name === 'statements' || name === 'classifications') return localValue(name) !== '{}';
  if (name === 'budgets') {
    const { budgets, budgetModes } = useBudgetStore.getState();
    return canonical(budgets) !== canonical(DEFAULT_BUDGETS) || Object.values(budgetModes).includes('manual');
  }
  const { items, probabilidadSueldoPorMes } = useProjectionStore.getState();
  return canonical(items) !== canonical(INITIAL_PROJECTIONS) || Object.keys(probabilidadSueldoPorMes).length > 0;
}

function validate(name: Name, value: string) {
  const parsed = JSON.parse(value);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Configuración remota inválida');
  if (name === 'statements') {
    if (Object.values(parsed).some(v => !v || typeof v !== 'object' || typeof (v as { finalDebt: number }).finalDebt !== 'number')) throw new Error('Regularizaciones inválidas');
    return parsed;
  }
  if (name === 'classifications') {
    if (Object.values(parsed).some(v => typeof v !== 'string')) throw new Error('Clasificaciones inválidas');
    return parsed;
  }
  if (name === 'budgets') {
    if (!parsed.budgets || !parsed.budgetModes || Object.values(parsed.budgets).some(v => typeof v !== 'number' || !Number.isFinite(v) || v < 0) || Object.values(parsed.budgetModes).some(v => v !== 'manual' && v !== 'sugerido')) throw new Error('Presupuestos remotos inválidos');
  } else if (!Array.isArray(parsed.items) || !parsed.probabilidadSueldoPorMes || parsed.items.some((i: { id?: string; monto?: number }) => !i.id || typeof i.monto !== 'number')) {
    throw new Error('Proyecciones remotas inválidas');
  }
  return parsed;
}

let applying = false;

function apply(name: Name, value: string) {
  const parsed = validate(name, value);
  localStorage.setItem(`finper_sync_backup_${name}_${Date.now()}`, localValue(name));
  applying = true;
  try {
    if (name === 'statements') {
      localStorage.setItem('finper_verified_card_statements', value);
      useCardStatementStore.setState({ statements: parsed });
    } else if (name === 'classifications') {
      localStorage.setItem(CLASIFICACIONES_STORAGE_KEY, value);
      window.dispatchEvent(new Event('finper-classifications-changed'));
      useFinanceStore.setState(s => ({ transactions: [...s.transactions] }));
    } else if (name === 'budgets') {
      useBudgetStore.getState().setAllBudgets(parsed.budgets, parsed.budgetModes);
    } else {
      localStorage.setItem('finper_projections_v1', JSON.stringify(parsed.items));
      localStorage.setItem('finper_projection_prob_v1', JSON.stringify(parsed.probabilidadSueldoPorMes));
      useProjectionStore.setState(parsed);
    }
  } finally {
    applying = false;
  }
}

const running: Partial<Record<Name, Promise<SyncOutcome>>> = {};

function summary(name: Name, value: string): string {
  try {
    const data = JSON.parse(value);
    if (name === 'budgets') return `${Object.keys(data.budgets || {}).length} límites · Total S/ ${(Object.values(data.budgets || {}) as number[]).reduce((sum, n) => sum + n, 0).toFixed(2)}`;
    if (name === 'projections') return `${(data.items || []).length} partidas · ${Object.keys(data.probabilidadSueldoPorMes || {}).length} escenarios de sueldo`;
    return `${Object.keys(data).length} registros`;
  } catch {
    return '1 configuración';
  }
}

function classifyError(error: any): { kind: SyncErrorKind; userMsg: string } {
  const errCode = error?.code || error?.status || '';
  const rawMsg: string = error instanceof Error
    ? error.message
    : (error?.message || error?.error_description || error?.details || (typeof error === 'object' ? JSON.stringify(error) : String(error)));
  const lower = rawMsg.toLowerCase();

  if (
    rawMsg.includes('Otro dispositivo') ||
    rawMsg.includes('concurrencia') ||
    rawMsg.includes('Reintenta para comparar')
  ) {
    return { kind: 'concurrency', userMsg: 'Versiones distintas: otro dispositivo actualizó los datos. Compara ambas versiones antes de decidir; no se sobrescribió nada.' };
  }
  if (rawMsg.includes('Verificación remota')) {
    return { kind: 'integrity', userMsg: rawMsg };
  }
  if (
    rawMsg.includes('JWT') ||
    rawMsg.includes('token') ||
    rawMsg.includes('Sesión no disponible') ||
    rawMsg.includes('expirada') ||
    errCode === 401 ||
    errCode === 'PGRST301'
  ) {
    return { kind: 'auth', userMsg: 'Sesión expirada o no válida. Vuelve a iniciar sesión para continuar.' };
  }
  if (rawMsg.includes('permission denied') || errCode === '42501' || errCode === 403) {
    return { kind: 'rls', userMsg: 'Acceso no autorizado en Supabase (RLS). Tu sesión no tiene permisos de lectura/escritura.' };
  }
  if (
    rawMsg.includes('Failed to fetch') ||
    rawMsg.includes('NetworkError') ||
    rawMsg.includes('Network request failed') ||
    lower.includes('network') ||
    lower.includes('offline')
  ) {
    return { kind: 'network', userMsg: 'Sin conexión a internet. Los cambios se conservan localmente y se enviarán al reconectar.' };
  }
  if (rawMsg.includes('completa') || rawMsg.includes('incompleta')) {
    return { kind: 'other', userMsg: rawMsg };
  }
  if (errCode) {
    return { kind: 'other', userMsg: `Error de sincronización (${errCode}): ${rawMsg.slice(0, 80)}. Se conserva la copia local.` };
  }
  return { kind: 'other', userMsg: `Error al sincronizar: ${rawMsg.slice(0, 80)}. Se conserva la copia local.` };
}

/**
 * Relee lo que quedó realmente en Supabase y comprueba que coincide con lo enviado.
 * Se exige para conciliaciones: escribir sin error no basta como prueba de persistencia.
 */
async function verifyRemoteMatches(name: Name, expected: string): Promise<void> {
  const check = await readSnapshot(name);
  if (check.value === null || canonical(JSON.parse(check.value)) !== canonical(JSON.parse(expected))) {
    throw new Error('Verificación remota fallida: Supabase no devolvió la misma versión que se envió. Se conserva la copia local para reintentar.');
  }
}

async function sync(
  name: Name,
  choice?: 'local' | 'remote' | 'merge',
  opts?: { waitForFresh?: boolean },
): Promise<SyncOutcome> {
  if (running[name]) {
    const prior = await running[name]!;
    if (choice || opts?.waitForFresh) return sync(name, choice, opts);
    return prior;
  }

  const done = (state: SyncState, message: string, extra: Partial<SyncOutcome> = {}): SyncOutcome => ({
    name,
    state,
    message,
    at: new Date().toISOString(),
    ...extra,
  });

  const work = async (): Promise<SyncOutcome> => {
    if (useSettingsSync.getState().entries[name].status !== 'conflict' || choice) {
      status(name, { status: 'syncing' });
    }

    try {
      const before = localValue(name);
      const remote = await readSnapshot(name);

      if (name === 'projections' && remote.value === null) {
        try {
          const legacy = await fetchProjectionsFromSupabase();
          if (legacy) remote.value = canonical(legacy);
        } catch (error) {
          if (!(error instanceof SyntaxError)) throw error;
          if (choice !== 'local') {
            throw new Error('La copia antigua de proyecciones en la nube está incompleta. Desde la computadora que tiene los datos correctos, pulsa «Compartir este dispositivo». Se conservará el respaldo antiguo.');
          }
        }
      }

      if (remote.value !== null) validate(name, remote.value);
      if (choice === 'remote' && remote.value === null) {
        throw new Error('Todavía no hay una copia en la nube. Comparte primero desde tu dispositivo principal.');
      }

      if (before !== localValue(name)) {
        status(name, { status: 'waiting' });
        return done('local_pending', 'Los datos cambiaron durante la sincronización; se reintentará con la versión más reciente.', { stale: true });
      }

      const baseline = localStorage.getItem(key(name));
      const decision = choice === 'local' ? 'upload' : choice === 'remote' ? 'download' : choice === 'merge' ? 'merge' : decideSync(before, remote.value, baseline, customized(name));

      if (decision === 'conflict') {
        const report = generateDiffReport(name, before, remote.value!);
        const message = 'Hay versiones distintas entre este dispositivo y la nube. Examina la comparación detallada antes de decidir.';
        status(name, {
          status: 'conflict',
          message,
          localSummary: summary(name, before),
          remoteSummary: summary(name, remote.value!),
          localValueRaw: before,
          remoteValueRaw: remote.value!,
          diffReport: report,
        });
        return done('conflict', message);
      }

      let uploaded = false;
      if (decision === 'merge' && remote.value !== null) {
        const smart = computeSmartMerge(name, before, remote.value);
        localStorage.setItem(
          `finper_sync_backup_${name}_${Date.now()}`,
          canonical({ local: JSON.parse(before), remote: JSON.parse(remote.value), mergeDraft: JSON.parse(smart.mergedValue) })
        );
        // Persistencia segura: escribir en Supabase primero antes de modificar el estado local
        await writeSnapshot(name, smart.mergedValue, remote.head);
        if (name === 'statements') await verifyRemoteMatches(name, smart.mergedValue);
        // Confirmado: aplicar localmente únicamente tras confirmación remota
        apply(name, smart.mergedValue);
        localStorage.setItem(key(name), smart.mergedValue);
        broadcastRealtimeSync(name);
        uploaded = true;
      } else if (decision === 'upload') {
        localStorage.setItem(`finper_sync_backup_${name}_${Date.now()}`, canonical({ local: JSON.parse(before), remote: remote.value ? JSON.parse(remote.value) : null }));
        await writeSnapshot(name, before, remote.head);
        if (name === 'statements') await verifyRemoteMatches(name, before);
        localStorage.setItem(key(name), before);
        broadcastRealtimeSync(name);
        uploaded = true;
      } else if (decision === 'download' && remote.value !== null) {
        apply(name, remote.value);
        localStorage.setItem(key(name), remote.value);
      } else if (decision === 'equal') {
        localStorage.setItem(key(name), before);
      }

      const stillInSync = decision !== 'idle' && localValue(name) === (localStorage.getItem(key(name)) ?? before);
      status(name, {
        status: stillInSync ? 'synced' : 'waiting',
        lastSync: new Date().toISOString(),
      });

      if (decision === 'idle') {
        return done('remote_confirmed', 'No hay datos locales por sincronizar.');
      }
      if (!stillInSync) {
        return done('local_pending', 'Los datos cambiaron durante la sincronización; se reintentará con la versión más reciente.', { stale: true });
      }
      return done(
        'remote_confirmed',
        uploaded ? 'Confirmado en Supabase: la nube devolvió exactamente la versión enviada.' : 'Este dispositivo coincide con la versión confirmada en Supabase.',
      );
    } catch (error: any) {
      const { kind, userMsg } = classifyError(error);

      if (kind === 'concurrency') {
        // Otro dispositivo modificó la versión remota: se conserva la local y se prepara la comparación.
        try {
          const mine = localValue(name);
          const fresh = await readSnapshot(name);
          if (fresh.value !== null && fresh.value !== mine) {
            status(name, {
              status: 'conflict',
              message: userMsg,
              localSummary: summary(name, mine),
              remoteSummary: summary(name, fresh.value),
              localValueRaw: mine,
              remoteValueRaw: fresh.value,
              diffReport: generateDiffReport(name, mine, fresh.value),
            });
            return done('conflict', userMsg, { errorKind: kind });
          }
        } catch {
          /* si la relectura falla se informa igualmente el conflicto de versiones */
        }
        status(name, { status: 'error', message: userMsg });
        return done('conflict', userMsg, { errorKind: kind });
      }

      status(name, { status: 'error', message: userMsg });
      return done(kind === 'network' ? 'local_pending' : 'sync_failed', userMsg, { errorKind: kind });
    }
  };

  running[name] = (async () => {
    if (name === 'statements') useCardStatementStore.getState().markSyncing();
    const outcome = await work();
    if (name === 'statements') useCardStatementStore.getState().applySyncOutcome(outcome);
    return outcome;
  })();
  try {
    return await running[name]!;
  } finally {
    delete running[name];
  }
}

export async function syncPersonalSettings(): Promise<void> {
  await Promise.all([sync('budgets'), sync('projections'), sync('statements'), sync('classifications')]);
}

/**
 * Sincroniza un módulo y devuelve el resultado verificable. Si los datos cambian mientras
 * se sincroniza, reintenta (máx. 2 veces) con la versión más reciente.
 */
export async function syncSettingsWithOutcome(name: Name): Promise<SyncOutcome> {
  let outcome = await sync(name, undefined, { waitForFresh: true });
  for (let attempt = 0; outcome.stale && attempt < 2; attempt++) {
    outcome = await sync(name, undefined, { waitForFresh: true });
  }
  return outcome;
}

export const syncStatementsWithOutcome = (): Promise<SyncOutcome> => syncSettingsWithOutcome('statements');

export const resolveSettings = (name: Name, choice: 'local' | 'remote' | 'merge') => sync(name, choice);

registerStatementSyncTransport(syncStatementsWithOutcome);

/**
 * Resuelve un conflicto mediante Conciliación Asistida Financiera:
 * 1. Verifica autenticación GoTrue antes de escribir.
 * 2. Comprueba optimísticamente que remote.head en Supabase no haya cambiado.
 * 3. Exige resolución explícita para cada registro modificado (cero sobreescritura automática).
 * 4. Guarda un respaldo previo verificable en localStorage.
 * 5. Aplica localmente y publica en Supabase.
 */
export async function resolveSettingsAssisted(
  name: Name,
  resolutions: Record<string, ItemResolution>,
  salaryProbabilityResolution?: 'use_local' | 'use_remote',
  targetMonthStr?: string,
): Promise<{ success: boolean; simulation: FinancialImpactSimulation }> {
  // 1. Verificación estricta de sesión
  const session = await getValidatedSession();
  if (!session?.user?.id) {
    throw new Error('No hay sesión autenticada activa. Inicia sesión para guardar cambios en la nube.');
  }

  // 2. Si hay otra sincronización en curso, esperar
  if (running[name]) {
    await running[name];
  }

  status(name, { status: 'syncing' });

  const before = localValue(name);
  try {
    const remote = await readSnapshot(name);

    if (remote.value === null) {
      throw new Error('No se encontró copia en la nube para conciliar.');
    }

    // 3. Ejecutar la fusión asistida asegurando decisiones para todas las modificadas
    const assisted = computeAssistedMerge(
      name,
      before,
      remote.value,
      resolutions,
      salaryProbabilityResolution,
      targetMonthStr,
    );

    // 4. Guardar respaldo previo verificable en localStorage
    localStorage.setItem(
      `finper_sync_backup_${name}_assisted_${Date.now()}`,
      canonical({
        local: JSON.parse(before),
        remote: JSON.parse(remote.value),
        mergedDraft: JSON.parse(assisted.mergedValue),
        resolutions,
        simulation: assisted.simulation,
        timestamp: new Date().toISOString(),
      })
    );

    // 5. ESCRIBIR EN SUPABASE PRIMERO (Borrador enviado con control de concurrencia contra remote.head)
    // El estado local se mantiene intacto hasta recibir confirmación remota exitosa.
    await writeSnapshot(name, assisted.mergedValue, remote.head);

    // 6. CONFIRMADO: Aplicar al estado local únicamente tras el éxito remoto
    apply(name, assisted.mergedValue);

    // 7. Actualizar línea base de sincronización y notificar
    localStorage.setItem(key(name), assisted.mergedValue);
    broadcastRealtimeSync(name);

    status(name, {
      status: 'synced',
      lastSync: new Date().toISOString(),
    });

    return { success: true, simulation: assisted.simulation };
  } catch (err: any) {
    // Si la escritura remota falla, asegurar que el estado local permanece intacto en `before`
    try {
      apply(name, before);
    } catch {
      // Ignorar fallo de restauración
    }

    status(name, {
      status: 'error',
      message: err?.message || 'Error al aplicar conciliación asistida. Se conservó el estado local sin cambios.',
    });
    throw err;
  }
}

export function downloadDiffReportJson(name: Name, resolutions?: Record<string, ItemResolution>): void {
  const entry = useSettingsSync.getState().entries[name];
  if (!entry?.diffReport || !entry?.localValueRaw || !entry?.remoteValueRaw) return;
  const backup = buildDownloadableDiffBackup(entry.diffReport, entry.localValueRaw, entry.remoteValueRaw, resolutions);
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `finper-conciliacion-${name}-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function watchPersonalSettings(): () => void {
  let timer: ReturnType<typeof setTimeout>;
  const changed = () => {
    if (applying) return;
    clearTimeout(timer);
    timer = setTimeout(() => { void syncPersonalSettings(); }, 500);
  };
  const unsubBudget = useBudgetStore.subscribe((state, old) => {
    if (state.budgets !== old.budgets || state.budgetModes !== old.budgetModes) changed();
  });
  const unsubProjection = useProjectionStore.subscribe((state, old) => {
    if (state.items !== old.items || state.probabilidadSueldoPorMes !== old.probabilidadSueldoPorMes) changed();
  });
  const unsubStatement = useCardStatementStore.subscribe((state, old) => {
    if (state.statements !== old.statements) changed();
  });
  window.addEventListener('finper-classifications-changed', changed);
  return () => {
    clearTimeout(timer);
    unsubBudget();
    unsubProjection();
    unsubStatement();
    window.removeEventListener('finper-classifications-changed', changed);
  };
}

export function downloadSyncBackup(): void {
  const saved: Record<string, unknown> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const name = localStorage.key(i)!;
    if (name.startsWith('finper_') || name === 'demo_deudas') {
      try {
        saved[name] = JSON.parse(localStorage.getItem(name)!);
      } catch {
        saved[name] = localStorage.getItem(name);
      }
    }
  }
  const url = URL.createObjectURL(new Blob([JSON.stringify(saved, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `finper-respaldo-sincronizacion-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
