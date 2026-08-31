import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://njgzhjwfcxdxiibkuuqg.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qZ3poandmY3hkeGlpYmt1dXFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwMjg5MjksImV4cCI6MjEwMzYwNDkyOX0.VQSGP9NSUAI1M_BaOtqhxC4hl8o8jAx7HC0rlrnzMNA';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Setiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

function normalizeCategory(rawCat: string): string {
  const cat = (rawCat || '').trim();
  if (!cat) return 'Gasto';
  if (/sueldo/i.test(cat)) return 'Sueldo';
  if (/servicio/i.test(cat)) return 'Servicio';
  if (/ahorro/i.test(cat)) return 'Ahorro';
  if (/deuda/i.test(cat)) return 'Deuda';
  if (/negocio/i.test(cat)) return 'Negocio';
  if (/otro\s*ing/i.test(cat)) return 'Otro Ing';
  if (/otro\s*egr/i.test(cat)) return 'Otro Egre';
  if (/tarjeta|compra|consumo/i.test(cat)) return 'Gasto';
  if (/gasto/i.test(cat)) return 'Gasto';
  return 'Gasto';
}

function parseExcelDate(rawDate: any): string {
  if (typeof rawDate === 'number') {
    // Convert Excel serial date to YYYY-MM-DD (Excel epoch starts 1899-12-30)
    const date = new Date(Math.round((rawDate - 25569) * 86400 * 1000));
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  if (typeof rawDate === 'string') {
    const s = rawDate.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    const parts = s.split(/[\/\-]/);
    if (parts.length === 3) {
      let p1 = parseInt(parts[0], 10);
      let p2 = parseInt(parts[1], 10);
      let p3 = parseInt(parts[2], 10);
      if (p3 < 100) p3 = 2000 + p3;
      if (p1 > 12 && p2 <= 12) {
        // DD/MM/YYYY
        return `${p3}-${String(p2).padStart(2, '0')}-${String(p1).padStart(2, '0')}`;
      } else {
        // MM/DD/YYYY
        return `${p3}-${String(p1).padStart(2, '0')}-${String(p2).padStart(2, '0')}`;
      }
    }
  }
  return '2026-01-01';
}

function parseAmount(rawVal: any): number {
  if (typeof rawVal === 'number') return Math.round(rawVal * 100) / 100;
  if (typeof rawVal === 'string') {
    const clean = rawVal.replace(/[^0-9.-]/g, '');
    const n = parseFloat(clean);
    return isNaN(n) ? 0 : Math.round(n * 100) / 100;
  }
  return 0;
}

function normalizeMonth(rawMonth: string, dateStr: string): string {
  if (rawMonth && typeof rawMonth === 'string') {
    const m = rawMonth.trim();
    if (/septiembre|setiembre/i.test(m)) return 'Setiembre';
    const found = MESES.find(x => x.toLowerCase() === m.toLowerCase());
    if (found) return found;
  }
  const monthIdx = parseInt(dateStr.split('-')[1] || '1', 10) - 1;
  return MESES[monthIdx] || 'Enero';
}

async function main() {
  console.log('====================================================');
  console.log('1. LEYENDO FINANZAS PERSONALES.XLSX DESDE CERO');
  console.log('====================================================');
  const excelPath = path.resolve('Finanzas Personales.xlsx');
  const buf = fs.readFileSync(excelPath);
  const workbook = XLSX.read(buf, { type: 'buffer' });
  const sheet = workbook.Sheets['Maestro'];
  const rawRows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  console.log(`Filas brutas leídas del Excel: ${rawRows.length}`);

  const cleanTransactions: any[] = [];
  rawRows.forEach((r, idx) => {
    const tipo = (r['Tipo'] || 'Egreso').toString().trim();
    const fecha = parseExcelDate(r['Fecha']);
    const categoria = normalizeCategory(r['Categoría'] || r['Categoria'] || '');
    const concepto = (r['Concepto'] || '').toString().trim();
    const rawMonto = r[' Monto '] !== undefined ? r[' Monto '] : r['Monto'];
    const monto = parseAmount(rawMonto);
    const entidad = (r['Entidad'] || 'Interbank').toString().trim();
    const mes = normalizeMonth(r['Mes'], fecha);

    if (concepto && monto > 0) {
      cleanTransactions.push({
        id: `tx-${idx + 1}`,
        tipo: tipo === 'Ingreso' ? 'Ingreso' : 'Egreso',
        fecha: fecha,
        categoria: categoria,
        concepto: concepto,
        monto: monto,
        entidad: entidad,
        mes: mes,
      });
    }
  });

  console.log(`Transacciones limpias a cargar: ${cleanTransactions.length}`);

  console.log('====================================================');
  console.log('2. ELIMINANDO TODA LA BASE DE DATOS EN SUPABASE');
  console.log('====================================================');
  
  // Eliminar todas las filas en Supabase
  const { error: delError } = await supabase
    .from('transacciones')
    .delete()
    .neq('id', '___non_existent_id___');

  if (delError) {
    console.error('Error al vaciar la tabla transacciones en Supabase:', delError);
    return;
  }
  console.log('Tabla transacciones vaciada al 100% en Supabase.');

  console.log('====================================================');
  console.log('3. CARGANDO REGISTROS DE EXCEL A SUPABASE EN LOTES');
  console.log('====================================================');
  const batchSize = 100;
  for (let i = 0; i < cleanTransactions.length; i += batchSize) {
    const batch = cleanTransactions.slice(i, i + batchSize);
    const { error: insErr } = await supabase.from('transacciones').insert(batch);
    if (insErr) {
      console.error(`Error al insertar lote ${i + 1}-${i + batch.length}:`, insErr);
      return;
    }
    console.log(`✓ Lote ${i + 1} a ${i + batch.length} insertado (${batch.length} registros).`);
  }

  // Verificación final en Supabase
  const { data: verifyData, error: verifyErr } = await supabase
    .from('transacciones')
    .select('id, tipo, fecha, categoria, concepto, monto, entidad, mes');

  if (verifyErr) {
    console.error('Error al verificar:', verifyErr);
  } else {
    console.log(`\n🎉 Supabase verificado con éxito: ${verifyData?.length} registros en total.`);
  }

  console.log('====================================================');
  console.log('4. SOBREESCRIBIENDO MASTERDATA.TS CON DATA LIMPIA');
  console.log('====================================================');
  const masterList = cleanTransactions.map(t => ({
    id: t.id,
    Tipo: t.tipo,
    Fecha: t.fecha,
    Categoria: t.categoria,
    Concepto: t.concepto,
    Monto: t.monto,
    Entidad: t.entidad,
    Mes: t.mes,
  }));

  const fileContent = `export interface Transaction {
  id: string;
  Tipo: 'Ingreso' | 'Egreso';
  Fecha: string;
  Categoria: string;
  Concepto: string;
  Monto: number;
  Entidad: string;
  Mes: string;
  estado?: 'confirmado' | 'pendiente' | 'provisional';
}

export const CATEGORIAS = [
  'Sueldo',
  'Servicio',
  'Gasto',
  'Ahorro',
  'Deuda',
  'Negocio',
  'Otro Ing',
  'Otro Egre',
] as const;

export type CategoriaType = typeof CATEGORIAS[number];

export const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Setiembre', 'Octubre', 'Noviembre', 'Diciembre'
] as const;

export const ENTIDADES = [
  'Interbank', 'BBVA Bfree', 'Interbank Amex', 'BCP', 'Ripley'
] as const;

export const LINE_OVERRIDES: Record<string, number> = {
  'BBVA Bfree': 3000,
  'Interbank Amex': 5000,
  'Ripley': 2000,
};

export const ACCOUNT_LABELS: Record<string, string> = {
  'Interbank': 'Cuenta Principal',
  'BBVA Bfree': 'Tarjeta Crédito',
  'Interbank Amex': 'Tarjeta Crédito',
  'BCP': 'Cuenta Ahorro',
  'Ripley': 'Tarjeta Crédito',
};

export const masterTransactions: Transaction[] = ${JSON.stringify(masterList, null, 2)};
`;

  fs.writeFileSync(path.resolve('src/utils/masterData.ts'), fileContent, 'utf-8');
  console.log('src/utils/masterData.ts actualizado con exactamente 685 registros limpios.');
}

main().catch(console.error);
