import { describe, expect, it } from 'vitest';
import { checkSupabaseHealth, fetchTransactionsFromSupabase } from '../../services/supabaseService';
import { supabase } from '../../lib/supabase';

const integrationEnabled = process.env.RUN_SUPABASE_INTEGRATION === 'true';

describe.runIf(integrationEnabled)('Supabase read-only integration', () => {
  it('verifies connectivity and counts without modifying remote data', async () => {
    const health = await checkSupabaseHealth();
    expect(health.connected).toBe(true);
    expect(health.tableExists).toBe(true);
    expect(health.rowCount).toBe(2246);

    const { count: configCount } = await supabase
      .from('transacciones')
      .select('*', { count: 'exact', head: true })
      .like('id', 'config-%');

    const { count: pendingCount } = await supabase
      .from('transacciones')
      .select('*', { count: 'exact', head: true })
      .like('id', 'pending-%');

    const { count: regularCount } = await supabase
      .from('transacciones')
      .select('*', { count: 'exact', head: true })
      .not('id', 'like', 'config-%')
      .not('id', 'like', 'pending-%');

    console.log(`[Supabase Audit] Total: ${health.rowCount}`);
    console.log(`[Supabase Audit] Regular financial transactions: ${regularCount}`);
    console.log(`[Supabase Audit] Config chunks: ${configCount}`);
    console.log(`[Supabase Audit] Pending payments: ${pendingCount}`);

    expect((configCount ?? 0) + (pendingCount ?? 0) + (regularCount ?? 0)).toBe(health.rowCount);
  }, 60_000);
});
