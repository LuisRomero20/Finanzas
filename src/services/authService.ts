import { supabase } from '../lib/supabase';
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js';

export interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  error: string | null;
}

export const AUTH_STORAGE_KEY = 'sb-njgzhjwfcxdxiibkuuqg-auth-token';

export async function getCurrentUser(): Promise<User | null> {
  // 1. Revisar de inmediato almacenamiento local para evitar parpadeos
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.user) {
        return parsed.user;
      }
    }
  } catch {}

  // 2. Consultar al SDK de Supabase
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) return null;
    return user;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<Session | null> {
  // 1. Preguntar al SDK de Supabase
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (!error && session) return session;
  } catch {}

  // 2. Fallback a almacenamiento local si el SDK aún no ha cargado en memoria
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.access_token && parsed?.user) {
        return parsed as Session;
      }
    }
  } catch {}

  return null;
}

async function tryProxyLogin(email: string, password: string): Promise<{ user: User | null; error: string | null }> {
  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), password }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { user: null, error: data.error || 'Credenciales incorrectas.' };
    }

    if (data.access_token && data.refresh_token) {
      const expiresAt = data.expires_at || Math.floor(Date.now() / 1000) + (data.expires_in || 3600);
      const sessionPayload = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_in: data.expires_in || 3600,
        expires_at: expiresAt,
        token_type: data.token_type || 'bearer',
        user: data.user,
      };

      // 1. Guardar la sesión directamente con expires_at válido para que el SDK no la descarte
      try {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sessionPayload));
      } catch (e) {
        console.warn('Could not write auth token to localStorage:', e);
      }

      // 2. Notificar al cliente de Supabase
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
          access_token: sessionPayload.access_token,
          refresh_token: sessionPayload.refresh_token,
        });

        if (!sessionError && sessionData.user) {
          return { user: sessionData.user, error: null };
        }
      } catch (e) {
        console.warn('setSession notice:', e);
      }

      // 3. Si setSession tuvo advertencia de red pero tenemos el usuario verificado
      if (sessionPayload.user) {
        return { user: sessionPayload.user, error: null };
      }
    }

    return { user: null, error: 'No se recibieron credenciales de sesión válidas.' };
  } catch (err: any) {
    return { user: null, error: err?.message || 'Error al conectar con el servidor de autenticación.' };
  }
}

export async function signInWithEmail(email: string, password: string): Promise<{ user: User | null; error: string | null }> {
  try {
    // 1. Intento directo con el SDK de Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (!error && data?.user) {
      return { user: data.user, error: null };
    }

    // 2. Si el SDK falla o hay error de fetch/red, intentar de inmediato con el proxy serverless de Vercel
    const proxyResult = await tryProxyLogin(email, password);
    if (proxyResult.user) {
      return proxyResult;
    }

    if (error && !error.message.toLowerCase().includes('fetch')) {
      return { user: null, error: error.message };
    }

    return proxyResult;
  } catch {
    // 3. Fallback al proxy serverless si hubo excepción en fetch
    return await tryProxyLogin(email, password);
  }
}

export async function signUpWithEmail(email: string, password: string): Promise<{ user: User | null; error: string | null }> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });
    if (error) {
      return { user: null, error: error.message };
    }
    return { user: data.user, error: null };
  } catch (err: any) {
    return { user: null, error: err?.message || 'Error inesperado al registrar usuario.' };
  }
}

export async function signOut(): Promise<{ error: string | null }> {
  try {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {}
    const { error } = await supabase.auth.signOut();
    if (error) return { error: error.message };
    return { error: null };
  } catch (err: any) {
    return { error: err?.message || 'Error al cerrar sesión.' };
  }
}

export function subscribeToAuthChanges(callback: (event: AuthChangeEvent, session: Session | null) => void) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
  return subscription;
}
