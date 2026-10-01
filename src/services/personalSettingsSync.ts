import { create } from 'zustand';
import { useBudgetStore, DEFAULT_BUDGETS } from '../store/budgetStore';
import { useProjectionStore, INITIAL_PROJECTIONS, fetchProjectionsFromSupabase } from '../store/projectionStore';
import { canonical, decideSync, readSnapshot, writeSnapshot } from './settingsSnapshot';
import { broadcastRealtimeSync } from '../utils/syncBus';
import { useCardStatementStore } from '../store/cardStatementStore';
import { useFinanceStore } from '../store/financeStore';
import { CLASIFICACIONES_STORAGE_KEY, getStoredClasificaciones } from '../utils/categoryClassification';

type Name = 'budgets' | 'projections' | 'statements' | 'classifications';
type Entry = { status: 'waiting' | 'syncing' | 'synced' | 'conflict' | 'error'; message?: string; lastSync?: string; localSummary?: string; remoteSummary?: string };
export const useSettingsSync = create<{ entries: Record<Name, Entry> }>(() => ({ entries: {
  budgets: { status: 'waiting' }, projections: { status: 'waiting' }, statements: { status: 'waiting' }, classifications: { status: 'waiting' },
} }));
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
  // Fail closed if a recovery copy cannot be stored (e.g. storage is full).
  localStorage.setItem(`finper_sync_backup_${name}_${Date.now()}`, localValue(name));
  applying = true;
  try {
    if (name === 'statements') {
      localStorage.setItem('finper_verified_card_statements', value);
      useCardStatementStore.setState({ statements: parsed });
    } else if (name === 'classifications') {
      localStorage.setItem(CLASIFICACIONES_STORAGE_KEY, value);
      window.dispatchEvent(new Event('finper-classifications-changed'));
      // Derived budgets/charts depend on the transactions reference.
      useFinanceStore.setState(s => ({ transactions: [...s.transactions] }));
    } else if (name === 'budgets') useBudgetStore.getState().setAllBudgets(parsed.budgets, parsed.budgetModes);
    else {
      localStorage.setItem('finper_projections_v1', JSON.stringify(parsed.items));
      localStorage.setItem('finper_projection_prob_v1', JSON.stringify(parsed.probabilidadSueldoPorMes));
      useProjectionStore.setState(parsed);
    }
  } finally { applying = false; }
}
const running: Partial<Record<Name, Promise<void>>> = {};
function summary(name: Name, value: string): string {
  const data = JSON.parse(value);
  if (name === 'budgets') return `${Object.keys(data.budgets).length} límites · Total S/ ${(Object.values(data.budgets) as number[]).reduce((sum, n) => sum + n, 0).toFixed(2)}`;
  if (name === 'projections') return `${data.items.length} partidas · ${Object.keys(data.probabilidadSueldoPorMes).length} escenarios de sueldo`;
  return `${Object.keys(data).length} registros`;
}
async function sync(name: Name, choice?: 'local' | 'remote'): Promise<void> {
  if (running[name]) { await running[name]; if (choice) return sync(name, choice); return; }
  const work = async () => {
    if (useSettingsSync.getState().entries[name].status !== 'conflict' || choice) status(name, { status: 'syncing' });
    try {
      const before = localValue(name);
      const remote = await readSnapshot(name);
      if (name === 'projections' && remote.value === null) {
        try {
          const legacy = await fetchProjectionsFromSupabase();
          if (legacy) remote.value = canonical(legacy);
        } catch (error) {
          if (!(error instanceof SyntaxError)) throw error;
          if (choice !== 'local') throw new Error('La copia antigua de proyecciones en la nube está incompleta. Desde la computadora que tiene los datos correctos, pulsa «Compartir este dispositivo». Se conservará el respaldo antiguo.');
          // Explicitly publish the intact local copy in a new namespace; retain old chunks.
        }
      }
      if (remote.value !== null) validate(name, remote.value);
      if (choice === 'remote' && remote.value === null) throw new Error('Todavía no hay una copia en la nube. Comparte primero desde tu computadora.');
      // An edit made while the read was in flight must be reconsidered next time.
      if (before !== localValue(name)) { status(name, { status: 'waiting' }); return; }
      const baseline = localStorage.getItem(key(name));
      const decision = choice === 'local' ? 'upload' : choice === 'remote' ? 'download' : decideSync(before, remote.value, baseline, customized(name));
      if (decision === 'conflict') {
        status(name, { status: 'conflict', message: 'Hay versiones distintas. Elige cuál compartir; ambas se conservarán en el respaldo.', localSummary: summary(name, before), remoteSummary: summary(name, remote.value!) });
        return;
      }
      if (decision === 'upload') {
        localStorage.setItem(`finper_sync_backup_${name}_${Date.now()}`, canonical({ local: JSON.parse(before), remote: remote.value ? JSON.parse(remote.value) : null }));
        await writeSnapshot(name, before, remote.head);
        localStorage.setItem(key(name), before);
        broadcastRealtimeSync(name);
      } else if (decision === 'download' && remote.value !== null) {
        apply(name, remote.value);
        localStorage.setItem(key(name), remote.value);
      } else if (decision === 'equal') localStorage.setItem(key(name), before);
      // Idle means no remote snapshot exists yet, not a successful upload.
      status(name, { status: decision === 'idle' || localValue(name) !== (localStorage.getItem(key(name)) ?? before) ? 'waiting' : 'synced', lastSync: new Date().toISOString() });
    } catch (error) {
      status(name, { status: 'error', message: error instanceof Error ? error.message : 'No se pudo sincronizar. Se conserva la copia local y se reintentará.' });
    }
  };
  running[name] = work();
  try { await running[name]; } finally { delete running[name]; }
}
export async function syncPersonalSettings(): Promise<void> {
  await Promise.all([sync('budgets'), sync('projections'), sync('statements'), sync('classifications')]);
}
export const resolveSettings = (name: Name, choice: 'local' | 'remote') => sync(name, choice);

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
  return () => { clearTimeout(timer); unsubBudget(); unsubProjection(); unsubStatement(); window.removeEventListener('finper-classifications-changed', changed); };
}

export function downloadSyncBackup(): void {
  const saved: Record<string, unknown> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const name = localStorage.key(i)!;
    if (name.startsWith('finper_') || name === 'demo_deudas') { try { saved[name] = JSON.parse(localStorage.getItem(name)!); } catch { saved[name] = localStorage.getItem(name); } }
  }
  const url = URL.createObjectURL(new Blob([JSON.stringify(saved, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = `finper-respaldo-sincronizacion-${new Date().toISOString().slice(0, 10)}.json`; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
