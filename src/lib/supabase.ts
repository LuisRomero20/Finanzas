import { createClient } from '@supabase/supabase-js';

export const TARGET_PROJECT_REF = 'njgzhjwfcxdxiibkuuqg';
export const FINPER_VERSION = '2.0.3';

const HARDCODED_URL = `https://${TARGET_PROJECT_REF}.supabase.co`;
const HARDCODED_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qZ3poandmY3hkeGlpYmt1dXFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwMjg5MjksImV4cCI6MjEwMzYwNDkyOX0.VQSGP9NSUAI1M_BaOtqhxC4hl8o8jAx7HC0rlrnzMNA';

/**
 * Extrae el project ref de una URL de Supabase (ej: 'https://njgzhjwfcxdxiibkuuqg.supabase.co' -> 'njgzhjwfcxdxiibkuuqg').
 */
export function extractProjectRefFromUrl(url?: string): string | null {
  if (!url) return null;
  const match = url.trim().match(/^https?:\/\/([a-z0-9_-]+)\.supabase\.co/i);
  return match ? match[1].toLowerCase() : null;
}

/**
 * Extrae el project ref del payload JWT de una clave pública de Supabase.
 * Si es una clave no-JWT (ej. claves 'sb_publishable_...' de otros proyectos), retorna null.
 */
