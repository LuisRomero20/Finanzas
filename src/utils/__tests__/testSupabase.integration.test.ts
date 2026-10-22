import { describe, expect, it } from 'vitest';
import { checkSupabaseHealth, fetchTransactionsFromSupabase } from '../../services/supabaseService';

const integrationEnabled = process.env.RUN_SUPABASE_INTEGRATION === 'true';

describe.runIf(integrationEnabled)('Supabase read-only integration', () => {
  it('verifies connectivity without modifying remote data', async () => {
    const health = await checkSupabaseHealth();
    expect(health.connected).toBe(true);
    expect(health.tableExists).toBe(true);
    expect(health.rowCount).toBeGreaterThan(0);

    const sample = await fetchTransactionsFromSupabase();
    expect(sample).not.toBeNull();
    expect(sample!.length).toBeGreaterThan(0);

    const cloudRows = await fetchTransactionsFromSupabase();
    expect(cloudRows).not.toBeNull();
  }, 60_000);
});
