import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readSnapshot, writeSnapshot } from '../../services/settingsSnapshot';
import { resolveSettingsAssisted, useSettingsSync } from '../../services/personalSettingsSync';
import { useBudgetStore, DEFAULT_BUDGETS } from '../../store/budgetStore';
import { useProjectionStore } from '../../store/projectionStore';
import * as authService from '../../services/authService';

vi.mock('../../services/settingsSnapshot', async (importOriginal) => ({
  ...((await importOriginal()) as any),
  readSnapshot: vi.fn(),
  writeSnapshot: vi.fn(),
}));

vi.mock('../../services/authService', () => ({
  getValidatedSession: vi.fn(),
}));

describe('FINPER 2.0.4 — Persistencia Segura y Confirmación Transaccional', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    useBudgetStore.setState({ budgets: { ...DEFAULT_BUDGETS }, budgetModes: {} });
    useProjectionStore.setState({
      items: [
        { id: 'p-1', concepto: 'BBVA Bfree', monto: 271.84, tipo: 'Egreso', categoria: 'Financiero', dia: 5, mesInicio: '2026-10', recurrencia: 'fijo', entidad: 'BBVA Bfree' },
      ],
      probabilidadSueldoPorMes: {},
    });

    vi.mocked(authService.getValidatedSession).mockResolvedValue({
      user: { id: 'test-user-id' } as any,
    } as any);
  });

  it('preserves local state untouched if remote writeSnapshot fails during assisted reconciliation', async () => {
    const remoteValue = JSON.stringify({
      items: [
        { id: 'p-1', concepto: 'BBVA Bfree', monto: 272.80, tipo: 'Egreso', categoria: 'Financiero', dia: 5, mesInicio: '2026-10', recurrencia: 'fijo', entidad: 'BBVA Bfree' },
      ],
      probabilidadSueldoPorMes: {},
    });

    vi.mocked(readSnapshot).mockResolvedValue({
      value: remoteValue,
      head: 'rev-remote-001',
    });

    // Simulamos fallo transitorio de Supabase al escribir
    vi.mocked(writeSnapshot).mockRejectedValueOnce(new Error('NetworkError: Failed to fetch Supabase /rest/v1'));

    // Ejecutamos la conciliación asistida eligiendo el valor de la nube (272.80)
    await expect(
      resolveSettingsAssisted('projections', {
        'p-1': { itemId: 'p-1', type: 'use_remote' },
      })
    ).rejects.toThrowError(/Failed to fetch/i);

    // CONTROL TRANSACCIONAL: El estado local NO debe haber mutado al valor de la nube
    const currentLocalProjections = useProjectionStore.getState().items;
    expect(currentLocalProjections[0].monto).toBe(271.84); // Conserva el valor de la PC

    // Se verifica que el estado de sincronización refleje el error sin corromper la copia local
    expect(useSettingsSync.getState().entries.projections.status).toBe('error');

    // Se verifica que se haya creado el respaldo previo con timestamp para custodia
    const backups = Object.keys(localStorage).filter(k => k.startsWith('finper_sync_backup_projections_assisted_'));
    expect(backups.length).toBeGreaterThan(0);
    const backupContent = JSON.parse(localStorage.getItem(backups[0])!);
    expect(backupContent.local.items[0].monto).toBe(271.84);
    expect(backupContent.mergedDraft.items[0].monto).toBe(272.80);
  });

  it('commits to local state ONLY after writeSnapshot confirms successful remote persistence', async () => {
    const remoteValue = JSON.stringify({
      items: [
        { id: 'p-1', concepto: 'BBVA Bfree', monto: 272.80, tipo: 'Egreso', categoria: 'Financiero', dia: 5, mesInicio: '2026-10', recurrencia: 'fijo', entidad: 'BBVA Bfree' },
      ],
      probabilidadSueldoPorMes: {},
    });

    vi.mocked(readSnapshot).mockResolvedValue({
      value: remoteValue,
      head: 'rev-remote-001',
    });

    let localStateDuringRemoteWrite: number | null = null;
    vi.mocked(writeSnapshot).mockImplementation(async () => {
      // En el momento en que se escribe a Supabase, el estado local aún NO debe haber sido alterado
      localStateDuringRemoteWrite = useProjectionStore.getState().items[0].monto;
    });

    const result = await resolveSettingsAssisted('projections', {
      'p-1': { itemId: 'p-1', type: 'use_remote' },
    });

    expect(result.success).toBe(true);

    // Confirmación del orden estricto de guardado:
    // 1. Durante la llamada a writeSnapshot, el estado local era todavía el original (271.84)
    expect(localStateDuringRemoteWrite).toBe(271.84);

    // 2. Solo después del retorno exitoso de writeSnapshot, el estado local se actualiza a 272.80
    expect(useProjectionStore.getState().items[0].monto).toBe(272.80);
    expect(useSettingsSync.getState().entries.projections.status).toBe('synced');
  });
});
