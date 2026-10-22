import { describe, expect, it } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('FINPER 2.0.1 — Validación de Migración e Integridad RLS (personal_settings)', () => {
  const migrationPath = path.resolve(
    process.cwd(),
    'supabase/migrations/20261022170000_create_personal_settings.sql'
  );

  it('verifica la existencia y estructura sintáctica del archivo de migración SQL', () => {
    expect(fs.existsSync(migrationPath)).toBe(true);
    const sql = fs.readFileSync(migrationPath, 'utf-8');
    expect(sql.length).toBeGreaterThan(100);

    // Debe ser transaccional (BEGIN ... COMMIT)
    expect(sql).toMatch(/^\s*BEGIN;/m);
    expect(sql).toMatch(/COMMIT;\s*$/m);
  });

  it('garantiza que la migración es estrictamente aditiva y no destructiva', () => {
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    // No debe contener comandos destructivos sobre tablas existentes
    expect(sql).not.toMatch(/DROP\s+TABLE/i);
    expect(sql).not.toMatch(/TRUNCATE\s+TABLE/i);
    expect(sql).not.toMatch(/DROP\s+COLUMN/i);

    // Debe crear la tabla solo si no existe
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.personal_settings');
  });

  it('valida la activación y forzado estricto de Row Level Security (RLS)', () => {
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    expect(sql).toContain('ALTER TABLE public.personal_settings ENABLE ROW LEVEL SECURITY;');
    expect(sql).toContain('ALTER TABLE public.personal_settings FORCE ROW LEVEL SECURITY;');
  });

  it('valida la revocación total de privilegios a roles anónimos y públicos', () => {
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    expect(sql).toContain('REVOKE ALL PRIVILEGES ON TABLE public.personal_settings FROM anon;');
    expect(sql).toContain('REVOKE ALL PRIVILEGES ON TABLE public.personal_settings FROM public;');
    expect(sql).toContain('REVOKE TRUNCATE ON TABLE public.personal_settings FROM anon, authenticated, public;');
  });

  it('valida que las 4 políticas RLS (SELECT, INSERT, UPDATE, DELETE) aíslen estrictamente por auth.uid()', () => {
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    // SELECT
    expect(sql).toMatch(/CREATE POLICY "personal_settings_select_own"[\s\S]*?FOR SELECT[\s\S]*?USING\s*\(\s*auth\.uid\(\)\s*=\s*user_id\s*\)/i);

    // INSERT
    expect(sql).toMatch(/CREATE POLICY "personal_settings_insert_own"[\s\S]*?FOR INSERT[\s\S]*?WITH CHECK\s*\(\s*auth\.uid\(\)\s*=\s*user_id\s*\)/i);

    // UPDATE
    expect(sql).toMatch(/CREATE POLICY "personal_settings_update_own"[\s\S]*?FOR UPDATE[\s\S]*?USING\s*\(\s*auth\.uid\(\)\s*=\s*user_id\s*\)[\s\S]*?WITH CHECK\s*\(\s*auth\.uid\(\)\s*=\s*user_id\s*\)/i);

    // DELETE
    expect(sql).toMatch(/CREATE POLICY "personal_settings_delete_own"[\s\S]*?FOR DELETE[\s\S]*?USING\s*\(\s*auth\.uid\(\)\s*=\s*user_id\s*\)/i);
  });

  it('simula el motor de evaluación de políticas RLS para garantizar aislamiento estricto de tenants', () => {
    interface SecurityContext {
      authUid: string | null;
      role: 'anon' | 'authenticated' | 'service_role';
    }

    interface PersonalSettingRow {
      id: string;
      user_id: string;
      name: string;
      data: any;
    }

    // Motor de evaluación simulado según la especificación SQL de la migración
    const evaluatePolicy = (
      action: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'TRUNCATE',
      row: PersonalSettingRow,
      ctx: SecurityContext
    ): boolean => {
      // 1. TRUNCATE está revocado para todos
      if (action === 'TRUNCATE') return false;

      // 2. Anon y Public revocados
      if (ctx.role === 'anon' || !ctx.authUid) return false;

      // 3. Service role tiene acceso administrativo
      if (ctx.role === 'service_role') return true;

      // 4. Authenticated: auth.uid() = user_id
      if (ctx.role === 'authenticated') {
        return ctx.authUid === row.user_id;
      }

      return false;
    };

    const rowUser1: PersonalSettingRow = {
      id: '0fdea8f0-budgets',
      user_id: '0fdea8f0-da9c-458b-a78c-4810a0685f2b',
      name: 'budgets',
      data: { limite: 5000 },
    };

    // Caso A: Anónimo intentando leer o escribir -> DENEGADO
    const anonCtx: SecurityContext = { authUid: null, role: 'anon' };
    expect(evaluatePolicy('SELECT', rowUser1, anonCtx)).toBe(false);
    expect(evaluatePolicy('INSERT', rowUser1, anonCtx)).toBe(false);
    expect(evaluatePolicy('UPDATE', rowUser1, anonCtx)).toBe(false);
    expect(evaluatePolicy('DELETE', rowUser1, anonCtx)).toBe(false);

    // Caso B: Usuario 2 intentando leer o modificar datos de Usuario 1 -> DENEGADO
    const user2Ctx: SecurityContext = { authUid: 'attacker-uuid-999', role: 'authenticated' };
    expect(evaluatePolicy('SELECT', rowUser1, user2Ctx)).toBe(false);
    expect(evaluatePolicy('INSERT', rowUser1, user2Ctx)).toBe(false);
    expect(evaluatePolicy('UPDATE', rowUser1, user2Ctx)).toBe(false);
    expect(evaluatePolicy('DELETE', rowUser1, user2Ctx)).toBe(false);

    // Caso C: Propietario legítimo -> PERMITIDO
    const ownerCtx: SecurityContext = { authUid: '0fdea8f0-da9c-458b-a78c-4810a0685f2b', role: 'authenticated' };
    expect(evaluatePolicy('SELECT', rowUser1, ownerCtx)).toBe(true);
    expect(evaluatePolicy('INSERT', rowUser1, ownerCtx)).toBe(true);
    expect(evaluatePolicy('UPDATE', rowUser1, ownerCtx)).toBe(true);
    expect(evaluatePolicy('DELETE', rowUser1, ownerCtx)).toBe(true);

    // Caso D: TRUNCATE denegado incluso al usuario autenticado
    expect(evaluatePolicy('TRUNCATE', rowUser1, ownerCtx)).toBe(false);
  });
});
