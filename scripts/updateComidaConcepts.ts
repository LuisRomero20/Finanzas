import { supabase } from '../src/lib/supabase';
import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';

interface UpdateTarget {
  id: string;
  mes: string;
  monto: number;
  nuevoConcepto: string;
}

const targets: UpdateTarget[] = [
  { id: 'tx-7', mes: 'Enero', monto: 100, nuevoConcepto: 'Makis' },
  { id: 'tx-12', mes: 'Enero', monto: 36.5, nuevoConcepto: 'Makis' },
  { id: 'tx-242', mes: 'Abril', monto: 12, nuevoConcepto: 'Menú' },
  { id: 'tx-344', mes: 'Mayo', monto: 39.05, nuevoConcepto: 'KFC' },
];

async function main() {
  console.log('====================================================');
  console.log('ACTUALIZANDO TRANSACCIONES DE "COMIDA" EN SUPABASE');
  console.log('====================================================');

  for (const t of targets) {
    console.log(`Actualizando ${t.id} (${t.mes}, S/ ${t.monto}) -> "${t.nuevoConcepto}"...`);
    const { data, error } = await supabase
      .from('transacciones')
      .update({
        concepto: t.nuevoConcepto,
        categoria: 'Comida & Restaurantes',
      })
      .eq('id', t.id)
      .select();

    if (error) {
      console.error(`Error actualizando ${t.id}:`, error);
    } else {
      console.log(`✓ ${t.id} actualizado con éxito:`, data);
    }
  }

  // 2. Actualizar masterData.ts
  console.log('\n====================================================');
  console.log('ACTUALIZANDO MASTERDATA.TS LOCAL');
  console.log('====================================================');
  const masterDataPath = path.resolve('src/utils/masterData.ts');
  let masterDataContent = fs.readFileSync(masterDataPath, 'utf8');

  // tx-7
  masterDataContent = masterDataContent.replace(
    /("id":\s*"tx-7"[\s\S]*?"Concepto":\s*)"Comida"/,
    '$1"Makis"'
  );
  // tx-12
  masterDataContent = masterDataContent.replace(
    /("id":\s*"tx-12"[\s\S]*?"Concepto":\s*)"Comida"/,
    '$1"Makis"'
  );
  // tx-242
  masterDataContent = masterDataContent.replace(
    /("id":\s*"tx-242"[\s\S]*?"Concepto":\s*)"Comida"/,
    '$1"Menú"'
  );
  // tx-344
  masterDataContent = masterDataContent.replace(
    /("id":\s*"tx-344"[\s\S]*?"Concepto":\s*)"Comida"/,
    '$1"KFC"'
  );

  fs.writeFileSync(masterDataPath, masterDataContent, 'utf8');
  console.log('✓ src/utils/masterData.ts actualizado con los nuevos conceptos.');

  // 3. Actualizar Finanzas Personales.xlsx si existe
  const excelPath = path.resolve('Finanzas Personales.xlsx');
  if (fs.existsSync(excelPath)) {
    try {
      const wb = XLSX.readFile(excelPath);
      if (wb.SheetNames.includes('maestrov2')) {
        const sheet = wb.Sheets['maestrov2'];
        const rows: any[] = XLSX.utils.sheet_to_json(sheet);
        let updatedCount = 0;
        for (const row of rows) {
          const concepto = (row['Concepto'] || '').toString().trim();
          const mes = (row['Mes'] || '').toString().trim();
          const monto = Number(row['Monto'] || row[' Monto ']);

          if (/^comida$/i.test(concepto)) {
            if (mes === 'Enero' && (monto === 100 || monto === 36.5)) {
              row['Concepto'] = 'Makis';
              updatedCount++;
            } else if (mes === 'Abril' && monto === 12) {
              row['Concepto'] = 'Menú';
              updatedCount++;
            } else if (mes === 'Mayo' && Math.abs(monto - 39) < 1) {
              row['Concepto'] = 'KFC';
              updatedCount++;
            }
          }
        }
        const newSheet = XLSX.utils.json_to_sheet(rows);
        wb.Sheets['maestrov2'] = newSheet;
        XLSX.writeFile(wb, excelPath);
        console.log(`✓ Finanzas Personales.xlsx actualizado (${updatedCount} filas en maestrov2).`);
      }
    } catch (e: any) {
      console.warn('Advertencia al actualizar Excel:', e?.message);
    }
  }

  // 4. Verificación final en Supabase
  console.log('\n====================================================');
  console.log('VERIFICACIÓN FINAL EN SUPABASE');
  console.log('====================================================');
  const { data: checkData } = await supabase
    .from('transacciones')
    .select('id, mes, fecha, monto, concepto, categoria')
    .in('id', ['tx-7', 'tx-12', 'tx-242', 'tx-344']);

  console.log(JSON.stringify(checkData, null, 2));

  // Verificar si queda algún concepto 'Comida' en Supabase
  const { data: remainingComida } = await supabase
    .from('transacciones')
    .select('id, mes, monto, concepto')
    .ilike('concepto', 'comida');

  console.log(`Registros restantes con concepto 'Comida': ${remainingComida?.length || 0}`);
}

main().catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
});
