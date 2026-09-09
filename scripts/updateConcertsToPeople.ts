import { supabase } from '../src/lib/supabase';
import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';

interface UpdateItem {
  id: string;
  nuevoConcepto: string;
  nuevaCategoria: string;
  descripcion: string;
}

const updates: UpdateItem[] = [
  {
    id: 'tx-674',
    nuevoConcepto: 'Eduardo',
    nuevaCategoria: 'Familia & Transferencias',
    descripcion: 'Entrada Paulo Londra (Agosto, S/ 100) -> Eduardo',
  },
  {
    id: 'tx-183',
    nuevoConcepto: 'Jacko',
    nuevaCategoria: 'Familia & Transferencias',
    descripcion: 'Concierto Milo J (Marzo Egreso, S/ 70) -> Jacko',
  },
  {
    id: 'tx-226',
    nuevoConcepto: 'Jacko',
    nuevaCategoria: 'Familia & Transferencias',
    descripcion: 'Concierto Milo J (Marzo Ingreso, S/ 80) -> Jacko',
  },
  {
    id: 'tx-283',
    nuevoConcepto: 'Jacko',
    nuevaCategoria: 'Familia & Transferencias',
    descripcion: 'Concierto Milo J (Abril Egreso, S/ 43.3) -> Jacko',
  },
];

async function main() {
  console.log('====================================================');
  console.log('1. ACTUALIZANDO EN SUPABASE');
  console.log('====================================================');

  for (const item of updates) {
    console.log(`Actualizando ${item.id}: ${item.descripcion}...`);
    const { data, error } = await supabase
      .from('transacciones')
      .update({
        concepto: item.nuevoConcepto,
        categoria: item.nuevaCategoria,
      })
      .eq('id', item.id)
      .select();

    if (error) {
      console.error(`Error en ${item.id}:`, error);
    } else {
      console.log(`✓ ${item.id} actualizado:`, data);
    }
  }

  console.log('\n====================================================');
  console.log('2. ACTUALIZANDO MASTERDATA.TS');
  console.log('====================================================');

  const masterDataPath = path.resolve('src/utils/masterData.ts');
  let content = fs.readFileSync(masterDataPath, 'utf8');

  // tx-674
  content = content.replace(
    /("id":\s*"tx-674"[\s\S]*?"Concepto":\s*)"Entrada Paulo Londra"/,
    '$1"Eduardo"'
  );
  // tx-183
  content = content.replace(
    /("id":\s*"tx-183"[\s\S]*?"Concepto":\s*)"Concierto Milo J"/,
    '$1"Jacko"'
  );
  // tx-226
  content = content.replace(
    /("id":\s*"tx-226"[\s\S]*?"Concepto":\s*)"Concierto Milo J"/,
    '$1"Jacko"'
  );
  // tx-283
  content = content.replace(
    /("id":\s*"tx-283"[\s\S]*?"Concepto":\s*)"Concierto Milo J"/,
    '$1"Jacko"'
  );

  fs.writeFileSync(masterDataPath, content, 'utf8');
  console.log('✓ masterData.ts actualizado.');

  console.log('\n====================================================');
  console.log('3. ACTUALIZANDO FINANZAS PERSONALES.XLSX');
  console.log('====================================================');

  const excelPath = path.resolve('Finanzas Personales.xlsx');
  if (fs.existsSync(excelPath)) {
    try {
      const wb = XLSX.read(fs.readFileSync(excelPath), { type: 'buffer' });
      for (const sheetName of ['maestrov2', 'Maestro']) {
        if (wb.SheetNames.includes(sheetName)) {
          const rows: any[] = XLSX.utils.sheet_to_json(wb.Sheets[sheetName]);
          let count = 0;
          for (const r of rows) {
            const c = (r['Concepto'] || '').toString().trim();
            if (/^entrada paulo londra$/i.test(c)) {
              r['Concepto'] = 'Eduardo';
              count++;
            } else if (/^concierto milo j$/i.test(c)) {
              r['Concepto'] = 'Jacko';
              count++;
            }
          }
          wb.Sheets[sheetName] = XLSX.utils.json_to_sheet(rows);
          console.log(`✓ Hoja ${sheetName} actualizada (${count} cambios).`);
        }
      }
      fs.writeFileSync(excelPath, XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
      console.log('✓ Archivo Excel guardado correctamente.');
    } catch (err: any) {
      console.warn('Advertencia en Excel:', err?.message);
    }
  }

  console.log('\n====================================================');
  console.log('4. VERIFICACIÓN FINAL');
  console.log('====================================================');

  const { data: verifyData } = await supabase
    .from('transacciones')
    .select('id, mes, fecha, tipo, monto, concepto, categoria')
    .in('id', ['tx-674', 'tx-183', 'tx-226', 'tx-283']);

  console.log(JSON.stringify(verifyData, null, 2));
}

main().catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
});
