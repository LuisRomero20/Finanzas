import * as fs from 'fs';

const txs: any[] = JSON.parse(fs.readFileSync('backups/prod_snapshot_2026-09-05.json', 'utf8'));

const seti = txs.filter(t => t.Mes === 'Setiembre');
console.log(`Total en Setiembre: ${seti.length}`);
console.log('--- TODAS LAS TRANSACCIONES DE SETIEMBRE ---');
for (const t of seti) {
  console.log(`${t.id} | ${t.Fecha} | ${t.Tipo} | ${t.Entidad} | S/ ${t.Monto} | ${t.Concepto} | ${t.estado || 'confirmado'}`);
}
