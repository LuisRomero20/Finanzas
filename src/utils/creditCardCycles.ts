import type { Transaction } from '../store/financeStore';
import { useCreditCardStore, DEFAULT_CARDS, type CardConfig } from '../store/creditCardStore';

export { type CardConfig, DEFAULT_CARDS };

/**
 * Listado de tarjetas de crédito configuradas en la aplicación.
 * Si el store está disponible, devuelve las tarjetas dinámicas del usuario.
 */
export const CARDS: CardConfig[] = DEFAULT_CARDS;

export function getActiveCards(): CardConfig[] {
  try {
    const fromStore = useCreditCardStore.getState().cards;
    if (fromStore && fromStore.length > 0) return fromStore;
  } catch {}
  return DEFAULT_CARDS;
}

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

function dateWithClampedDay(year: number, monthIndex: number, day: number): Date {
  const lastDay = new Date(year, monthIndex + 1, 0, 12).getDate();
  return new Date(year, monthIndex, Math.min(Math.max(day, 1), lastDay), 12, 0, 0, 0);
}

function monthShift(date: Date, delta: number, day: number): Date {
  return dateWithClampedDay(date.getFullYear(), date.getMonth() + delta, day);
}

function dayBefore(date: Date): Date {
  const result = new Date(date);
  result.setDate(result.getDate() - 1);
  return result;
}

/**
 * Dado un día de referencia, devuelve:
 *  - current: ciclo que está acumulando ahora
 *  - prev:    ciclo anterior (ya facturado, pendiente de pago)
 */
export function getCycles(ref: Date, card: CardConfig): { current: Cycle; prev: Cycle } {
  const normalizedRef = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate(), 12);
  const startThisMonth = dateWithClampedDay(ref.getFullYear(), ref.getMonth(), card.cycleStartDay);
  const currentStart = normalizedRef >= startThisMonth
    ? startThisMonth
    : monthShift(startThisMonth, -1, card.cycleStartDay);
  const nextStart = monthShift(currentStart, 1, card.cycleStartDay);
  const currentEnd = dayBefore(nextStart);
  const prevStart = monthShift(currentStart, -1, card.cycleStartDay);
  const prevEnd = dayBefore(currentStart);
  const currentPayBase = monthShift(currentStart, 2, card.paymentDay);
  const prevPayBase = monthShift(prevStart, 2, card.paymentDay);
  const prevPrevPayBase = monthShift(prevStart, 1, card.paymentDay);

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

  const hasVerifiedStatement = typeof verifiedStatementFinalDebt === 'number' && verifiedStatementFinalDebt >= 0;
  const prevTotal = hasVerifiedStatement ? verifiedStatementFinalDebt : calculatedPrevTotal;

  const paidTxs = getCardPaymentTxs(transactions, card.entity, prev.prevPayDate, prev.payDate);
  const paymentTotal = paidTxs.reduce((s, t) => s + t.Monto, 0);

  // Considerar cancelado si los pagos cubren el monto facturado (tolerancia de S/ 1 por redondeo bancario) o regularizado a 0
  const isPaid = (paymentTotal >= prevTotal - 1 && prevTotal > 0) || (prevTotal === 0 && (paymentTotal > 0 || hasVerifiedStatement));
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
