import { supabase } from '../src/lib/supabase';

async function detail() {
  const { data: all, error } = await supabase.from('transacciones').select('*');
  if (!all) return;

  const getExact = (c: string) => all.filter(t => t.concepto && t.concepto.trim().toLowerCase() === c.toLowerCase());
  const getLike = (c: string) => all.filter(t => t.concepto && t.concepto.toLowerCase().includes(c.toLowerCase()));

  console.log('1. Abrigo:', getExact('Abrigo').map(t => `${t.id} (${t.mes}, S/ ${t.monto})`));
  console.log('2. Arreglar Zapatillas:', getExact('Arreglar Zapatillas').map(t => `${t.id} (${t.mes}, S/ ${t.monto})`));
  console.log('3. Arreglar Abrigo:', getExact('Arreglar Abrigo').map(t => `${t.id} (${t.mes}, S/ ${t.monto})`));
  console.log('4. Polo y/o Camisa:', getExact('Polo y/o Camisa').map(t => `${t.id} (${t.mes}, S/ ${t.monto})`));
  console.log('5. Concierto Milo J / Jacko:');
  console.log('   tx-183:', all.find(t => t.id === 'tx-183'));
  console.log('   tx-226:', all.find(t => t.id === 'tx-226'));
  console.log('   tx-283:', all.find(t => t.id === 'tx-283'));
  console.log('6. Cigarro:', getExact('Cigarro').map(t => `${t.id} (${t.categoria}, S/ ${t.monto})`));
  console.log('7. Medicinas:', getExact('Medicinas').map(t => `${t.id} (${t.mes}, S/ ${t.monto})`));
  console.log('8. Dulce:', getExact('Dulce').map(t => `${t.id} (${t.mes}, S/ ${t.monto})`));
  console.log('9. Galleta Casino:', getExact('Galleta Casino').map(t => `${t.id} (${t.mes}, S/ ${t.monto})`));
  console.log('10. Salida Casual:', getLike('casual').map(t => `${t.id} (${t.concepto}, ${t.mes}, S/ ${t.monto})`));
  console.log('11. Salida Familiar:', getLike('familiar').map(t => `${t.id} (${t.concepto}, ${t.mes}, S/ ${t.monto})`));
  console.log('12. Utencilios de Aseo Personal:', getLike('aseo personal').map(t => `${t.id} (${t.concepto}, ${t.mes}, S/ ${t.monto})`));
  console.log('13. Utencilios de Limpieza:', getLike('limpieza').map(t => `${t.id} (${t.concepto}, ${t.mes}, S/ ${t.monto})`));
  console.log('14. Videojuegos:', getExact('Videojuegos').map(t => `${t.id} (${t.mes}, S/ ${t.monto})`));
}

detail().catch(console.error);
