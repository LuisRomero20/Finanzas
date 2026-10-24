import { create } from 'zustand';
import { masterTransactions } from '../utils/masterData';
import { useFinanceStore } from './financeStore';
import { useCreditCardStore } from './creditCardStore';
import { supabase } from '../lib/supabase';
import { decodeLegacyProjections } from '../utils/legacyProjections';
import { allocateMoney } from '../domain/finance/money';
import { calculateBillingCycle, formatDateOnly } from '../domain/cards/billingCycles';
import {
  calculateMultiHorizonProjection,
  getHorizonMonthList,
  type MultiHorizonProjectionResult,
  type ProjectionHorizonMonths,
  type RawProjectionInputItem,
} from '../domain/projections/multiHorizon';


export type ProjectedRecurrence = 'fijo' | 'temporal' | 'unico';

export interface MonthException {
  suprimido?: boolean;
  montoModificado?: number;
  diaModificado?: number;
}

export interface ProjectedItem {
  id: string;
  tipo: 'Ingreso' | 'Egreso';
  categoria: string;
  concepto: string;
  monto: number;
  entidad: string;
  dia: number; // 1 a 31
  mesInicio: string; // Formato 'YYYY-MM', ej. '2026-10'
  recurrencia: ProjectedRecurrence;
  mesesDuracion?: number; // Si es temporal (ej. 3 meses)
  excepciones?: Record<string, MonthException>; // Clave: 'YYYY-MM'
  cuotas?: number;
  montoTotal?: number;
}

export interface CardCycleDueDetail {
  entity: string;
  totalAPagar: number;
  fechaPago: string; // 'YYYY-MM-DD'
  diaPago: number;
  periodoFacturado: string;
  consumos: Array<{
    id: string;
    fecha: string;
    concepto: string;
    monto: number;
    categoria: string;
    origen: 'Histórico Maestro' | 'Proyección';
  }>;
}

export interface EffectiveProjectedRow {
  id: string;
  itemId: string;
  tipo: 'Ingreso' | 'Egreso';
  fecha: string; // 'YYYY-MM-DD'
  categoria: string;
  concepto: string;
  monto: number;
  montoOriginal: number;
  entidad: string;
  recurrencia: ProjectedRecurrence;
  esFijo: boolean;
  esTemporal: boolean;
  esUnico: boolean;
  esModificado: boolean;
  esTarjetaCredito: boolean;
  esPagoLiquidacionTarjeta?: boolean;
  tarjetaLiquidada?: string;
  detalleConsumosCiclo?: CardCycleDueDetail['consumos'];
  mesPagoTarjeta?: string; // Formato 'YYYY-MM'
  fechaPagoTarjeta?: string; // Formato 'YYYY-MM-DD'
  // ── Triple Fecha Explícita (FINPER 2.1) ──
  fechaConsumo: string; // 'YYYY-MM-DD' fecha programada del consumo
  mesConsumo: string; // 'YYYY-MM'
  cicloFacturacion?: string; // ej. '10/10 — 09/11'
  fechaCorteTarjeta?: string; // 'YYYY-MM-DD'
  fechaPagoEfectiva: string; // 'YYYY-MM-DD' fecha en que sale dinero de caja/banco
  mesImpactoCaja: string; // 'YYYY-MM'
  desfaseMesesCaja: number; // 0 = mismo mes, 1 = mes siguiente, 2 = cruza corte
}

export interface CardCycleRule {
  entity: string;
  corteDay: number;
  pagoDay: number;
}

export const CARD_RULES: Record<string, CardCycleRule> = {
  'Interbank Amex': { entity: 'Interbank Amex', corteDay: 21, pagoDay: 15 },
  'BBVA Bfree': { entity: 'BBVA Bfree', corteDay: 10, pagoDay: 5 },
  'Ripley': { entity: 'Ripley', corteDay: 3, pagoDay: 1 },
};

export function resolveCardRule(entity: string): CardCycleRule | undefined {
  try {
    const found = useCreditCardStore.getState().getCardByEntity(entity);
    if (found) return { entity: found.entity, corteDay: found.cycleStartDay, pagoDay: found.paymentDay };
  } catch {
    // El store puede no estar inicializado durante SSR o pruebas puras.
  }
  return CARD_RULES[entity];
}

/**
 * Calcula la fecha y mes exacto en que se debe pagar un consumo de tarjeta de crédito
 * considerando el día de corte y el día límite de pago.
 * 
 * Regla:
 * - Si el consumo es ANTES del corte (día < corteDay): pertenece al ciclo actual y se paga el mes siguiente (mes + 1).
 * - Si el consumo es EL DÍA DEL CORTE O DESPUÉS (día >= corteDay): pertenece al nuevo ciclo y se paga 2 meses después (mes + 2).
 *   Ejemplo BBVA (corte 10, pago 5): Consumo antes del 10 se paga el 5 del mes siguiente; del 10 en adelante se paga en 2 meses.
 */
export interface CardPaymentDateResult {
  mesPago: string;
  fechaPago: string;
  cicloDescripcion: string;
  pagaEnMesSiguiente: boolean;
  periodoFacturado: string;
  fechaCorte: string;
  desfaseMeses: number;
}

