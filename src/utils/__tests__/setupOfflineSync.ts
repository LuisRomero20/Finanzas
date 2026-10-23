import { vi } from 'vitest';
// Never let a regression test read or modify the user's live Supabase database.
vi.mock('../../lib/supabase', () => {
  let mockSdkToken: string | null = null;
  const result = { data: [], error: null };
  const query: Record<string, unknown> = {};
  for (const method of ['select', 'insert', 'upsert', 'update', 'delete', 'eq', 'in', 'not', 'like', 'ilike', 'order', 'limit', 'range', 'single', 'maybeSingle']) query[method] = () => query;
  query.then = (resolve: (r: unknown) => unknown) => Promise.resolve(result).then(resolve);
  return {
    TARGET_PROJECT_REF: 'njgzhjwfcxdxiibkuuqg',
    FINPER_VERSION: '2.1.1',
    AUTHORIZED_SUPABASE_URL: 'https://njgzhjwfcxdxiibkuuqg.supabase.co',
    SUPABASE_URL: 'https://njgzhjwfcxdxiibkuuqg.supabase.co',
    SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_1234567890123456789012_12345678',
    extractProjectRefFromUrl: vi.fn((url?: string) => url?.includes('njgzhjwfcxdxiibkuuqg') ? 'njgzhjwfcxdxiibkuuqg' : null),
    extractProjectRefFromKey: vi.fn((_key?: string) => 'njgzhjwfcxdxiibkuuqg'),
    getSupabaseConfigHealth: vi.fn(() => ({
      targetProjectRef: 'njgzhjwfcxdxiibkuuqg',
      activeProjectRef: 'njgzhjwfcxdxiibkuuqg',
      activeUrl: 'https://njgzhjwfcxdxiibkuuqg.supabase.co',
      configuredProjectRef: 'njgzhjwfcxdxiibkuuqg',
      urlStatus: 'valid' as const,
      keyStatus: 'verified' as const,
      keyFormat: 'modern_publishable' as const,
      configurationState: 'verified' as const,
      severity: 'ok' as const,
      isHealthy: true,
      appVersion: '2.1.1',
      errorMessage: null,
    })),
    isSupabaseConfigHealthy: vi.fn(() => true),
    verifySupabaseConfiguration: vi.fn(async () => ({
      targetProjectRef: 'njgzhjwfcxdxiibkuuqg',
      activeProjectRef: 'njgzhjwfcxdxiibkuuqg',
      activeUrl: 'https://njgzhjwfcxdxiibkuuqg.supabase.co',
      configuredProjectRef: 'njgzhjwfcxdxiibkuuqg',
      urlStatus: 'valid' as const,
      keyStatus: 'verified' as const,
      keyFormat: 'modern_publishable' as const,
      configurationState: 'verified' as const,
      severity: 'ok' as const,
      isHealthy: true,
      appVersion: '2.1.1',
      errorMessage: null,
    })),
    subscribeSupabaseConfigHealth: vi.fn(() => () => {}),
    assertSupabaseWritesAllowed: vi.fn(),
    resolveSupabaseConfig: vi.fn(() => ({
      url: 'https://njgzhjwfcxdxiibkuuqg.supabase.co',
      key: 'sb_publishable_1234567890123456789012_12345678',
      health: {
        targetProjectRef: 'njgzhjwfcxdxiibkuuqg',
        activeProjectRef: 'njgzhjwfcxdxiibkuuqg',
        activeUrl: 'https://njgzhjwfcxdxiibkuuqg.supabase.co',
        configuredProjectRef: 'njgzhjwfcxdxiibkuuqg',
        urlStatus: 'valid' as const,
        keyStatus: 'verified' as const,
        keyFormat: 'modern_publishable' as const,
        configurationState: 'verified' as const,
        severity: 'ok' as const,
        isHealthy: true,
        appVersion: '2.1.1',
        errorMessage: null,
      },
    })),
    updateManagedSdkToken: vi.fn((token: string | null) => { mockSdkToken = token; }),
    getManagedSdkToken: vi.fn(() => mockSdkToken),
    supabase: {
      from: () => query,
      channel: () => ({ send: vi.fn() }),
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
        getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
        setSession: vi.fn().mockImplementation((payload) => Promise.resolve({
          data: {
            session: {
              access_token: payload?.access_token || 'mock-token',
              refresh_token: payload?.refresh_token || 'mock-refresh',
              expires_at: Math.floor(Date.now() / 1000) + 3600,
              user: { id: '0fdea8f0-da9c-458b-a78c-4810a0685f2b', email: 'luis_jesusrc@hotmail.com' },
            },
          },
          error: null,
        })),
        refreshSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
        signInWithPassword: vi.fn().mockResolvedValue({ data: { user: null, session: null }, error: null }),
        signUp: vi.fn().mockResolvedValue({ data: { user: null, session: null }, error: null }),
        signOut: vi.fn().mockResolvedValue({ error: null }),
        onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      },
    },
  };
});
