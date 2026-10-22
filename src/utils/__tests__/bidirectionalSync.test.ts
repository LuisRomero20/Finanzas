import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  enqueuePendingSave,
  enqueuePendingDelete,
  flushPendingPaymentsOutbox,
  getPendingOutboxCount,
  getPendingOutboxItems,
  clearPendingOutboxForTesting,
} from '../../services/pendingPaymentsOutbox';
import { readSnapshot, writeSnapshot, canonical } from '../../services/settingsSnapshot';
import * as supabaseService from '../../services/supabaseService';
import * as authService from '../../services/authService';
import type { PendingPaymentItem } from '../../store/pendingPaymentsStore';
import { supabase } from '../../lib/supabase';

describe('FINPER 2.0.1 — Sincronización Bidireccional y Resiliencia Multidispositivo', () => {
  const dummyItem1: PendingPaymentItem = {
    id: 'pend-sync-001',
    concepto: 'Servicio Cloud PC',
    monto: 45.5,
    tipo: 'Egreso',
    categoria: 'Suscripciones',
    entidad: 'Interbank',
    fecha: '2026-10-25',
    mes: 'Octubre',
    mesStr: '2026-10',
    estado: 'pendiente',
    origen: 'Manual',
    fechaCreacion: '2026-10-22T12:00:00.000Z',
  };

  beforeEach(() => {
    localStorage.clear();
    clearPendingOutboxForTesting();
    vi.restoreAllMocks();

    // Sesión mockeada activa por defecto
    vi.spyOn(authService, 'getValidatedSession').mockResolvedValue({
      access_token: 'jwt-valid-token-pc',
      refresh_token: 'refresh-token-pc',
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      token_type: 'bearer',
      user: { id: '0fdea8f0-da9c-458b-a78c-4810a0685f2b', email: 'luis_jesusrc@hotmail.com' } as any,
    });
  });

  // ============================================================================
  // ESCENARIO 1: Interrupción de Red y Recuperación en Outbox
  // ============================================================================
  it('retiene operaciones durante corte de red y las envía atómicamente al restaurar conexión', async () => {
    const saveSpy = vi.spyOn(supabaseService, 'savePendingPaymentToSupabase')
      .mockRejectedValueOnce(new Error('Network offline / Failed to fetch'))
      .mockResolvedValueOnce(true);

    enqueuePendingSave(dummyItem1, '0fdea8f0-da9c-458b-a78c-4810a0685f2b');

    // Primer flush falla por red
    const resultFail = await flushPendingPaymentsOutbox();
    expect(resultFail.remaining).toBe(1);
    expect(getPendingOutboxCount()).toBe(1);

    const items = getPendingOutboxItems();
    expect(items[0].attempts).toBe(1);
    expect(items[0].lastError).toContain('Network offline');

    // Conexión restaurada: segundo flush tiene éxito
    const resultSuccess = await flushPendingPaymentsOutbox();
    expect(resultSuccess.flushed).toBe(1);
    expect(resultSuccess.remaining).toBe(0);
    expect(getPendingOutboxCount()).toBe(0);
    expect(saveSpy).toHaveBeenCalledTimes(2);
  });

  // ============================================================================
  // ESCENARIO 2: Cancelación Local de Operación no Sincronizada
  // ============================================================================
  it('cancela localmente un pago pendiente eliminado antes de tocar la nube para evitar tráfico fantasma', async () => {
    const saveSpy = vi.spyOn(supabaseService, 'savePendingPaymentToSupabase').mockResolvedValue(true);
    const deleteSpy = vi.spyOn(supabaseService, 'deletePendingPaymentFromSupabase').mockResolvedValue(true);

    // Deshabilitar temporalmente auto-flush para simular acción inmediata del usuario
    vi.spyOn(authService, 'getValidatedSession').mockResolvedValueOnce(null);
    enqueuePendingSave(dummyItem1);
    expect(getPendingOutboxCount()).toBe(1);

    // Usuario elimina inmediatamente el ítem recién creado antes de que sincronice
    enqueuePendingDelete('pend-sync-001');

    // La operación de guardado debió cancelarse directamente en cola
    expect(getPendingOutboxCount()).toBe(0);
    expect(saveSpy).not.toHaveBeenCalled();
    expect(deleteSpy).not.toHaveBeenCalled();
  });

  // ============================================================================
  // ESCENARIO 3: Aislamiento de Sesión en Outbox
  // ============================================================================
  it('no despacha operaciones pertenecientes a otro usuario si se cambia de sesión', async () => {
    const saveSpy = vi.spyOn(supabaseService, 'savePendingPaymentToSupabase').mockResolvedValue(true);

    // Encolar con usuario A
    enqueuePendingSave(dummyItem1, 'user-a-uuid');

    // Iniciar sesión como usuario B
    vi.spyOn(authService, 'getValidatedSession').mockResolvedValue({
      access_token: 'jwt-user-b',
      refresh_token: 'refresh-b',
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      token_type: 'bearer',
      user: { id: 'user-b-uuid', email: 'otro_usuario@test.com' } as any,
    });

    const result = await flushPendingPaymentsOutbox();
    expect(result.flushed).toBe(0);
    expect(result.remaining).toBe(1);
    expect(saveSpy).not.toHaveBeenCalled();
  });

  // ============================================================================
  // ESCENARIO 4: Detección de Conflictos Concurrentes en Ajustes Personales
  // ============================================================================
  it('detecta condición de carrera entre dos dispositivos y rechaza sobrescritura obsoleta', async () => {
    const dbRows = new Map<string, any>();

    vi.spyOn(supabase, 'from').mockImplementation(((table: string) => {
      let filterId: string | null = null;
      let filterConcepto: string | null = null;
      let likePrefix = '';
      let isSingle = false;

      const query: any = {
        select: () => query,
        eq: (k: string, v: any) => {
          if (k === 'id') filterId = v;
          if (k === 'concepto') filterConcepto = v;
          return query;
        },
        like: (_k: string, pattern: string) => {
          likePrefix = pattern.endsWith('%') ? pattern.slice(0, -1) : pattern;
          return query;
        },
        order: () => query,
        limit: () => query,
        maybeSingle: async () => {
          isSingle = true;
          const row = filterId ? dbRows.get(filterId) : null;
          return { data: row ?? null, error: null };
        },
        insert: async (payload: any) => {
          const rows = Array.isArray(payload) ? payload : [payload];
          rows.forEach(r => dbRows.set(r.id, r));
          return { data: rows, error: null };
        },
        update: (payload: any) => {
          return {
            eq: (k: string, v: any) => {
              if (k === 'id') filterId = v;
              return {
                eq: (k2: string, v2: any) => {
                  if (k2 === 'concepto') filterConcepto = v2;
                  return {
                    select: async () => {
                      const existing = filterId ? dbRows.get(filterId) : null;
                      if (existing && existing.concepto === filterConcepto) {
                        existing.concepto = payload.concepto;
                        dbRows.set(filterId, existing);
                        return { data: [existing], error: null };
                      }
                      // Conflicto de versión optimista (0 filas modificadas)
                      return { data: [], error: null };
                    },
                  };
                },
              };
            },
          };
        },
        upsert: async (payload: any) => {
          dbRows.set(payload.id, payload);
          return { data: payload, error: null };
        },
        then: (resolve: (val: any) => any) => {
          let rows = [...dbRows.values()];
          if (likePrefix) {
            rows = rows.filter(r => String(r.id).startsWith(likePrefix));
          }
          if (filterId) {
            rows = rows.filter(r => r.id === filterId);
          }
          rows.sort((a, b) => (Number(a.monto) || 0) - (Number(b.monto) || 0));
          return Promise.resolve({ data: isSingle ? rows[0] ?? null : rows, error: null }).then(resolve);
        },
      };
      return query;
    }) as any);

    // Dispositivo A guarda versión inicial
    const baseValue = canonical({ pres: 'Base Presupuesto' });
    await writeSnapshot('budgets', baseValue, null);

    const initialRead = await readSnapshot('budgets');
    expect(initialRead.value).toBe(baseValue);
    const initialHead = initialRead.head;

    // Dispositivo B actualiza la configuración a versión 2
    const devBValue = canonical({ pres: 'Actualizado en iPhone' });
    await writeSnapshot('budgets', devBValue, initialHead);

    // Dispositivo A intenta actualizar con su 'initialHead' obsoleto
    const devAValue = canonical({ pres: 'Sobrescritura conflictiva en PC' });
    await expect(writeSnapshot('budgets', devAValue, initialHead)).rejects.toThrow(
      'Otro dispositivo actualizó los datos'
    );

    // Verificar que prevaleció la versión del dispositivo B sin corrupción
    const finalRead = await readSnapshot('budgets');
    expect(finalRead.value).toBe(devBValue);
  });

  // ============================================================================
  // ESCENARIO 5: Lectura Dual con Priorización de Marca de Tiempo Más Reciente
  // ============================================================================
  it('prioriza la tabla dedicada personal_settings cuando tiene timestamp más reciente que transacciones', async () => {
    const memory = new Map<string, any>();

    // Simular que personal_settings tiene una versión más nueva que transacciones
    memory.set('config-sync-budgets', {
      id: 'config-sync-budgets',
      concepto: JSON.stringify({ revision: 'rev-old', count: 1, updated_at: '2026-10-22T10:00:00.000Z' }),
    });

    vi.spyOn(supabase, 'from').mockImplementation(((table: string) => {
      let filterName = '';
      const query: any = {
        select: () => query,
        eq: (k: string, v: any) => {
          if (k === 'name') filterName = v;
          return query;
        },
        maybeSingle: async () => {
          if (table === 'personal_settings' && filterName === 'budgets') {
            return {
              data: {
                data: { modo: 'estricto', version_reciente: true },
                version: 2,
                updated_at: '2026-10-22T15:00:00.000Z', // 5 horas más reciente que legacy
              },
              error: null,
            };
          }
          if (table === 'transacciones') {
            return { data: memory.get('config-sync-budgets'), error: null };
          }
          return { data: null, error: null };
        },
      };
      return query;
    }) as any);

    const snapshot = await readSnapshot('budgets');
    expect(snapshot.value).toBe(canonical({ modo: 'estricto', version_reciente: true }));
  });

  // ============================================================================
  // ESCENARIO 6: Fallo Parcial de Fragmentos Nunca Publica Manifiesto
  // ============================================================================
  it('aborta y no actualiza el manifiesto si falla la inserción de fragmentos intermedios', async () => {
    let manifestPublished = false;

    vi.spyOn(supabase, 'from').mockImplementation(((table: string) => {
      const query: any = {
        insert: async (payload: any) => {
          const rows = Array.isArray(payload) ? payload : [payload];
          // Simular que el lote de chunks falla por error de base de datos
          if (rows.some(r => r.id.includes('-'))) {
            return { data: null, error: new Error('Error simulado en chunk insert') };
          }
          manifestPublished = true;
          return { data: rows, error: null };
        },
      };
      return query;
    }) as any);

    await expect(writeSnapshot('budgets', canonical({ valor: 'incompleto' }), null)).rejects.toThrow(
      'Error simulado en chunk insert'
    );
    expect(manifestPublished).toBe(false);
  });
});
