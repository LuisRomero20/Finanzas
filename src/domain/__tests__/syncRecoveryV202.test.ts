import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readSnapshot, writeSnapshot, canonical } from '../../services/settingsSnapshot';
import { insertTransactionToSupabase, deleteTransactionFromSupabase } from '../../services/supabaseService';
import * as authService from '../../services/authService';
import { supabase } from '../../lib/supabase';
import type { Transaction } from '../../utils/masterData';

describe('FINPER 2.0.2 — Pruebas de Recuperación de Sincronización y Resiliencia RLS', () => {
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
  // ESCENARIO 1: Recuperación de Inserción con Fila Preexistente (Unique 23505)
  // ============================================================================
  it('recupera y actualiza el manifiesto cuando previousHead es null pero la fila ya existía en transacciones', async () => {
    const memory = new Map<string, any>();
    // Simular que el manifiesto ya existía en Supabase
    memory.set('config-sync-budgets', {
      id: 'config-sync-budgets',
      concepto: JSON.stringify({ revision: 'old-rev', count: 1 }),
      monto: 0,
    });

    vi.spyOn(supabase, 'from').mockImplementation(((table: string) => {
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
              // Simular error 23505 de Postgres (duplicate key)
              return { data: null, error: { code: '23505', message: 'duplicate key value violates unique constraint' } };
            }
            memory.set(r.id, r);
          }
          return { data: rows, error: null };
        },
        update: (payload: any) => {
          return {
            eq: (k: string, v: any) => {
              if (k === 'id') {
                const existing = memory.get(v);
                if (existing) {
                  existing.concepto = payload.concepto;
                  memory.set(v, existing);
                }
              }
              return { error: null };
            },
          };
        },
        upsert: async () => ({ error: null }),
      };
      return query;
    }) as any);

    const testValue = canonical({ test: 'recuperacion_23505' });
    // Llamar writeSnapshot con previousHead null (primer intento de sync del cliente)
    await expect(writeSnapshot('budgets', testValue, null)).resolves.not.toThrow();

    const updatedRow = memory.get('config-sync-budgets');
    expect(updatedRow).toBeDefined();
    const manifest = JSON.parse(updatedRow.concepto);
    expect(manifest.count).toBe(1);
    expect(manifest.revision).toBeDefined();
  });

  // ============================================================================
  // ESCENARIO 2: Soft Fail cuando personal_settings no existe (42P01)
  // ============================================================================
  it('ejecuta exitosamente writeSnapshot aunque la tabla personal_settings devuelva 42P01 (no existe)', async () => {
    const memory = new Map<string, any>();

    vi.spyOn(supabase, 'from').mockImplementation(((table: string) => {
      let filterId: string | null = null;
      const query: any = {
        select: () => query,
        eq: (k: string, v: any) => {
          if (k === 'id') filterId = v;
          return query;
        },
        insert: async (payload: any) => {
          const rows = Array.isArray(payload) ? payload : [payload];
          rows.forEach(r => memory.set(r.id, r));
          return { data: rows, error: null };
        },
        update: (payload: any) => ({
          eq: () => ({
            eq: () => ({
              select: async () => ({ data: [{ id: 'config-sync-budgets' }], error: null }),
            }),
          }),
        }),
        upsert: async () => {
          if (table === 'personal_settings') {
            // Simular error 42P01 de Postgres: tabla no existe
            return { data: null, error: { code: '42P01', message: 'relation "personal_settings" does not exist' } };
          }
          return { data: null, error: null };
        },
        maybeSingle: async () => ({ data: filterId ? memory.get(filterId) : null, error: null }),
      };
      return query;
    }) as any);

    // Debe completar sin lanzar excepción
    await expect(writeSnapshot('budgets', canonical({ ok: true }), null)).resolves.not.toThrow();
  });

  // ============================================================================
  // ESCENARIO 3: Titularidad Estricta en insertTransactionToSupabase
  // ============================================================================
  it('rechaza inserción en transacciones si no existe una sesión de usuario activa', async () => {
    vi.spyOn(authService, 'getValidatedSession').mockResolvedValue(null);

    const result = await insertTransactionToSupabase(dummyTx);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Se requiere sesión activa');
  });

  it('adjunta obligatoriamente user_id de la sesión al insertar en transacciones', async () => {
    let capturedPayload: any = null;

    vi.spyOn(supabase, 'from').mockImplementation(((table: string) => ({
      upsert: (payload: any) => {
        capturedPayload = payload;
        return {
          select: async () => ({ data: [payload], error: null }),
        };
      },
    }) as any));

    const result = await insertTransactionToSupabase(dummyTx);
    expect(result.success).toBe(true);
    expect(capturedPayload).toBeDefined();
    expect(capturedPayload.user_id).toBe('0fdea8f0-da9c-458b-a78c-4810a0685f2b');
    expect(capturedPayload.id).toBe('tx-v202-001');
  });

  // ============================================================================
  // ESCENARIO 4: deleteTransactionFromSupabase Requiere Sesión Autenticada
  // ============================================================================
  it('rechaza eliminación de transacciones si no hay sesión autenticada', async () => {
    vi.spyOn(authService, 'getValidatedSession').mockResolvedValue(null);

    const success = await deleteTransactionFromSupabase('tx-v202-001');
    expect(success).toBe(false);
  });
});
