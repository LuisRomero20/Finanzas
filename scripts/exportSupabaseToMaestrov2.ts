import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import { getEffectiveCategory } from '../src/utils/categoryClassification';

const SUPABASE_URL = 'https://njgzhjwfcxdxiibkuuqg.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qZ3poandmY3hkeGlpYmt1dXFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwMjg5MjksImV4cCI6MjEwMzYwNDkyOX0.VQSGP9NSUAI1M_BaOtqhxC4hl8o8jAx7HC0rlrnzMNA';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function dateToExcelSerial(dateStr: string): number {
  if (!dateStr || typeof dateStr !== 'string') return 46023; // fallback 2026-01-01
  const parts = dateStr.trim().split(/[\/\-]/).map(Number);
  if (parts.length === 3) {
    let y = parts[0];
    let m = parts[1];
    let d = parts[2];
    if (y < 100) y = 2000 + y;
    // Check if DD/MM/YYYY
    if (parts[0] <= 31 && parts[1] <= 12 && parts[2] >= 2000) {
      d = parts[0];
      m = parts[1];
      y = parts[2];
    }
    const utcDate = Date.UTC(y, m - 1, d);
    const epoch = Date.UTC(1899, 11, 30);
    return Math.round((utcDate - epoch) / 86400000);
  }
  return 46023;
}

async function exportToMaestrov2() {
  console.log('====================================================');
  console.log('1. CONSULTANDO TODAS LAS TRANSACCIONES DE SUPABASE');
  console.log('====================================================');

  // Traer todas las filas de la tabla transacciones
  const { data: rows, error } = await supabase
    .from('transacciones')
    .select('*')
    .order('fecha', { ascending: true })
    .order('id', { ascending: true });

  if (error || !rows) {
    console.error('Error al consultar Supabase:', error);
    process.exit(1);
  }

  console.log(`✓ Se recuperaron ${rows.length} transacciones desde Supabase.`);

  console.log('====================================================');
  console.log('2. LEYENDO FINANZAS PERSONALES.XLSX');
  console.log('====================================================');

  const excelPath = path.resolve('Finanzas Personales.xlsx');
  const buf = fs.readFileSync(excelPath);
  const workbook = XLSX.read(buf, { type: 'buffer', cellStyles: true, cellFormula: true });

  console.log('Hojas actuales en el Excel:', workbook.SheetNames);

  console.log('====================================================');
  console.log('3. CONSTRUYENDO HOJA "maestrov2" CON EL MISMO FORMATO');
  console.log('====================================================');

  // Encabezados exactos de Maestro
  const headers = ['Tipo', 'Fecha', 'Categoría', 'Concepto', 'Monto', 'Entidad', 'Mes'];

  // Crear celdas de la hoja manualmente para asegurar formato de fecha y monto
  const ws: XLSX.WorkSheet = {};
  
  // Fila 1: Encabezados
  headers.forEach((h, colIdx) => {
    const cellRef = XLSX.utils.encode_cell({ r: 0, c: colIdx });
    ws[cellRef] = { t: 's', v: h };
  });

  // Filas de datos
  rows.forEach((row, rowIdx) => {
    const r = rowIdx + 1; // Fila Excel 1-indexed (fila 2 en adelante)
    const serialDate = dateToExcelSerial(row.fecha);
    const monto = Number(row.monto) || 0;

    // Col A: Tipo
    ws[XLSX.utils.encode_cell({ r, c: 0 })] = { t: 's', v: row.tipo || 'Egreso' };

    // Col B: Fecha (serial de Excel con formato de fecha para que Excel lo reconozca)
    ws[XLSX.utils.encode_cell({ r, c: 1 })] = {
      t: 'n',
      v: serialDate,
      z: 'yyyy-mm-dd',
    };

    // Col C: Categoría (categoría detallada enriquecida)
    const effectiveCat = getEffectiveCategory({
      id: row.id,
      Tipo: row.tipo,
      Fecha: row.fecha,
      Concepto: row.concepto,
      Categoria: row.categoria,
      Entidad: row.entidad,
      Monto: monto,
      Mes: row.mes,
    });
    const finalCat = effectiveCat ? effectiveCat.nombre : (row.categoria || 'Gasto');
    ws[XLSX.utils.encode_cell({ r, c: 2 })] = { t: 's', v: finalCat };

    // Col D: Concepto
    ws[XLSX.utils.encode_cell({ r, c: 3 })] = { t: 's', v: row.concepto || '' };

    // Col E: Monto (número con formato de moneda/dos decimales)
    ws[XLSX.utils.encode_cell({ r, c: 4 })] = {
      t: 'n',
      v: monto,
      z: '#,##0.00',
    };

    // Col F: Entidad
    ws[XLSX.utils.encode_cell({ r, c: 5 })] = { t: 's', v: row.entidad || 'Interbank' };

    // Col G: Mes
    ws[XLSX.utils.encode_cell({ r, c: 6 })] = { t: 's', v: row.mes || 'Enero' };
  });

  // Definir rango !ref
  const maxRow = rows.length; // índice de la última fila (0-indexed = rows.length)
  ws['!ref'] = XLSX.utils.encode_range({
    s: { r: 0, c: 0 },
    e: { r: maxRow, c: 6 },
  });

  // Anchos de columna óptimos para buena legibilidad
  ws['!cols'] = [
    { wch: 12 }, // Tipo
    { wch: 14 }, // Fecha
    { wch: 28 }, // Categoría
    { wch: 38 }, // Concepto
    { wch: 14 }, // Monto
    { wch: 20 }, // Entidad
    { wch: 14 }, // Mes
  ];

  // Insertar o reemplazar la hoja 'maestrov2'
  if (workbook.SheetNames.includes('maestrov2')) {
    workbook.Sheets['maestrov2'] = ws;
    console.log('Hoja "maestrov2" ya existía: reemplazada con los datos más recientes.');
  } else {
    // Insertar maestrov2 justo después de Maestro si existe
    const maestroIdx = workbook.SheetNames.indexOf('Maestro');
    if (maestroIdx >= 0) {
      workbook.SheetNames.splice(maestroIdx + 1, 0, 'maestrov2');
      workbook.Sheets['maestrov2'] = ws;
    } else {
      XLSX.utils.book_append_sheet(workbook, ws, 'maestrov2');
    }
    console.log('Hoja "maestrov2" añadida exitosamente.');
  }

  console.log('====================================================');
  console.log('4. GUARDANDO FINANZAS PERSONALES.XLSX');
  console.log('====================================================');

  XLSX.writeFile(workbook, excelPath);
  console.log(`✓ Archivo ${excelPath} actualizado con éxito.`);
  console.log(`✓ Total de registros en "maestrov2": ${rows.length}`);
  console.log('Hojas resultantes en el libro:', workbook.SheetNames);
}

exportToMaestrov2().catch(err => {
  console.error('Error fatal al exportar a maestrov2:', err);
  process.exit(1);
});
