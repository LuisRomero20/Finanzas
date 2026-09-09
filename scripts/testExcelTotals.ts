import * as XLSX from 'xlsx';
import * as fs from 'fs';

const buf = fs.readFileSync('Finanzas Personales.xlsx');
const wb = XLSX.read(buf, { type: 'buffer' });
const sheet = wb.Sheets['Maestro'];
const rawRows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

console.log('Total raw rows in Maestro sheet:', rawRows.length);

const setiRows = rawRows.filter(r => {
  const m = String(r['Mes'] || '');
  return /setiembre|septiembre/i.test(m);
});

console.log('Setiembre rows in Excel:', setiRows.length);

let ibkIng = 0;
let ibkEgr = 0;
let bbvaIng = 0;
let bbvaEgr = 0;
let amexIng = 0;
let amexEgr = 0;
let ripleyIng = 0;
let ripleyEgr = 0;

for (const r of setiRows) {
  const tipo = String(r['Tipo'] || '').trim();
  const entidad = String(r['Entidad'] || '').trim();
  const rawMonto = r[' Monto '] !== undefined ? r[' Monto '] : r['Monto'];
  const monto = typeof rawMonto === 'number' ? rawMonto : parseFloat(String(rawMonto).replace(/[^0-9.-]/g, '')) || 0;

  if (entidad === 'Interbank') {
    if (tipo === 'Ingreso') ibkIng += monto;
    if (tipo === 'Egreso') ibkEgr += monto;
  }
  if (entidad === 'BBVA Bfree') {
    if (tipo === 'Ingreso') bbvaIng += monto;
    if (tipo === 'Egreso') bbvaEgr += monto;
  }
  if (entidad === 'Interbank Amex') {
    if (tipo === 'Ingreso') amexIng += monto;
    if (tipo === 'Egreso') amexEgr += monto;
  }
  if (entidad === 'Ripley') {
    if (tipo === 'Ingreso') ripleyIng += monto;
    if (tipo === 'Egreso') ripleyEgr += monto;
  }
}

console.log(`Interbank Excel: Ing=${ibkIng.toFixed(2)}, Egr=${ibkEgr.toFixed(2)}, Saldo=${(ibkIng - ibkEgr).toFixed(2)}`);
console.log(`BBVA Bfree Excel: Cargos(Ing)=${bbvaIng.toFixed(2)}, Abonos(Egr)=${bbvaEgr.toFixed(2)}`);
console.log(`Interbank Amex Excel: Cargos(Ing)=${amexIng.toFixed(2)}, Abonos(Egr)=${amexEgr.toFixed(2)}, Neto=${(amexIng - amexEgr).toFixed(2)}`);
console.log(`Ripley Excel: Cargos(Ing)=${ripleyIng.toFixed(2)}, Abonos(Egr)=${ripleyEgr.toFixed(2)}, Neto=${(ripleyIng - ripleyEgr).toFixed(2)}`);
