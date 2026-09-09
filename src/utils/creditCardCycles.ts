import type { Transaction } from '../store/financeStore';

export interface CardConfig {
  entity: string;
  name: string;
  cycleStartDay: number; // día que inicia el ciclo (ej. 21)
  paymentDay: number;    // día de pago (ej. 15)
  accentBg?: string;
  accentText?: string;
  headerBg?: string;
  pillBg?: string;
  pillText?: string;
}

export const CARDS: CardConfig[] = [
  {
    entity: 'Interbank Amex',
    name: 'Interbank Amex',
    cycleStartDay: 21,
    paymentDay: 15,
    accentBg: 'bg-blue-600',
    accentText: 'text-blue-700',
    headerBg: 'from-blue-700 to-blue-500',
    pillBg: 'bg-blue-100',
    pillText: 'text-blue-700',
  },
  {
    entity: 'BBVA Bfree',
    name: 'BBVA Bfree',
    cycleStartDay: 11,
    paymentDay: 5,
    accentBg: 'bg-sky-600',
    accentText: 'text-sky-700',
    headerBg: 'from-sky-700 to-sky-500',
    pillBg: 'bg-sky-100',
    pillText: 'text-sky-700',
  },
  {
    entity: 'Ripley',
    name: 'Ripley',
    cycleStartDay: 4,
    paymentDay: 1,
    accentBg: 'bg-purple-600',
    accentText: 'text-purple-700',
    headerBg: 'from-purple-700 to-purple-500',
    pillBg: 'bg-purple-100',
    pillText: 'text-purple-700',
  },
];

/** Parsea "YYYY-MM-DD" en hora local (evita desfase UTC) */
export function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Si cae sábado o domingo, avanza al lunes siguiente */
export function nextWorkingDay(date: Date): Date {
  const d = new Date(date);
  if (d.getDay() === 6) d.setDate(d.getDate() + 2);
  else if (d.getDay() === 0) d.setDate(d.getDate() + 1);
  return d;
}

export function daysFromToday(date: Date, todayRef = new Date()): number {
  const today = new Date(todayRef);
  today.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / 86_400_000);
}

export interface Cycle {
  start: Date;
  end: Date;
  payDate: Date;
  prevPayDate: Date; // Ventana de pago inicia desde esta fecha (exclusiva)
}

/**
 * Dado un día de referencia, devuelve:
 *  - current: ciclo que está acumulando ahora
 *  - prev:    ciclo anterior (ya facturado, pendiente de pago)
 */
export function getCycles(ref: Date, card: CardConfig): { current: Cycle; prev: Cycle } {
  const year = ref.getFullYear();
  const month = ref.getMonth();
  const day = ref.getDate();

  let currentStart: Date;
  let currentEnd: Date;
  let prevStart: Date;
  let prevEnd: Date;
  let currentPayBase: Date;
  let prevPayBase: Date;
  let prevPrevPayBase: Date;

  if (day >= card.cycleStartDay) {
    // Ya pasó el corte de este mes:
    prevStart = new Date(year, month - 1, card.cycleStartDay, 12, 0, 0, 0);
    prevEnd = new Date(year, month, card.cycleStartDay - 1, 12, 0, 0, 0);
    prevPayBase = new Date(year, month + 1, card.paymentDay, 12, 0, 0, 0);
    prevPrevPayBase = new Date(year, month, card.paymentDay, 12, 0, 0, 0);

    // El ciclo que está acumulando (current) empieza este mes y cierra el mes que viene
    currentStart = new Date(year, month, card.cycleStartDay, 12, 0, 0, 0);
    currentEnd = new Date(year, month + 1, card.cycleStartDay - 1, 12, 0, 0, 0);
    currentPayBase = new Date(year, month + 2, card.paymentDay, 12, 0, 0, 0);
  } else {
    // Aún NO ha pasado el corte de este mes:
    prevStart = new Date(year, month - 2, card.cycleStartDay, 12, 0, 0, 0);
    prevEnd = new Date(year, month - 1, card.cycleStartDay - 1, 12, 0, 0, 0);
    prevPayBase = new Date(year, month, card.paymentDay, 12, 0, 0, 0);
    prevPrevPayBase = new Date(year, month - 1, card.paymentDay, 12, 0, 0, 0);

    // El ciclo que está acumulando (current) empezó el mes pasado y cierra este mes
    currentStart = new Date(year, month - 1, card.cycleStartDay, 12, 0, 0, 0);
    currentEnd = new Date(year, month, card.cycleStartDay - 1, 12, 0, 0, 0);
    currentPayBase = new Date(year, month + 1, card.paymentDay, 12, 0, 0, 0);
  }

  const currentPayDate = nextWorkingDay(currentPayBase);
  const prevPayDate = nextWorkingDay(prevPayBase);
  const prevPrevPayDate = nextWorkingDay(prevPrevPayBase);

  return {
    current: { start: currentStart, end: currentEnd, payDate: currentPayDate, prevPayDate: prevPayDate },
    prev: { start: prevStart, end: prevEnd, payDate: prevPayDate, prevPayDate: prevPrevPayDate },
  };
}

