import { beforeEach, expect, it, vi } from 'vitest';
const memory = vi.hoisted(() => ({ rows: new Map<string, { id: string; concepto: string; monto: number }>(), failChunks: false }));
vi.mock('../../lib/supabase', () => ({ supabase: { from: () => {
  let action = 'read'; let payload: Array<{ id: string; concepto: string; monto: number }> = []; let update: { concepto: string };
  const filters: Array<[string, unknown]> = []; let prefix = ''; let single = false;
  const query = {
    select: () => query,
    eq: (key: string, value: unknown) => { filters.push([key, value]); return query; },
    like: (_key: string, value: string) => { prefix = value.slice(0, -1); return query; },
    order: () => query, limit: () => query,
    maybeSingle: () => { single = true; return query; },
    insert: (rows: typeof payload | typeof payload[number]) => { action = 'insert'; payload = Array.isArray(rows) ? rows : [rows]; return query; },
    update: (value: { concepto: string }) => { action = 'update'; update = value; return query; },
    then: (resolve: (value: unknown) => unknown) => {
      if (action === 'insert') {
        if (memory.failChunks || payload.some(row => memory.rows.has(row.id))) return Promise.resolve({ error: new Error('write failed') }).then(resolve);
        payload.forEach(row => memory.rows.set(row.id, row));
        return Promise.resolve({ error: null }).then(resolve);
      }
      const found = [...memory.rows.values()].filter(row => row.id.startsWith(prefix) && filters.every(([key, value]) => row[key as keyof typeof row] === value)).sort((a, b) => a.monto - b.monto);
      if (action === 'update') found.forEach(row => memory.rows.set(row.id, { ...row, ...update }));
      return Promise.resolve({ data: single ? found[0] ?? null : found, error: null }).then(resolve);
    },
  };
  return query;
} } }));
import { readSnapshot, writeSnapshot, canonical } from '../../services/settingsSnapshot';
beforeEach(() => { memory.rows.clear(); memory.failChunks = false; });
it('round trips long Unicode documents and keeps old immutable versions', async () => {
  const value = canonical({ text: 'á💳'.repeat(500) });
  await writeSnapshot('budgets', value, null);
  const first = await readSnapshot('budgets');
  expect(first.value).toBe(value);
  const oldIds = [...memory.rows.keys()];
  await writeSnapshot('budgets', '{}', first.head);
  expect((await readSnapshot('budgets')).value).toBe('{}');
  expect(oldIds.every(id => memory.rows.has(id))).toBe(true);
});
it('rejects a stale writer instead of replacing a newer head', async () => {
  await writeSnapshot('budgets', '{}', null);
  const first = await readSnapshot('budgets');
  await writeSnapshot('budgets', '{"new":1}', first.head);
  await expect(writeSnapshot('budgets', '{"stale":1}', first.head)).rejects.toThrow('Otro dispositivo');
  expect((await readSnapshot('budgets')).value).toBe('{"new":1}');
});
it('does not publish a head after failed chunks and refuses incomplete reads', async () => {
  memory.failChunks = true;
  await expect(writeSnapshot('budgets', '{}', null)).rejects.toThrow();
  expect(memory.rows.has('config-sync-budgets')).toBe(false);
  memory.failChunks = false;
  await writeSnapshot('budgets', '{}', null);
  const chunk = [...memory.rows.keys()].find(id => id !== 'config-sync-budgets')!;
  memory.rows.delete(chunk);
  await expect(readSnapshot('budgets')).rejects.toThrow('completa');
});
