import { vi } from 'vitest';
// Never let a regression test read or modify the user's live Supabase database.
vi.mock('../../lib/supabase', () => {
  const result = { data: [], error: null };
  const query: Record<string, unknown> = {};
  for (const method of ['select', 'insert', 'upsert', 'update', 'delete', 'eq', 'in', 'not', 'like', 'order', 'limit', 'maybeSingle']) query[method] = () => query;
  query.then = (resolve: (r: unknown) => unknown) => Promise.resolve(result).then(resolve);
  return { supabase: { from: () => query, channel: () => ({ send: vi.fn() }) } };
});
