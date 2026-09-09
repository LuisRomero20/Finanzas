import * as XLSX from 'xlsx';

const wb = XLSX.readFile('Finanzas Personales.xlsx');
console.log('Sheet names:', wb.SheetNames);

for (const name of wb.SheetNames) {
  const ws = wb.Sheets[name];
  const json = XLSX.utils.sheet_to_json(ws);
  console.log(`Sheet "${name}" rows:`, json.length);
  if (json.length > 0) {
    console.log('Sample row:', json[0]);
  }
}
