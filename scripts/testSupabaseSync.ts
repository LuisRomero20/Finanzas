import { supabase } from '../src/lib/supabase';

async function main() {
  console.log('Verificando pagos pendientes en Supabase...');
  
  // Limpiar test
  await supabase.from('transacciones').delete().eq('id', 'pending-test-001');

  // Purgar 2026-09-10 Pastilla Madre
  const { data: delData } = await supabase
    .from('transacciones')
    .delete()
    .like('id', 'pending-%')
    .eq('fecha', '2026-09-10')
    .ilike('concepto', '%Pastilla Madre%')
    .select();
  if (delData && delData.length > 0) {
    console.log('Eliminado con éxito:', delData);
  }

  // Leer estado actual
  const { data: current } = await supabase
    .from('transacciones')
    .select('id, fecha, concepto, monto, entidad')
    .like('id', 'pending-%')
    .order('fecha', { ascending: true });

  console.log(`Total pendientes en Supabase: ${current?.length || 0}`);
  if (current) {
    current.forEach((r, idx) => {
      console.log(`${idx + 1}. [${r.fecha}] ${r.concepto} - S/ ${r.monto} (${r.entidad}) [${r.id}]`);
    });
  }
}

main().catch(console.error);
