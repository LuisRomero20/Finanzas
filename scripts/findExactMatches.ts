import * as fs from 'fs';

const txs: any[] = JSON.parse(fs.readFileSync('backups/prod_snapshot_2026-09-05.json', 'utf8'));

console.log('Total txs:', txs.length);

// Let's search which transactions have 488.43, 976.10, 12.70, 637.11, 18.99
for (const t of txs) {
  if ([488.43, 976.10, 12.70, 637.11, 18.99, 2452.63, 2214.91, 237.72].some(m => Math.abs(t.Monto - m) < 0.01)) {
    console.log('Direct match tx:', t);
  }
}

// Or sums by month, or sums by date, or what?
// Let's search if any subset of transactions sums to 2452.63
console.log('\nChecking all months with different filters...');
const allMonths = Array.from(new Set(txs.map(t => t.Mes)));
for (const m of allMonths) {
  const mtxs = txs.filter(t => t.Mes === m);
  const ibkIng = mtxs.filter(t => t.Entidad === 'Interbank' && t.Tipo === 'Ingreso').reduce((a,b)=>a+b.Monto,0);
  const ibkEgr = mtxs.filter(t => t.Entidad === 'Interbank' && t.Tipo === 'Egreso').reduce((a,b)=>a+b.Monto,0);
  console.log(`Month: ${m} -> IBK Ing: ${ibkIng}, Egr: ${ibkEgr}`);
}
