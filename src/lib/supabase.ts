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

const SUPABASE_URL = sanitizeUrl(import.meta.env.VITE_SUPABASE_URL);
const SUPABASE_PUBLISHABLE_KEY = sanitizeKey(
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY
);

function getStoredAccessToken(): string | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem('sb-njgzhjwfcxdxiibkuuqg-auth-token');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.access_token) {
        const nowUnix = Math.floor(Date.now() / 1000);
        if (!parsed.expires_at || parsed.expires_at > nowUnix + 10) {
          return parsed.access_token;
        }
      }
    }
  } catch {}
  return null;
}

const customFetch: typeof fetch = async (input, init) => {
  const headers = new Headers(init?.headers);
  const currentAuth = headers.get('Authorization');
  const token = getStoredAccessToken();

  // Si existe un token de sesión legítimo en localStorage y la petición no lleva
  // Authorization o lleva la anon_key por defecto, inyectar el Bearer token del usuario:
  if (token && (!currentAuth || currentAuth === `Bearer ${SUPABASE_PUBLISHABLE_KEY}`)) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return fetch(input, { ...init, headers });
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
