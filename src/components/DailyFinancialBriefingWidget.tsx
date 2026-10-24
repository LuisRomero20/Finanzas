import React, { useState, useMemo } from 'react';
import { useProjectionStore } from '../store/projectionStore';
import { useFinanceStore } from '../store/financeStore';
import { useCreditCardStore } from '../store/creditCardStore';
import { generateFinancialBriefing } from '../domain/alerts/obligationAlertsEngine';
import { getLimaDateTime } from '../domain/alerts/dateUtils';
import type { ObligationItem } from '../domain/alerts/types';
import {
  BellRing,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react';

const fmt = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' });
const BRIEFING_EXPANDED_KEY = 'finper_briefing_widget_expanded';

interface DailyFinancialBriefingWidgetProps {
  /** Mes objetivo opcional ('YYYY-MM'). Si no se indica, usa el mes actual en Lima */
  customMonthStr?: string;
  /** Clase CSS adicional para el contenedor */
  className?: string;
}

export const DailyFinancialBriefingWidget: React.FC<DailyFinancialBriefingWidgetProps> = ({
  customMonthStr,
  className = '',
}) => {
  const { getMonthlyProjections } = useProjectionStore();
  const { transactions } = useFinanceStore();
  const { cards } = useCreditCardStore();

  const [expanded, setExpanded] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(BRIEFING_EXPANDED_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const toggleExpanded = () => {
    setExpanded(prev => {
      const next = !prev;
      try {
        sessionStorage.setItem(BRIEFING_EXPANDED_KEY, String(next));
      } catch {}
      return next;
    });
  };

  // Fecha y hora actual en Lima
  const limaNow = useMemo(() => getLimaDateTime(), []);
  const activeMonth = customMonthStr || limaNow.monthString;

  // Calculamos las filas efectivas del mes consultado sin alterar nada
  const projectedRows = useMemo(() => {
    try {
      return getMonthlyProjections(activeMonth);
    } catch {
      return [];
    }
  }, [getMonthlyProjections, activeMonth]);

  // Generamos el briefing financiero puro
  const briefing = useMemo(() => {
    const cardRules = cards.map(c => ({
      entity: c.entity,
      paymentDay: c.paymentDay,
      cutoffDay: c.cycleStartDay,
    }));

    return generateFinancialBriefing({
      projectedRows,
      executedTransactions: transactions,
      cardRules,
      targetMonth: activeMonth,
    });
  }, [projectedRows, transactions, cards, activeMonth]);

  const hasUrgentAlerts =
    briefing.totalTodayPending > 0 ||
    briefing.totalOverduePending > 0 ||
    briefing.liquidityStatus === 'deficit';

  return (
    <section
      className={`mb-4 rounded-2xl border border-sky-800/30 bg-white dark:bg-[#11191D] text-xs shadow-sm overflow-hidden transition-all duration-200 ${className}`}
      aria-label="Briefing Financiero Matutino — Alertas de Obligaciones"
    >
      {/* Barra superior de cabecera */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-4 py-3 bg-gradient-to-r from-sky-500/10 via-slate-50/50 to-indigo-500/10 dark:from-sky-950/30 dark:via-slate-900/40 dark:to-indigo-950/30 border-b border-sky-200/50 dark:border-sky-900/30">
        <button
          type="button"
          onClick={toggleExpanded}
          className="flex items-center gap-2.5 text-left cursor-pointer flex-1 min-w-0"
          aria-expanded={expanded}
          aria-controls="finper-daily-briefing-details"
          aria-label={expanded ? 'Colapsar briefing financiero' : 'Expandir briefing financiero'}
        >
          <div className={`p-2 rounded-xl shrink-0 ${hasUrgentAlerts ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' : 'bg-sky-500/20 text-sky-600 dark:text-sky-400'}`}>
            <BellRing size={18} className={hasUrgentAlerts ? 'animate-bounce' : ''} />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                Briefing Financiero 7:30 a. m.
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-800">
                America/Lima (UTC-5)
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                {activeMonth}
              </span>
            </div>

            {/* Resumen compacto de 1 línea */}
            <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 font-medium flex items-center gap-2 flex-wrap">
              <span>
                Hoy: <strong>{fmt.format(briefing.totalTodayPending)}</strong> pendientes
              </span>
              <span>·</span>
              <span>
                Próximos 7 días: <strong>{fmt.format(briefing.totalNext7DaysPending)}</strong>
              </span>
              {briefing.totalOverduePending > 0 && (
                <>
                  <span>·</span>
                  <span className="text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
                    <AlertTriangle size={12} />
                    {fmt.format(briefing.totalOverduePending)} vencidos
                  </span>
                </>
              )}
              <span>·</span>
              {briefing.liquidityStatus === 'insufficient_data' ? (
                <span className="text-slate-400 dark:text-slate-500 font-normal">
                  Balance: Sin proyecciones cargadas
                </span>
              ) : (
                <span className={`font-semibold ${briefing.monthlyProjectedBalance < 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  Balance {fmt.format(briefing.monthlyProjectedBalance)}
                </span>
              )}
            </p>
          </div>
        </button>

        {/* Botón de control de expansión */}
        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          <button
            type="button"
            onClick={toggleExpanded}
            className="p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-slate-500 transition cursor-pointer"
            title={expanded ? 'Colapsar briefing' : 'Expandir briefing detallado'}
            aria-label={expanded ? 'Colapsar briefing' : 'Expandir briefing detallado'}
            aria-expanded={expanded}
            aria-controls="finper-daily-briefing-details"
          >
            <span className="text-sm font-bold" aria-hidden="true">
              {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </span>
          </button>
        </div>
      </div>

      {/* Contenido Detallado Expandido */}
      {expanded && (
        <div id="finper-daily-briefing-details" className="p-4 space-y-4 animate-in fade-in duration-150">
          {/* Banner de alerta de liquidez si existe déficit */}
          {briefing.liquidityAlertMessage && (
            <div
              className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                briefing.liquidityStatus === 'deficit'
                  ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                  : 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-200'
              }`}
            >
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <div className="text-xs">
                <strong>Alerta de Disponibilidad:</strong> {briefing.liquidityAlertMessage}
                <p className="text-[11px] opacity-85 mt-0.5">
                  Las partidas y sus importes originales se conservan intactos en Proyecciones.
                </p>
              </div>
            </div>
          )}

          {/* Grilla de secciones: Hoy, Próximos 7 días, Vencidos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* 1. Vencimientos de Hoy */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 dark:border-slate-800">
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Calendar size={14} className="text-sky-500" />
                  Vencen Hoy
                </span>
                <span className="font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  {fmt.format(briefing.totalTodayPending)}
                </span>
              </div>

              {briefing.obligationsToday.length === 0 ? (
                <p className="text-[11px] text-slate-400 italic">No hay obligaciones para hoy.</p>
              ) : (
                <div className="space-y-2">
                  {briefing.obligationsToday.map(o => (
                    <ObligationRowCard key={o.id} obligation={o} />
                  ))}
                </div>
              )}
            </div>

            {/* 2. Próximos 7 días */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 dark:border-slate-800">
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Clock size={14} className="text-indigo-500" />
                  Próximos 7 días
                </span>
                <span className="font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  {fmt.format(briefing.totalNext7DaysPending)}
                </span>
              </div>

              {briefing.obligationsNext7Days.length === 0 ? (
                <p className="text-[11px] text-slate-400 italic">Sin vencimientos en los próximos 7 días.</p>
              ) : (
                <div className="space-y-2">
                  {briefing.obligationsNext7Days.map(o => (
                    <ObligationRowCard key={o.id} obligation={o} />
                  ))}
                </div>
              )}
            </div>

            {/* 3. Vencidos sin registrar / Tarjetas */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 dark:border-slate-800">
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <AlertTriangle size={14} className="text-rose-500" />
                  Vencidos sin Confirmar
                </span>
                <span className="font-mono text-[11px] font-bold text-rose-600 dark:text-rose-400">
                  {fmt.format(briefing.totalOverduePending)}
                </span>
              </div>

              {briefing.obligationsOverdue.length === 0 ? (
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                  ✓ Al día: no hay pagos vencidos pendientes.
                </p>
              ) : (
                <div className="space-y-2">
                  {briefing.obligationsOverdue.map(o => (
                    <ObligationRowCard key={o.id} obligation={o} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Pie informativo de integridad */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-slate-800 text-[10px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <Info size={12} className="text-sky-500 shrink-0" />
              <span>
                Briefing de solo lectura. Consulta directamente tus partidas sin crear ni duplicar transacciones.
              </span>
            </div>
            <span>
              Ingresos: {fmt.format(briefing.monthlyProjectedIncome)} · Egresos: {fmt.format(briefing.monthlyProjectedExpense)}
            </span>
          </div>
        </div>
      )}
    </section>
  );
};

interface ObligationRowCardProps {
  obligation: ObligationItem;
}

const ObligationRowCard: React.FC<ObligationRowCardProps> = ({ obligation }) => {
  const isExecuted = obligation.executionStatus === 'executed';

  return (
    <div
      className={`p-2 rounded-lg border text-xs transition-all ${
        isExecuted
          ? 'bg-emerald-500/5 border-emerald-500/20 text-slate-600 dark:text-slate-300'
          : obligation.urgency === 'overdue'
            ? 'bg-rose-500/5 border-rose-500/20'
            : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80'
      }`}
    >
      <div className="flex items-center justify-between gap-1.5">
        <span className="font-semibold text-slate-800 dark:text-slate-100 truncate">
          {obligation.concepto}
        </span>
        <span className={`font-mono font-bold shrink-0 ${isExecuted ? 'text-emerald-600 dark:text-emerald-400 line-through opacity-75' : 'text-slate-900 dark:text-slate-100'}`}>
          {fmt.format(obligation.monto)}
        </span>
      </div>

      <div className="flex items-center justify-between gap-1 mt-1 text-[10px] text-slate-500 dark:text-slate-400">
        <span>
          {obligation.entidad} · {obligation.dueDate}
        </span>

        {isExecuted ? (
          <span className="inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 font-semibold">
            <CheckCircle2 size={11} />
            Confirmado
          </span>
        ) : (
          <span
            className={`font-semibold ${
              obligation.urgency === 'overdue'
                ? 'text-rose-600 dark:text-rose-400'
                : obligation.urgency === 'due_today'
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-slate-400'
            }`}
          >
            {obligation.urgency === 'overdue' ? 'Vencido' : 'Pendiente'}
          </span>
        )}
      </div>
    </div>
  );
};