export function extractProjectRefFromKey(key?: string): string | null {
  if (!key) return null;
  const trimmed = key.trim().replace(/^["']|["']$/g, '');
  if (!trimmed.startsWith('eyJ')) return null;
  const parts = trimmed.split('.');
  if (parts.length < 2) return null;
  try {
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonStr = typeof atob === 'function'
      ? atob(base64)
      : Buffer.from(base64, 'base64').toString('utf-8');
    const payload = JSON.parse(jsonStr);
    return payload.ref ? String(payload.ref).toLowerCase() : null;
  } catch {
    return null;
  }
}

export interface SupabaseConfigHealth {
  targetProjectRef: string;
  activeProjectRef: string;
  activeUrl: string;
  urlStatus: 'valid' | 'mismatched' | 'fallback_hardcoded';
  keyStatus: 'valid' | 'mismatched' | 'fallback_hardcoded';
  isHealthy: boolean;
  appVersion: string;
  errorMessage: string | null;
}

/**
 * Resuelve y valida la configuración de Supabase verificando coincidencia criptográfica
 * entre la URL y la clave pública para impedir desvíos accidentales a otras bases de datos.
 */
export function resolveSupabaseConfig(): {
  url: string;
  key: string;
  health: SupabaseConfigHealth;
} {
  const rawEnvUrl = typeof import.meta !== 'undefined' && import.meta.env
    ? import.meta.env.VITE_SUPABASE_URL
    : undefined;
  const rawEnvKey = typeof import.meta !== 'undefined' && import.meta.env
    ? (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY)
    : undefined;

  let url = HARDCODED_URL;
  let urlStatus: SupabaseConfigHealth['urlStatus'] = 'fallback_hardcoded';
  let isHealthy = true;
  let errorMessage: string | null = null;

  if (rawEnvUrl && typeof rawEnvUrl === 'string' && rawEnvUrl.trim()) {
    const cleanedUrl = rawEnvUrl.trim().replace(/^["']|["']$/g, '').replace(/\/+$/, '');
    const urlRef = extractProjectRefFromUrl(cleanedUrl);
    if (urlRef === TARGET_PROJECT_REF) {
      url = cleanedUrl;
      urlStatus = 'valid';
    } else {
      urlStatus = 'mismatched';
      isHealthy = false;
      errorMessage = `Discrepancia crítica: VITE_SUPABASE_URL apunta a '${urlRef || cleanedUrl}', pero el proyecto auditado es '${TARGET_PROJECT_REF}'.`;
      console.error(`[FINPER Config Error] ${errorMessage}`);
      // NUNCA conectar a una base de datos no autorizada; usar HARDCODED_URL para proteger la integridad contable
      url = HARDCODED_URL;
    }
  }

  let key = HARDCODED_KEY;
  let keyStatus: SupabaseConfigHealth['keyStatus'] = 'fallback_hardcoded';

  if (rawEnvKey && typeof rawEnvKey === 'string' && rawEnvKey.trim()) {
    const cleanedKey = rawEnvKey.trim().replace(/^["']|["']$/g, '');
    const keyRef = extractProjectRefFromKey(cleanedKey);
    if (keyRef === TARGET_PROJECT_REF) {
      key = cleanedKey;
      keyStatus = 'valid';
    } else {
      keyStatus = 'mismatched';
      isHealthy = false;
      const keyDetail = cleanedKey.startsWith('sb_publishable_') ? 'clave publicable no verificada' : `ref '${keyRef || 'desconocido'}'`;
      const msg = `Discrepancia crítica: La clave pública (${keyDetail}) no pertenece al proyecto '${TARGET_PROJECT_REF}'.`;
      errorMessage = errorMessage ? `${errorMessage} ${msg}` : msg;
      console.error(`[FINPER Config Error] ${msg}`);
      // Usar la clave autorizada de TARGET_PROJECT_REF
      key = HARDCODED_KEY;
    }
  }

  const activeRef = extractProjectRefFromUrl(url) || TARGET_PROJECT_REF;

  const health: SupabaseConfigHealth = {
    targetProjectRef: TARGET_PROJECT_REF,
    activeProjectRef: activeRef,
    activeUrl: url,
    urlStatus,
    keyStatus,
    isHealthy,
    appVersion: FINPER_VERSION,
    errorMessage,
  };

  return { url, key, health };
}

const resolvedConfig = resolveSupabaseConfig();
export const SUPABASE_URL = resolvedConfig.url;
export const SUPABASE_PUBLISHABLE_KEY = resolvedConfig.key;
const configHealth = resolvedConfig.health;

export function getSupabaseConfigHealth(): SupabaseConfigHealth {
  return configHealth;
}

export function isSupabaseConfigHealthy(): boolean {
  return configHealth.isHealthy;
}

// Token en memoria administrado exclusivamente en sincronía con el SDK GoTrue de Supabase
let currentSdkToken: string | null = null;

export function updateManagedSdkToken(token: string | null): void {
  currentSdkToken = token;
}

export function getManagedSdkToken(): string | null {
  return currentSdkToken;
}

/**
 * Interceptor HTTP estrictamente acotado para solicitudes de datos a Supabase (/rest/v1/).
 * 
 * Reglas de seguridad:
 * 1. Bloquea de inmediato cualquier petición que mencione dominios obsoletos (ej. elsjuyjjkrkyhlylmaip).
 * 2. Restringe modificaciones exclusivamente al origen exacto del proyecto (SUPABASE_URL) y a rutas /rest/v1/.
 * 3. Detiene operaciones de escritura si existe una discrepancia no resuelta de configuración.
 * 4. NUNCA intercepta rutas de autenticación (/auth/v1/), storage, ni peticiones a otros dominios.
 * 5. NUNCA lee directamente de localStorage (la gestión de sesión y renovación corresponde al SDK).
 * 6. Si la cabecera Authorization ya contiene un Bearer token legítimo del usuario, no se modifica.
 * 7. Solo suministra el token administrado por el SDK si la cabecera es idéntica a la clave pública anónima o está ausente.
 */
const customFetch: typeof fetch = async (input, init) => {
  const urlStr = typeof input === 'string' ? input : (input instanceof Request ? input.url : '');

  // Regla 0: Bloqueo explícito de dominios obsoletos detectados en auditoría
  if (urlStr.includes('elsjuyjjkrkyhlylmaip')) {
    console.error('[FINPER Seguridad] Petición interceptada y abortada al dominio obsoleto:', urlStr);
    throw new Error(`Dominio obsoleto bloqueado (elsjuyjjkrkyhlylmaip). El proyecto activo es ${TARGET_PROJECT_REF}.`);
  }

  // Regla 1: Restringir estrictamente al origen del proyecto y al endpoint PostgREST (/rest/v1/)
  if (!urlStr.startsWith(SUPABASE_URL) || !urlStr.includes('/rest/v1/')) {
    return fetch(input, init);
  }

  // Regla 2: Detener escrituras si la configuración está en estado de error
  const method = (init?.method || 'GET').toUpperCase();
  const isWrite = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
  if (!isSupabaseConfigHealthy() && isWrite) {
    throw new Error(`[FINPER Seguridad] Escrituras detenidas: ${getSupabaseConfigHealth().errorMessage}`);
  }

  const headers = new Headers(init?.headers);
  const currentAuth = headers.get('Authorization');

  // Regla 3: Solo intervenir si la petición carece de Authorization o lleva exactamente la clave pública anónima
  const isAnonymousKey = currentAuth === `Bearer ${SUPABASE_PUBLISHABLE_KEY}`;
  const isMissingAuth = !currentAuth;

  if (isMissingAuth || isAnonymousKey) {
    const token = getManagedSdkToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
      return fetch(input, { ...init, headers });
    }
  }

  return fetch(input, init);
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    fetch: customFetch,
  },
});

// Sincronizar automáticamente el token administrado con los eventos oficiales del SDK de Supabase
if (supabase?.auth?.onAuthStateChange) {
  try {
    supabase.auth.onAuthStateChange((_event, session) => {
      updateManagedSdkToken(session?.access_token ?? null);
    });
  } catch {}
}

// Inicializar el token en memoria si el SDK ya cuenta con sesión al arrancar
if (supabase?.auth?.getSession) {
  try {
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session?.access_token) {
        updateManagedSdkToken(data.session.access_token);
      }
    }).catch(() => {});
  } catch {}
}

// Tipos para Supabase
export interface SupabaseUsuario {
  id: string;
  nombre: string;
  email: string;
  created_at: string;
}

export interface SupabaseDeuda {
  id: string;
  usuario_id: string;
  acreedor: string;
  monto: number;
  tasa_anual: number;
  plazo_meses: number;
  meses_pagados: number;
  fecha_inicio: string;
  tipo_tasa: 'nominal' | 'efectiva';
  moneda: string;
  estado: 'activa' | 'pagada' | 'proximo_vencer';
  created_at: string;
  updated_at: string;
}
