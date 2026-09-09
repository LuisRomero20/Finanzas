import { supabase } from '../src/lib/supabase';
import { masterTransactions } from '../src/utils/masterData';

async function main() {
  console.log('Fetching all transactions from Supabase...');
  const { data: allSupabase, error } = await supabase.from('transacciones').select('*');
  if (error || !allSupabase) {
    console.error('Error fetching Supabase:', error);
    return;
  }
  console.log(`Total rows in Supabase: ${allSupabase.length}`);

  const conceptsToCheck = [
    'Abrigo',
    'Arreglar Zapatillas',
    'Arreglar Abrigo',
    'Polo y/o Camisa',
    'Jacko',
    'Concierto Milo J',
    'Cigarro',
    'Medicinas',
    'Dulce',
    'Galleta Casino',
    'Salida Casual',
    'Salida Familiar',
    'Utencilios de Aseo Personal',
    'Utencilios de Limpieza',
    'Videojuegos'
  ];

  for (const c of conceptsToCheck) {
    const matches = allSupabase.filter(t => t.concepto && t.concepto.toLowerCase().includes(c.toLowerCase()));
    console.log(`\n=== Pattern "${c}": ${matches.length} matches in Supabase ===`);
    for (const m of matches) {
      console.log(`  id: ${m.id} | ${m.fecha} | ${m.mes} | ${m.tipo} | S/ ${m.monto} | '${m.concepto}' | '${m.categoria}' | ${m.entidad}`);
    }
  }

  // Also check for any variations of "Utencilios" or "Limpieza" or "Aseo"
  const limpiezaMatches = allSupabase.filter(t => t.concepto && /limpieza|aseo|utensilio|utencilio/i.test(t.concepto));
  console.log(`\n=== All Cleaning/Personal Hygiene matches (${limpiezaMatches.length}): ===`);
  for (const m of limpiezaMatches) {
    console.log(`  id: ${m.id} | ${m.fecha} | ${m.mes} | ${m.tipo} | S/ ${m.monto} | '${m.concepto}' | '${m.categoria}' | ${m.entidad}`);
  }
}

main().catch(console.error);
