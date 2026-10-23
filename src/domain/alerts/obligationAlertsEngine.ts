/**
 * Motor de Consulta y Alertas de Obligaciones Financieras (FINPER 2.1 — Sprint 02)
 * 
 * Principio Fundamental:
 * - Operación 100% libre de efectos secundarios (función pura).
 * - No inserta transacciones, no muta stores, no altera partidas proyectadas.
 * - Todos los recordatorios referencian las partidas originales por ID.
 * - Trabaja estrictamente en zona horaria America/Lima (UTC-5).
 */

import type { Transaction } from '../../utils/masterData';
import type { EffectiveProjectedRow } from '../../store/projectionStore';
import { getLimaDateTime, addDays } from './dateUtils';
import type {
  DailyFinancialBriefing,
  ObligationItem,
  ObligationUrgency,
  ObligationExecutionStatus,
  LiquidityHealthStatus,
} from './types';

export interface GenerateBriefingOptions {
  /** Filas efectivas calculadas del mes desde projectionStore */
  projectedRows: EffectiveProjectedRow[];
  /** Transacciones reales registradas en la lista maestra / financeStore */
  executedTransactions: Transaction[];
  /** Tarjetas activas con sus reglas de facturación */
  cardRules?: Array<{ entity: string; paymentDay: number; cutoffDay?: number }>;
  /** Fecha/hora de referencia (por defecto ahora en America/Lima) */
  referenceNow?: Date;
  /** Mes objetivo opcional ('YYYY-MM'). Si no se indica, usa el mes actual en Lima */
  targetMonth?: string;
}

/**
 * Normaliza cadenas de texto para comparar conceptos sin problemas de tildes o mayúsculas.
 */
