import React, { useState, useMemo } from 'react';
import { useFinanceStore, type Transaction } from '../store/financeStore';
import {
  CreditCard,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Clock,
  CalendarDays,
  FileText,
  CheckCircle2,
  Sparkles,
  RotateCcw,
  UploadCloud,
  FileCheck2,
} from 'lucide-react';
import { StatementImportModal } from '../components/StatementImportModal';
import { useCardStatementStore } from '../store/cardStatementStore';

// ============================================================
// CONFIGURACIÓN DE TARJETAS
// ============================================================
interface CardConfig {
  entity: string;
  name: string;
  cycleStartDay: number; // día que inicia el ciclo (ej. 21)
  paymentDay: number;    // día de pago (ej. 15)
  accentBg: string;
  accentText: string;
  headerBg: string;
  pillBg: string;
  pillText: string;
}

const CARDS: CardConfig[] = [
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

// ============================================================
// HELPERS DE FECHAS
// ============================================================

/** Parsea "YYYY-MM-DD" en hora local (evita desfase UTC) */
function parseLocal(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Si cae sábado o domingo, avanza al lunes siguiente */
function nextWorkingDay(date: Date): Date {
  const d = new Date(date);
  if (d.getDay() === 6) d.setDate(d.getDate() + 2);
  else if (d.getDay() === 0) d.setDate(d.getDate() + 1);
  return d;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatShort(date: Date): string {
  return date.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
}

function daysFromToday(date: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / 86_400_000);
}

// ============================================================
// LÓGICA DE CICLOS
// ============================================================
interface Cycle {
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
function getCycles(ref: Date, card: CardConfig): { current: Cycle; prev: Cycle } {
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
    // El ciclo que cerró (prev) empezó el mes pasado (corteDay) y cerró este mes (corteDay - 1).
    // Su pago vence el mes que viene (month + 1, paymentDay).
    prevStart = new Date(year, month - 1, card.cycleStartDay, 12, 0, 0, 0);
    prevEnd = new Date(year, month, card.cycleStartDay - 1, 12, 0, 0, 0);
    prevPayBase = new Date(year, month + 1, card.paymentDay, 12, 0, 0, 0);
    prevPrevPayBase = new Date(year, month, card.paymentDay, 12, 0, 0, 0);

    // El ciclo que está acumulando (current) empieza este mes y cierra el mes que viene.
    // Su pago vence en 2 meses (month + 2, paymentDay).
    currentStart = new Date(year, month, card.cycleStartDay, 12, 0, 0, 0);
    currentEnd = new Date(year, month + 1, card.cycleStartDay - 1, 12, 0, 0, 0);
    currentPayBase = new Date(year, month + 2, card.paymentDay, 12, 0, 0, 0);
  } else {
    // Aún NO ha pasado el corte de este mes:
    // El ciclo facturado por pagar (prev) empezó hace 2 meses y cerró el mes pasado.
    // Su pago vence este mes (month, paymentDay).
    prevStart = new Date(year, month - 2, card.cycleStartDay, 12, 0, 0, 0);
    prevEnd = new Date(year, month - 1, card.cycleStartDay - 1, 12, 0, 0, 0);
    prevPayBase = new Date(year, month, card.paymentDay, 12, 0, 0, 0);
    prevPrevPayBase = new Date(year, month - 1, card.paymentDay, 12, 0, 0, 0);

    // El ciclo que está acumulando (current) empezó el mes pasado y cierra este mes.
    // Su pago vence el mes que viene (month + 1, paymentDay).
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

/** Filtra egresos de la lista de transacciones para una entidad y rango de fechas */
function getTxs(txList: Transaction[], entity: string, start: Date, end: Date) {
  return txList.filter(t => {
    if (t.Entidad !== entity || t.Tipo !== 'Egreso') return false;
    const d = parseLocal(t.Fecha);
    return d >= start && d <= end;
  });
}

/** Filtra abonos de pago de tarjeta buscando 'Pago de Tarjeta <Entidad>' dentro de una ventana */
function getPaymentTxs(txList: Transaction[], entity: string, windowStart: Date, windowEnd: Date) {
  const regex = new RegExp(`Pago de Tarjeta ${entity}`, 'i');
  return txList.filter(t => {
    if (t.Tipo !== 'Egreso') return false;
    if (!regex.test(t.Concepto)) return false;
    const d = parseLocal(t.Fecha);
    return d > windowStart && d <= windowEnd;
  });
}

const fmt = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' });

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export const CronogramaPagos: React.FC = () => {
  const { transactions } = useFinanceStore();
  const [refDate, setRefDate] = useState(() => {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    return d;
  });

  // Modal de importación de estado de cuenta
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetCardForModal, setTargetCardForModal] = useState<string>('Interbank Amex');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const { statements, getVerifiedStatement, removeVerifiedStatement } = useCardStatementStore();

  const shiftDate = (days: number) => {
    const d = new Date(refDate);
    d.setDate(d.getDate() + days);
    setRefDate(d);
  };

  const handleOpenImport = (cardEntity?: string) => {
    if (cardEntity) setTargetCardForModal(cardEntity);
    setIsModalOpen(true);
  };

  const handleDebtUpdated = (cardEntity: string, finalDebt: number) => {
    setSuccessToast(`¡Deuda de ${cardEntity} actualizada con éxito a ${fmt.format(finalDebt)}!`);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  // Resumen global
  const summary = useMemo(() => {
    let totalPorPagar = 0;
    let totalAcumulando = 0;
    const proximoPago: { card: string; payDate: Date; total: number }[] = [];

    CARDS.forEach(card => {
      const { current, prev } = getCycles(refDate, card);
      const verifiedStmt = getVerifiedStatement(card.entity, prev.payDate, prev.end);
      
      const prevTotal = verifiedStmt ? verifiedStmt.finalDebt : getTxs(transactions, card.entity, prev.start, prev.end).reduce((s, t) => s + t.Monto, 0);
      const currTotal = getTxs(transactions, card.entity, current.start, current.end).reduce((s, t) => s + t.Monto, 0);
      
      const prevPayments = getPaymentTxs(transactions, card.entity, prev.prevPayDate, prev.payDate).reduce((s, t) => s + t.Monto, 0);
      const netToPay = Math.max(0, prevTotal - prevPayments);

      totalPorPagar += netToPay;
      totalAcumulando += currTotal;
      if (netToPay > 0) proximoPago.push({ card: card.name, payDate: prev.payDate, total: netToPay });
    });

    proximoPago.sort((a, b) => a.payDate.getTime() - b.payDate.getTime());
    return { totalPorPagar, totalAcumulando, proximoPago };
  }, [transactions, refDate, statements, getVerifiedStatement]);

  return (
    <div className="space-y-8">
      
      {/* Toast de Éxito */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-in fade-in slide-in-from-bottom duration-200">
          <div className="p-1.5 bg-green-500/20 text-green-400 rounded-lg">
            <CheckCircle2 size={18} />
          </div>
          <span className="text-sm font-semibold">{successToast}</span>
        </div>
      )}

      {/* ── HEADER EJECUTIVO ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-[#11191D] rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Gestión de Tarjetas & Facturación
            </h1>
            <span className="text-[10px] font-bold uppercase tracking-widest bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 rounded-full">
              Ciclos Activos
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Control de periodos de corte, fechas límite de pago y conciliación con estados de cuenta.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Botón Importar Estado de Cuenta General */}
          <button
            onClick={() => handleOpenImport()}
            className="flex items-center gap-2 bg-[#0F2A1D] dark:bg-emerald-700 hover:bg-black dark:hover:bg-emerald-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm hover:shadow-md transition-all"
          >
            <UploadCloud size={16} />
            <span>Importar Estado de Cuenta</span>
          </button>

          {/* Selector de fecha de referencia */}
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 shadow-inner">
            <button onClick={() => shiftDate(-1)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition p-0.5">
              <ChevronLeft size={16} />
            </button>
            <CalendarDays size={14} className="text-slate-500 dark:text-slate-400" />
            <input
              type="date"
              value={refDate.toISOString().slice(0, 10)}
              onChange={e => {
                const d = new Date(e.target.value + 'T12:00:00');
                if (!isNaN(d.getTime())) setRefDate(d);
              }}
              className="text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none bg-transparent cursor-pointer"
            />
            <button onClick={() => shiftDate(1)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition p-0.5">
              <ChevronRight size={16} />
            </button>
            <button
              onClick={() => { const d = new Date(); d.setHours(12,0,0,0); setRefDate(d); }}
              className="ml-1 text-[11px] text-emerald-700 dark:text-emerald-400 hover:underline font-bold"
            >
              Hoy
            </button>
          </div>
        </div>
      </div>

      {/* ── Resumen global ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white dark:bg-[#11191D] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm px-6 py-5">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Total por Pagar Ahora</p>
          <p className="text-3xl font-black text-rose-600 dark:text-rose-400 mt-2 tracking-tight">{fmt.format(summary.totalPorPagar)}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-medium">Ciclos facturados pendientes de pago</p>
        </div>
        <div className="bg-white dark:bg-[#11191D] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm px-6 py-5">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Acumulando en Curso</p>
          <p className="text-3xl font-black text-slate-800 dark:text-slate-100 mt-2 tracking-tight">{fmt.format(summary.totalAcumulando)}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-medium">Ciclos actuales aún no facturados</p>
        </div>
        <div className="bg-white dark:bg-[#11191D] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm px-6 py-5">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Próximos Vencimientos</p>
          {summary.proximoPago.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-3 italic">Sin vencimientos pendientes</p>
          ) : (
            <ul className="mt-2.5 space-y-1.5">
              {summary.proximoPago.map(p => {
                const days = daysFromToday(p.payDate);
                return (
                  <li key={p.card} className="flex justify-between items-center text-xs">
                    <span className="text-slate-700 dark:text-slate-300 font-semibold">{p.card}</span>
                    <span className={`font-bold tabular-nums ${days <= 7 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'}`}>
                      {formatShort(p.payDate)} · {days <= 0 ? <span className="text-rose-500">Vencido</span> : `${days}d`}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* ── Tarjetas individuales ── */}
      <div className="space-y-6">
        {CARDS.map(card => {
          const { current, prev } = getCycles(refDate, card);
          const prevTxs = getTxs(transactions, card.entity, prev.start, prev.end);
          const currTxs = getTxs(transactions, card.entity, current.start, current.end);
          const calculatedPrevTotal = prevTxs.reduce((s, t) => s + t.Monto, 0);
          const currTotal = currTxs.reduce((s, t) => s + t.Monto, 0);

          // Verificar si hay estado de cuenta confirmado guardado para este ciclo
          const verifiedStatement = getVerifiedStatement(card.entity, prev.payDate, prev.end);
          const prevTotal = verifiedStatement ? verifiedStatement.finalDebt : calculatedPrevTotal;

          const pagadoTxs = getPaymentTxs(transactions, card.entity, prev.prevPayDate, prev.payDate);
          const pagadoTotal = pagadoTxs.reduce((s, t) => s + t.Monto, 0);
          
          const isPaid = pagadoTotal > 0;
          const netToPay = isPaid ? 0 : prevTotal;

          const daysLeft = daysFromToday(prev.payDate);
          const isOverdue = daysLeft < 0 && !isPaid && netToPay > 0;
          const isUrgent = daysLeft >= 0 && daysLeft <= 7 && !isPaid && netToPay > 0;

          return (
            <div key={card.entity} className="bg-white dark:bg-[#11191D] rounded-2xl shadow-sm overflow-hidden border border-slate-200/80 dark:border-slate-800 transition-colors">

              {/* Header de la tarjeta */}
              <div className={`bg-gradient-to-r ${card.headerBg} px-6 py-4`}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 rounded-lg p-2">
                      <CreditCard className="text-white" size={20} />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">{card.name}</h2>
                      <p className="text-white/70 text-xs">
                        Ciclo: día <strong className="text-white">{card.cycleStartDay}</strong> de cada mes
                        &nbsp;·&nbsp;
                        Pago: día <strong className="text-white">{card.paymentDay}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center">
                    {/* Botón Cargar Estado de Cuenta */}
                    <button
                      onClick={() => handleOpenImport(card.entity)}
                      className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-3 py-1.5 rounded-lg backdrop-blur-sm transition border border-white/20"
                      title="Importar estado de cuenta para esta tarjeta"
                    >
                      <UploadCloud size={14} />
                      <span>Cargar Estado de Cuenta</span>
                    </button>

                    {isPaid ? (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-green-500 text-white shadow-sm">
                        ✅ Cancelado
                      </div>
                    ) : (isOverdue || isUrgent) && prevTotal > 0 ? (
                      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
                        isOverdue ? 'bg-red-500 text-white' : 'bg-amber-400 text-amber-900'
                      }`}>
                        <AlertTriangle size={12} />
                        {isOverdue ? `VENCIDO hace ${Math.abs(daysLeft)}d` : `¡Pagar en ${daysLeft}d!`}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Barra de Estado de Cuenta Verificado si existe */}
              {verifiedStatement && (
                <div className="bg-blue-50/80 dark:bg-blue-950/40 border-b border-blue-100 dark:border-blue-900/50 px-6 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <FileCheck2 size={15} className="text-blue-600 dark:text-blue-400" />
                    <span className="font-bold text-blue-900 dark:text-blue-200">Deuda Verificada con Estado de Cuenta:</span>
                    <span className="bg-blue-200/60 dark:bg-blue-900/60 text-blue-900 dark:text-blue-200 font-bold px-2 py-0.5 rounded text-[11px]">
                      {fmt.format(verifiedStatement.finalDebt)}
                    </span>
                    <span className="text-slate-400 dark:text-slate-500 text-[11px] hidden sm:inline">
                      ({verifiedStatement.fileName})
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleOpenImport(card.entity)}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold hover:underline text-[11px]"
                    >
                      Ver conciliación
                    </button>
                    <button
                      onClick={() => removeVerifiedStatement(verifiedStatement.cycleKey || card.entity)}
                      className="text-slate-400 hover:text-red-600 dark:hover:text-rose-400 flex items-center gap-1 text-[11px]"
                      title="Volver al cálculo automático por transacciones registradas"
                    >
                      <RotateCcw size={11} />
                      <span>Restablecer</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Dos columnas: Por Pagar | Acumulando */}
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800">

                {/* ── Columna 1: Por Pagar (ciclo anterior) ── */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-5">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">Por Pagar</p>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        {formatShort(prev.start)} — {formatShort(prev.end)}
                      </p>
                    </div>
                    <div className={`text-right rounded-xl px-3 py-2 ${
                      isPaid ? 'bg-green-50 border border-green-200 dark:bg-emerald-950/40 dark:border-emerald-800/60' :
                      isOverdue ? 'bg-red-50 border border-red-200 dark:bg-rose-950/40 dark:border-rose-800/60' :
                      isUrgent  ? 'bg-amber-50 border border-amber-200 dark:bg-amber-950/40 dark:border-amber-800/60' :
                                  'bg-slate-50 border border-slate-200 dark:bg-slate-800/60 dark:border-slate-700'
                    }`}>
                      <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1 justify-end">
                        <Clock size={11} /> Vence
                      </p>
                      <p className={`text-sm font-bold leading-tight ${
                        isPaid ? 'text-green-600 dark:text-emerald-400' :
                        isOverdue ? 'text-red-600 dark:text-rose-400' : isUrgent ? 'text-amber-600 dark:text-amber-400' : 'text-slate-700 dark:text-slate-200'
                      }`}>
                        {formatDate(prev.payDate)}
                      </p>
                      <p className={`text-xs font-medium ${isPaid ? 'text-green-500 dark:text-emerald-400' : isOverdue ? 'text-red-500 dark:text-rose-400' : isUrgent ? 'text-amber-500 dark:text-amber-400' : 'text-slate-400 dark:text-slate-500'}`}>
                        {isPaid 
                          ? 'Pagado a tiempo'
                          : isOverdue
                          ? `${Math.abs(daysLeft)}d vencido`
                          : daysLeft === 0
                          ? '¡Hoy!'
                          : `en ${daysLeft} días`}
                      </p>
                    </div>
                  </div>

                  {isPaid ? (
                    <div className="mb-5">
                      <p className="text-3xl font-bold text-slate-300 dark:text-slate-600 line-through">
                        {fmt.format(prevTotal)}
                      </p>
                      <p className="text-sm font-medium text-green-600 dark:text-emerald-400 mt-1">
                        Saldado con pago de {fmt.format(pagadoTotal)}
                      </p>
                    </div>
                  ) : (
                    <div className="mb-5">
                      <p className={`text-3xl font-bold ${card.accentText} dark:text-white`}>
                        {fmt.format(netToPay)}
                      </p>
                      {verifiedStatement && (
                        <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mt-1 flex items-center gap-1">
                          <CheckCircle2 size={13} />
                          Deuda confirmada del estado de cuenta
                        </p>
                      )}
                      {pagadoTotal > 0 && (
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                          Abonado {fmt.format(pagadoTotal)} de {fmt.format(prevTotal)}
                        </p>
                      )}
                    </div>
                  )}

                  {prevTxs.length === 0 ? (
                    <p className="text-slate-400 dark:text-slate-500 text-sm italic py-4 text-center">Sin transacciones en este período</p>
                  ) : (
                    <div className="overflow-y-auto max-h-52 space-y-0">
                      <div className="text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider mb-2 border-b border-slate-200 dark:border-slate-800 pb-1">
                        {prevTxs.length} transacción{prevTxs.length !== 1 ? 'es' : ''} en FinPer
                      </div>
                      {prevTxs.map(t => (
                        <div key={t.id} className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800/60 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 rounded px-1 transition-colors">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-slate-700 dark:text-slate-200 font-medium truncate">{t.Concepto}</p>
                            <p className="text-xs text-slate-400 dark:text-slate-500">{t.Fecha} · <span className="italic">{t.Categoria}</span></p>
                          </div>
                          <span className="text-sm font-semibold text-slate-800 dark:text-white ml-4 shrink-0 tabular-nums">
                            {fmt.format(t.Monto)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ── Columna 2: Acumulando (ciclo actual) ── */}
                <div className="p-6 bg-slate-50/30 dark:bg-slate-800/20">
                  <div className="flex items-start justify-between mb-5">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">Acumulando</p>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        {formatShort(current.start)} — {formatShort(current.end)}
                      </p>
                    </div>
                    <div className="text-right rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                      <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1 justify-end">
                        <Clock size={11} /> Vencerá
                      </p>
                      <p className="text-sm font-bold text-slate-600 dark:text-slate-300 leading-tight">
                        {formatDate(current.payDate)}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        en {daysFromToday(current.payDate)} días
                      </p>
                    </div>
                  </div>

                  <p className="text-3xl font-bold text-slate-400 dark:text-slate-500 mb-1">
                    {fmt.format(currTotal)}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mb-5">acumulado hasta hoy</p>

                  {currTxs.length === 0 ? (
                    <p className="text-slate-400 dark:text-slate-500 text-sm italic py-4 text-center">Sin consumos aún en este ciclo</p>
                  ) : (
                    <div className="overflow-y-auto max-h-52 space-y-0">
                      <div className="text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider mb-2 border-b border-slate-200 dark:border-slate-800 pb-1">
                        {currTxs.length} transacción{currTxs.length !== 1 ? 'es' : ''}
                      </div>
                      {currTxs.map(t => (
                        <div key={t.id} className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800/60 last:border-0 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 rounded px-1 transition-colors">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-slate-600 dark:text-slate-300 font-medium truncate">{t.Concepto}</p>
                            <p className="text-xs text-slate-400 dark:text-slate-500">{t.Fecha} · <span className="italic">{t.Categoria}</span></p>
                          </div>
                          <span className="text-sm font-semibold text-slate-600 dark:text-slate-300 ml-4 shrink-0 tabular-nums">
                            {fmt.format(t.Monto)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de Importación */}
      <StatementImportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialCard={targetCardForModal}
        onDebtUpdated={handleDebtUpdated}
      />

    </div>
  );
};
