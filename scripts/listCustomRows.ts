import * as fs from 'fs';

const txs: any[] = JSON.parse(fs.readFileSync('backups/prod_snapshot_2026-09-05.json', 'utf8'));

const customs = txs.filter(t => t.id && t.id.startsWith('custom-'));
console.log(`Total custom-* rows in Supabase: ${customs.length}`);

for (const c of customs) {
  console.log(`${c.id} | ${c.Fecha} | ${c.Mes} | ${c.Entidad} | ${c.Tipo} | S/ ${c.Monto} | ${c.Concepto}`);
}
