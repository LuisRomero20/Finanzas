import { beforeEach, describe, expect, it, vi } from 'vitest';
import { writeSnapshot, canonical, getMirrorSyncStatus, repairMirrorSync } from '../../services/settingsSnapshot';
import { insertTransactionToSupabase, deleteTransactionFromSupabase } from '../../services/supabaseService';
import * as authService from '../../services/authService';
import { supabase, updateManagedSdkToken, getManagedSdkToken } from '../../lib/supabase';
import type { Transaction } from '../../utils/masterData';

describe('FINPER 2.0.2 — Pruebas Rigurosas de Sincronización, Concurrencia y Resiliencia RLS', () => {
  const dummyTx: Transaction = {
    id: 'tx-v202-001',
    Tipo: 'Egreso',
    Fecha: '2026-10-22',
    Concepto: 'Prueba Recuperación V202',
    Categoria: 'Servicios',
    Entidad: 'BCP',
    Monto: 120.5,
    Mes: 'Octubre',
  };

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();

    vi.spyOn(authService, 'getValidatedSession').mockResolvedValue({
      access_token: 'valid-jwt-v202',
      refresh_token: 'refresh-jwt-v202',
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      token_type: 'bearer',
      user: { id: '0fdea8f0-da9c-458b-a78c-4810a0685f2b', email: 'luis_jesusrc@hotmail.com' } as any,
    });
  });

  // ============================================================================
  // REQUISITO 1: Rechazo de Sobrescritura Ciega ante Colisión 23505
  // ============================================================================
  it('rechaza sobrescritura ciega y lanza conflicto optimista cuando previousHead es null pero la fila ya existía (23505)', async () => {
    const memory = new Map<string, any>();
    const originalConcept = JSON.stringify({ revision: 'existing-rev-cloud', count: 1 });
    memory.set('config-sync-budgets', {
      id: 'config-sync-budgets',
      concepto: originalConcept,
      monto: 0,
    });

    vi.spyOn(supabase, 'from').mockImplementation(((_table: string) => {
      let filterId: string | null = null;
      const query: any = {
        select: () => query,
        eq: (k: string, v: any) => {
          if (k === 'id') filterId = v;
          return query;
        },
        like: () => query,
        order: () => query,
        limit: () => query,
        maybeSingle: async () => {
          const row = filterId ? memory.get(filterId) : null;
          return { data: row ?? null, error: null };
        },
        insert: async (payload: any) => {
          const rows = Array.isArray(payload) ? payload : [payload];
          for (const r of rows) {
            if (memory.has(r.id)) {
              // Simular error 23505 de Postgres (duplicate key / row preexistente)
              return { data: null, error: { code: '23505', message: 'duplicate key value violates unique constraint' } };
            }
            memory.set(r.id, r);
          }
          return { data: rows, error: null };
        },
        update: () => ({
          eq: () => ({
            eq: () => ({
              select: async () => ({ data: [], error: null }),
            }),
          }),
        }),
        upsert: async () => ({ error: null }),
      };
      return query;
    }) as any);

    const testValue = canonical({ test: 'intento_sobrescritura_ciega' });

    // Debe lanzar error de concurrencia optimista y NUNCA ejecutar update ciego
    await expect(writeSnapshot('budgets', testValue, null)).rejects.toThrow(
      'Otro dispositivo actualizó los datos. Reintenta para comparar las versiones.'
    );

    // Confirmar que la versión preexistente en la nube quedó completamente intacta
    const persisted = memory.get('config-sync-budgets');
    expect(persisted.concepto).toBe(originalConcept);
  });

  // ============================================================================
  // REQUISITO 2: Condición de Carrera entre PC e iPhone
  // ============================================================================
  it('detecta condición de carrera entre PC e iPhone y previene pérdida silenciosa', async () => {
    const memory = new Map<string, any>();
    let currentManifest = JSON.stringify({ revision: 'v1-shared', count: 1 });
    memory.set('config-sync-projections', {
      id: 'config-sync-projections',
      concepto: currentManifest,
      monto: 0,
    });

    vi.spyOn(supabase, 'from').mockImplementation(((_table: string) => {
      let filterId: string | null = null;
      let filterConcepto: string | null = null;
      const query: any = {
        select: () => query,
        eq: (k: string, v: any) => {
          if (k === 'id') filterId = v;
          if (k === 'concepto') filterConcepto = v;
          return query;
        },
        insert: async (payload: any) => {
          const rows = Array.isArray(payload) ? payload : [payload];
          rows.forEach(r => memory.set(r.id, r));
          return { data: rows, error: null };
        },
        update: (payload: any) => ({
          eq: (k: string, v: any) => {
            if (k === 'id') filterId = v;
            return {
              eq: (k2: string, v2: any) => {
                if (k2 === 'concepto') filterConcepto = v2;
                return {
                  select: async () => {
                    const row = filterId ? memory.get(filterId) : null;
                    if (row && row.concepto === filterConcepto) {
                      row.concepto = payload.concepto;
                      memory.set(filterId, row);
                      currentManifest = payload.concepto;
                      return { data: [row], error: null };
                    }
                    return { data: [], error: null };
                  },
                };
              },
            };
          },
        }),
        upsert: async () => ({ error: null }),
        maybeSingle: async () => ({ data: filterId ? memory.get(filterId) : null, error: null }),
      };
      return query;
    }) as any);

    const initialHead = currentManifest;

    // Dispositivo A (iPhone) actualiza primero con éxito
    const iphoneValue = canonical({ items: [{ id: 'p1', monto: 500 }] });
    await expect(writeSnapshot('projections', iphoneValue, initialHead)).resolves.not.toThrow();

    // Dispositivo B (PC) intenta actualizar utilizando el 'initialHead' que ya quedó obsoleto
    const pcValue = canonical({ items: [{ id: 'p1', monto: 800 }] });
    await expect(writeSnapshot('projections', pcValue, initialHead)).rejects.toThrow(
      'Otro dispositivo actualizó los datos'
    );

    // Comprobar que prevalece la versión de iPhone sin sobrescritura accidental
    expect(memory.get('config-sync-projections').concepto).toBe(currentManifest);
  });

  // ============================================================================
  // REQUISITO 3: Rechazo por Sesión Caducada
  // ============================================================================
  it('rechaza operaciones de guardado cuando la sesión ha caducado sin perder datos', async () => {
    vi.spyOn(authService, 'getValidatedSession').mockResolvedValue(null);

    await expect(writeSnapshot('budgets', '{}', null)).rejects.toThrow(
      'Se requiere sesión activa y validada'
    );

    const txResult = await insertTransactionToSupabase(dummyTx);
    expect(txResult.success).toBe(false);
    expect(txResult.error).toContain('Se requiere sesión activa');
  });

  // ============================================================================
  // REQUISITO 4: Flujo de Renovación de Token (Token Refresh)
  // ============================================================================
  it('permite reanudar sincronización después de una renovación exitosa de token', async () => {
    let tokenExpired = true;

    vi.spyOn(authService, 'getValidatedSession').mockImplementation(async () => {
      if (tokenExpired) {
        tokenExpired = false;
        return {
          access_token: 'renewed-jwt-token-ok',
          refresh_token: 'refresh-jwt-renewed',
          expires_at: Math.floor(Date.now() / 1000) + 7200,
          user: { id: '0fdea8f0-da9c-458b-a78c-4810a0685f2b' } as any,
        } as any;
      }
      return {
        access_token: 'renewed-jwt-token-ok',
        refresh_token: 'refresh-jwt-renewed',
        expires_at: Math.floor(Date.now() / 1000) + 7200,
        user: { id: '0fdea8f0-da9c-458b-a78c-4810a0685f2b' } as any,
      } as any;
    });

    vi.spyOn(supabase, 'from').mockImplementation(((_table: string) => ({
      upsert: (payload: any) => ({
        select: async () => ({ data: [payload], error: null }),
      }),
    }) as any));

    const result = await insertTransactionToSupabase(dummyTx);
    expect(result.success).toBe(true);
    expect(result.data[0].user_id).toBe('0fdea8f0-da9c-458b-a78c-4810a0685f2b');
  });

  // ============================================================================
  // REQUISITO 5: Fallo Parcial de Fragmentos Nunca Publica Manifiesto
  // ============================================================================
  it('aborta la operación y no modifica el manifiesto si falla la inserción de chunks intermedios', async () => {
    let manifestModified = false;

    vi.spyOn(supabase, 'from').mockImplementation(((_table: string) => ({
      insert: async (payload: any) => {
        const rows = Array.isArray(payload) ? payload : [payload];
        if (rows.some(r => String(r.id).includes('-'))) {
          return { data: null, error: { message: 'Network interruption during chunk transfer' } };
        }
        manifestModified = true;
        return { data: rows, error: null };
      },
    }) as any));

    await expect(writeSnapshot('budgets', canonical({ deep: 'data' }), null)).rejects.toThrow(
      'Network interruption during chunk transfer'
    );
    expect(manifestModified).toBe(false);
  });

  // ============================================================================
  // REQUISITO 6: Tolerancia y Detección Verificable de Estado del Mirror (personal_settings)
  // ============================================================================
  it('registra verifiable mirror status: table_not_migrated cuando no existe personal_settings', async () => {
    const memory = new Map<string, any>();

    vi.spyOn(supabase, 'from').mockImplementation(((table: string) => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: null, error: null }),
        }),
      }),
      insert: async (payload: any) => {
        const rows = Array.isArray(payload) ? payload : [payload];
        rows.forEach(r => memory.set(r.id, r));
        return { data: rows, error: null };
      },
      upsert: async () => {
        if (table === 'personal_settings') {
          return { data: null, error: { code: '42P01', message: 'relation "personal_settings" does not exist' } };
        }
        return { data: null, error: null };
      },
    }) as any));

    await writeSnapshot('budgets', canonical({ valid: true }), null);

    const status = getMirrorSyncStatus('budgets') as any;
    expect(status.status).toBe('table_not_migrated');
  });

  it('registra verifiable mirror status: desynced cuando la tabla existe pero la escritura falla', async () => {
    const memory = new Map<string, any>();

    vi.spyOn(supabase, 'from').mockImplementation(((table: string) => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: null, error: null }),
        }),
      }),
      insert: async (payload: any) => {
        const rows = Array.isArray(payload) ? payload : [payload];
        rows.forEach(r => memory.set(r.id, r));
        return { data: rows, error: null };
      },
      upsert: async () => {
        if (table === 'personal_settings') {
          return { data: null, error: { code: '57014', message: 'canceling statement due to statement timeout' } };
        }
        return { data: null, error: null };
      },
    }) as any));

    await writeSnapshot('classifications', canonical({ a: 'CatA' }), null);

    const status = getMirrorSyncStatus('classifications') as any;
    expect(status.status).toBe('desynced');
    expect(status.error).toContain('timeout');
  });

  it('permite reconciliar y reparar el mirror mediante repairMirrorSync', async () => {
    let mirrorUpserted = false;

    vi.spyOn(supabase, 'from').mockImplementation(((table: string) => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => {
            if (table === 'transacciones') {
              return {
                data: {
                  id: 'config-sync-statements',
                  concepto: JSON.stringify({ revision: 'r1', count: 1 }),
                },
                error: null,
              };
            }
            return { data: null, error: null };
          },
        }),
        like: () => ({
          order: () => ({
            limit: async () => ({
              data: [{ id: 'config-sync-statements-r1-0', concepto: '{"card":100}', monto: 0 }],
              error: null,
            }),
          }),
        }),
      }),
      upsert: async () => {
        mirrorUpserted = true;
        return { data: null, error: null };
      },
    }) as any));

    const repaired = await repairMirrorSync('statements');
    expect(repaired).toBe(true);
    expect(mirrorUpserted).toBe(true);
    const status = getMirrorSyncStatus('statements') as any;
    expect(status.status).toBe('synced');
  });

  // ============================================================================
  // REQUISITO 7: Titularidad RLS en Eliminación de Transacciones
  // ============================================================================
  it('rechaza eliminación de transacciones si no hay sesión autenticada', async () => {
    vi.spyOn(authService, 'getValidatedSession').mockResolvedValue(null);

    const success = await deleteTransactionFromSupabase('tx-v202-001');
    expect(success).toBe(false);
  });

  // ============================================================================
  // REQUISITO 8: Gestión Oficial de Tokens en Memoria y Cierre de Sesión
  // ============================================================================
  it('mantiene sincronizado el token administrado en memoria con el ciclo de vida de la sesión', () => {
    updateManagedSdkToken('token-lifecycle-test');
    expect(getManagedSdkToken()).toBe('token-lifecycle-test');

    // Cierre de sesión limpia el token administrado
    updateManagedSdkToken(null);
    expect(getManagedSdkToken()).toBeNull();
  });
});