export function calculateCardPaymentDate(entity: string, year: number, monthIndex: number, day: number): CardPaymentDateResult {
  const purchaseDate = formatDateOnly(year, monthIndex + 1, day);
  const rule = resolveCardRule(entity);
  if (!rule) {
    return { 
      mesPago: purchaseDate.slice(0, 7),
      fechaPago: purchaseDate,
      cicloDescripcion: 'Sin ciclo de tarjeta',
      pagaEnMesSiguiente: false,
      periodoFacturado: 'Sin ciclo',
      fechaCorte: purchaseDate,
      desfaseMeses: 0,
    };
  }
  const cycle = calculateBillingCycle(purchaseDate, { cutoffDay: rule.corteDay, dueDay: rule.pagoDay });
  const beforeCutoff = day < rule.corteDay;
  const [pY, pM] = [year, monthIndex + 1];
  const [dY, dM] = cycle.billingMonth.split('-').map(Number);
  const desfaseMeses = Math.max(0, (dY * 12 + dM) - (pY * 12 + pM));
  const periodoFacturado = `${cycle.periodStart.slice(8, 10)}/${cycle.periodStart.slice(5, 7)} — ${cycle.periodEnd.slice(8, 10)}/${cycle.periodEnd.slice(5, 7)}`;

  return {
    mesPago: cycle.billingMonth,
    fechaPago: cycle.dueDate,
    cicloDescripcion: beforeCutoff
      ? `Antes del corte (día ${rule.corteDay}) · Paga mes siguiente`
      : `Corte día ${rule.corteDay} (nuevo ciclo) · Paga en 2 meses`,
    pagaEnMesSiguiente: beforeCutoff,
    periodoFacturado,
    fechaCorte: cycle.periodEnd,
    desfaseMeses,
  };
}

export interface CardInstallmentSchedule {
  cuotaNumber: number; // 1, 2, ...
  totalCuotas: number;
  mesPago: string; // 'YYYY-MM'
  fechaPago: string; // 'YYYY-MM-DD'
  montoCuota: number;
  mesLabel: string; // e.g. 'Noviembre 2026'
}

/**
 * Calcula el cronograma completo de cuotas para una compra con tarjeta de crédito,
 * determinando el primer mes de facturación según el día de corte y proyectando
 * las cuotas mes a mes con el día de pago respectivo.
 */
export function calculateCardInstallmentSchedule(
  entity: string,
  purchaseDateStr: string, // 'YYYY-MM-DD'
  totalAmount: number,
  cuotas: number
): CardInstallmentSchedule[] {
  if (cuotas <= 0 || totalAmount <= 0) return [];
  const parts = purchaseDateStr.split('-').map(Number);
  if (parts.length < 3) return [];
  const [y, m, d] = parts;

  const firstPayInfo = calculateCardPaymentDate(entity, y, m - 1, d);
  const [startPayY, startPayM] = firstPayInfo.mesPago.split('-').map(Number);

  const rule = resolveCardRule(entity);
  const payDay = rule ? rule.pagoDay : 5;
  const installmentAmounts = allocateMoney(totalAmount, cuotas);
  const schedule: CardInstallmentSchedule[] = [];

  const MESES_NOMBRES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Setiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  for (let k = 1; k <= cuotas; k++) {
    let payY = startPayY;
    let payM = startPayM + (k - 1);
    while (payM > 12) {
      payM -= 12;
      payY++;
    }
    const fechaPago = formatDateOnly(payY, payM, payDay);
    const mesPago = fechaPago.slice(0, 7);
    const montoCuota = installmentAmounts[k - 1];

    const mesLabel = `${MESES_NOMBRES[payM - 1]} ${payY}`;

    schedule.push({
      cuotaNumber: k,
      totalCuotas: cuotas,
      mesPago,
      fechaPago,
      montoCuota,
      mesLabel,
    });
  }

  return schedule;
}

/**
 * Calcula el detalle y la suma total de consumos que vencen para pagarse en targetMonthStr ('YYYY-MM')
 * para una tarjeta de crédito específica (BBVA Bfree, Interbank Amex, Ripley).
 * 
 * Agrega tanto las compras reales del histórico (masterTransactions) como los consumos proyectados,
 * procesando compras al contado y dividiendo compras en cuotas en sus respectivos meses de pago.
 */
