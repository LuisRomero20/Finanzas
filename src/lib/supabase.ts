import { createClient } from '@supabase/supabase-js';

const HARDCODED_URL = 'https://njgzhjwfcxdxiibkuuqg.supabase.co';
const HARDCODED_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qZ3poandmY3hkeGlpYmt1dXFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwMjg5MjksImV4cCI6MjEwMzYwNDkyOX0.VQSGP9NSUAI1M_BaOtqhxC4hl8o8jAx7HC0rlrnzMNA';

function sanitizeUrl(raw?: string): string {
  if (!raw) return HARDCODED_URL;
  const cleaned = raw.trim().replace(/^["']|["']$/g, '').replace(/\/+$/, '');
  if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
    return HARDCODED_URL;
  }
  return cleaned;
}

function sanitizeKey(raw?: string): string {
  if (!raw) return HARDCODED_KEY;
  return raw.trim().replace(/^["']|["']$/g, '');
}

export const SUPABASE_URL = sanitizeUrl(import.meta.env.VITE_SUPABASE_URL);
export const SUPABASE_PUBLISHABLE_KEY = sanitizeKey(
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY
);

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
 * 1. Restringe modificaciones exclusivamente al origen exacto del proyecto (SUPABASE_URL) y a rutas /rest/v1/.
 * 2. NUNCA intercepta rutas de autenticación (/auth/v1/), storage, ni peticiones a otros dominios.
 * 3. NUNCA lee directamente de localStorage (la gestión de sesión y renovación corresponde al SDK).
 * 4. Si la cabecera Authorization ya contiene un Bearer token legítimo del usuario, no se modifica.
 * 5. Solo suministra el token administrado por el SDK si la cabecera es idéntica a la clave pública anónima o está ausente.
 */
const customFetch: typeof fetch = async (input, init) => {
  const urlStr = typeof input === 'string' ? input : (input instanceof Request ? input.url : '');

  // Regla 1: Restringir estrictamente al origen del proyecto y al endpoint PostgREST (/rest/v1/)
  if (!urlStr.startsWith(SUPABASE_URL) || !urlStr.includes('/rest/v1/')) {
    return fetch(input, init);
  }

  const headers = new Headers(init?.headers);
  const currentAuth = headers.get('Authorization');

  // Regla 2: Solo intervenir si la petición carece de Authorization o lleva exactamente la clave pública anónima
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
