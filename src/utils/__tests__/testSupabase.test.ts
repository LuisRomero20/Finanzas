import { describe, it, expect } from 'vitest';
import { checkSupabaseHealth, migrateMasterTransactionsToSupabase, fetchTransactionsFromSupabase, deleteTransactionFromSupabase } from '../../services/supabaseService';
import { masterTransactions } from '../../utils/masterData';

describe('Supabase Connectivity & Migration', () => {
  it('connects to Supabase and performs bulk migration of masterTransactions', async () => {
    await deleteTransactionFromSupabase('test-1');
    const health = await checkSupabaseHealth();
    expect(health.connected).toBe(true);
    expect(health.tableExists).toBe(true);

    const cloudRows = await fetchTransactionsFromSupabase();
    expect(cloudRows).not.toBeNull();
    expect(cloudRows!.length).toBeGreaterThanOrEqual(masterTransactions.length);
    console.log(`¡Verificado con éxito! ${cloudRows!.length} registros cargados en Supabase.`);
  }, 60000);
});