export function getCardDueDetailsForMonth(
  entity: string,
  targetMonthStr: string,
  projectedItems: ProjectedItem[] = []
): CardCycleDueDetail {
  const rule = CARD_RULES[entity];
  if (!rule) {
    return {
      entity,
      totalAPagar: 0,
      fechaPago: `${targetMonthStr}-01`,
      diaPago: 1,
      periodoFacturado: '-',
      consumos: [],
    };
  }

  const [targetYear, targetMonth] = targetMonthStr.split('-').map(Number);
  const padPayDay = String(rule.pagoDay).padStart(2, '0');
  const fechaPago = `${targetMonthStr}-${padPayDay}`;

  const consumos: CardCycleDueDetail['consumos'] = [];
  const seenKeys = new Set<string>();

  // 1. Transacciones reales registradas en lista maestra (Supabase / local)
  const rawTxs = useFinanceStore?.getState?.()?.transactions;
  const sourceTransactions = Array.isArray(rawTxs) ? rawTxs : masterTransactions;
  sourceTransactions.forEach((t) => {
    if (t.Entidad === entity && t.Tipo === 'Egreso') {
      const parts = t.Fecha.split('-').map(Number);
      if (parts.length === 3) {
        const y = parts[0];
        const mIndex = parts[1] - 1;
        const d = parts[2];

        // Verificar si la compra se realizó en cuotas
        let numCuotas = (t.cuotas && t.cuotas > 1) ? t.cuotas : 1;
        if (numCuotas === 1 && t.Concepto) {
          const match = t.Concepto.match(/\[(\d+)\s*cuotas?\]|\((\d+)\s*cuotas?\)/i);
          if (match) numCuotas = parseInt(match[1] || match[2], 10);
        }

        if (numCuotas > 1) {
          // Procesamiento de compra en cuotas
          const schedule = calculateCardInstallmentSchedule(entity, t.Fecha, t.Monto, numCuotas);
          const activeCuota = schedule.find(s => s.mesPago === targetMonthStr);
          if (activeCuota) {
            const cleanConcept = t.Concepto.replace(/\s*\[\d+\s*cuotas?\]|\(\d+\s*cuotas?\)/gi, '').trim();
            const key = `${t.Fecha}-${cleanConcept}-cuota-${activeCuota.cuotaNumber}-${numCuotas}`;
            if (!seenKeys.has(key)) {
              seenKeys.add(key);
              consumos.push({
                id: `master-${t.id || t.Fecha}-cuota-${activeCuota.cuotaNumber}`,
                fecha: t.Fecha,
                concepto: `${cleanConcept} (Cuota ${activeCuota.cuotaNumber}/${numCuotas})`,
                monto: activeCuota.montoCuota,
                categoria: t.Categoria,
                origen: 'Histórico Maestro',
              });
            }
          }
        } else {
          // Compra regular al contado (1 cuota)
          const payInfo = calculateCardPaymentDate(entity, y, mIndex, d);
          if (payInfo.mesPago === targetMonthStr) {
            const key = `${t.Fecha}-${t.Concepto}-${t.Monto}`;
            if (!seenKeys.has(key)) {
              seenKeys.add(key);
              consumos.push({
                id: `master-${t.id || key}`,
                fecha: t.Fecha,
                concepto: t.Concepto,
                monto: t.Monto,
                categoria: t.Categoria,
                origen: 'Histórico Maestro',
              });
            }
          }
        }
      }
    }
  });

  // 2. Partidas proyectadas
  for (const item of projectedItems) {
    if (item.entidad === entity && item.tipo === 'Egreso') {
      // Partida proyectada en cuotas
      if (item.cuotas && item.cuotas > 1) {
        const [startYear, startMonth] = item.mesInicio.split('-').map(Number);
        const padD = String(item.dia).padStart(2, '0');
        const purchaseDateStr = `${startYear}-${String(startMonth).padStart(2, '0')}-${padD}`;
        const totalAmount = item.montoTotal ?? (item.monto * item.cuotas);
        const schedule = calculateCardInstallmentSchedule(entity, purchaseDateStr, totalAmount, item.cuotas);
        const activeCuota = schedule.find(s => s.mesPago === targetMonthStr);
        if (activeCuota) {
          const key = `proj-cuota-${item.id}-${activeCuota.cuotaNumber}`;
          if (!seenKeys.has(key)) {
            seenKeys.add(key);
            consumos.push({
              id: key,
              fecha: activeCuota.fechaPago,
              concepto: `${item.concepto} (Cuota ${activeCuota.cuotaNumber}/${item.cuotas})`,
              monto: activeCuota.montoCuota,
              categoria: item.categoria,
              origen: 'Proyección',
            });
          }
        }
      } else {
        // Partida proyectada regular
        for (let offset = 1; offset <= 2; offset++) {
          let sourceMonthVal = targetMonth - offset;
          let sourceYear = targetYear;
          while (sourceMonthVal < 1) {
            sourceMonthVal += 12;
            sourceYear--;
          }
          const sourceMonthStr = `${sourceYear}-${String(sourceMonthVal).padStart(2, '0')}`;

          const [startYear, startMonth] = item.mesInicio.split('-').map(Number);
          const startDateVal = startYear * 12 + (startMonth - 1);
          const sourceDateVal = sourceYear * 12 + (sourceMonthVal - 1);

          if (sourceDateVal >= startDateVal) {
            const monthsDiff = sourceDateVal - startDateVal;
            if (item.recurrencia === 'unico' && monthsDiff !== 0) continue;
            if (item.recurrencia === 'temporal' && monthsDiff >= (item.mesesDuracion || 1)) continue;

            const excepcion = item.excepciones?.[sourceMonthStr];
            if (excepcion?.suprimido) continue;

            const activeDay = excepcion?.diaModificado ?? item.dia;
            const activeAmount = excepcion?.montoModificado ?? item.monto;
            const payInfo = calculateCardPaymentDate(entity, sourceYear, sourceMonthVal - 1, activeDay);

            if (payInfo.mesPago === targetMonthStr) {
              const padD = String(activeDay).padStart(2, '0');
              const consDate = `${sourceYear}-${String(sourceMonthVal).padStart(2, '0')}-${padD}`;
              const key = `${consDate}-${item.concepto}-${activeAmount}`;
              if (!seenKeys.has(key)) {
                seenKeys.add(key);
                consumos.push({
                  id: `proj-${item.id}-${sourceMonthStr}`,
                  fecha: consDate,
                  concepto: item.concepto,
                  monto: activeAmount,
                  categoria: item.categoria,
                  origen: 'Proyección',
                });
              }
            }
          }
        }
      }
    }
  }

  // Ordenar consumos cronológicamente
  consumos.sort((a, b) => a.fecha.localeCompare(b.fecha));

  const totalAPagar = consumos.reduce((s, c) => s + c.monto, 0);

  // Calcular rango del ciclo
  let startCycleMonth = targetMonth - 2;
  // startCycleYear
  if (startCycleMonth < 1) {
    startCycleMonth += 12;
    // year shift
  }
  let endCycleMonth = targetMonth - 1;
  // endCycleYear
  if (endCycleMonth < 1) {
    endCycleMonth += 12;
    // year shift
  }
  const periodoFacturado = `${String(rule.corteDay).padStart(2, '0')}/${String(startCycleMonth).padStart(2, '0')} — ${String(rule.corteDay - 1).padStart(2, '0')}/${String(endCycleMonth).padStart(2, '0')}`;

  return {
    entity,
    totalAPagar: Math.round(totalAPagar * 100) / 100,
    fechaPago,
    diaPago: rule.pagoDay,
    periodoFacturado,
    consumos,
  };
}

