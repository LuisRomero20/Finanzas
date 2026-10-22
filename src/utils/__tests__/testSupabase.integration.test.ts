import { describe, expect, it } from 'vitest';
import { checkSupabaseHealth } from '../../services/supabaseService';
import { supabase } from '../../lib/supabase';

const integrationEnabled = process.env.RUN_SUPABASE_INTEGRATION === 'true';

describe.runIf(integrationEnabled)('Supabase read-only integration', () => {
  it('confirms anonymous clients are now blocked following containment', async () => {
    const health = await checkSupabaseHealth();
    // Following immediate containment, anonymous access is blocked
    expect(health.connected).toBe(false);
    expect(health.rowCount).toBe(0);

    const { error } = await supabase
      .from('transacciones')
      .select('*', { count: 'exact', head: true });

    // Expect permission denied or empty
    expect(error).not.toBeNull();
  }, 60_000);
});
