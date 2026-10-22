import { supabase } from '../lib/supabase';
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js';

export interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  error: string | null;
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) return null;
    return user;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<Session | null> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) return null;
    return session;
  } catch {
    return null;
  }
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
      // 1. Guardar la sesión directamente en el almacenamiento de Supabase del navegador
      const storageKey = 'sb-njgzhjwfcxdxiibkuuqg-auth-token';
      try {
        localStorage.setItem(storageKey, JSON.stringify(data));
      } catch (e) {
        console.warn('Could not write auth token to localStorage:', e);
      }

      // 2. Notificar al cliente de Supabase
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
        });

        if (!sessionError && sessionData.user) {
          return { user: sessionData.user, error: null };
        }
      } catch (e) {
        console.warn('setSession notice:', e);
      }

      // Si setSession dio error de fetch, pero tenemos data.user y token guardado en localStorage:
      if (data.user) {
        return { user: data.user, error: null };
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
    const storageKey = 'sb-njgzhjwfcxdxiibkuuqg-auth-token';
    try {
      localStorage.removeItem(storageKey);
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