// Plantilla inicial basada en la estructura real del usuario (Octubre 2026)
export const INITIAL_PROJECTIONS: ProjectedItem[] = [
  {
    id: 'proj-1',
    tipo: 'Ingreso',
    categoria: 'Otro Ing',
    concepto: 'Bonificación Ahorro',
    monto: 0.0,
    entidad: 'Interbank',
    dia: 1,
    mesInicio: '2026-10',
    recurrencia: 'fijo',
  },
  {
    id: 'proj-2',
    tipo: 'Ingreso',
    categoria: 'Sueldo',
    concepto: 'Sueldo',
    monto: 2375.30,
    entidad: 'Interbank',
    dia: 1,
    mesInicio: '2026-10',
    recurrencia: 'fijo',
  },
  {
    id: 'proj-3',
    tipo: 'Egreso',
    categoria: 'Servicio',
    concepto: 'Spotify',
    monto: 12.0,
    entidad: 'Interbank Amex',
    dia: 1,
    mesInicio: '2026-10',
    recurrencia: 'fijo',
  },
  {
    id: 'proj-4',
    tipo: 'Egreso',
    categoria: 'Servicio',
    concepto: 'Internet',
    monto: 79.0,
    entidad: 'BBVA Bfree',
    dia: 1,
    mesInicio: '2026-10',
    recurrencia: 'fijo',
  },
  {
    id: 'proj-5',
    tipo: 'Egreso',
    categoria: 'Servicio',
    concepto: 'Gas',
    monto: 50.0,
    entidad: 'BBVA Bfree',
    dia: 1,
    mesInicio: '2026-10',
    recurrencia: 'fijo',
    excepciones: { '2026-10': { montoModificado: 41.80 } },
  },
  {
    id: 'proj-6',
    tipo: 'Egreso',
    categoria: 'Servicio',
    concepto: 'Corte de Cabello',
    monto: 20.0,
    entidad: 'Interbank',
    dia: 1,
    mesInicio: '2026-10',
    recurrencia: 'fijo',
  },
  {
    id: 'proj-7',
    tipo: 'Egreso',
    categoria: 'Tecnología & Gadgets',
    concepto: 'iPhone 16',
    monto: 246.75,
    entidad: 'Interbank',
    dia: 1,
    mesInicio: '2026-10',
    recurrencia: 'fijo',
  },
  {
    id: 'proj-8',
    tipo: 'Egreso',
    categoria: 'Servicio',
    concepto: 'Pago de Tarjeta Ripley',
    monto: 374.82,
    entidad: 'Interbank',
    dia: 1,
    mesInicio: '2026-10',
    recurrencia: 'fijo',
    excepciones: { '2026-10': { montoModificado: 374.82 } },
  },
  {
    id: 'proj-9',
    tipo: 'Egreso',
    categoria: 'Deuda',
    concepto: 'Prestamo Yape',
    monto: 116.85,
    entidad: 'Interbank',
    dia: 1,
    mesInicio: '2026-10',
    recurrencia: 'fijo',
  },
  {
    id: 'proj-10',
    tipo: 'Egreso',
    categoria: 'Gasto',
    concepto: 'Pastilla Madre',
    monto: 120.0,
    entidad: 'Ripley',
    dia: 4,
    mesInicio: '2026-10',
    recurrencia: 'fijo',
  },
  {
    id: 'proj-20',
    tipo: 'Egreso',
    categoria: 'Hogar & Mantenimiento',
    concepto: 'Utensilios de Limpieza',
    monto: 30.0,
    entidad: 'Ripley',
    dia: 4,
    mesInicio: '2026-10',
    recurrencia: 'fijo',
  },
  {
    id: 'proj-11',
    tipo: 'Egreso',
    categoria: 'Servicio',
    concepto: 'Agua + Mantenimiento',
    monto: 180.0,
    entidad: 'Interbank',
    dia: 5,
    mesInicio: '2026-10',
    recurrencia: 'fijo',
  },
  {
    id: 'proj-12',
    tipo: 'Egreso',
    categoria: 'Servicio',
    concepto: 'Pago de Tarjeta Interbank Amex',
    monto: 465.30,
    entidad: 'Interbank',
    dia: 5,
    mesInicio: '2026-10',
    recurrencia: 'fijo',
  },
  {
    id: 'proj-13',
    tipo: 'Egreso',
    categoria: 'Servicio',
    concepto: 'Pago de Tarjeta BBVA Bfree',
    monto: 272.80,
    entidad: 'Interbank',
    dia: 5,
    mesInicio: '2026-10',
    recurrencia: 'fijo',
  },
  {
    id: 'proj-14',
    tipo: 'Egreso',
    categoria: 'Servicio',
    concepto: 'Telefonia Movil',
    monto: 39.9,
    entidad: 'BBVA Bfree',
    dia: 11,
    mesInicio: '2026-10',
    recurrencia: 'fijo',
  },
  {
    id: 'proj-15',
    tipo: 'Egreso',
    categoria: 'Servicio',
    concepto: 'Luz',
    monto: 120.0,
    entidad: 'BBVA Bfree',
    dia: 11,
    mesInicio: '2026-10',
    recurrencia: 'fijo',
  },
  {
    id: 'proj-16',
    tipo: 'Egreso',
    categoria: 'Deuda',
    concepto: 'Prestamo BCP',
    monto: 143.16,
    entidad: 'Interbank',
    dia: 15,
    mesInicio: '2026-10',
    recurrencia: 'fijo',
  },
  {
    id: 'proj-17',
    tipo: 'Egreso',
    categoria: 'Otro Egre',
    concepto: 'Titulación',
    monto: 980.0,
    entidad: 'Interbank',
    dia: 15,
    mesInicio: '2026-10',
    recurrencia: 'fijo',
    excepciones: { '2026-10': { suprimido: true } },
  },
  {
    id: 'proj-18',
    tipo: 'Egreso',
    categoria: 'Servicio',
    concepto: 'iCloud',
    monto: 15.0,
    entidad: 'Interbank',
    dia: 23,
    mesInicio: '2026-10',
    recurrencia: 'fijo',
  },
  {
    id: 'proj-19',
    tipo: 'Egreso',
    categoria: 'Servicio',
    concepto: 'Madre',
    monto: 90.0,
    entidad: 'Interbank',
    dia: 5,
    mesInicio: '2026-10',
    recurrencia: 'fijo',
  },
];

