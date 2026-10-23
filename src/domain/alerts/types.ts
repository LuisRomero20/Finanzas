/**
 * Tipos de datos para el Motor de Recordatorios y Briefing Financiero FINPER 2.1
 * 
 * Regla de Oro: Este módulo es estrictamente de LECTURA.
 * Referencia siempre los registros originales mediante su identificador único (ID).
 * NUNCA crea, muta ni duplica transacciones ni partidas proyectadas.
 */

export type ObligationUrgency = 'overdue' | 'due_today' | 'due_soon' | 'future';

export type ObligationExecutionStatus = 'executed' | 'pending';

export type ObligationSource = 'projection' | 'credit_card';

export interface ObligationItem {
  /** Identificador determinístico del recordatorio (ej. alert-proj-12-2026-11-05) */
  id: string;
  /** Referencia estricta al identificador original de la partida o tarjeta */
  referenceItemId: string;
  source: ObligationSource;
  tipo: 'Ingreso' | 'Egreso';
  concepto: string;
  categoria: string;
  entidad: string;
  monto: number;
  /** Fecha de vencimiento en formato 'YYYY-MM-DD' */
  dueDate: string;
  urgency: ObligationUrgency;
  executionStatus: ObligationExecutionStatus;
  matchedTransactionId?: string;
  matchedTransactionDate?: string;
  /** Detalle opcional (ej: cuotas, periodo de corte) */
  detail?: string;
}

export type LiquidityHealthStatus = 'surplus' | 'tight' | 'deficit';

export interface DailyFinancialBriefing {
  /** Fecha de corte en zona horaria America/Lima (YYYY-MM-DD) */
  dateLima: string;
  /** Hora de emisión en zona horaria America/Lima (HH:mm) */
  timeLima: string;
  /** Marca temporal completa */
  timestampLima: string;
  /** Indica si la hora actual está dentro de la ventana matutina (06:00 a 11:59 Lima) */
  isMorningBriefing: boolean;

  /** Obligaciones que vencen exactamente hoy */
  obligationsToday: ObligationItem[];
  /** Obligaciones que vencen en los próximos 7 días */
  obligationsNext7Days: ObligationItem[];
  /** Obligaciones vencidas en el mes sin registro de ejecución confirmado */
  obligationsOverdue: ObligationItem[];
  /** Tarjetas de crédito con vencimiento próximo */
  cardsDue: ObligationItem[];

  /** Suma monetaria de obligaciones pendientes para hoy */
  totalTodayPending: number;
  /** Suma monetaria de obligaciones de hoy ya confirmadas/ejecutadas */
  totalTodayExecuted: number;
  /** Suma monetaria de obligaciones pendientes para los próximos 7 días */
  totalNext7DaysPending: number;
  /** Suma monetaria de obligaciones vencidas pendientes */
  totalOverduePending: number;

  /** Métricas de proyección del mes consultado */
  monthConsulted: string; // 'YYYY-MM'
  monthlyProjectedIncome: number;
  monthlyProjectedExpense: number;
  monthlyProjectedBalance: number;

  /** Diagnóstico de liquidez */
  liquidityStatus: LiquidityHealthStatus;
  liquidityAlertMessage?: string;
}
