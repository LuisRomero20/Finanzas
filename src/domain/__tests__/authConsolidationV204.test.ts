import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getValidatedSession,
  getAuthDiagnostic,
  signOut,
  isSessionExpired,
  AUTH_STORAGE_KEY,
} from '../../services/authService';
import { supabase, updateManagedSdkToken, getManagedSdkToken } from '../../lib/supabase';
import type { Session, User } from '@supabase/supabase-js';

describe('FINPER 2.0.4 — Consolidación de Autenticación y Ciclo de Vida de Sesión', () => {
  const dummyUser: User = {
    id: '0fdea8f0-da9c-458b-a78c-4810a0685f2b',
    email: 'luis_jesusrc@hotmail.com',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: '2026-07-01T00:00:00.000Z',
  };

  const dummySession: Session = {
    access_token: 'v204-valid-jwt',
    refresh_token: 'v204-refresh-jwt',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: 'bearer',
    user: dummyUser,
  };

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    updateManagedSdkToken(null);
  });

  // 1. Deduplicación de llamadas concurrentes (in-flight promise mutex)
  it('deduplica llamadas concurrentes a getValidatedSession() para evitar carreras de hidratación', async () => {
    let callCount = 0;
    vi.spyOn(supabase.auth, 'getSession').mockImplementation(async () => {
      callCount++;
      await new Promise(r => setTimeout(r, 20));
      return { data: { session: dummySession }, error: null };
    });

    // Disparar 5 llamadas simultáneas
    const promises = [
      getValidatedSession(),
      getValidatedSession(),
      getValidatedSession(),
      getValidatedSession(),
      getValidatedSession(),
    ];

    const results = await Promise.all(promises);

    // Todas las llamadas deben resolver a la misma sesión idéntica
    expect(results).toHaveLength(5);
    results.forEach(res => expect(res?.access_token).toBe('v204-valid-jwt'));

    // Solo debe haberse invocado una vez a supabase.auth.getSession
    expect(callCount).toBe(1);
  });

  // 2. Sincronización estricta del token administrado en memoria con el ciclo del SDK
  it('sincroniza el token en memoria con el SDK y lo purga inmediatamente al cerrar sesión', async () => {
    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: { session: dummySession },
      error: null,
    });

    const session = await getValidatedSession();
    expect(session?.access_token).toBe('v204-valid-jwt');
    expect(getManagedSdkToken()).toBe('v204-valid-jwt');

    // Cierre de sesión
    const signoutResult = await signOut();
    expect(signoutResult.error).toBeNull();
    expect(getManagedSdkToken()).toBeNull();
    expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
  });

  // 3. Detección de sesión expirada y rechazo
  it('detecta tokens expirados y los rechaza con estado expired en lugar de autenticado falso', () => {
    const expiredSession: Session = {
      ...dummySession,
      expires_at: Math.floor(Date.now() / 1000) - 100, // Expirado hace 100 segundos
    };

    expect(isSessionExpired(expiredSession)).toBe(true);
    expect(isSessionExpired(dummySession)).toBe(false);
  });

  // 4. Renovación automática de token (Refresh)
  it('ejecuta renovación automática mediante refreshSession cuando el token expiró pero tiene refresh_token', async () => {
    const expiredSession: Session = {
      ...dummySession,
      expires_at: Math.floor(Date.now() / 1000) - 10,
    };

    const renewedSession: Session = {
      ...dummySession,
      access_token: 'v204-renewed-jwt',
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    };

    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: { session: expiredSession },
      error: null,
    });

    const refreshSpy = vi.spyOn(supabase.auth, 'refreshSession').mockResolvedValue({
      data: { session: renewedSession, user: dummyUser },
      error: null,
    });

    const session = await getValidatedSession();
    expect(refreshSpy).toHaveBeenCalled();
    expect(session?.access_token).toBe('v204-renewed-jwt');
    expect(getManagedSdkToken()).toBe('v204-renewed-jwt');
  });

  // 5. Diagnóstico de autenticación granular
  it('reporta diagnóstico unauthenticated cuando no existe sesión en memoria ni almacenamiento', async () => {
    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: { session: null },
      error: null,
    });

    const origEnv = process.env.NODE_ENV;
    try {
      (process.env as any).NODE_ENV = 'production';
      const diag = await getAuthDiagnostic();
      expect(diag.status).toBe('unauthenticated');
      expect(diag.verificationState).toBe('unauthenticated');
    } finally {
      (process.env as any).NODE_ENV = origEnv;
    }
  });
});
