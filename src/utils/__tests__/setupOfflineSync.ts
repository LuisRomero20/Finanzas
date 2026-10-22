import { vi } from 'vitest';
// Never let a regression test read or modify the user's live Supabase database.
vi.mock('../../lib/supabase', () => {
  const result = { data: [], error: null };
  const query: Record<string, unknown> = {};
  for (const method of ['select', 'insert', 'upsert', 'update', 'delete', 'eq', 'in', 'not', 'like', 'ilike', 'order', 'limit', 'range', 'single', 'maybeSingle']) query[method] = () => query;
  query.then = (resolve: (r: unknown) => unknown) => Promise.resolve(result).then(resolve);
  return {
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