export interface ProjectionState {
  items: ProjectedItem[];
  probabilidadSueldoPorMes: Record<string, number>; // Ej: { '2026-10': 2375.30 }
  
  // Acciones
  addItem: (item: Omit<ProjectedItem, 'id'>) => string;
  updateItem: (id: string, updates: Partial<ProjectedItem>) => void;
  deleteItem: (id: string) => void;
  
  // Manejo de excepciones por mes (suprimir o modificar puntualmente)
  suppressInMonth: (id: string, monthStr: string) => void;
  restoreInMonth: (id: string, monthStr: string) => void;
  suppressAllInMonth: (monthStr: string) => void;
  restoreAllInMonth: (monthStr: string) => void;
  modifyAmountInMonth: (id: string, monthStr: string, amount: number) => void;
  modifyDateInMonth: (id: string, monthStr: string, day: number) => void;
  clearMonthException: (id: string, monthStr: string) => void;
  
  // Escenario de probabilidad de sueldo
  setProbabilidadSueldo: (monthStr: string, monto: number) => void;
  clearProbabilidadSueldo: (monthStr: string) => void;
  
  // Sincronización Supabase
  syncFromSupabase: () => Promise<void>;
  saveToSupabase: () => Promise<void>;

  // Selector de cálculo
  getMonthlyProjections: (monthStr: string) => EffectiveProjectedRow[];
  getMultiHorizon: (
    baseMonth: string,
    horizonMonths: ProjectionHorizonMonths,
    initialLiquidCash?: number,
    simulations?: ProjectedItem[],
  ) => MultiHorizonProjectionResult;
  resetToDefaults: () => void;
}

const LS_KEY = 'finper_projections_v1';
const LS_PROB_KEY = 'finper_projection_prob_v1';
const CHUNK_PREFIX = 'config-proj-chunk-';

export async function fetchProjectionsFromSupabase(): Promise<{
  items: ProjectedItem[];
  probabilidadSueldoPorMes: Record<string, number>;
} | null> {
  try {
    const { data, error } = await supabase
      .from('transacciones')
      .select('id, concepto')
      .like('id', `${CHUNK_PREFIX}%`)
      .order('id', { ascending: true });

    if (error) throw error;
    if (!data || data.length === 0) return null;

    const sorted = [...data].sort((a, b) => {
      const numA = parseInt(a.id.replace(CHUNK_PREFIX, ''), 10);
      const numB = parseInt(b.id.replace(CHUNK_PREFIX, ''), 10);
      return numA - numB;
    });

    // Preserve the legacy cloud representation even when earlier writes left invalid JSON.
    if (typeof localStorage !== 'undefined') localStorage.setItem('finper_legacy_projection_cloud_backup_v2', JSON.stringify(sorted));
    const parsed = decodeLegacyProjections(sorted) as { items: ProjectedItem[]; probabilidadSueldoPorMes?: Record<string, number> };
    if (parsed && Array.isArray(parsed.items)) {
      const prob = parsed.probabilidadSueldoPorMes || {};

      return {
        items: parsed.items,
        probabilidadSueldoPorMes: prob,
      };
    }
  } catch (err) {
    console.warn('Error fetching projections from Supabase:', err);
    throw err;
  }
  return null;
}

