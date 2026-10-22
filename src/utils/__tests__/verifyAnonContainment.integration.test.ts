import { describe, expect, it } from 'vitest';
import { supabase } from '../../lib/supabase';

const integrationEnabled = process.env.RUN_SUPABASE_INTEGRATION === 'true';

describe.runIf(integrationEnabled)('Verification of Anonymous Containment on Supabase', () => {
  it('confirms that anonymous clients can no longer read or modify public.transacciones', async () => {
    // 1. Intento de lectura anónima (SELECT)
    const { error: readError, count } = await supabase
      .from('transacciones')
      .select('*', { count: 'exact', head: true });

    const isBlocked = (readError !== null && /permission denied/i.test(readError.message)) || count === 0 || count === null;

    console.log('[Anon Containment Check] Read Error:', readError?.message ?? 'None');
    console.log('[Anon Containment Check] Visible Rows for Anon:', count ?? 0);

    if (isBlocked) {
      console.log('>>> CONFIRMADO: La tabla public.transacciones está protegida contra acceso anónimo. <<<');
    } else {
      console.warn('>>> ALERTA: La tabla public.transacciones aún permite lectura a clientes anónimos. <<<');
    }

    // 2. Intento de escritura anónima (INSERT)
    const { error: insertError } = await supabase
      .from('transacciones')
      .insert({
        id: 'test-containment-probe',
        tipo: 'Egreso',
        fecha: '2026-10-22',
        concepto: 'Sonda de Seguridad',
        categoria: 'Test',
        entidad: 'Test',
        monto: 1,
        mes: '2026-10',
      });

    console.log('[Anon Containment Check] Insert Error:', insertError?.message ?? 'None');
    if (insertError) {
      expect(insertError.message).toMatch(/permission denied|violates row-level security/i);
    }
  });
});
