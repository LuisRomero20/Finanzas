import { supabase } from '../src/lib/supabase';
import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';

function round2(num: number): number {
  return Math.round(num * 100) / 100;
}

async function run() {
  console.log('====================================================');
  console.log('1. ACTUALIZANDO CONCEPTOS Y CATEGORÍAS EN SUPABASE');
  console.log('====================================================');

  // 1. Abrigo -> Casaca
  await supabase.from('transacciones').update({ concepto: 'Casaca', categoria: 'Ropa & Calzado' }).eq('id', 'tx-444');
  console.log('✓ tx-444: Abrigo -> Casaca');

  // 2. Arreglar Zapatillas -> Zapatillas
  await supabase.from('transacciones').update({ concepto: 'Zapatillas', categoria: 'Ropa & Calzado' }).eq('id', 'tx-130');
  console.log('✓ tx-130: Arreglar Zapatillas -> Zapatillas');

  // 3. Arreglar Abrigo -> Casaca
  await supabase.from('transacciones').update({ concepto: 'Casaca', categoria: 'Ropa & Calzado' }).eq('id', 'tx-209');
  console.log('✓ tx-209: Arreglar Abrigo -> Casaca');

  // 4. Polo y/o Camisa -> Camisa
  await supabase.from('transacciones').update({ concepto: 'Camisa', categoria: 'Ropa & Calzado' }).eq('id', 'tx-138');
  console.log('✓ tx-138: Polo y/o Camisa -> Camisa');

  // 5. Revertir egresos de Concierto Milo J (tx-183 y tx-283) a Concierto Milo J
  await supabase.from('transacciones').update({ concepto: 'Concierto Milo J', categoria: 'Conciertos & Eventos' }).eq('id', 'tx-183');
  await supabase.from('transacciones').update({ concepto: 'Concierto Milo J', categoria: 'Conciertos & Eventos' }).eq('id', 'tx-283');
  console.log('✓ tx-183 y tx-283 revertidos a Concierto Milo J (tx-226 se mantiene como Jacko)');

  // 6. Cigarro -> Salidas & Sociales
  await supabase.from('transacciones').update({ categoria: 'Salidas & Sociales' }).ilike('concepto', 'cigarro');
  console.log('✓ Cigarro actualizado a categoría Salidas & Sociales');

  // 7. Medicinas -> Medicina Madre
  await supabase.from('transacciones').update({ concepto: 'Medicina Madre', categoria: 'Salud & Farmacia' }).eq('id', 'tx-472');
  console.log('✓ tx-472: Medicinas -> Medicina Madre');

  // 8. Dulce -> Dulce de Leche
  const dulceIds = ['tx-127', 'tx-333', 'tx-337', 'tx-566'];
  for (const id of dulceIds) {
    await supabase.from('transacciones').update({ concepto: 'Dulce de Leche', categoria: 'Supermercado & Alimentos' }).eq('id', id);
  }
  console.log(`✓ ${dulceIds.length} transacciones de Dulce -> Dulce de Leche`);

  // 9. Galleta Casino -> Galleta
  await supabase.from('transacciones').update({ concepto: 'Galleta', categoria: 'Supermercado & Alimentos' }).eq('id', 'tx-208');
  console.log('✓ tx-208: Galleta Casino -> Galleta');

  // 10. Salida Casual -> Ron
  await supabase.from('transacciones').update({ concepto: 'Ron', categoria: 'Salidas & Sociales' }).in('id', ['tx-134', 'tx-143']);
  console.log('✓ tx-134 y tx-143: Salida Casual -> Ron');

  // 11. Salida Familiar -> Vino
  await supabase.from('transacciones').update({ concepto: 'Vino', categoria: 'Salidas & Sociales' }).in('id', ['tx-14', 'tx-216']);
  console.log('✓ tx-14 y tx-216: Salida Familiar -> Vino');

  // 12. Utencilios de Aseo Personal -> Shampoo
  const aseoIds = ['tx-104', 'tx-140', 'tx-202', 'tx-217'];
  for (const id of aseoIds) {
    await supabase.from('transacciones').update({ concepto: 'Shampoo', categoria: 'Cuidado Personal & Aseo' }).eq('id', id);
  }
  console.log(`✓ ${aseoIds.length} transacciones de Utencilios de Aseo Personal -> Shampoo`);

  // 13. Utencilios de Limpieza dividelo entre Detergente, Papel Higiénico y Pasta Dental sin tocar el monto
  const limpiezaIds = [
    'tx-82', 'tx-88', 'tx-105', 'tx-201', 'tx-220', 'tx-266', 'tx-304', 'tx-324',
    'tx-371', 'tx-471', 'tx-493', 'tx-516', 'tx-585', 'tx-604', 'tx-658', 'tx-671', 'tx-672'
  ];

  const { data: limpiezaRows, error: lErr } = await supabase
    .from('transacciones')
    .select('*')
    .in('id', limpiezaIds);

  if (lErr || !limpiezaRows) {
    console.error('Error fetching limpieza rows:', lErr);
    return;
  }

  const newSplitRows: any[] = [];
  let totalOrig = 0;
  let totalSplit = 0;

  for (const row of limpiezaRows) {
    const origMonto = Number(row.monto);
    totalOrig += origMonto;

    const m1 = round2(origMonto / 3);
    const m2 = round2(origMonto / 3);
    const m3 = round2(origMonto - m1 - m2);
    totalSplit += (m1 + m2 + m3);

    // 1: Detergente (actualiza el id existente)
    await supabase.from('transacciones').update({
      concepto: 'Detergente',
      categoria: 'Hogar & Mantenimiento',
      monto: m1,
    }).eq('id', row.id);

    // 2: Papel Higiénico (inserta id-pap)
    newSplitRows.push({
      id: `${row.id}-pap`,
      tipo: row.tipo,
      fecha: row.fecha,
      concepto: 'Papel Higiénico',
      categoria: 'Hogar & Mantenimiento',
      entidad: row.entidad,
      monto: m2,
      mes: row.mes,
    });

    // 3: Pasta Dental (inserta id-pas)
    newSplitRows.push({
      id: `${row.id}-pas`,
      tipo: row.tipo,
      fecha: row.fecha,
      concepto: 'Pasta Dental',
      categoria: 'Cuidado Personal & Aseo',
      entidad: row.entidad,
      monto: m3,
      mes: row.mes,
    });
  }

  // Insertar las nuevas filas en Supabase
  const { error: insSplitErr } = await supabase.from('transacciones').upsert(newSplitRows);
  if (insSplitErr) {
    console.error('Error insertando split rows:', insSplitErr);
  } else {
    console.log(`✓ 17 filas de Utencilios de Limpieza divididas entre Detergente, Papel Higiénico y Pasta Dental.`);
    console.log(`  Total original: S/ ${round2(totalOrig)} === Total dividido: S/ ${round2(totalSplit)}`);
  }

  // 14. Videojuegos -> In Game
  await supabase.from('transacciones').update({ concepto: 'In Game', categoria: 'Entretenimiento & Streaming' }).eq('id', 'tx-54');
  console.log('✓ tx-54: Videojuegos -> In Game');

  console.log('\n====================================================');
  console.log('2. ACTUALIZANDO MASTERDATA.TS LOCAL');
  console.log('====================================================');

  // Descargar todas las transacciones actualizadas de Supabase para generar masterData.ts perfecto
  const { data: allFresh, error: freshErr } = await supabase
    .from('transacciones')
    .select('*')
    .order('fecha', { ascending: true });

  if (allFresh && allFresh.length > 0) {
    const formattedList = allFresh.map(t => ({
      id: t.id,
      Tipo: t.tipo,
      Fecha: t.fecha,
      Categoria: t.categoria,
      Concepto: t.concepto,
      Monto: Number(t.monto),
      Entidad: t.entidad,
      Mes: t.mes,
      ...(t.estado ? { estado: t.estado } : {})
    }));

    const masterDataPath = path.resolve('src/utils/masterData.ts');
    const existingContent = fs.readFileSync(masterDataPath, 'utf8');
    const prefix = existingContent.slice(0, existingContent.indexOf('export const masterTransactions: Transaction[] = ['));
    const newContent = `${prefix}export const masterTransactions: Transaction[] = ${JSON.stringify(formattedList, null, 2)};\n`;

    fs.writeFileSync(masterDataPath, newContent, 'utf8');
    console.log(`✓ masterData.ts actualizado con los ${formattedList.length} registros exactos de Supabase.`);
  }

  console.log('\n====================================================');
  console.log('3. ACTUALIZANDO ARCHIVO EXCEL');
  console.log('====================================================');

  const excelPath = path.resolve('Finanzas Personales.xlsx');
  if (fs.existsSync(excelPath)) {
    try {
      const wb = XLSX.read(fs.readFileSync(excelPath), { type: 'buffer' });
      for (const sheetName of ['maestrov2', 'Maestro']) {
        if (wb.SheetNames.includes(sheetName)) {
          const rows: any[] = XLSX.utils.sheet_to_json(wb.Sheets[sheetName]);
          const newRows: any[] = [];

          for (const r of rows) {
            const c = (r['Concepto'] || '').toString().trim();
            const tipo = (r['Tipo'] || '').toString().trim();
            const monto = Number(r['Monto'] || r[' Monto ']);

            if (/^abrigo$/i.test(c)) {
              r['Concepto'] = 'Casaca';
              newRows.push(r);
            } else if (/^arreglar zapatillas$/i.test(c)) {
              r['Concepto'] = 'Zapatillas';
              newRows.push(r);
            } else if (/^arreglar abrigo$/i.test(c)) {
              r['Concepto'] = 'Casaca';
              newRows.push(r);
            } else if (/^polo y\/o camisa$/i.test(c)) {
              r['Concepto'] = 'Camisa';
              newRows.push(r);
            } else if (/^concierto milo j$/i.test(c)) {
              if (/ingreso/i.test(tipo)) {
                r['Concepto'] = 'Jacko';
              } else {
                r['Concepto'] = 'Concierto Milo J';
              }
              newRows.push(r);
            } else if (/^medicinas$/i.test(c)) {
              r['Concepto'] = 'Medicina Madre';
              newRows.push(r);
            } else if (/^dulce$/i.test(c)) {
              r['Concepto'] = 'Dulce de Leche';
              newRows.push(r);
            } else if (/^galleta casino$/i.test(c)) {
              r['Concepto'] = 'Galleta';
              newRows.push(r);
            } else if (/^salida casual$/i.test(c)) {
              r['Concepto'] = 'Ron';
              newRows.push(r);
            } else if (/^salida familiar$/i.test(c)) {
              r['Concepto'] = 'Vino';
              newRows.push(r);
            } else if (/^utencilios de aseo personal$/i.test(c)) {
              r['Concepto'] = 'Shampoo';
              newRows.push(r);
            } else if (/^videojuegos$/i.test(c)) {
              r['Concepto'] = 'In Game';
              newRows.push(r);
            } else if (/^utencilios de limpieza$/i.test(c)) {
              const m1 = round2(monto / 3);
              const m2 = round2(monto / 3);
              const m3 = round2(monto - m1 - m2);

              const r1 = { ...r, Concepto: 'Detergente', Monto: m1 };
              const r2 = { ...r, Concepto: 'Papel Higiénico', Monto: m2 };
              const r3 = { ...r, Concepto: 'Pasta Dental', Monto: m3 };

              newRows.push(r1, r2, r3);
            } else {
              newRows.push(r);
            }
          }

          wb.Sheets[sheetName] = XLSX.utils.json_to_sheet(newRows);
          console.log(`✓ Hoja ${sheetName} en Excel actualizada.`);
        }
      }
      fs.writeFileSync(excelPath, XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
      console.log('✓ Finanzas Personales.xlsx guardado con éxito.');
    } catch (e: any) {
      console.warn('Advertencia actualizando Excel:', e?.message);
    }
  }

  console.log('\n====================================================');
  console.log('¡TODAS LAS ACTUALIZACIONES COMPLETADAS CON ÉXITO!');
  console.log('====================================================');
}

run().catch(console.error);
