import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, cleanup } from '@testing-library/react';
import { canonical, decideSync, readSnapshot, writeSnapshot } from '../../services/settingsSnapshot';
import { resolveSettings, syncPersonalSettings, useSettingsSync } from '../../services/personalSettingsSync';
import { useBudgetStore, DEFAULT_BUDGETS } from '../../store/budgetStore';
import { useProjectionStore, INITIAL_PROJECTIONS, type EffectiveProjectedRow } from '../../store/projectionStore';
import { MobileProjectionList } from '../../components/MobileProjectionList';
import { decodeLegacyProjections } from '../legacyProjections';

vi.mock('../../services/settingsSnapshot', async importOriginal => ({
  ...await importOriginal<typeof import('../../services/settingsSnapshot')>(),
  readSnapshot: vi.fn(), writeSnapshot: vi.fn(),
}));
const remote: Record<string, string | null> = {};
const budgetValue = (amount: number) => canonical({ budgets: { comida: amount }, budgetModes: { comida: 'manual' } });
beforeEach(() => {
  cleanup(); localStorage.clear(); vi.clearAllMocks();
  remote.budgets = null; remote.projections = null; remote.statements = null; remote.classifications = null;
  useBudgetStore.setState({ budgets: { ...DEFAULT_BUDGETS }, budgetModes: {} });
  useProjectionStore.setState({ items: INITIAL_PROJECTIONS, probabilidadSueldoPorMes: {} });
  vi.mocked(readSnapshot).mockImplementation(async name => ({ value: remote[name], head: remote[name] === null ? null : 'revision' }));
  vi.mocked(writeSnapshot).mockImplementation(async (name, value) => { remote[name] = value; });
});

describe('Non-destructive settings synchronization', () => {
  it('recovers the newer padded cloud document without mixing old unpadded chunks', () => {
    const rows = [
      { id: 'config-proj-chunk-0', concepto: '{"items":["old"]}' },
      { id: 'config-proj-chunk-001', concepto: '"current"]}' },
      { id: 'config-proj-chunk-000', concepto: '{"items":[' },
    ];
    expect(decodeLegacyProjections(rows)).toEqual({ items: ['current'] });
    expect(() => decodeLegacyProjections(rows.filter(r => r.id !== 'config-proj-chunk-000'))).toThrow();
  });
  it('compares local/remote/baseline and protects concurrent and first-run differences', () => {
    expect(decideSync('local', 'remote', null, true)).toBe('conflict');
    expect(decideSync('default', 'remote', null, false)).toBe('download');
    expect(decideSync('new', 'old', 'old', true)).toBe('upload');
    expect(decideSync('old', 'new', 'old', true)).toBe('download');
    expect(decideSync('a', 'b', 'old', true)).toBe('conflict');
    expect(decideSync('default', null, null, false)).toBe('idle');
  });
  it('does not upload defaults from an unconfigured phone', async () => {
    await syncPersonalSettings();
    expect(writeSnapshot).not.toHaveBeenCalled();
  });
  it('migrates customized desktop budgets, then downloads them on a fresh phone', async () => {
    useBudgetStore.getState().setAllBudgets({ comida: 419.2 }, { comida: 'manual' });
    await syncPersonalSettings();
    expect(remote.budgets).toBe(budgetValue(419.2));
    localStorage.clear();
    useBudgetStore.setState({ budgets: DEFAULT_BUDGETS, budgetModes: {} });
    await syncPersonalSettings();
    expect(useBudgetStore.getState().budgets.comida).toBe(419.2);
    expect(useBudgetStore.getState().budgetModes.comida).toBe('manual');
  });
  it('preserves both versions until an explicit resolution and makes a recovery copy', async () => {
    useBudgetStore.getState().setAllBudgets({ comida: 80 }, { comida: 'manual' });
    remote.budgets = budgetValue(90);
    await syncPersonalSettings();
    expect(useSettingsSync.getState().entries.budgets.status).toBe('conflict');
    expect(useBudgetStore.getState().budgets.comida).toBe(80);
    expect(writeSnapshot).not.toHaveBeenCalled();
    await resolveSettings('budgets', 'remote');
    expect(useBudgetStore.getState().budgets.comida).toBe(90);
    const backups = Object.keys(localStorage).filter(k => k.startsWith('finper_sync_backup_'));
    expect(backups.some(k => localStorage.getItem(k) === budgetValue(80))).toBe(true);
  });
  it('keeps unsent edits on network failure and retries after a reload', async () => {
    localStorage.setItem('finper_sync_baseline_budgets_v2', budgetValue(50));
    remote.budgets = budgetValue(50);
    useBudgetStore.getState().setAllBudgets({ comida: 70 }, { comida: 'manual' });
    vi.mocked(writeSnapshot).mockRejectedValueOnce(new Error('offline'));
    await syncPersonalSettings();
    expect(useBudgetStore.getState().budgets.comida).toBe(70);
    expect(localStorage.getItem('finper_sync_baseline_budgets_v2')).toBe(budgetValue(50));
    await syncPersonalSettings();
    expect(remote.budgets).toBe(budgetValue(70));
  });
  it('does not overwrite edits made during an in-flight read', async () => {
    let finish!: (value: { value: string; head: string }) => void;
    vi.mocked(readSnapshot).mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
    const syncing = syncPersonalSettings();
    useBudgetStore.getState().setAllBudgets({ comida: 123 }, { comida: 'manual' });
    finish({ value: budgetValue(90), head: 'revision' });
    await syncing;
    expect(useBudgetStore.getState().budgets.comida).toBe(123);
  });
  it('accepts empty projections and preserves a salary of 2700', async () => {
    remote.projections = canonical({ items: [], probabilidadSueldoPorMes: { '2026-10': 2700 } });
    await resolveSettings('projections', 'remote');
    expect(useProjectionStore.getState().items).toEqual([]);
    expect(useProjectionStore.getState().probabilidadSueldoPorMes['2026-10']).toBe(2700);
  });
});

it('paginates phone rows and exposes the same action handler in details', () => {
  const action = vi.fn();
  const rows = Array.from({ length: 6 }, (_, i) => ({ id: String(i), concepto: `Movimiento ${i}`, fecha: '2026-11-01', entidad: 'Interbank', tipo: 'Egreso', monto: 10, categoria: 'Servicio' } as EffectiveProjectedRow));
  render(<MobileProjectionList rows={rows} onCycle={() => {}} actions={r => <button onClick={() => action(r.id)}>Editar {r.id}</button>} />);
  expect(screen.queryByText('Movimiento 5')).toBeNull();
  fireEvent.click(screen.getByText('Siguiente →'));
  fireEvent.click(screen.getByText('Editar 5'));
  expect(action).toHaveBeenCalledWith('5');
  expect(screen.queryByText('Movimiento 0')).toBeNull();
});
