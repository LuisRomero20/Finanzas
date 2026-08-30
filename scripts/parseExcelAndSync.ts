import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://njgzhjwfcxdxiibkuuqg.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qZ3poandmY3hkeGlpYmt1dXFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwMjg5MjksImV4cCI6MjEwMzYwNDkyOX0.VQSGP9NSUAI1M_BaOtqhxC4hl8o8jAx7HC0rlrnzMNA';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const excelPath = path.resolve('Finanzas Personales.xlsx');
const buf = fs.readFileSync(excelPath);
const workbook = XLSX.read(buf, { type: 'buffer' });

const sheet = workbook.Sheets['Maestro'];
const rawData: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });

console.log('Total raw rows:', rawData.length);
const categoriesFound = new Set<string>();
const entitiesFound = new Set<string>();
const tiposFound = new Set<string>();

rawData.forEach(row => {
  const cat = row['Categoría'] || row['Categoria'] || '';
  if (cat) categoriesFound.add(cat.trim());
  const ent = row['Entidad'] || '';
  if (ent) entitiesFound.add(ent.trim());
  const tipo = row['Tipo'] || '';
  if (tipo) tiposFound.add(tipo.trim());
});

console.log('Categories in Excel:', Array.from(categoriesFound));
console.log('Entities in Excel:', Array.from(entitiesFound));
console.log('Tipos in Excel:', Array.from(tiposFound));
console.log('\nFirst 5 parsed rows:');
console.log(rawData.slice(0, 5));
console.log('\nLast 5 parsed rows:');
console.log(rawData.slice(-5));
