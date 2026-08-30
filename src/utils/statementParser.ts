import * as pdfjsLib from 'pdfjs-dist';
// Usar el worker local incluido en el bundle de Vite
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import * as XLSX from 'xlsx';
import type { Transaction } from './masterData';

// Configurar Worker de PDF.js usando la URL empaquetada por Vite
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
}

export interface StatementMovement {
  id: string;
  fecha: string; // YYYY-MM-DD
  concepto: string;
  monto: number;
  moneda: 'PEN' | 'USD';
  tipo: 'cargo' | 'abono';
  rawLine?: string;
}

export interface StatementData {
  entidadDetectada?: string;
  periodoInicio?: string;
  periodoFin?: string;
  fechaCorte?: string;
  fechaVencimiento?: string;
  deudaFinal: number; // Saldo al corte / Total a pagar / Pago del mes
  deudaFinalUSD?: number;
  pagoMinimo?: number;
  movimientos: StatementMovement[];
  textoCompleto: string;
  nombreArchivo: string;
}

export interface MatchResult {
  statementMovement: StatementMovement;
  appTransaction?: Transaction;
  status: 'matched' | 'statement_only' | 'app_only';
  difference?: number;
}

export interface ReconciliationReport {
  cardEntity: string;
  statementData: StatementData;
  appTransactions: Transaction[];
  totalStatementCargos: number;
  totalStatementAbonos: number;
  totalAppCargos: number;
  totalMatchedFinPer: number;
  deudaFinalEstadoCuenta: number;
  diferenciaGastos: number;
  matches: MatchResult[];
  unmatchedStatement: StatementMovement[];
  unmatchedApp: Transaction[];
}

const MONTH_MAP: Record<string, string> = {
  ene: '01', jan: '01', enero: '01',
  feb: '02', febrero: '02',
  mar: '03', marzo: '03',
  abr: '04', apr: '04', abril: '04',
  may: '05', mayo: '05',
  jun: '06', junio: '06',
  jul: '07', julio: '07',
  ago: '08', aug: '08', agosto: '08',
  set: '09', sep: '09', sept: '09', setiembre: '09', septiembre: '09',
  oct: '10', octubre: '10',
  nov: '11', noviembre: '11',
  dic: '12', dec: '12', diciembre: '12',
};

/**
 * Limpia y normaliza texto eliminando espacios extra y caracteres especiales
 */
function cleanText(text: string): string {
  return text.replace(/\r\n/g, '\n').replace(/[ \t]+/g, ' ').trim();
}

/**
 * Convierte strings como "1,234.56", "1.234,56", "S/ 120.00" a número flotante
 */
export function parseAmount(str: string): number {
  if (!str) return 0;
  let clean = str.replace(/(?:S\/\.?|US\$|\$|PEN|USD|EUR)\s*/gi, '').trim();

  // Si tiene signo negativo
  const isNegative = clean.startsWith('-') || clean.endsWith('-');

  if (clean.includes(',') && clean.includes('.')) {
    if (clean.lastIndexOf(',') > clean.lastIndexOf('.')) {
      clean = clean.replace(/\./g, '').replace(',', '.');
    } else {
      clean = clean.replace(/,/g, '');
    }
  } else if (clean.includes(',')) {
    if (/,\d{2}$/.test(clean.trim())) {
      clean = clean.replace(',', '.');
    } else {
      clean = clean.replace(/,/g, '');
    }
  }

  clean = clean.replace(/[^\d.]/g, '');
  const num = parseFloat(clean);
  if (isNaN(num)) return 0;
  return isNegative ? -Math.abs(num) : Math.abs(num);
}

/**
 * Normaliza fechas variadas (DD/MM/YYYY, DD-MM-YYYY, DD-Mmm, DD/MM) a formato ISO YYYY-MM-DD
 */
