import { masterTransactions } from '../src/utils/masterData';

const CARDS = [
  { entity: 'Interbank Amex', name: 'Interbank Amex', cycleStartDay: 21, paymentDay: 15 },
  { entity: 'BBVA Bfree', name: 'BBVA Bfree', cycleStartDay: 11, paymentDay: 5 },
  { entity: 'Ripley', name: 'Ripley', cycleStartDay: 4, paymentDay: 1 },
];

function parseLocal(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}
function nextWorkingDay(date: Date) {
  const d = new Date(date);
  if (d.getDay() === 6) d.setDate(d.getDate() + 2);
  else if (d.getDay() === 0) d.setDate(d.getDate() + 1);
  return d;
}
function getCycles(ref: Date, card: typeof CARDS[0]) {
  const year = ref.getFullYear();
  const month = ref.getMonth();
  const day = ref.getDate();
  let currentStart: Date, currentEnd: Date, prevStart: Date, prevEnd: Date, currentPayBase: Date, prevPayBase: Date, prevPrevPayBase: Date;
  if (day >= card.cycleStartDay) {
    prevStart = new Date(year, month - 1, card.cycleStartDay, 12, 0, 0, 0);
    prevEnd = new Date(year, month, card.cycleStartDay - 1, 12, 0, 0, 0);
    prevPayBase = new Date(year, month + 1, card.paymentDay, 12, 0, 0, 0);
    prevPrevPayBase = new Date(year, month, card.paymentDay, 12, 0, 0, 0);
    currentStart = new Date(year, month, card.cycleStartDay, 12, 0, 0, 0);
    currentEnd = new Date(year, month + 1, card.cycleStartDay - 1, 12, 0, 0, 0);
    currentPayBase = new Date(year, month + 2, card.paymentDay, 12, 0, 0, 0);
  } else {
    prevStart = new Date(year, month - 2, card.cycleStartDay, 12, 0, 0, 0);
    prevEnd = new Date(year, month - 1, card.cycleStartDay - 1, 12, 0, 0, 0);
    prevPayBase = new Date(year, month, card.paymentDay, 12, 0, 0, 0);
    prevPrevPayBase = new Date(year, month - 1, card.paymentDay, 12, 0, 0, 0);
    currentStart = new Date(year, month - 1, card.cycleStartDay, 12, 0, 0, 0);
    currentEnd = new Date(year, month, card.cycleStartDay - 1, 12, 0, 0, 0);
    currentPayBase = new Date(year, month + 1, card.paymentDay, 12, 0, 0, 0);
  }
  return {
    current: { start: currentStart, end: currentEnd, payDate: nextWorkingDay(currentPayBase), prevPayDate: nextWorkingDay(prevPayBase) },
    prev: { start: prevStart, end: prevEnd, payDate: nextWorkingDay(prevPayBase), prevPayDate: nextWorkingDay(prevPrevPayBase) },
  };
}

function getTxs(txList: any[], entity: string, start: Date, end: Date) {
  return txList.filter(t => {
    if (t.Entidad !== entity || t.Tipo !== 'Egreso') return false;
    const d = parseLocal(t.Fecha);
    return d >= start && d <= end;
  });
}

function getPaymentTxs(txList: any[], entity: string, windowStart: Date, windowEnd: Date) {
  const regex = new RegExp('Pago de Tarjeta ' + entity, 'i');
  return txList.filter(t => {
    if (t.Tipo !== 'Egreso') return false;
    if (!regex.test(t.Concepto)) return false;
    const d = parseLocal(t.Fecha);
    return d > windowStart && d <= windowEnd;
  });
}

const refDate = new Date(2026, 8, 9, 12, 0, 0); // 09 Septiembre 2026
console.log('Fecha de referencia:', refDate.toISOString());

CARDS.forEach(card => {
  const { current, prev } = getCycles(refDate, card);
  const prevTxs = getTxs(masterTransactions, card.entity, prev.start, prev.end);
  const currTxs = getTxs(masterTransactions, card.entity, current.start, current.end);
  const prevTotal = prevTxs.reduce((s, t) => s + t.Monto, 0);
  const currTotal = currTxs.reduce((s, t) => s + t.Monto, 0);
  const paymentTxs = getPaymentTxs(masterTransactions, card.entity, prev.prevPayDate, prev.payDate);
  const paymentTotal = paymentTxs.reduce((s, t) => s + t.Monto, 0);
  const isPaid = paymentTotal >= prevTotal && prevTotal > 0;
  const netToPay = isPaid ? 0 : Math.max(0, prevTotal - paymentTotal);

  console.log('\n--- ' + card.name + ' ---');
  console.log('Ciclo Facturado: ' + prev.start.toISOString().slice(0,10) + ' al ' + prev.end.toISOString().slice(0,10) + ' (Vence ' + prev.payDate.toISOString().slice(0,10) + ')');
  console.log('Total Facturado: S/ ' + prevTotal.toFixed(2));
  console.log('Pagos Detectados: S/ ' + paymentTotal.toFixed(2), paymentTxs.map(p => p.Concepto + ': S/ ' + p.Monto));
  console.log('Por pagar facturado: S/ ' + netToPay.toFixed(2) + (isPaid ? ' [CANCELADO]' : ' [PENDIENTE]'));
  console.log('Ciclo en curso (Acumulando): ' + current.start.toISOString().slice(0,10) + ' al ' + current.end.toISOString().slice(0,10));
  console.log('Acumulado en curso: S/ ' + currTotal.toFixed(2));
  console.log('DEUDA VIVA TOTAL: S/ ' + (netToPay + currTotal).toFixed(2));
});

console.log('\n=== CUENTAS BANCARIAS ===');
const currentMonth = 'Setiembre';
const ibkMesTxs = masterTransactions.filter(t => t.Entidad === 'Interbank' && t.Mes === currentMonth);
const ibkMesIng = ibkMesTxs.filter(t => t.Tipo === 'Ingreso').reduce((a,b) => a + b.Monto, 0);
const ibkMesEgr = ibkMesTxs.filter(t => t.Tipo === 'Egreso').reduce((a,b) => a + b.Monto, 0);
console.log(`Interbank Mes (${currentMonth}): Ingresos: S/ ${ibkMesIng.toFixed(2)}, Egresos: S/ ${ibkMesEgr.toFixed(2)}, Saldo: S/ ${(ibkMesIng - ibkMesEgr).toFixed(2)}`);

const bcpMesTxs = masterTransactions.filter(t => t.Entidad === 'BCP' && t.Mes === currentMonth);
const bcpMesIng = bcpMesTxs.filter(t => t.Tipo === 'Ingreso').reduce((a,b) => a + b.Monto, 0);
const bcpMesEgr = bcpMesTxs.filter(t => t.Tipo === 'Egreso').reduce((a,b) => a + b.Monto, 0);
console.log(`BCP Mes (${currentMonth}): Ingresos: S/ ${bcpMesIng.toFixed(2)}, Egresos: S/ ${bcpMesEgr.toFixed(2)}, Saldo: S/ ${(bcpMesIng - bcpMesEgr).toFixed(2)}`);
