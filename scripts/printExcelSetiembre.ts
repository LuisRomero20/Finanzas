import * as XLSX from 'xlsx';
import * as fs from 'fs';

const buf = fs.readFileSync('Finanzas Personales.xlsx');
const wb = XLSX.read(buf, { type: 'buffer' });
const sheet = wb.Sheets['Maestro'];
const rawRows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

const setiRows = rawRows.filter(r => {
  const m = String(r['Mes'] || '');
  return /setiembre|septiembre/i.test(m);
});

console.log('--- ALL ROWS FOR SETIEMBRE IN EXCEL ---');
setiRows.forEach((r, i) => {
  const rawMonto = r[' Monto '] !== undefined ? r[' Monto '] : r['Monto'];
  console.log(`[${i+1}] Entidad: "${r['Entidad']}" | Tipo: "${r['Tipo']}" | Monto: ${rawMonto} | Concepto: "${r['Concepto']}" | Fecha: "${r['Fecha']}"`);
});