function safeSetStorage(key: string, value: string): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
    }
  } catch {}
}

function safeRemoveStorage(key: string): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(key);
    }
  } catch {}
}

function loadStoredItems(): ProjectedItem[] {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    }
  } catch {}
  return INITIAL_PROJECTIONS;
}

function loadStoredProb(): Record<string, number> {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(LS_PROB_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          return parsed;
        }
      }
    }
  } catch {}
  return {};
}

export const useProjectionStore = create<ProjectionState>((set, get) => ({
  items: typeof window !== 'undefined' ? loadStoredItems() : INITIAL_PROJECTIONS,
  probabilidadSueldoPorMes: typeof window !== 'undefined' ? loadStoredProb() : {},

  addItem: (newItem) => {
    const id = `proj-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const fullItem: ProjectedItem = { ...newItem, id };
    set((state) => {
      const updated = [...state.items, fullItem];
      safeSetStorage(LS_KEY, JSON.stringify(updated));
      return { items: updated };
    });
    return id;
  },

  updateItem: (id, updates) => {
    set((state) => {
      const updated = state.items.map((item) => (item.id === id ? { ...item, ...updates } : item));
      safeSetStorage(LS_KEY, JSON.stringify(updated));
      return { items: updated };
    });
  },

  deleteItem: (id) => {
    set((state) => {
      const updated = state.items.filter((item) => item.id !== id);
      safeSetStorage(LS_KEY, JSON.stringify(updated));
      return { items: updated };
    });
  },

  suppressInMonth: (id, monthStr) => {
    set((state) => {
      const updated = state.items.map((item) => {
        if (item.id !== id) return item;
        const excepciones = { ...(item.excepciones || {}) };
        excepciones[monthStr] = { ...(excepciones[monthStr] || {}), suprimido: true };
        return { ...item, excepciones };
      });
      safeSetStorage(LS_KEY, JSON.stringify(updated));
      return { items: updated };
    });
  },

  restoreInMonth: (id, monthStr) => {
    set((state) => {
      const updated = state.items.map((item) => {
        if (item.id !== id) return item;
        const excepciones = { ...(item.excepciones || {}) };
        if (excepciones[monthStr]) {
          excepciones[monthStr] = { ...excepciones[monthStr], suprimido: false };
        }
        return { ...item, excepciones };
      });
      safeSetStorage(LS_KEY, JSON.stringify(updated));
      return { items: updated };
    });
  },

  suppressAllInMonth: (monthStr) => {
    set((state) => {
      const updated = state.items.map((item) => {
        const excepciones = { ...(item.excepciones || {}) };
        excepciones[monthStr] = { ...(excepciones[monthStr] || {}), suprimido: true };
        return { ...item, excepciones };
      });
      const updatedProb = { ...state.probabilidadSueldoPorMes };
      delete updatedProb[monthStr];
      safeSetStorage(LS_KEY, JSON.stringify(updated));
      safeSetStorage(LS_PROB_KEY, JSON.stringify(updatedProb));
      return { items: updated, probabilidadSueldoPorMes: updatedProb };
    });
  },

  restoreAllInMonth: (monthStr) => {
    set((state) => {
      const updated = state.items.map((item) => {
        const excepciones = { ...(item.excepciones || {}) };
        if (excepciones[monthStr]) {
          delete excepciones[monthStr].suprimido;
          if (Object.keys(excepciones[monthStr]).length === 0) {
            delete excepciones[monthStr];
          }
        }
        return { ...item, excepciones };
      });
      safeSetStorage(LS_KEY, JSON.stringify(updated));
      return { items: updated };
    });
  },

  modifyAmountInMonth: (id, monthStr, amount) => {
    set((state) => {
      const updated = state.items.map((item) => {
        if (item.id !== id) return item;
        const excepciones = { ...(item.excepciones || {}) };
        excepciones[monthStr] = { ...(excepciones[monthStr] || {}), montoModificado: amount };
        return { ...item, excepciones };
      });
      safeSetStorage(LS_KEY, JSON.stringify(updated));
      return { items: updated };
    });
  },

  modifyDateInMonth: (id, monthStr, day) => {
    set((state) => {
      const updated = state.items.map((item) => {
        if (item.id !== id) return item;
        const excepciones = { ...(item.excepciones || {}) };
        excepciones[monthStr] = { ...(excepciones[monthStr] || {}), diaModificado: day };
        return { ...item, excepciones };
      });
      safeSetStorage(LS_KEY, JSON.stringify(updated));
      return { items: updated };
    });
  },

  clearMonthException: (id, monthStr) => {
    set((state) => {
      const updated = state.items.map((item) => {
        if (item.id !== id || !item.excepciones) return item;
        const excepciones = { ...item.excepciones };
        delete excepciones[monthStr];
        return { ...item, excepciones };
      });
      safeSetStorage(LS_KEY, JSON.stringify(updated));
      return { items: updated };
    });
  },

  setProbabilidadSueldo: (monthStr, monto) => {
    set((state) => {
      const updated = { ...state.probabilidadSueldoPorMes, [monthStr]: monto };
      safeSetStorage(LS_PROB_KEY, JSON.stringify(updated));
      return { probabilidadSueldoPorMes: updated };
    });
  },

  clearProbabilidadSueldo: (monthStr) => {
    set((state) => {
      const updated = { ...state.probabilidadSueldoPorMes };
      delete updated[monthStr];
      safeSetStorage(LS_PROB_KEY, JSON.stringify(updated));
      return { probabilidadSueldoPorMes: updated };
    });
  },

  syncFromSupabase: async () => {
    const { syncPersonalSettings } = await import('../services/personalSettingsSync');
    await syncPersonalSettings();
  },

  saveToSupabase: async () => {
    const { syncPersonalSettings } = await import('../services/personalSettingsSync');
    await syncPersonalSettings();
  },

  getMonthlyProjections: (targetMonthStr) => {
    const { items } = get();
    // targetMonthStr es 'YYYY-MM', ej. '2026-10'
    const [targetYear, targetMonth] = targetMonthStr.split('-').map(Number);
    const targetDateVal = targetYear * 12 + (targetMonth - 1);

    const rows: EffectiveProjectedRow[] = [];

    for (const item of items) {
      const [startYear, startMonth] = item.mesInicio.split('-').map(Number);
      const startDateVal = startYear * 12 + (startMonth - 1);

      // Si el mes objetivo es anterior al mes de inicio, no aplica
      if (targetDateVal < startDateVal) continue;

      const monthsDiff = targetDateVal - startDateVal;

      // Evaluar recurrencia
      if (item.recurrencia === 'unico' && monthsDiff !== 0) {
        continue;
      }
      if (item.recurrencia === 'temporal') {
        const duracion = item.mesesDuracion || 1;
        if (monthsDiff >= duracion) continue;
      }

      // Evaluar excepciones del mes objetivo
      const excepcion = item.excepciones?.[targetMonthStr];
      if (excepcion?.suprimido) {
        // Suprimido en este mes específico
        continue;
      }

      const activeDay = excepcion?.diaModificado ?? item.dia;
      let activeAmount = excepcion?.montoModificado ?? item.monto;
      const isModified = excepcion?.montoModificado !== undefined || excepcion?.diaModificado !== undefined;

      // Detección de filas de liquidación/pago de tarjeta de crédito
      const isCardPaymentAmex = /pago.*tarjeta.*amex/i.test(item.concepto);
      const isCardPaymentBbva = /pago.*tarjeta.*bbva/i.test(item.concepto);
      const isCardPaymentRipley = /pago.*tarjeta.*ripley/i.test(item.concepto);

      let isCardSettlement = false;
      let cardSettledName = '';
      let cardDueDetail: CardCycleDueDetail | undefined;

      if (isCardPaymentAmex || isCardPaymentBbva || isCardPaymentRipley) {
        isCardSettlement = true;
        cardSettledName = isCardPaymentAmex ? 'Interbank Amex' : isCardPaymentBbva ? 'BBVA Bfree' : 'Ripley';
        cardDueDetail = getCardDueDetailsForMonth(cardSettledName, targetMonthStr, items);

        // Si el usuario no ingresó un monto manual específico para este mes,
        // utilizar el total exacto liquidado según los consumos reales y proyectados del ciclo
        if (excepcion?.montoModificado === undefined) {
          activeAmount = cardDueDetail.totalAPagar;
        }
      }

      const padDay = String(Math.min(activeDay, 31)).padStart(2, '0');
      const padMonth = String(targetMonth).padStart(2, '0');
      const fullDate = `${targetYear}-${padMonth}-${padDay}`;

      const isCreditCard = Boolean(CARD_RULES[item.entidad]);
      let cardPayInfo: CardPaymentDateResult | undefined;

      if (isCreditCard) {
        cardPayInfo = calculateCardPaymentDate(item.entidad, targetYear, targetMonth - 1, activeDay);
      }

      const fechaConsumo = fullDate;
      const mesConsumo = targetMonthStr;
      const fechaPagoEfectiva = cardPayInfo?.fechaPago || fullDate;
      const mesImpactoCaja = cardPayInfo?.mesPago || targetMonthStr;
      const desfaseMesesCaja = cardPayInfo?.desfaseMeses ?? 0;
      const cicloFacturacion = cardPayInfo?.periodoFacturado;
      const fechaCorteTarjeta = cardPayInfo?.fechaCorte;

      rows.push({
        id: `${item.id}-${targetMonthStr}`,
        itemId: item.id,
        tipo: item.tipo,
        fecha: fullDate,
        categoria: item.categoria,
        concepto: item.concepto,
        monto: activeAmount,
        montoOriginal: item.monto,
        entidad: item.entidad,
        recurrencia: item.recurrencia,
        esFijo: item.recurrencia === 'fijo',
        esTemporal: item.recurrencia === 'temporal',
        esUnico: item.recurrencia === 'unico',
        esModificado: isModified,
        esTarjetaCredito: isCreditCard,
        esPagoLiquidacionTarjeta: isCardSettlement,
        tarjetaLiquidada: cardSettledName || undefined,
        detalleConsumosCiclo: cardDueDetail?.consumos,
        mesPagoTarjeta: cardPayInfo?.mesPago,
        fechaPagoTarjeta: cardPayInfo?.fechaPago,
        fechaConsumo,
        mesConsumo,
        cicloFacturacion,
        fechaCorteTarjeta,
        fechaPagoEfectiva,
        mesImpactoCaja,
        desfaseMesesCaja,
      });
    }

    // Incorporar cuotas activas de compras con tarjeta registradas
    const sourceTransactions = useFinanceStore?.getState ? useFinanceStore.getState().transactions : masterTransactions;
    sourceTransactions.forEach((t) => {
      if (t.Tipo === 'Egreso' && t.Entidad) {
        let numCuotas = (t.cuotas && t.cuotas > 1) ? t.cuotas : 1;
        if (numCuotas === 1 && t.Concepto) {
          const match = t.Concepto.match(/\[(\d+)\s*cuotas?\]|\((\d+)\s*cuotas?\)/i);
          if (match) numCuotas = parseInt(match[1] || match[2], 10);
        }

        if (numCuotas > 1) {
          const schedule = calculateCardInstallmentSchedule(t.Entidad, t.Fecha, t.Monto, numCuotas);
          const activeCuota = schedule.find(s => s.mesPago === targetMonthStr);
          if (activeCuota) {
            const cleanConcept = t.Concepto.replace(/\s*\[\d+\s*cuotas?\]|\(\d+\s*cuotas?\)/gi, '').trim();
            const rowId = `tx-installment-${t.id || t.Fecha}-${targetMonthStr}`;
            let isCreditCard = Boolean(CARD_RULES[t.Entidad]);
            if (!isCreditCard) {
              try {
                isCreditCard = Boolean(useCreditCardStore.getState().getCardByEntity(t.Entidad));
              } catch {}
            }

            const [iY, iM] = (t.Fecha || activeCuota.fechaPago).slice(0, 7).split('-').map(Number);
            const [aY, aM] = activeCuota.mesPago.split('-').map(Number);
            const installmentDesfase = Math.max(0, (aY * 12 + aM) - (iY * 12 + iM));

            rows.push({
              id: rowId,
              itemId: t.id,
              tipo: 'Egreso',
              fecha: activeCuota.fechaPago,
              categoria: t.Categoria,
              concepto: `${cleanConcept} (Cuota ${activeCuota.cuotaNumber}/${numCuotas})`,
              monto: activeCuota.montoCuota,
              montoOriginal: t.Monto,
              entidad: t.Entidad,
              recurrencia: 'temporal',
              esFijo: false,
              esTemporal: true,
              esUnico: false,
              esModificado: false,
              esTarjetaCredito: isCreditCard,
              esPagoLiquidacionTarjeta: false,
              mesPagoTarjeta: activeCuota.mesPago,
              fechaPagoTarjeta: activeCuota.fechaPago,
              fechaConsumo: t.Fecha || activeCuota.fechaPago,
              mesConsumo: (t.Fecha || activeCuota.fechaPago).slice(0, 7),
              cicloFacturacion: `Cuota ${activeCuota.cuotaNumber} de ${numCuotas}`,
              fechaPagoEfectiva: activeCuota.fechaPago,
              mesImpactoCaja: activeCuota.mesPago,
              desfaseMesesCaja: installmentDesfase,
            });
          }
        }
      }
    });

    // Ordenar por día de fecha ascendente
    rows.sort((a, b) => a.fecha.localeCompare(b.fecha));
    return rows;
  },

  getMultiHorizon: (baseMonth, horizonMonths, initialLiquidCash = 0, simulations = []) => {
    const months = getHorizonMonthList(baseMonth, horizonMonths);
    const inputItems: RawProjectionInputItem[] = [];

    for (const m of months) {
      const rows = get().getMonthlyProjections(m);
      for (const r of rows) {
        inputItems.push({
          id: r.id,
          source: (r.esTarjetaCredito || r.esPagoLiquidacionTarjeta) ? 'obligation' : 'estimate',
          type: r.tipo,
          month: m,
          date: r.fecha,
          concept: r.concepto,
          category: r.categoria,
          entity: r.entidad,
          amount: r.monto,
          isInstallment: r.esTemporal,
        });
      }
    }

    if (simulations.length > 0) {
      for (const sim of simulations) {
        for (const m of months) {
          const [startYear, startMonth] = sim.mesInicio.split('-').map(Number);
          const [targetYear, targetMonth] = m.split('-').map(Number);
          const diff = (targetYear * 12 + targetMonth) - (startYear * 12 + startMonth);
          if (diff < 0) continue;
          if (sim.recurrencia === 'unico' && diff !== 0) continue;
          if (sim.recurrencia === 'temporal' && diff >= (sim.mesesDuracion || 1)) continue;

          inputItems.push({
            id: `sim-${sim.id}-${m}`,
            source: 'simulation',
            type: sim.tipo,
            month: m,
            concept: `[Simulación] ${sim.concepto}`,
            category: sim.categoria,
            entity: sim.entidad,
            amount: sim.monto,
          });
        }
      }
    }

    return calculateMultiHorizonProjection(baseMonth, horizonMonths, initialLiquidCash, inputItems);
  },

  resetToDefaults: () => {
    safeRemoveStorage(LS_KEY);
    safeRemoveStorage(LS_PROB_KEY);
    set({
      items: INITIAL_PROJECTIONS,
      probabilidadSueldoPorMes: {},
    });
  },
}));
