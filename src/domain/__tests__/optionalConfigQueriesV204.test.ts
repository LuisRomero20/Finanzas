import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchOptionalConfigRow,
  fetchCardsConfigFromSupabase,
  fetchCreditLinesConfigFromSupabase,
  fetchBridgeConfigFromSupabase,
  fetchSavingsGoalsFromSupabase,
} from '../../services/supabaseService';
import { supabase } from '../../lib/supabase';

describe('FINPER 2.0.4 — Optional Config Queries with .maybeSingle() (Zero 406 Errors)', () => {
  let mockQueryResult: { data: any; error: any; status?: number };

  beforeEach(() => {
    vi.restoreAllMocks();
    mockQueryResult = { data: null, error: null, status: 200 };

    vi.spyOn(supabase, 'from').mockImplementation((_table: string) => {
      const query: any = {
        select: () => query,
        eq: () => query,
        like: () => query,
        order: () => query,
        limit: () => query,
        maybeSingle: async () => mockQueryResult,
      };
      return query;
    });
  });

  it('handles 0 rows gracefully (returns null with status not_found, without throwing HTTP 406)', async () => {
    mockQueryResult = {
      data: null,
      error: null,
      status: 200,
    };

    const res = await fetchOptionalConfigRow(
      'config-credit-cards-v2',
      (raw) => JSON.parse(raw),
      'Test Card Config',
    );

    expect(res.status).toBe('not_found');
    expect(res.data).toBeNull();
    expect(res.error).toBeUndefined();
  });

  it('returns parsed data when row exists with status found', async () => {
    const payload = [{ id: 'card-1', name: 'Ripley Mastercard', cycleStartDay: 3, paymentDay: 1 }];
    mockQueryResult = {
      data: {
        id: 'config-credit-cards-v2',
        concepto: JSON.stringify(payload),
      },
      error: null,
      status: 200,
    };

    const res = await fetchOptionalConfigRow<any[]>(
      'config-credit-cards-v2',
      (raw) => JSON.parse(raw),
      'Test Card Config',
    );

    expect(res.status).toBe('found');
    expect(res.data).toEqual(payload);
  });

  it('detects multiple unexpected rows without crashing (PGRST116)', async () => {
    mockQueryResult = {
      data: null,
      error: { code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned' },
      status: 406,
    };

    const res = await fetchOptionalConfigRow(
      'config-credit-lines-v2',
      (raw) => JSON.parse(raw),
      'Test Credit Lines',
    );

    expect(res.status).toBe('multiple_rows');
    expect(res.data).toBeNull();
    expect(res.error).toContain('multiple');
  });

  it('differentiates permission denied / RLS error (42501 / HTTP 403)', async () => {
    mockQueryResult = {
      data: null,
      error: { code: '42501', message: 'permission denied for table transacciones' },
      status: 403,
    };

    const res = await fetchOptionalConfigRow(
      'config-savings-goals-v1',
      (raw) => JSON.parse(raw),
      'Test Goals',
    );

    expect(res.status).toBe('permission_denied');
    expect(res.data).toBeNull();
    expect(res.statusCode).toBe(403);
  });

  it('handles corrupt JSON in concepto safely (status parse_error)', async () => {
    mockQueryResult = {
      data: {
        id: 'config-prev-month-bridge',
        concepto: '{ not valid json',
      },
      error: null,
      status: 200,
    };

    const res = await fetchOptionalConfigRow(
      'config-prev-month-bridge',
      (raw) => JSON.parse(raw),
      'Test Bridge',
    );

    expect(res.status).toBe('parse_error');
    expect(res.data).toBeNull();
  });

  it('fetchCardsConfigFromSupabase returns null on not_found without error', async () => {
    mockQueryResult = {
      data: null,
      error: null,
      status: 200,
    };

    const cards = await fetchCardsConfigFromSupabase();
    expect(cards).toBeNull();
  });

  it('fetchCreditLinesConfigFromSupabase returns parsed lines when present', async () => {
    mockQueryResult = {
      data: {
        id: 'config-credit-lines-v2',
        concepto: JSON.stringify({ lines: { 'Interbank Amex': 15000 }, labels: {} }),
      },
      error: null,
      status: 200,
    };

    const lines = await fetchCreditLinesConfigFromSupabase();
    expect(lines).toEqual({ lines: { 'Interbank Amex': 15000 }, labels: {} });
  });

  it('fetchBridgeConfigFromSupabase and fetchSavingsGoalsFromSupabase use .maybeSingle() and return null on 0 rows', async () => {
    mockQueryResult = {
      data: null,
      error: null,
      status: 200,
    };

    const bridge = await fetchBridgeConfigFromSupabase();
    expect(bridge).toBeNull();

    const goals = await fetchSavingsGoalsFromSupabase();
    expect(goals).toBeNull();
  });
});
