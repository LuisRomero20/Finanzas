import * as fs from 'fs';

// Look for masterTransactions in oldMasterData.ts
const content = fs.readFileSync('scripts/oldMasterData.ts', 'utf8');
const match = content.match(/export const masterTransactions: Transaction\[\] = (\[[\s\S]*?\]);/);
if (!match) {
  console.log('No match found');
  process.exit(0);
}
const oldTxs = JSON.parse(match[1]);
console.log('Old masterTransactions count:', oldTxs.length);

const seti = oldTxs.filter((t: any) => t.Mes === 'Setiembre');
console.log('Old Setiembre count:', seti.length);

const ibkIng = seti.filter((t: any) => t.Entidad === 'Interbank' && t.Tipo === 'Ingreso').reduce((a: any,b: any)=>a+b.Monto, 0);
const ibkEgr = seti.filter((t: any) => t.Entidad === 'Interbank' && t.Tipo === 'Egreso').reduce((a: any,b: any)=>a+b.Monto, 0);

console.log('Old Interbank in Setiembre:');
console.log('  Ingresos:', ibkIng);
console.log('  Egresos:', ibkEgr);
console.log('  Saldo:', (ibkIng - ibkEgr).toFixed(2));

const bbvaIng = seti.filter((t: any) => t.Entidad === 'BBVA Bfree' && t.Tipo === 'Ingreso').reduce((a: any,b: any)=>a+b.Monto, 0);
const bbvaEgr = seti.filter((t: any) => t.Entidad === 'BBVA Bfree' && t.Tipo === 'Egreso').reduce((a: any,b: any)=>a+b.Monto, 0);
console.log('Old BBVA Bfree:');
console.log('  Cargos (Ing):', bbvaIng, 'Abonos (Egr):', bbvaEgr);

const amexIng = seti.filter((t: any) => t.Entidad === 'Interbank Amex' && t.Tipo === 'Ingreso').reduce((a: any,b: any)=>a+b.Monto, 0);
const amexEgr = seti.filter((t: any) => t.Entidad === 'Interbank Amex' && t.Tipo === 'Egreso').reduce((a: any,b: any)=>a+b.Monto, 0);
console.log('Old Interbank Amex:');
console.log('  Cargos (Ing):', amexIng, 'Abonos (Egr):', amexEgr, 'Neto:', (amexIng - amexEgr).toFixed(2));

const ripleyIng = seti.filter((t: any) => t.Entidad === 'Ripley' && t.Tipo === 'Ingreso').reduce((a: any,b: any)=>a+b.Monto, 0);
const ripleyEgr = seti.filter((t: any) => t.Entidad === 'Ripley' && t.Tipo === 'Egreso').reduce((a: any,b: any)=>a+b.Monto, 0);
console.log('Old Ripley:');
console.log('  Cargos (Ing):', ripleyIng, 'Abonos (Egr):', ripleyEgr, 'Neto:', (ripleyIng - ripleyEgr).toFixed(2));