export function normalizeDate(dateStr: string, defaultYear = new Date().getFullYear()): string {
  const clean = dateStr.trim();

  // Formato: 23-Jul o 23-Jul-2026 o 23/Jul/2026
  const monthNameMatch = clean.match(/^(\d{1,2})[\/\-\s]([A-Za-z]{3,10})(?:[\/\-\s](\d{2,4}))?$/);
  if (monthNameMatch) {
    const day = monthNameMatch[1].padStart(2, '0');
    const monthStr = monthNameMatch[2].toLowerCase().slice(0, 3);
    const month = MONTH_MAP[monthStr] || '01';
    let year = monthNameMatch[3] || String(defaultYear);
    if (year.length === 2) year = '20' + year;
    return `${year}-${month}-${day}`;
  }

  // Formato: DD/MM/YYYY o DD-MM-YYYY
  const dmyMatch = clean.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    let year = dmyMatch[3];
    if (year.length === 2) year = '20' + year;
    return `${year}-${month}-${day}`;
  }

  // Formato: DD/MM
  const dmMatch = clean.match(/^(\d{1,2})[\/\-](\d{1,2})$/);
  if (dmMatch) {
    const day = dmMatch[1].padStart(2, '0');
    const month = dmMatch[2].padStart(2, '0');
    return `${defaultYear}-${month}-${day}`;
  }

  return clean;
}

/**
 * Detecta qué entidad bancaria corresponde según el texto del documento
 */
export function detectBankEntity(text: string): string | undefined {
  const lower = text.toLowerCase();
  if (lower.includes('interbank') || lower.includes('amex') || lower.includes('american express')) {
    return 'Interbank Amex';
  }
  if (lower.includes('bbva') || lower.includes('bfree') || lower.includes('continental')) {
    return 'BBVA Bfree';
  }
  if (lower.includes('ripley') || lower.includes('banco ripley')) {
    return 'Ripley';
  }
  if (lower.includes('bcp') || lower.includes('banco de credito') || lower.includes('banco de crédito')) {
    return 'BCP';
  }
  if (lower.includes('scotiabank')) {
    return 'Scotiabank';
  }
  return undefined;
}

/**
 * Extrae texto de un archivo PDF usando pdfjs-dist con soporte de contraseña
 */
export async function extractTextFromPDF(file: File | ArrayBuffer, password?: string): Promise<string> {
  let arrayBuffer: ArrayBuffer;
  if (file instanceof File) {
    arrayBuffer = await file.arrayBuffer();
  } else {
    arrayBuffer = file;
  }

  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    password: password || undefined,
  });

  try {
    const pdfDoc = await loadingTask.promise;
    let fullText = '';

    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      const items = textContent.items as Array<{ str: string; transform: number[] }>;
      if (items.length === 0) continue;

      let lastY: number | null = null;
      let pageText = '';

      for (const item of items) {
        if ('str' in item) {
          const currentY = item.transform[5];
          if (lastY !== null && Math.abs(currentY - lastY) > 4) {
            pageText += '\n';
          } else if (pageText.length > 0 && !pageText.endsWith('\n') && !pageText.endsWith(' ')) {
            pageText += ' ';
          }
          pageText += item.str;
          lastY = currentY;
        }
      }
      fullText += pageText + '\n--- PAGE BREAK ---\n';
    }

    return fullText;
  } catch (error: any) {
    if (error?.name === 'PasswordException' || error?.message?.toLowerCase().includes('password')) {
      throw new Error('PASSWORD_REQUIRED');
    }
    throw error;
  }
}

/**
 * Extrae texto y filas de un archivo Excel o CSV
 */
export async function extractTextFromExcel(file: File): Promise<{ text: string; rows: any[][] }> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  let fullText = '';
  const allRows: any[][] = [];

  workbook.SheetNames.forEach(sheetName => {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
    fullText += `=== Hoja: ${sheetName} ===\n`;
    rows.forEach(r => {
      if (r && r.length > 0) {
        allRows.push(r);
        fullText += r.join(' | ') + '\n';
      }
    });
  });

  return { text: fullText, rows: allRows };
}

/**
 * Analiza el texto extraído para obtener datos del estado de cuenta
 */
