import { describe, expect, it, vi } from 'vitest';
import type * as SupabaseLib from '../../lib/supabase';

const toBase64Url = (value: unknown) => btoa(JSON.stringify(value))
  .replace(/=/g, '')
  .replace(/\+/g, '-')
  .replace(/\//g, '_');

const makeLegacyJwt = (ref: string, role = 'anon') => [
  toBase64Url({ alg: 'HS256', typ: 'JWT' }),
  toBase64Url({ iss: 'supabase', ref, role, iat: 1, exp: 4_102_444_800 }),
  'synthetic-signature-for-format-tests',
].join('.');

describe('FINPER 2.1.1 — configuración pública de Supabase', async () => {
  const actualLib = await vi.importActual<typeof SupabaseLib>('../../lib/supabase');
  const {
    AUTHORIZED_SUPABASE_URL,
    TARGET_PROJECT_REF,
    FINPER_VERSION,
    assertSupabaseWritesAllowed,
    extractProjectRefFromKey,
    extractProjectRefFromUrl,
    inspectSupabasePublicKey,
    resolveSupabaseConfig,
    verifyResolvedSupabaseConfig,
  } = actualLib;

  const MODERN_KEY = 'sb_publishable_1234567890123456789012_12345678';
  const LEGACY_KEY = makeLegacyJwt(TARGET_PROJECT_REF);

  it('mantiene un único proyecto autorizado sin incorporar credenciales de respaldo', () => {
    expect(TARGET_PROJECT_REF).toBe('njgzhjwfcxdxiibkuuqg');
    expect(AUTHORIZED_SUPABASE_URL).toBe('https://njgzhjwfcxdxiibkuuqg.supabase.co');
    expect(FINPER_VERSION).toBe('2.1.1');

    const missing = resolveSupabaseConfig({});
    expect(missing.health.configurationState).toBe('missing');
    expect(missing.health.isHealthy).toBe(false);
    expect(missing.key).not.toMatch(/^eyJ/);
    expect(() => assertSupabaseWritesAllowed(missing.health)).toThrow(/Escrituras detenidas/);
  });

  it('extrae el proyecto de la URL y solo de JWT heredados', () => {
    expect(extractProjectRefFromUrl(`${AUTHORIZED_SUPABASE_URL}/rest/v1/`)).toBe(TARGET_PROJECT_REF);
    expect(extractProjectRefFromUrl('https://otro.supabase.co')).toBe('otro');
    expect(extractProjectRefFromUrl('https://example.com')).toBeNull();
    expect(extractProjectRefFromKey(LEGACY_KEY)).toBe(TARGET_PROJECT_REF);
    expect(extractProjectRefFromKey(MODERN_KEY)).toBeNull();
  });

  it('interpreta una clave publicable moderna como opaca y pendiente de verificación', () => {
    expect(inspectSupabasePublicKey(MODERN_KEY)).toEqual({
      format: 'modern_publishable',
      projectRef: null,
      role: 'anon',
    });

    const resolved = resolveSupabaseConfig({
      url: AUTHORIZED_SUPABASE_URL,
      publishableKey: MODERN_KEY,
    });
    expect(resolved.health.configurationState).toBe('unverified');
    expect(resolved.health.keyStatus).toBe('unverified');
    expect(resolved.health.errorMessage).not.toMatch(/proyecto distinto|no pertenece/i);
  });

  it('acepta el formato anon JWT heredado, pero exige confirmación del gateway', () => {
    const resolved = resolveSupabaseConfig({
      url: AUTHORIZED_SUPABASE_URL,
      legacyAnonKey: LEGACY_KEY,
    });
    expect(resolved.health.keyFormat).toBe('legacy_anon_jwt');
    expect(resolved.health.configurationState).toBe('unverified');
    expect(resolved.health.isHealthy).toBe(false);
  });

  it('bloquea URL, JWT y claves de servidor incompatibles sin filtrar tokens', () => {
    const wrongUrl = resolveSupabaseConfig({
      url: 'https://otroproyecto.supabase.co',
      publishableKey: MODERN_KEY,
    });
    expect(wrongUrl.health.configurationState).toBe('mismatched');

    const wrongJwt = resolveSupabaseConfig({
      url: AUTHORIZED_SUPABASE_URL,
      legacyAnonKey: makeLegacyJwt('otroproyecto'),
    });
    expect(wrongJwt.health.keyStatus).toBe('mismatched');
    expect(wrongJwt.health.isHealthy).toBe(false);

    const secret = resolveSupabaseConfig({
      url: AUTHORIZED_SUPABASE_URL,
      publishableKey: 'sb_secret_never-put-this-in-a-browser',
    });
    expect(secret.health.configurationState).toBe('invalid');
    expect(JSON.stringify(secret.health)).not.toContain('sb_secret_');
  });

  it('habilita el funcionamiento normal únicamente cuando el gateway confirma la clave', async () => {
    const resolved = resolveSupabaseConfig({
      url: AUTHORIZED_SUPABASE_URL,
      publishableKey: MODERN_KEY,
    });
    const fetcher = vi.fn(async () => new Response('{}', { status: 200 })) as unknown as typeof fetch;
    const health = await verifyResolvedSupabaseConfig(resolved, fetcher);

    expect(fetcher).toHaveBeenCalledWith(`${AUTHORIZED_SUPABASE_URL}/auth/v1/settings`, expect.objectContaining({ method: 'GET' }));
    expect(health.configurationState).toBe('verified');
    expect(health.isHealthy).toBe(true);
    expect(() => assertSupabaseWritesAllowed(health)).not.toThrow();
  });

  it('mantiene las escrituras bloqueadas ante rechazo real o verificación no disponible', async () => {
    const resolved = resolveSupabaseConfig({
      url: AUTHORIZED_SUPABASE_URL,
      publishableKey: MODERN_KEY,
    });
    const rejected = await verifyResolvedSupabaseConfig(
      resolved,
      vi.fn(async () => new Response('{}', { status: 401 })) as unknown as typeof fetch,
    );
    expect(rejected.configurationState).toBe('mismatched');
    expect(() => assertSupabaseWritesAllowed(rejected)).toThrow(/Escrituras detenidas/);

    const unavailable = await verifyResolvedSupabaseConfig(
      resolved,
      vi.fn(async () => { throw new TypeError('network offline'); }) as unknown as typeof fetch,
    );
    expect(unavailable.configurationState).toBe('unverified');
    expect(unavailable.severity).toBe('warning');
    expect(unavailable.errorMessage).toMatch(/No se confirmó una discrepancia/);
  });
});
