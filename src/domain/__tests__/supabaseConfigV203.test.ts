import { describe, expect, it, vi } from 'vitest';
import * as SupabaseLib from '../../lib/supabase';

describe('FINPER 2.0.3 — Verificación Estricta de Configuración Supabase y Contención de Dominios', async () => {
  // Importar la implementación real de las utilidades de configuración sin los mocks de prueba
  const actualLib = await vi.importActual<typeof SupabaseLib>('../../lib/supabase');
  const {
    TARGET_PROJECT_REF,
    FINPER_VERSION,
    extractProjectRefFromUrl,
    extractProjectRefFromKey,
    resolveSupabaseConfig,
    getSupabaseConfigHealth,
  } = actualLib;

  const VALID_TARGET_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qZ3poandmY3hkeGlpYmt1dXFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwMjg5MjksImV4cCI6MjEwMzYwNDkyOX0.VQSGP9NSUAI1M_BaOtqhxC4hl8o8jAx7HC0rlrnzMNA';
  const OBSOLETE_PUBLISHABLE_KEY = 'sb_publishable_hvgD4QA4kOCxTTqEMlFLLg_OjNAeLhu';

  // 1. Identificador de proyecto oficial
  it('establece njgzhjwfcxdxiibkuuqg como el único proyecto de referencia autorizado', () => {
    expect(TARGET_PROJECT_REF).toBe('njgzhjwfcxdxiibkuuqg');
    expect(FINPER_VERSION).toBe('2.0.3');
  });

  // 2. Extracción precisa de Project Ref desde URLs
  it('extrae el project ref correcto de URLs de Supabase y detecta dominios obsoletos', () => {
    expect(extractProjectRefFromUrl('https://njgzhjwfcxdxiibkuuqg.supabase.co')).toBe('njgzhjwfcxdxiibkuuqg');
    expect(extractProjectRefFromUrl('https://njgzhjwfcxdxiibkuuqg.supabase.co/rest/v1/')).toBe('njgzhjwfcxdxiibkuuqg');
    expect(extractProjectRefFromUrl('https://elsjuyjjkrkyhlylmaip.supabase.co')).toBe('elsjuyjjkrkyhlylmaip');
    expect(extractProjectRefFromUrl('https://google.com')).toBeNull();
    expect(extractProjectRefFromUrl('')).toBeNull();
    expect(extractProjectRefFromUrl(undefined)).toBeNull();
  });

  // 3. Extracción y validación criptográfica de claves públicas
  it('reconoce el project ref en tokens JWT válidos y rechaza claves obsoletas o no autorizadas', () => {
    // Clave autorizada
    const validRef = extractProjectRefFromKey(VALID_TARGET_KEY);
    expect(validRef).toBe('njgzhjwfcxdxiibkuuqg');

    // Clave no-JWT o publishable antigua del proyecto obsoleto elsjuyjjkrkyhlylmaip
    const obsoleteRef = extractProjectRefFromKey(OBSOLETE_PUBLISHABLE_KEY);
    expect(obsoleteRef).toBeNull();

    // Claves vacías o corruptas
    expect(extractProjectRefFromKey('')).toBeNull();
    expect(extractProjectRefFromKey('not-a-token')).toBeNull();
    expect(extractProjectRefFromKey(undefined)).toBeNull();
  });

  // 4. Diagnóstico seguro sin fuga de tokens
  it('genera un diagnóstico de configuración que expone identificadores de proyecto sin filtrar claves ni tokens', () => {
    const health = getSupabaseConfigHealth();
    expect(health).toHaveProperty('targetProjectRef');
    expect(health).toHaveProperty('activeProjectRef');
    expect(health).toHaveProperty('urlStatus');
    expect(health).toHaveProperty('keyStatus');
    expect(health).toHaveProperty('isHealthy');
    expect(health).toHaveProperty('appVersion');

    // Comprobar que targetProjectRef es exactamente el autorizado
    expect(health.targetProjectRef).toBe('njgzhjwfcxdxiibkuuqg');
    expect(health.activeProjectRef).toBe('njgzhjwfcxdxiibkuuqg');

    // Comprobar que ningún campo de diagnóstico expone la clave privada o el token
    const serialized = JSON.stringify(health);
    expect(serialized).not.toContain(VALID_TARGET_KEY);
    expect(serialized).not.toContain('eyJhbGci');
  });

  // 5. Resolución y prevención de fallbacks silenciosos
  it('resuelve correctamente la configuración activa y garantiza estado saludable en producción', () => {
    const resolved = resolveSupabaseConfig();
    expect(resolved.url).toContain('njgzhjwfcxdxiibkuuqg.supabase.co');
    expect(resolved.key).toBe(VALID_TARGET_KEY);
    expect(resolved.health.isHealthy).toBe(true);
  });
});
