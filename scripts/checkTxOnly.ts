import * as fs from 'fs';

const txs: any[] = JSON.parse(fs.readFileSync('backups/prod_snapshot_2026-09-05.json', 'utf8'));

const txItems = txs.filter(t => t.id && t.id.startsWith('tx-') && t.Mes === 'Setiembre');
console.log(`tx-* count in Setiembre: ${txItems.length}`);

const ibkIng = txItems.filter(t => t.Entidad === 'Interbank' && t.Tipo === 'Ingreso').reduce((a,b)=>a+b.Monto, 0);
const ibkEgr = txItems.filter(t => t.Entidad === 'Interbank' && t.Tipo === 'Egreso').reduce((a,b)=>a+b.Monto, 0);

console.log('Interbank tx-* only:');
console.log('  Ingresos:', ibkIng);
console.log('  Egresos:', ibkEgr);
console.log('  Saldo:', ibkIng - ibkEgr);

const bbvaIng = txItems.filter(t => t.Entidad === 'BBVA Bfree' && t.Tipo === 'Ingreso').reduce((a,b)=>a+b.Monto, 0);
const bbvaEgr = txItems.filter(t => t.Entidad === 'BBVA Bfree' && t.Tipo === 'Egreso').reduce((a,b)=>a+b.Monto, 0);
console.log('BBVA Bfree tx-* only:');
console.log('  Cargos (Ing):', bbvaIng, 'Abonos (Egr):', bbvaEgr);

const amexIng = txItems.filter(t => t.Entidad === 'Interbank Amex' && t.Tipo === 'Ingreso').reduce((a,b)=>a+b.Monto, 0);
const amexEgr = txItems.filter(t => t.Entidad === 'Interbank Amex' && t.Tipo === 'Egreso').reduce((a,b)=>a+b.Monto, 0);
console.log('Interbank Amex tx-* only:');
console.log('  Cargos (Ing):', amexIng, 'Abonos (Egr):', amexEgr);

const ripleyIng = txItems.filter(t => t.Entidad === 'Ripley' && t.Tipo === 'Ingreso').reduce((a,b)=>a+b.Monto, 0);
const ripleyEgr = txItems.filter(t => t.Entidad === 'Ripley' && t.Tipo === 'Egreso').reduce((a,b)=>a+b.Monto, 0);
console.log('Ripley tx-* only:');
console.log('  Cargos (Ing):', ripleyIng, 'Abonos (Egr):', ripleyEgr);
