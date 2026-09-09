import { supabase } from '../src/lib/supabase';

async function main() {
  console.log('Testing connection to Supabase...');
  
  // 1. Probar transacciones estado
  const { data: txEstado, error: txEstadoErr } = await supabase
    .from('transacciones')
    .select('id, estado')
    .limit(1);
  console.log('Tabla transacciones estado column:', txEstado, 'error:', txEstadoErr?.message);

  // 2. Probar insertar un registro con prefijo pending- en transacciones
  const testPending = {
    id: 'pending-test-001',
    tipo: 'Egreso',
    fecha: '2026-10-05',
    concepto: 'Prueba Pendiente Sincronizado',
    categoria: 'Servicios Básicos & Facturas',
    entidad: 'Interbank',
    monto: 150,
    mes: 'Octubre',
  };

  const { data: insData, error: insError } = await supabase
    .from('transacciones')
    .upsert(testPending)
    .select();
  console.log('Upsert pending-test result:', insData, 'error:', insError?.message);

  // 3. Probar leer registros pending
  const { data: readPending, error: readError } = await supabase
    .from('transacciones')
    .select('*')
    .like('id', 'pending-%');
  console.log('Read pending result count:', readPending?.length, 'error:', readError?.message);

  // 4. Limpiar registro de prueba
  await supabase.from('transacciones').delete().eq('id', 'pending-test-001');
  console.log('Limpiado registro de prueba');

  // 4. Probar rpc o tablas
  const { data: cData, error: cError } = await supabase
    .from('configuraciones')
    .select('*')
    .limit(1);
  console.log('Tabla configuraciones:', cData ? 'Existe' : 'No existe', 'error:', cError?.message);
}

main().catch(console.error);
