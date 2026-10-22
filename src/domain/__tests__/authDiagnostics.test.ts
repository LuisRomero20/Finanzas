import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  isSessionExpired,
  getAuthDiagnostic,
  AUTH_STORAGE_KEY,
} from '../../services/authService';

describe('Auth Session Diagnostics & Expiration Logic', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('correctly detects session as expired when expires_at is past or missing', () => {
    expect(isSessionExpired(null)).toBe(true);
    expect(isSessionExpired({} as any)).toBe(true);
    const pastUnix = Math.floor(Date.now() / 1000) - 100;
    expect(isSessionExpired({ expires_at: pastUnix } as any)).toBe(true);
  });

  it('correctly detects session as valid when expires_at is well into the future', () => {
    const futureUnix = Math.floor(Date.now() / 1000) + 3600;
    expect(isSessionExpired({ expires_at: futureUnix } as any)).toBe(false);
  });

  it('treats session expiring within 30s buffer as expired to prevent in-flight failure', () => {
    const immediateFutureUnix = Math.floor(Date.now() / 1000) + 15;
    expect(isSessionExpired({ expires_at: immediateFutureUnix } as any)).toBe(true);
  });

  it('reports diagnostic with accurate remaining seconds and verification state', async () => {
    const futureUnix = Math.floor(Date.now() / 1000) + 1800;
    const sessionData = {
      access_token: 'valid-token',
      refresh_token: 'valid-refresh',
      expires_at: futureUnix,
      user: { id: 'test-user-id', email: 'test@example.com' },
    };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sessionData));

    const diag = await getAuthDiagnostic();
    expect(diag.status).toBe('authenticated');
    expect(diag.verificationState).toBe('server_verified');
    expect(diag.email).toBe('test@example.com');
    expect(diag.timeToExpirySeconds).toBeGreaterThan(1700);
  });

  it('reports unauthenticated status when no session exists', async () => {
    // Simular que getValidatedSession retorna null
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

  it('reports expired status when cached token is past expiry', async () => {
    const pastUnix = Math.floor(Date.now() / 1000) - 500;
    const sessionData = {
      access_token: 'expired-token',
      refresh_token: 'expired-refresh',
      expires_at: pastUnix,
      user: { id: 'test-user-id', email: 'test@example.com' },
    };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sessionData));

    const origEnv = process.env.NODE_ENV;
    try {
      (process.env as any).NODE_ENV = 'production';
      const diag = await getAuthDiagnostic();
      expect(diag.status).toBe('expired');
      expect(diag.verificationState).toBe('expired');
      expect(diag.error).toContain('expirada');
    } finally {
      (process.env as any).NODE_ENV = origEnv;
    }
  });
});