export function parseStatementText(text: string, fileName: string): StatementData {
  const cleaned = cleanText(text);
  const detectedEntity = detectBankEntity(cleaned);

  let deudaFinal = 0;
  let deudaFinalUSD = 0;
  let pagoMinimo = 0;
  let periodoInicio: string | undefined;
  let periodoFin: string | undefined;
  let fechaCorte: string | undefined;
  let fechaVencimiento: string | undefined;
  let referenceYear = new Date().getFullYear();

  // 1. Extraer Fechas del Ciclo / Periodo / Vencimiento
  const interbankPeriodMatch = cleaned.match(/del\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\s*(?:al\s*cierre\s*de|al|a|-)\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i);
  if (interbankPeriodMatch) {
    periodoInicio = normalizeDate(interbankPeriodMatch[1]);
    periodoFin = normalizeDate(interbankPeriodMatch[2]);
    fechaCorte = periodoFin;
    const yearMatch = periodoFin.match(/^(\d{4})/);
    if (yearMatch) referenceYear = parseInt(yearMatch[1], 10);
  }

  const vencMatch = cleaned.match(/(?:[uú]ltimo\s*d[ií]a\s*de\s*pago|fecha\s*l[ií]mite\s*de\s*pago|fecha\s*de\s*pago|vence|vencimiento)\s*[:=]?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i);
  if (vencMatch) {
    fechaVencimiento = normalizeDate(vencMatch[1], referenceYear);
  }

  if (!fechaCorte) {
    const corteMatch = cleaned.match(/(?:fecha\s*de\s*corte|corte\s*al|cierre\s*de)\s*[:=]?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i);
    if (corteMatch) {
      fechaCorte = normalizeDate(corteMatch[1], referenceYear);
    }
  }

  // 2. Extraer Pago Mínimo
  const minSubtotalMatch = cleaned.match(/PAGO\s+M[IÍ]NIMO(?:\s+DEL\s+MES)?[\s\S]{0,100}?=\s*([\d,.]+\.\d{2})/i);
  if (minSubtotalMatch) {
    pagoMinimo = Math.abs(parseAmount(minSubtotalMatch[1]));
  }
  if (pagoMinimo === 0) {
    const minGenericMatch = cleaned.match(/PAGO\s+M[IÍ]NIMO[\s\S]{0,60}?(?:S\/\.?|PEN|\$)?\s*([\d,.]+\.\d{2})/i);
    if (minGenericMatch) {
      pagoMinimo = Math.abs(parseAmount(minGenericMatch[1]));
    }
  }

  // 3. Parsear Líneas de Movimientos
  const movimientos: StatementMovement[] = [];
  const lines = text.split('\n');

  const interbankTxRegex = /^(\d{1,2}\s*[\-\/]\s*[A-Za-z]{3,4})\s+([A-Za-z0-9\.\-\_\s\*\/\&]+?)\s+([\-]?(?:S\/\.?|USD|\$)?\s*[\d,.]+\d{2})(?:\s+([\-]?(?:S\/\.?|USD|\$)?\s*[\d,.]+\d{2}))?$/i;
  const standardTxRegex = /(?:^|\s)(\d{1,2}[\/\-\.]\d{1,2}(?:[\/\-\.]\d{2,4})?)\s+([A-Za-z0-9\.\-\_\s\*\/\&]{3,45})\s+(?:(S\/\.?|USD|\$)\s*)?([\-]?[0-9,.]+\d{2})([\s\-]*(?:CR|ABONO|\+)?)?/i;

  let moveId = 1;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('---') || trimmed.startsWith('===')) continue;

    if (/^(subtotal|pago del mes|pago m[ií]nimo|total a pagar|deuda total|tu estado de cuenta|deb[ií]as|romero|fecha comercio|saldo|l[ií]nea de cr[eé]dito)/i.test(trimmed)) {
      continue;
    }

    // 1) Probar formato Interbank (23-Jul Comercio MontoPEN MontoUSD)
    const ibMatch = trimmed.match(interbankTxRegex);
    if (ibMatch) {
      const rawDate = ibMatch[1].replace(/\s+/g, '-');
      const rawConcepto = ibMatch[2].trim();
      const rawAmountSoles = ibMatch[3];

      if (!/^(fecha|comercio|subtotal|total|pagina|tarjeta|l[ií]nea)/i.test(rawConcepto)) {
        const monto = parseAmount(rawAmountSoles);
        const esAbono = monto < 0 || /pago|abono|cr|\+/i.test(rawConcepto);

        movimientos.push({
          id: `stmt-${moveId++}`,
          fecha: normalizeDate(rawDate, referenceYear),
          concepto: rawConcepto,
          monto: Math.abs(monto),
          moneda: 'PEN',
          tipo: esAbono ? 'abono' : 'cargo',
          rawLine: trimmed,
        });
        continue;
      }
    }

    // 2) Probar formato estándar
    const stdMatch = trimmed.match(standardTxRegex);
    if (stdMatch) {
      const rawDate = stdMatch[1];
      const concepto = stdMatch[2].trim();
      const currencySymbol = stdMatch[3] || 'S/';
      const rawAmount = stdMatch[4];
      const suffix = stdMatch[5] || '';

      if (!/^(fecha|operacion|movimiento|detalle|descripcion|pagina|tarjeta|estado de cuenta|subtotal|l[ií]nea)/i.test(concepto)) {
        const monto = parseAmount(rawAmount);
        if (Math.abs(monto) > 0) {
          const esAbono = monto < 0 || /abono|pago|cr|\+/i.test(suffix) || /pago\s+de\s+tarjeta|abono/i.test(concepto);
          const moneda = currencySymbol.includes('$') || currencySymbol.toUpperCase().includes('USD') ? 'USD' : 'PEN';

          movimientos.push({
            id: `stmt-${moveId++}`,
            fecha: normalizeDate(rawDate, referenceYear),
            concepto: concepto.replace(/\s+/g, ' '),
            monto: Math.abs(monto),
            moneda,
            tipo: esAbono ? 'abono' : 'cargo',
            rawLine: trimmed,
          });
        }
      }
    }
  }

  // 4. Extraer Deuda Final / Pago del Mes (Excluyendo línea de crédito o saldo disponible)
  
  // a) PAGO DEL MES (Suma de subtotales) = 751.89
  const matchPdmSub = cleaned.match(/PAGO\s+DEL\s+MES\s*\(Suma\s+de\s+subtotales\)[^=]*=\s*([\d,.]+\.\d{2})/i);
  if (matchPdmSub) {
    deudaFinal = Math.abs(parseAmount(matchPdmSub[1]));
  }

  // b) PAGO DEL MES S/ 751.89
  if (deudaFinal === 0) {
    const matchPdm = cleaned.match(/PAGO\s+DEL\s+MES[\s\S]{0,40}?(?:S\/\.?|PEN|\$)\s*([\d,.]+\.\d{2})/i);
    if (matchPdm) {
      deudaFinal = Math.abs(parseAmount(matchPdm[1]));
    }
  }

  // c) tu Deuda Total* es S/ 751.89
  if (deudaFinal === 0) {
    const matchDeudaTot = cleaned.match(/(?:tu\s+)?Deuda\s+Total\*?\s+es\s*(?:S\/\.?|PEN|\$)?\s*([\d,.]+\.\d{2})/i);
    if (matchDeudaTot) {
      const v = Math.abs(parseAmount(matchDeudaTot[1]));
      if (v > 0 && v !== 1000) deudaFinal = v;
    }
  }

  // d) Si la deuda final coincide exactamente con la suma de cargos o es 0/1000, usar la suma de cargos del estado de cuenta
  const sumCargos = movimientos.filter(m => m.tipo === 'cargo').reduce((s, m) => s + m.monto, 0);
  if (sumCargos > 0) {
    if (deudaFinal === 0 || deudaFinal === 1000 || Math.abs(deudaFinal - sumCargos) < 0.05) {
      deudaFinal = Number(sumCargos.toFixed(2));
    }
  }

  return {
    entidadDetectada: detectedEntity,
    periodoInicio,
    periodoFin,
    fechaCorte,
    fechaVencimiento,
    deudaFinal,
    deudaFinalUSD,
    pagoMinimo,
    movimientos,
    textoCompleto: text,
    nombreArchivo: fileName,
  };
}

