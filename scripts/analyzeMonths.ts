import * as fs from 'fs';

const txs = JSON.parse(fs.readFileSync('backups/prod_snapshot_2026-09-05.json', 'utf8'));

const months: Record<string, any[]> = {};
for (const t of txs) {
  if (!months[t.Mes]) months[t.Mes] = [];
  months[t.Mes].push(t);
}

for (const [m, list] of Object.entries(months)) {
  const ibkIng = list.filter(t => t.Entidad === 'Interbank' && t.Tipo === 'Ingreso').reduce((a, b) => a + b.Monto, 0);
  const ibkEgr = list.filter(t => t.Entidad === 'Interbank' && t.Tipo === 'Egreso').reduce((a, b) => a + b.Monto, 0);
  
  const bbvaCargos = list.filter(t => t.Entidad === 'BBVA Bfree' && t.Tipo === 'Egreso').reduce((a, b) => a + b.Monto, 0);
  const amexCargos = list.filter(t => t.Entidad === 'Interbank Amex' && t.Tipo === 'Egreso').reduce((a, b) => a + b.Monto, 0);
  const amexAbonos = list.filter(t => t.Entidad === 'Interbank Amex' && t.Tipo === 'Ingreso').reduce((a, b) => a + b.Monto, 0);
  const ripleyCargos = list.filter(t => t.Entidad === 'Ripley' && t.Tipo === 'Egreso').reduce((a, b) => a + b.Monto, 0);
  const ripleyAbonos = list.filter(t => t.Entidad === 'Ripley' && t.Tipo === 'Ingreso').reduce((a, b) => a + b.Monto, 0);

  console.log(`=== MES: ${m} (${list.length} txs) ===`);
  console.log(`  Interbank: Ing=${ibkIng.toFixed(2)}, Egr=${ibkEgr.toFixed(2)}, Saldo=${(ibkIng - ibkEgr).toFixed(2)}`);
  console.log(`  BBVA Bfree: Cargos=${bbvaCargos.toFixed(2)}`);
  console.log(`  Interbank Amex: Cargos=${amexCargos.toFixed(2)}, Abonos=${amexAbonos.toFixed(2)}, Neto=${(amexCargos - amexAbonos).toFixed(2)}`);
  console.log(`  Ripley: Cargos=${ripleyCargos.toFixed(2)}, Abonos=${ripleyAbonos.toFixed(2)}, Neto=${(ripleyCargos - ripleyAbonos).toFixed(2)}`);
}