function normalizeString(val: string): string {
  return (val || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Determina si una partida proyectada ya cuenta con un pago real registrado en movimientos maestros.
 */
function findMatchingExecutedTransaction(
  row: EffectiveProjectedRow,
  executedTransactions: Transaction[],
  monthStr: string
): Transaction | undefined {
  const normConceptoRow = normalizeString(row.concepto);
  const normEntidadRow = normalizeString(row.entidad);

  // Palabras clave principales del concepto proyectado (mínimo 3 letras)
  const keywords = normConceptoRow
    .split(/\s+/)
    .filter(k => k.length >= 3 && !['pago', 'tarjeta', 'deuda', 'servicio', 'mes'].includes(k));

  return executedTransactions.find(t => {
    // 1. Debe coincidir el tipo (Ingreso o Egreso)
    if (t.Tipo !== row.tipo) return false;

    // 2. Debe corresponder al mismo mes (por fecha o campo Mes)
    const txMonth = (t.Fecha || '').slice(0, 7);
    if (txMonth !== monthStr && t.Mes !== monthStr) return false;

    // 3. Coincidencia en monto (tolerancia de S/ 0.05 por redondeo bancario)
    const isAmountEqual = Math.abs(t.Monto - row.monto) < 0.05;
    if (!isAmountEqual) return false;

    // 4. Coincidencia en entidad o concepto
    const normConceptoTx = normalizeString(t.Concepto);
    const normEntidadTx = normalizeString(t.Entidad);

    const sameEntity = normEntidadTx.length > 0 && normEntidadTx === normEntidadRow;
    const sameConceptExact = normConceptoTx === normConceptoRow;
    const hasKeywordMatch = keywords.some(kw => normConceptoTx.includes(kw));

    return sameConceptExact || sameEntity || hasKeywordMatch;
  });
}

/**
 * Genera el Briefing Financiero Diario a partir de los datos existentes sin alterarlos.
 */
export function generateFinancialBriefing(options: GenerateBriefingOptions): DailyFinancialBriefing {
  const {
    projectedRows = [],
    executedTransactions = [],
    cardRules: _cardRules = [],
    referenceNow = new Date(),
  } = options;

  const limaNow = getLimaDateTime(referenceNow);
  const targetMonth = options.targetMonth || limaNow.monthString;
  const todayStr = limaNow.dateString;
  const next7DaysLimit = addDays(todayStr, 7);

  // Consideramos horario matutino entre las 06:00 y las 11:59 en Lima (7:30 a. m. está en esta franja)
  const isMorningBriefing = limaNow.hours >= 6 && limaNow.hours < 12;

  const obligationsToday: ObligationItem[] = [];
  const obligationsNext7Days: ObligationItem[] = [];
  const obligationsOverdue: ObligationItem[] = [];
  const cardsDue: ObligationItem[] = [];

  let monthlyProjectedIncome = 0;
  let monthlyProjectedExpense = 0;

  let totalTodayPending = 0;
  let totalTodayExecuted = 0;
  let totalNext7DaysPending = 0;
  let totalOverduePending = 0;

  for (const row of projectedRows) {
    // Cálculo acumulado mensual
    if (row.tipo === 'Ingreso') {
      monthlyProjectedIncome += row.monto;
    } else {
      monthlyProjectedExpense += row.monto;
    }

    const matchedTx = findMatchingExecutedTransaction(row, executedTransactions, targetMonth);
    const executionStatus: ObligationExecutionStatus = matchedTx ? 'executed' : 'pending';

    const dueDate = row.fecha;
    let urgency: ObligationUrgency;

    if (dueDate === todayStr) {
      urgency = 'due_today';
    } else if (dueDate < todayStr) {
      urgency = 'overdue';
    } else if (dueDate > todayStr && dueDate <= next7DaysLimit) {
      urgency = 'due_soon';
    } else {
      urgency = 'future';
    }

    const obligation: ObligationItem = {
      id: `alert-proj-${row.itemId || row.id}-${dueDate}`,
      referenceItemId: row.itemId || row.id,
      source: 'projection',
      tipo: row.tipo,
      concepto: row.concepto,
      categoria: row.categoria,
      entidad: row.entidad,
      monto: row.monto,
      dueDate,
      urgency,
      executionStatus,
      matchedTransactionId: matchedTx?.id,
      matchedTransactionDate: matchedTx?.Fecha,
      detail: row.esTarjetaCredito ? `Consumos tarjeta ${row.entidad}` : undefined,
    };

    // Clasificar según urgencia
    const isExpense = row.tipo === 'Egreso';

    if (urgency === 'due_today') {
      obligationsToday.push(obligation);
      if (isExpense) {
        if (executionStatus === 'pending') {
          totalTodayPending += row.monto;
        } else {
          totalTodayExecuted += row.monto;
        }
      }
    } else if (urgency === 'due_soon') {
      obligationsNext7Days.push(obligation);
      if (isExpense && executionStatus === 'pending') {
        totalNext7DaysPending += row.monto;
      }
    } else if (urgency === 'overdue' && executionStatus === 'pending') {
      // Solo alertamos como vencido si aún NO ha sido pagado
      obligationsOverdue.push(obligation);
      if (isExpense) {
        totalOverduePending += row.monto;
      }
    }

    // Si es un pago de tarjeta en los próximos 7 días o hoy, incluir en cardsDue
    if (row.esPagoLiquidacionTarjeta || /pago.*tarjeta/i.test(row.concepto)) {
      if (urgency === 'due_today' || urgency === 'due_soon' || (urgency === 'overdue' && executionStatus === 'pending')) {
        cardsDue.push(obligation);
      }
    }
  }

  // Ordenar cronológicamente las obligaciones
  obligationsToday.sort((a, b) => a.concepto.localeCompare(b.concepto));
  obligationsNext7Days.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  obligationsOverdue.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  cardsDue.sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const monthlyProjectedBalance = Math.round((monthlyProjectedIncome - monthlyProjectedExpense) * 100) / 100;

  // Evaluación de liquidez
  let liquidityStatus: LiquidityHealthStatus = 'surplus';
  let liquidityAlertMessage: string | undefined;

  if (monthlyProjectedBalance < 0) {
    liquidityStatus = 'deficit';
    const defFmt = Math.abs(monthlyProjectedBalance).toFixed(2);
    liquidityAlertMessage = `Déficit mensual proyectado de S/ ${defFmt} para ${targetMonth}. Las obligaciones superan los ingresos proyectados.`;
  } else if (monthlyProjectedBalance < 250) {
    liquidityStatus = 'tight';
    liquidityAlertMessage = `Margen de liquidez ajustado para ${targetMonth} (S/ ${monthlyProjectedBalance.toFixed(2)}).`;
  }

  return {
    dateLima: todayStr,
    timeLima: limaNow.timeString,
    timestampLima: `${todayStr} ${limaNow.timeString} (America/Lima)`,
    isMorningBriefing,
    obligationsToday,
    obligationsNext7Days,
    obligationsOverdue,
    cardsDue,
    totalTodayPending: Math.round(totalTodayPending * 100) / 100,
    totalTodayExecuted: Math.round(totalTodayExecuted * 100) / 100,
    totalNext7DaysPending: Math.round(totalNext7DaysPending * 100) / 100,
    totalOverduePending: Math.round(totalOverduePending * 100) / 100,
    monthConsulted: targetMonth,
    monthlyProjectedIncome: Math.round(monthlyProjectedIncome * 100) / 100,
    monthlyProjectedExpense: Math.round(monthlyProjectedExpense * 100) / 100,
    monthlyProjectedBalance,
    liquidityStatus,
    liquidityAlertMessage,
  };
}
