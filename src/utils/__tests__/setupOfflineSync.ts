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
    FINPER_VERSION: '2.0.3',
    SUPABASE_URL: 'https://njgzhjwfcxdxiibkuuqg.supabase.co',
    SUPABASE_PUBLISHABLE_KEY: 'mock-anon-key',
    extractProjectRefFromUrl: vi.fn((url?: string) => url?.includes('njgzhjwfcxdxiibkuuqg') ? 'njgzhjwfcxdxiibkuuqg' : null),
    extractProjectRefFromKey: vi.fn((_key?: string) => 'njgzhjwfcxdxiibkuuqg'),
    getSupabaseConfigHealth: vi.fn(() => ({
      targetProjectRef: 'njgzhjwfcxdxiibkuuqg',
      activeProjectRef: 'njgzhjwfcxdxiibkuuqg',
      activeUrl: 'https://njgzhjwfcxdxiibkuuqg.supabase.co',
      urlStatus: 'valid' as const,
      keyStatus: 'valid' as const,
      isHealthy: true,
      appVersion: '2.0.3',
      errorMessage: null,
    })),
    isSupabaseConfigHealthy: vi.fn(() => true),
    resolveSupabaseConfig: vi.fn(() => ({
      url: 'https://njgzhjwfcxdxiibkuuqg.supabase.co',
      key: 'mock-anon-key',
      health: {
        targetProjectRef: 'njgzhjwfcxdxiibkuuqg',
        activeProjectRef: 'njgzhjwfcxdxiibkuuqg',
        activeUrl: 'https://njgzhjwfcxdxiibkuuqg.supabase.co',
        urlStatus: 'valid' as const,
        keyStatus: 'valid' as const,
        isHealthy: true,
        appVersion: '2.0.3',
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
        signInWithPassword: vi.fn().mockResolvedValue({ data: { user: null, session: null }, error: null }),
        signUp: vi.fn().mockResolvedValue({ data: { user: null, session: null }, error: null }),
        signOut: vi.fn().mockResolvedValue({ error: null }),
        onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      },
    },
  };
});
