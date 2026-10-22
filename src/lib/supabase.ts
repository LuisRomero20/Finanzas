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

// Token en memoria administrado en sincronía con el ciclo de vida del SDK GoTrue
let currentSdkToken: string | null = null;

export function updateManagedSdkToken(token: string | null): void {
  currentSdkToken = token;
}

export function getManagedSdkToken(): string | null {
  return currentSdkToken;
}

function getFallbackStorageToken(): string | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem('sb-njgzhjwfcxdxiibkuuqg-auth-token');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.access_token) {
        const nowUnix = Math.floor(Date.now() / 1000);
        if (!parsed.expires_at || parsed.expires_at > nowUnix + 15) {
          return parsed.access_token;
        }
      }
    }
  } catch {}
  return null;
}

/**
 * Interceptor HTTP de protección estricta para solicitudes de base de datos (/rest/v1/).
 * Reglas de diseño:
 * 1. NUNCA intercepta rutas de autenticación (/auth/v1/), storage, ni peticiones externas.
 * 2. Si la petición ya lleva un Bearer token legítimo del SDK, no modifica nada.
 * 3. Utiliza preferentemente la sesión administrada por el SDK oficial de Supabase.
 * 4. Solo inyecta el token de usuario si la solicitud a /rest/v1/ carece de autenticación o
 *    lleva la anon_key por defecto, previniendo denegaciones de RLS (Postgres 42501).
 */
const customFetch: typeof fetch = async (input, init) => {
  const urlStr = typeof input === 'string' ? input : (input instanceof Request ? input.url : '');

  // Regla 1: Intervenir ÚNICAMENTE peticiones dirigidas a PostgREST (/rest/v1/)
  if (!urlStr.includes('/rest/v1/')) {
    return fetch(input, init);
  }

  const headers = new Headers(init?.headers);
  const currentAuth = headers.get('Authorization');

  // Regla 2: Si ya cuenta con un Bearer token específico distinto a la anon_key, respetar la sesión del SDK
  const isAnonOrMissing = !currentAuth || currentAuth === `Bearer ${SUPABASE_PUBLISHABLE_KEY}` || currentAuth.includes('anon');

  if (isAnonOrMissing) {
    const token = getManagedSdkToken() || getFallbackStorageToken();
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