/**
 * Algoritmo de comparación y conciliación entre el estado de cuenta y las transacciones de FinPer
 */
export function reconcileStatement(
  statementData: StatementData,
  appTransactions: Transaction[],
  cardEntity: string
): ReconciliationReport {
  const matches: MatchResult[] = [];
  const usedAppIds = new Set<string>();

  // Rango de fechas del ciclo del estado de cuenta
  const startStr = statementData.periodoInicio;
  const endStr = statementData.fechaCorte || statementData.periodoFin;

  // Filtrar SOLO transacciones de la tarjeta que correspondan al ciclo del estado de cuenta
  const cardAppTxs = appTransactions.filter(t => {
    const matchEntity = t.Entidad === cardEntity || 
      (cardEntity.includes('Interbank') && (t.Entidad === 'Interbank' || t.Entidad === 'Interbank Amex')) ||
      (cardEntity.includes('BBVA') && t.Entidad.includes('BBVA')) ||
      (cardEntity.includes('Ripley') && t.Entidad.includes('Ripley'));
    
    if (!matchEntity || t.Tipo !== 'Egreso') return false;

    if (startStr && endStr) {
      const txFecha = t.Fecha.slice(0, 10);
      return txFecha >= startStr && txFecha <= endStr;
    }

    return true;
  });

  const statementCargos = statementData.movimientos.filter(m => m.tipo === 'cargo');
  const statementAbonos = statementData.movimientos.filter(m => m.tipo === 'abono');

  const totalStatementCargos = statementCargos.reduce((s, m) => s + m.monto, 0);
  const totalStatementAbonos = statementAbonos.reduce((s, m) => s + m.monto, 0);
  const totalAppCargos = cardAppTxs.reduce((s, t) => s + t.Monto, 0);

  let totalMatchedFinPer = 0;

  for (const stmtMove of statementCargos) {
    let bestMatch: Transaction | null = null;
    let minScore = Infinity;

    for (const appTx of cardAppTxs) {
      if (usedAppIds.has(appTx.id)) continue;

      const diffMonto = Math.abs(stmtMove.monto - appTx.Monto);
      if (diffMonto <= 0.05) {
        let dateScore = 10;
        try {
          const d1 = new Date(stmtMove.fecha).getTime();
          const d2 = new Date(appTx.Fecha).getTime();
          const diffDays = Math.abs(d1 - d2) / (1000 * 60 * 60 * 24);
          if (!isNaN(diffDays)) {
            dateScore = Math.min(diffDays, 10);
          }
        } catch {
          dateScore = 5;
        }

        const c1 = stmtMove.concepto.toLowerCase();
        const c2 = appTx.Concepto.toLowerCase();
        const conceptBonus = c1.includes(c2) || c2.includes(c1) ? -5 : 0;

        const totalScore = diffMonto * 10 + dateScore + conceptBonus;
        if (totalScore < minScore) {
          minScore = totalScore;
          bestMatch = appTx;
        }
      }
    }

    if (bestMatch && minScore <= 15) {
      usedAppIds.add(bestMatch.id);
      totalMatchedFinPer += bestMatch.Monto;
      matches.push({
        statementMovement: stmtMove,
        appTransaction: bestMatch,
        status: 'matched',
        difference: Math.abs(stmtMove.monto - bestMatch.Monto),
      });
    } else {
      matches.push({
        statementMovement: stmtMove,
        status: 'statement_only',
        difference: stmtMove.monto,
      });
    }
  }

  const unmatchedStatement = matches
    .filter(m => m.status === 'statement_only')
    .map(m => m.statementMovement);

  const unmatchedApp = cardAppTxs.filter(t => !usedAppIds.has(t.id));

  for (const appTx of unmatchedApp) {
    matches.push({
      statementMovement: {
        id: `app-${appTx.id}`,
        fecha: appTx.Fecha,
        concepto: appTx.Concepto,
        monto: appTx.Monto,
        moneda: 'PEN',
        tipo: 'cargo',
      },
      appTransaction: appTx,
      status: 'app_only',
      difference: appTx.Monto,
    });
  }

  const deudaFinalEstadoCuenta = statementData.deudaFinal > 0
    ? statementData.deudaFinal
    : totalStatementCargos;

  const diferenciaGastos = deudaFinalEstadoCuenta - totalMatchedFinPer;

  return {
    cardEntity,
    statementData,
    appTransactions: cardAppTxs,
    totalStatementCargos,
    totalStatementAbonos,
    totalAppCargos,
    totalMatchedFinPer,
    deudaFinalEstadoCuenta,
    diferenciaGastos,
    matches,
    unmatchedStatement,
    unmatchedApp,
  };
}
