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
    const d = XLSX.SSF.parse_date_code(rawDate);
    const y = d.y < 100 ? (d.y >= 50 ? 1900 + d.y : 2000 + d.y) : d.y;
    return `${y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
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

async function run() {
  console.log('--- 1. LEYENDO FINANZAS PERSONALES.XLSX ---');
  const excelPath = path.resolve('Finanzas Personales.xlsx');
  const buf = fs.readFileSync(excelPath);
  const workbook = XLSX.read(buf, { type: 'buffer' });
  const sheet = workbook.Sheets['Maestro'];
  const rawRows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  console.log(`Leídas ${rawRows.length} filas brutas de la hoja Maestro.`);

  const normalizedRows: any[] = [];
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
      normalizedRows.push({
        id: `tx-${idx + 1}`,
        Tipo: tipo === 'Ingreso' ? 'Ingreso' : 'Egreso',
        Fecha: fecha,
        Categoria: categoria,
        Concepto: concepto,
        Monto: monto,
        Entidad: entidad,
        Mes: mes,
      });
    }
  });

  console.log(`Transacciones válidas normalizadas: ${normalizedRows.length}`);

  console.log('--- 2. CONSULTANDO TRANSACCIONES ACTUALES EN SUPABASE ---');
  const { data: dbData, error: dbError } = await supabase
    .from('transacciones')
    .select('*');

  if (dbError) {
    console.error('Error al consultar Supabase:', dbError);
    return;
  }

  const existingTxs = dbData || [];
  console.log(`Registros actuales en Supabase: ${existingTxs.length}`);

  // Set de firmas únicas existentes: tipo|fecha|concepto|entidad|monto
  const signatureSet = new Set<string>();
  const idSet = new Set<string>();

  existingTxs.forEach(t => {
    idSet.add(t.id);
    const sig = `${(t.tipo || '').toLowerCase()}|${t.fecha}|${(t.concepto || '').trim().toLowerCase()}|${(t.entidad || '').trim().toLowerCase()}|${Number(t.monto).toFixed(2)}`;
    signatureSet.add(sig);
  });

  const newRecordsToInsert: any[] = [];
  let existingMatched = 0;

  normalizedRows.forEach((r, idx) => {
    const sig = `${r.Tipo.toLowerCase()}|${r.Fecha}|${r.Concepto.toLowerCase()}|${r.Entidad.toLowerCase()}|${r.Monto.toFixed(2)}`;
    if (!signatureSet.has(sig)) {
      // Generar id único si colisiona
      let newId = r.id;
      if (idSet.has(newId)) {
        newId = `tx-new-${Date.now()}-${idx}`;
      }
      newRecordsToInsert.push({
        id: newId,
        tipo: r.Tipo,
        fecha: r.Fecha,
        concepto: r.Concepto,
        categoria: r.Categoria,
        entidad: r.Entidad,
        monto: r.Monto,
        mes: r.Mes,
      });
      signatureSet.add(sig);
      idSet.add(newId);
    } else {
      existingMatched++;
    }
  });

  console.log(`Registros ya mapeados en Supabase (sin cambios): ${existingMatched}`);
  console.log(`Nuevos registros a insertar en Supabase: ${newRecordsToInsert.length}`);

  if (newRecordsToInsert.length > 0) {
    console.log('Insertando nuevos registros en Supabase en lotes...');
    const batchSize = 100;
    for (let i = 0; i < newRecordsToInsert.length; i += batchSize) {
      const batch = newRecordsToInsert.slice(i, i + batchSize);
      const { error: insErr } = await supabase.from('transacciones').insert(batch);
      if (insErr) {
        console.error(`Error en lote ${i}:`, insErr);
      } else {
        console.log(`Lote ${i + 1} - ${i + batch.length} insertado con éxito.`);
      }
    }
  }

  // Verificar total final
  const { data: finalData } = await supabase.from('transacciones').select('*');
  console.log(`\n🎉 Total consolidado final en Supabase: ${finalData?.length || 0} registros.`);

  console.log('--- 3. ACTUALIZANDO MASTERDATA.TS LOCALMENTE ---');
  const masterContent = `export interface Transaction {
  id: string;
  Tipo: 'Ingreso' | 'Egreso';
  Fecha: string;
  Categoria: string;
  Concepto: string;
  Monto: number;
  Entidad: string;
  Mes: string;
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

export const masterTransactions: Transaction[] = ${JSON.stringify(normalizedRows, null, 2)};
`;

  fs.writeFileSync(path.resolve('src/utils/masterData.ts'), masterContent, 'utf-8');
  console.log('Archivo src/utils/masterData.ts actualizado con los registros maestros.');
}

run().catch(console.error);