/** Filtra egresos de la lista de transacciones para una tarjeta y rango de fechas */
export function getCardTxs(txList: Transaction[], entity: string, start: Date, end: Date) {
  return txList.filter(t => {
    if (t.Entidad !== entity || t.Tipo !== 'Egreso') return false;
    const d = parseLocalDate(t.Fecha);
    return d >= start && d <= end;
  });
}

/**
 * Filtra abonos de pago de tarjeta buscando transacciones de egreso con concepto
 * tipo 'Pago de Tarjeta <Entidad>' dentro de la ventana de pago.
 */
export function getCardPaymentTxs(txList: Transaction[], entity: string, windowStart: Date, windowEnd: Date) {
  const regex = new RegExp(`Pago de Tarjeta ${entity}`, 'i');
  return txList.filter(t => {
    if (t.Tipo !== 'Egreso') return false;
    if (!regex.test(t.Concepto)) return false;
    const d = parseLocalDate(t.Fecha);
    return d > windowStart && d <= windowEnd;
  });
}

export interface CardLivePosition {
  card: CardConfig;
  currentCycle: Cycle;
  prevCycle: Cycle;
  prevTotal: number; // Monto facturado
  paymentTotal: number; // Pagos recibidos
  isPaid: boolean; // ¿Facturado cancelado?
  netToPay: number; // Por pagar del facturado (0 si cancelado)
  currTotal: number; // Acumulando en curso
  liveDebt: number; // Deuda viva actual
  daysLeft: number;
  isOverdue: boolean;
  isUrgent: boolean;
  paidTransactions: Transaction[];
  hasVerifiedStatement: boolean;
}

/**
 * Calcula la posición viva y real de una tarjeta de crédito,
 * unificando el ciclo facturado, pagos realizados y acumulado en curso.
 */
export function calculateCardLivePosition(
  card: CardConfig,
  transactions: Transaction[],
  refDate: Date = new Date(),
  verifiedStatementFinalDebt?: number | null
): CardLivePosition {
  const { current, prev } = getCycles(refDate, card);

  const prevTxs = getCardTxs(transactions, card.entity, prev.start, prev.end);
  const currTxs = getCardTxs(transactions, card.entity, current.start, current.end);

  const calculatedPrevTotal = prevTxs.reduce((s, t) => s + t.Monto, 0);
  const currTotal = currTxs.reduce((s, t) => s + t.Monto, 0);

  const hasVerifiedStatement = typeof verifiedStatementFinalDebt === 'number' && verifiedStatementFinalDebt > 0;
  const prevTotal = hasVerifiedStatement ? verifiedStatementFinalDebt : calculatedPrevTotal;

  const paidTxs = getCardPaymentTxs(transactions, card.entity, prev.prevPayDate, prev.payDate);
  const paymentTotal = paidTxs.reduce((s, t) => s + t.Monto, 0);

  // Considerar cancelado si los pagos cubren el monto facturado (tolerancia de S/ 1 por redondeo bancario)
  const isPaid = (paymentTotal >= prevTotal - 1 && prevTotal > 0) || (prevTotal === 0 && paymentTotal > 0);
  const netToPay = isPaid ? 0 : Math.max(0, prevTotal - paymentTotal);

  // Deuda viva total: si ya pagó el facturado, solo debe lo que viene acumulando en curso
  const liveDebt = isPaid ? currTotal : (netToPay + currTotal);

  const daysLeft = daysFromToday(prev.payDate, refDate);
  const isOverdue = daysLeft < 0 && !isPaid && netToPay > 0;
  const isUrgent = daysLeft >= 0 && daysLeft <= 7 && !isPaid && netToPay > 0;

  return {
    card,
    currentCycle: current,
    prevCycle: prev,
    prevTotal,
    paymentTotal,
    isPaid,
    netToPay,
    currTotal,
    liveDebt,
    daysLeft,
    isOverdue,
    isUrgent,
    paidTransactions: paidTxs,
    hasVerifiedStatement,
  };
}
