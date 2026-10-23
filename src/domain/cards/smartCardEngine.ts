/**
 * FINPER 2.1 — Motor Centralizado de Tarjetas Inteligentes (Smart Card Engine)
 *
 * Principios Financieros y de Arquitectura:
 * 1. Dominio Puro: Funciones determinísticas, libres de efectos secundarios, mutaciones y llamadas a red.
 * 2. 4 Estados Financieros:
 *    - 'confirmed': Datos validados contra estado de cuenta oficial emitido por el banco.
 *    - 'calculated': Calculado por FINPER en base a movimientos y reglas de ciclo.
 *    - 'estimated': Proyectado con supuestos matemáticos (ej. cuotas futuras con TEA supuesta).
 *    - 'hypothetical': Simulación pura que jamás altera saldos ni escribe en bases de datos.
 * 3. Transparencia Contractual:
 *    - NUNCA inventar tasas ni comisiones.
 *    - Si faltan tasas o seguro de desgravamen y no es promo 0%, emitir:
 *      "Estimación incompleta: faltan datos contractuales".
 * 4. Precisión Monetaria:
 *    - Redondeo al centavo bancario y ajuste en la última cuota para evitar pérdida de centavos.
 * 5. Separación Económica vs Caja:
 *    - Gasto económico: registrado en la fecha de la compra.
 *    - Desembolso de caja: registrado en la fecha de vencimiento/pago de la tarjeta.
 */

import { roundMoney, toMinorUnits, fromMinorUnits, allocateMoney } from '../finance/money';
import { convertTeaToTem } from '../finance/rates';
import {
  calculateBillingCycle,
  addMonthsKeepingDay,
  type DateOnly,
  type BillingRule,
  type BillingCycleResult,
} from './billingCycles';

export type FinancialDataState = 'confirmed' | 'calculated' | 'estimated' | 'hypothetical';

export type PurchaseFinancingModality = 'direct' | 'zero_interest_promo' | 'revolving_financed';

export type CreditCardIssuer = 'Ripley' | 'Interbank' | 'BBVA' | 'Otro';
export type CreditCardNetwork = 'Mastercard' | 'American Express' | 'Visa' | 'Otra';
export type CurrencyCode = 'PEN' | 'USD';

export interface CardContractualRates {
  tea?: number; // Tasa Efectiva Anual (ej. 0.35 para 35%)
  tcea?: number; // Tasa de Costo Efectivo Anual
  debtInsuranceMonthlyRate?: number; // Seguro de desgravamen mensual (ej. 0.0039 para 0.39%)
  monthlyFixedFee?: number; // Comisión fija de administración mensual
  membershipAnnualFee?: number; // Cuota anual de membresía
}

export interface ContractualCompleteness {
  isComplete: boolean;
  missingTerms: string[];
  warningMessage?: string;
}

export interface SmartCardAccount {
  id: string;
  entity: string;
  name: string;
  issuer: CreditCardIssuer;
  commercialName: string;
  network: CreditCardNetwork;
  currency: CurrencyCode;
  creditLimit: number;
  availableCredit: number;
  usedCredit: number;
  billedDebt: number; // Por pagar ahora (ciclo cerrado)
  unbilledDebt: number; // Acumulando en curso (ciclo abierto)
  cycleStartDay: number;
  paymentDay: number;
  rates: CardContractualRates;
  ratesCompleteness: ContractualCompleteness;
  referenceBureau?: {
    creditLimit?: number;
    usedBalance?: number;
    sourceDate: string;
    isVerified: boolean;
  };
  status: 'active' | 'blocked' | 'closed';
  billingRulesStatus: 'unverified' | 'user_confirmed' | 'statement_confirmed';
  colorTheme?: {
    accentBg: string;
    accentText: string;
    headerBg: string;
    pillBg: string;
    pillText: string;
  };
}

export interface SmartInstallmentRow {
  installmentNumber: number;
  dueDate: DateOnly;
  billingMonth: string; // YYYY-MM
  initialBalance: number;
  principalPayment: number;
  interestPayment: number;
  insurancePayment: number;
  feesPayment: number;
  totalInstallment: number;
  finalBalance: number;
  dataStatus: FinancialDataState;
}

export interface SmartInstallmentSchedule {
  purchaseId?: string;
  cardId: string;
  principal: number;
  tea: number;
  tem: number;
  totalInstallments: number;
  currency: CurrencyCode;
  totalInterest: number;
  totalInsurance: number;
  totalFees: number;
  totalPayable: number;
  firstDueDate: DateOnly;
  lastDueDate: DateOnly;
  isZeroInterestPromo: boolean;
  modality: PurchaseFinancingModality;
  completeness: ContractualCompleteness;
  rows: SmartInstallmentRow[];
}

export interface SmartSimulationResult {
  isSimulation: true;
  schedule: SmartInstallmentSchedule;
  totalPrincipal: number;
  totalInterest: number;
  totalInsurance: number;
  totalFees: number;
  totalCost: number;
  firstDueDate: DateOnly;
  lastDueDate: DateOnly;
  estimatedTcea: number | null;
  monthlyCashFlowImpact: Array<{ month: string; amount: number }>;
  completeness: ContractualCompleteness;
}

export interface ReconciliationTransactionItem {
  id: string;
  fecha: string;
  concepto: string;
  monto: number;
  categoria?: string;
  tipo?: string;
}

export interface ReconciliationReport {
  cardEntity: string;
  cycleKey: string;
  periodStart?: string;
  periodEnd?: string;
  dueDate?: string;
  statementDebtConfirmed: number;
  finperCalculatedDebt: number;
  variance: number; // statementDebt - finperCalculated
  reconciliationStatus: 'CONCILIADO' | 'DISCREPANCIA_MAYOR_BANCO' | 'DISCREPANCIA_MAYOR_FINPER';
  diagnosticMessage: string;
  includedPurchasesCount: number;
  totalPurchasesAmount: number;
  allocatedPaymentsCount: number;
  totalPaymentsAmount: number;
  suggestedAction?: string;
}

export const CONTRACTUAL_WARNING_MESSAGE = 'Estimación incompleta: faltan datos contractuales';

/**
 * Valida si los términos contractuales de una tarjeta están completos para cálculos financieros.
 * - 'zero_interest_promo' o 'direct': no requieren TEA obligatoria para la simulación inicial.
 * - 'revolving_financed': requiere TEA y seguro de desgravamen contractuales.
 */
export function validateCardContractualRates(
  rates?: CardContractualRates,
  isZeroInterestPromoOrModality: boolean | PurchaseFinancingModality = false,
): ContractualCompleteness {
  const isExempt = typeof isZeroInterestPromoOrModality === 'string'
    ? (isZeroInterestPromoOrModality === 'zero_interest_promo' || isZeroInterestPromoOrModality === 'direct')
    : isZeroInterestPromoOrModality;

  if (isExempt) {
    return {
      isComplete: true,
      missingTerms: [],
    };
  }

  const missing: string[] = [];
  if (!rates) {
    return {
      isComplete: false,
      missingTerms: ['tea', 'debtInsuranceMonthlyRate'],
      warningMessage: CONTRACTUAL_WARNING_MESSAGE,
    };
  }

  if (typeof rates.tea !== 'number' || rates.tea <= 0) {
    missing.push('TEA (Tasa Efectiva Anual)');
  }
  if (typeof rates.debtInsuranceMonthlyRate !== 'number') {
    missing.push('Seguro de Desgravamen mensual');
  }

  if (missing.length > 0) {
    return {
      isComplete: false,
      missingTerms: missing,
      warningMessage: CONTRACTUAL_WARNING_MESSAGE,
    };
  }

  return {
    isComplete: true,
    missingTerms: [],
  };
}

/**
 * Resuelve la fecha de vencimiento y mes de pago para un consumo con tarjeta.
 * Si purchaseDay < cutoffDay: Pertenece al ciclo actual y vence el mes siguiente (mes + 1).
 * Si purchaseDay >= cutoffDay: Pertenece al ciclo nuevo y vence en 2 meses (mes + 2).
 */
export function resolveCardPaymentCycle(
  purchaseDate: DateOnly,
  rule: BillingRule,
): BillingCycleResult {
  return calculateBillingCycle(purchaseDate, rule);
}

/**
 * Genera el cronograma de cuotas puro de tarjeta inteligente.
 * Maneja 1 cuota (directa), promociones a 0% de interés (3 cuotas sin intereses) y cuotas con interés (francés).
 */
export function buildSmartInstallmentSchedule(params: {
  purchaseId?: string;
  cardId: string;
  purchaseDate: DateOnly;
  amount: number;
  installmentsCount: number;
  rule: BillingRule;
  rates?: CardContractualRates;
  isZeroInterestPromo?: boolean;
  currency?: CurrencyCode;
  dataStatus?: FinancialDataState;
}): SmartInstallmentSchedule {
  const {
    purchaseId,
    cardId,
    purchaseDate,
    amount,
    rule,
    rates,
    currency = 'PEN',
    dataStatus = 'calculated',
  } = params;

  const installmentsCount = Math.max(1, Math.floor(params.installmentsCount || 1));

  let modality: PurchaseFinancingModality;
  if (params.isZeroInterestPromo || rates?.tea === 0) {
    modality = 'zero_interest_promo';
  } else if (installmentsCount === 1) {
    modality = 'direct';
  } else {
    modality = 'revolving_financed';
  }

  const isZeroInterestPromo = modality === 'zero_interest_promo';
  const completeness = validateCardContractualRates(rates, modality);

  const tea = isZeroInterestPromo ? 0 : Math.max(0, rates?.tea ?? 0);
  const tem = tea > 0 ? convertTeaToTem(tea) : 0;
  const insuranceRate = isZeroInterestPromo ? 0 : Math.max(0, rates?.debtInsuranceMonthlyRate ?? 0);
  const fixedMonthlyFee = Math.max(0, rates?.monthlyFixedFee ?? 0);

  const initialCycle = calculateBillingCycle(purchaseDate, rule);
  const firstDueDate = initialCycle.dueDate;

  if (amount <= 0) {
    return {
      purchaseId,
      cardId,
      principal: 0,
      tea: 0,
      tem: 0,
      totalInstallments: installmentsCount,
      currency,
      totalInterest: 0,
      totalInsurance: 0,
      totalFees: 0,
      totalPayable: 0,
      firstDueDate,
      lastDueDate: firstDueDate,
      isZeroInterestPromo,
      modality,
      completeness,
      rows: [],
    };
  }

  // CASO 1: Compra directa (1 cuota pagada al vencimiento del ciclo sin financiamiento rotatorio)
  if (modality === 'direct') {
    const insurancePayment = roundMoney(amount * insuranceRate);
    const feesPayment = roundMoney(fixedMonthlyFee);
    const totalInstallment = roundMoney(amount + insurancePayment + feesPayment);

    const rows: SmartInstallmentRow[] = [{
      installmentNumber: 1,
      dueDate: firstDueDate,
      billingMonth: firstDueDate.slice(0, 7),
      initialBalance: amount,
      principalPayment: amount,
      interestPayment: 0,
      insurancePayment,
      feesPayment,
      totalInstallment,
      finalBalance: 0,
      dataStatus,
    }];

    return {
      purchaseId,
      cardId,
      principal: amount,
      tea: 0,
      tem: 0,
      totalInstallments: 1,
      currency,
      totalInterest: 0,
      totalInsurance: insurancePayment,
      totalFees: feesPayment,
      totalPayable: totalInstallment,
      firstDueDate,
      lastDueDate: firstDueDate,
      isZeroInterestPromo: false,
      modality: 'direct',
      completeness,
      rows,
    };
  }

  // CASO 2: Promoción a cuotas sin interés (0% TEA contractual)
  if (modality === 'zero_interest_promo') {
    const allocatedPrincipal = allocateMoney(amount, installmentsCount);
    let currentBalanceMinor = toMinorUnits(amount);
    let totalInsurance = 0;
    let totalFees = 0;
    const rows: SmartInstallmentRow[] = [];

    for (let i = 1; i <= installmentsCount; i++) {
      const currentDueDate = i === 1 ? firstDueDate : addMonthsKeepingDay(firstDueDate, i - 1, rule.dueDay);
      const initialBalance = fromMinorUnits(currentBalanceMinor);
      const principalPayment = allocatedPrincipal[i - 1];
      const insurancePayment = roundMoney(initialBalance * insuranceRate);
      const feesPayment = roundMoney(fixedMonthlyFee);
      const totalInstallment = roundMoney(principalPayment + insurancePayment + feesPayment);

      currentBalanceMinor = Math.max(0, currentBalanceMinor - toMinorUnits(principalPayment));
      const finalBalance = i === installmentsCount ? 0 : fromMinorUnits(currentBalanceMinor);

      totalInsurance = roundMoney(totalInsurance + insurancePayment);
      totalFees = roundMoney(totalFees + feesPayment);

      rows.push({
        installmentNumber: i,
        dueDate: currentDueDate,
        billingMonth: currentDueDate.slice(0, 7),
        initialBalance,
        principalPayment,
        interestPayment: 0,
        insurancePayment,
        feesPayment,
        totalInstallment,
        finalBalance,
        dataStatus,
      });
    }

    const lastDueDate = rows[rows.length - 1]?.dueDate ?? firstDueDate;
    const totalPayable = roundMoney(amount + totalInsurance + totalFees);

    return {
      purchaseId,
      cardId,
      principal: amount,
      tea: 0,
      tem: 0,
      totalInstallments: installmentsCount,
      currency,
      totalInterest: 0,
      totalInsurance,
      totalFees,
      totalPayable,
      firstDueDate,
      lastDueDate,
      isZeroInterestPromo: true,
      modality: 'zero_interest_promo',
      completeness,
      rows,
    };
  }

  // CASO 2: Cuotas con financiamiento e intereses (Sistema Francés)
  const levelPayment = tem > 0
    ? amount * ((tem * Math.pow(1 + tem, installmentsCount)) / (Math.pow(1 + tem, installmentsCount) - 1))
    : (amount / installmentsCount);
  let balance = amount;
  let totalInterest = 0;
  let totalInsurance = 0;
  let totalFees = 0;
  const rows: SmartInstallmentRow[] = [];

  for (let i = 1; i <= installmentsCount; i++) {
    const currentDueDate = i === 1 ? firstDueDate : addMonthsKeepingDay(firstDueDate, i - 1, rule.dueDay);
    const isLast = i === installmentsCount;

    const interestPayment = roundMoney(balance * tem);
    const insurancePayment = roundMoney(balance * insuranceRate);
    const feesPayment = roundMoney(fixedMonthlyFee);

    let principalPayment = isLast ? roundMoney(balance) : roundMoney(levelPayment - interestPayment);
    if (principalPayment > balance) principalPayment = roundMoney(balance);

    const initialBalance = roundMoney(balance);
    balance = Math.max(0, roundMoney(balance - principalPayment));
    const finalBalance = isLast ? 0 : balance;

    const totalInstallment = roundMoney(principalPayment + interestPayment + insurancePayment + feesPayment);

    totalInterest = roundMoney(totalInterest + interestPayment);
    totalInsurance = roundMoney(totalInsurance + insurancePayment);
    totalFees = roundMoney(totalFees + feesPayment);

    rows.push({
      installmentNumber: i,
      dueDate: currentDueDate,
      billingMonth: currentDueDate.slice(0, 7),
      initialBalance,
      principalPayment,
      interestPayment,
      insurancePayment,
      feesPayment,
      totalInstallment,
      finalBalance,
      dataStatus,
    });
  }

  const lastDueDate = rows[rows.length - 1]?.dueDate ?? firstDueDate;
  const totalPayable = roundMoney(amount + totalInterest + totalInsurance + totalFees);

  return {
    purchaseId,
    cardId,
    principal: amount,
    tea,
    tem,
    totalInstallments: installmentsCount,
    currency,
    totalInterest,
    totalInsurance,
    totalFees,
    totalPayable,
    firstDueDate,
    lastDueDate,
    isZeroInterestPromo: false,
    modality: 'revolving_financed',
    completeness,
    rows,
  };
}

/**
 * SIMULADOR FINANCIERO PURO
 * Ejecuta una simulación hipotética completamente desacoplada de los registros reales.
 * Jamás muta estados ni escribe en bases de datos.
 */
export function simulateCardPurchase(params: {
  cardId: string;
  amount: number;
  installmentsCount: number;
  purchaseDate: DateOnly;
  rule: BillingRule;
  rates?: CardContractualRates;
  promoZeroInterest?: boolean;
  currency?: CurrencyCode;
}): SmartSimulationResult {
  const schedule = buildSmartInstallmentSchedule({
    cardId: params.cardId,
    purchaseDate: params.purchaseDate,
    amount: params.amount,
    installmentsCount: params.installmentsCount,
    rule: params.rule,
    rates: params.rates,
    isZeroInterestPromo: params.promoZeroInterest,
    currency: params.currency ?? 'PEN',
    dataStatus: 'hypothetical',
  });

  const monthlyCashFlowImpact = schedule.rows.map(row => ({
    month: row.billingMonth,
    amount: row.totalInstallment,
  }));

  // Estimación referencial de TCEA si los datos están completos y hay financiamiento
  let estimatedTcea: number | null = null;
  if (schedule.isZeroInterestPromo) {
    estimatedTcea = 0;
  } else if (schedule.completeness.isComplete && schedule.tea > 0) {
    const totalAdditionalCost = schedule.totalInsurance + schedule.totalFees;
    const additionalAnnualFactor = schedule.principal > 0 ? (totalAdditionalCost / schedule.principal) * (12 / schedule.totalInstallments) : 0;
    estimatedTcea = roundMoney(schedule.tea + additionalAnnualFactor);
  }

  return {
    isSimulation: true,
    schedule,
    totalPrincipal: schedule.principal,
    totalInterest: schedule.totalInterest,
    totalInsurance: schedule.totalInsurance,
    totalFees: schedule.totalFees,
    totalCost: schedule.totalPayable,
    firstDueDate: schedule.firstDueDate,
    lastDueDate: schedule.lastDueDate,
    estimatedTcea,
    monthlyCashFlowImpact,
    completeness: schedule.completeness,
  };
}

/**
 * MOTOR DE CONCILIACIÓN BANCARIA DE TARJETAS
 * Compara los cálculos de FINPER contra el estado de cuenta bancario confirmado.
 * Identifica discrepancias sin alterar los datos originales.
 */
export function reconcileCardCycle(params: {
  cardEntity: string;
  cycleKey: string;
  statementDebtConfirmed: number;
  periodStart?: string;
  periodEnd?: string;
  dueDate?: string;
  purchasesInCycle: ReconciliationTransactionItem[];
  paymentsInCycle: ReconciliationTransactionItem[];
}): ReconciliationReport {
  const {
    cardEntity,
    cycleKey,
    statementDebtConfirmed,
    periodStart,
    periodEnd,
    dueDate,
    purchasesInCycle,
    paymentsInCycle,
  } = params;

  const totalPurchasesAmount = roundMoney(purchasesInCycle.reduce((sum, p) => sum + p.monto, 0));
  const totalPaymentsAmount = roundMoney(paymentsInCycle.reduce((sum, p) => sum + p.monto, 0));
  const finperCalculatedDebt = totalPurchasesAmount;
  const variance = roundMoney(statementDebtConfirmed - finperCalculatedDebt);

  let reconciliationStatus: ReconciliationReport['reconciliationStatus'] = 'CONCILIADO';
  let diagnosticMessage = 'El cálculo de FINPER coincide exactamente con el saldo confirmado del banco.';
  let suggestedAction: string | undefined = undefined;

  if (Math.abs(variance) > 0.05) {
    if (variance > 0) {
      reconciliationStatus = 'DISCREPANCIA_MAYOR_BANCO';
      diagnosticMessage = `El banco registra S/ ${variance.toFixed(2)} más que FINPER. Posibles compras omitidas, cobros de membresía, seguro de desgravamen o intereses del ciclo.`;
      suggestedAction = 'Revisar si hay comisiones bancarias, desgravamen o consumos con tarjeta que aún no registraste en FINPER.';
    } else {
      reconciliationStatus = 'DISCREPANCIA_MAYOR_FINPER';
      diagnosticMessage = `FINPER registra S/ ${Math.abs(variance).toFixed(2)} más que el banco. Posibles compras duplicadas, devoluciones acreditadas o consumos registrados en fecha posterior al corte.`;
      suggestedAction = 'Verificar si existen consumos duplicados en este ciclo o devoluciones recibidas en tu tarjeta.';
    }
  }

  return {
    cardEntity,
    cycleKey,
    periodStart,
    periodEnd,
    dueDate,
    statementDebtConfirmed,
    finperCalculatedDebt,
    variance,
    reconciliationStatus,
    diagnosticMessage,
    includedPurchasesCount: purchasesInCycle.length,
    totalPurchasesAmount,
    allocatedPaymentsCount: paymentsInCycle.length,
    totalPaymentsAmount,
    suggestedAction,
  };
}

/**
 * CONECTOR DE PROYECCIONES: OBLIGACIONES DE TARJETA A MULTI-HORIZONTE (3, 6, 12, 24 MESES)
 * Garantiza la separación entre gasto económico y salida de efectivo:
 * - El gasto económico ya ocurrió en la fecha de compra.
 * - La salida de efectivo ocurre en la fecha límite de pago del estado de cuenta / cuota.
 */
export interface CardMonthlyCashOutflow {
  cardEntity: string;
  billingMonth: string; // YYYY-MM
  dueDate: string; // YYYY-MM-DD
  installmentObligations: number;
  revolvingDirectObligations: number;
  totalCashOutflow: number;
  isConfirmed: boolean;
}

export function aggregateCardObligationsForMonth(
  cardEntity: string,
  targetMonth: string, // YYYY-MM
  dueDetails: {
    totalAPagar: number;
    fechaPago: string;
    consumos: Array<{ id: string; monto: number; origen: string }>;
  },
  confirmedDebt?: number,
): CardMonthlyCashOutflow {
  const isConfirmed = typeof confirmedDebt === 'number';
  const effectiveDebt = isConfirmed ? confirmedDebt : dueDetails.totalAPagar;

  return {
    cardEntity,
    billingMonth: targetMonth,
    dueDate: dueDetails.fechaPago,
    installmentObligations: roundMoney(effectiveDebt),
    revolvingDirectObligations: 0,
    totalCashOutflow: roundMoney(effectiveDebt),
    isConfirmed,
  };
}

/**
 * ============================================================================
 * CLASIFICACIÓN Y EVALUACIÓN DETERMINÍSTICA DE PAGOS DE TARJETAS
 * ============================================================================
 */
export type CardPaymentClassification = 'pago_parcial' | 'pago_total' | 'pago_con_excedente' | 'invalido';

export interface CardPaymentEvaluation {
  isValid: boolean;
  classification: CardPaymentClassification;
  pendingDebt: number;
  paymentAmount: number;
  remainingDebt: number;
  excessAmount: number;
  requiresExcessConfirmation: boolean;
  canProceed: boolean;
  statusBadge: {
    label: string;
    variant: 'amber' | 'emerald' | 'blue' | 'rose';
  };
  summaryMessage: string;
  errorMessage?: string;
}

export function evaluateCardPayment(params: {
  pendingDebt: number;
  paymentAmount: number | string;
  confirmExcess?: boolean;
}): CardPaymentEvaluation {
  const pendingDebt = roundMoney(Math.max(0, params.pendingDebt || 0));
  const rawAmount = typeof params.paymentAmount === 'string'
    ? parseFloat(params.paymentAmount.trim())
    : params.paymentAmount;

  if (isNaN(rawAmount) || !Number.isFinite(rawAmount) || rawAmount <= 0) {
    return {
      isValid: false,
      classification: 'invalido',
      pendingDebt,
      paymentAmount: 0,
      remainingDebt: pendingDebt,
      excessAmount: 0,
      requiresExcessConfirmation: false,
      canProceed: false,
      statusBadge: {
        label: 'Monto Inválido',
        variant: 'rose',
      },
      summaryMessage: 'El monto del pago debe ser un número positivo mayor a S/ 0.00.',
      errorMessage: 'El monto ingresado no es válido.',
    };
  }

  const paymentAmount = roundMoney(rawAmount);

  // Caso 1: Pago Parcial (paymentAmount < pendingDebt)
  if (paymentAmount < pendingDebt - 0.005) {
    const remainingDebt = roundMoney(pendingDebt - paymentAmount);
    return {
      isValid: true,
      classification: 'pago_parcial',
      pendingDebt,
      paymentAmount,
      remainingDebt,
      excessAmount: 0,
      requiresExcessConfirmation: false,
      canProceed: true,
      statusBadge: {
        label: `Pago Parcial (Pendiente: S/ ${remainingDebt.toFixed(2)})`,
        variant: 'amber',
      },
      summaryMessage: `Pago parcial de S/ ${paymentAmount.toFixed(2)} registrado. Queda un saldo pendiente de S/ ${remainingDebt.toFixed(2)}.`,
    };
  }

  // Caso 2: Pago Total (paymentAmount == pendingDebt)
  if (Math.abs(paymentAmount - pendingDebt) <= 0.005) {
    return {
      isValid: true,
      classification: 'pago_total',
      pendingDebt,
      paymentAmount,
      remainingDebt: 0,
      excessAmount: 0,
      requiresExcessConfirmation: false,
      canProceed: true,
      statusBadge: {
        label: 'Pago Total (Deuda Saldada 100%)',
        variant: 'emerald',
      },
      summaryMessage: `Pago total de S/ ${paymentAmount.toFixed(2)} registrado. La deuda del ciclo quedó cancelada en su totalidad.`,
    };
  }

  // Caso 3: Pago Superior al Pendiente (paymentAmount > pendingDebt)
  const excessAmount = roundMoney(paymentAmount - pendingDebt);
  const isConfirmed = Boolean(params.confirmExcess);
  return {
    isValid: true,
    classification: 'pago_con_excedente',
    pendingDebt,
    paymentAmount,
    remainingDebt: 0,
    excessAmount,
    requiresExcessConfirmation: true,
    canProceed: isConfirmed,
    statusBadge: {
      label: `Excedente: +S/ ${excessAmount.toFixed(2)} a favor`,
      variant: 'blue',
    },
    summaryMessage: `El pago de S/ ${paymentAmount.toFixed(2)} supera la deuda en S/ ${excessAmount.toFixed(2)} (saldo a favor / pago adelantado).`,
  };
}

/**
 * ============================================================================
 * EVALUACIÓN Y TRAZABILIDAD DE CONCILIACIÓN BANCARIA
 * ============================================================================
 */
export type ReconciliationVerificationStatus = 'draft' | 'user_declared' | 'statement_verified' | 'disputed';
export type StatementInformationSource = 'manual_entry' | 'statement_file' | 'external';

export interface ReconciliationEvaluation {
  canSave: boolean;
  isDebtZero: boolean;
  requiresZeroConfirmation: boolean;
  verificationStatus: ReconciliationVerificationStatus;
  source: StatementInformationSource;
  parsedDebt: number | null;
  parsedMinPayment: number | undefined;
  variance: number;
  reconciliationStatus: ReconciliationReport['reconciliationStatus'];
  statusBadge: {
    label: string;
    variant: 'amber' | 'emerald' | 'blue' | 'rose' | 'slate';
  };
  validationError?: string;
  displayDocumentRef?: string;
}

export function evaluateReconciliationInput(params: {
  statementDebtStr: string;
  minPaymentStr?: string;
  calculatedDebt: number;
  documentReference?: string;
  isDocumentIdentified?: boolean;
  confirmZeroDebt?: boolean;
  isDisputed?: boolean;
}): ReconciliationEvaluation {
  const rawDebtStr = params.statementDebtStr.trim();
  const calculatedDebt = roundMoney(params.calculatedDebt || 0);

  // 1. Campo vacío
  if (rawDebtStr === '') {
    return {
      canSave: false,
      isDebtZero: false,
      requiresZeroConfirmation: false,
      verificationStatus: 'draft',
      source: 'manual_entry',
      parsedDebt: null,
      parsedMinPayment: undefined,
      variance: 0,
      reconciliationStatus: 'CONCILIADO',
      statusBadge: {
        label: 'Pendiente de Ingresar',
        variant: 'slate',
      },
      validationError: 'Ingresa el saldo total facturado según tu estado de cuenta.',
    };
  }

  const parsedDebt = parseFloat(rawDebtStr);

  // 2. Monto numérico inválido
  if (isNaN(parsedDebt) || !Number.isFinite(parsedDebt) || parsedDebt < 0) {
    return {
      canSave: false,
      isDebtZero: false,
      requiresZeroConfirmation: false,
      verificationStatus: 'draft',
      source: 'manual_entry',
      parsedDebt: null,
      parsedMinPayment: undefined,
      variance: 0,
      reconciliationStatus: 'CONCILIADO',
      statusBadge: {
        label: 'Importe Inválido',
        variant: 'rose',
      },
      validationError: 'El monto ingresado debe ser un número mayor o igual a S/ 0.00.',
    };
  }

  const finalDebt = roundMoney(parsedDebt);
  const isDebtZero = finalDebt === 0;
  const requiresZeroConfirmation = isDebtZero;

  // Validación de pago mínimo opcional
  let parsedMinPayment: number | undefined = undefined;
  if (params.minPaymentStr && params.minPaymentStr.trim() !== '') {
    const rawMin = parseFloat(params.minPaymentStr.trim());
    if (!isNaN(rawMin) && Number.isFinite(rawMin) && rawMin >= 0) {
      parsedMinPayment = roundMoney(rawMin);
    }
  }

  // Trazabilidad de verificación
  let verificationStatus: ReconciliationVerificationStatus = 'user_declared';
  let source: StatementInformationSource = 'manual_entry';
  let displayDocumentRef: string | undefined = undefined;

  if (params.isDisputed) {
    verificationStatus = 'disputed';
  } else if (params.isDocumentIdentified && params.documentReference && params.documentReference.trim() !== '') {
    verificationStatus = 'statement_verified';
    source = 'statement_file';
    displayDocumentRef = params.documentReference.trim();
  }

  const variance = roundMoney(finalDebt - calculatedDebt);
  let reconciliationStatus: ReconciliationReport['reconciliationStatus'] = 'CONCILIADO';
  if (Math.abs(variance) > 0.05) {
    reconciliationStatus = variance > 0 ? 'DISCREPANCIA_MAYOR_BANCO' : 'DISCREPANCIA_MAYOR_FINPER';
  }

  const canSave = !requiresZeroConfirmation || Boolean(params.confirmZeroDebt);

  let badgeVariant: 'amber' | 'emerald' | 'blue' | 'rose' | 'slate' = 'slate';
  let badgeLabel = 'Declaración Manual';

  if (verificationStatus === 'statement_verified') {
    badgeVariant = 'emerald';
    badgeLabel = `Doc. Verificado (${displayDocumentRef})`;
  } else if (verificationStatus === 'disputed') {
    badgeVariant = 'rose';
    badgeLabel = 'En Disputa Bancaria';
  } else {
    badgeVariant = 'amber';
    badgeLabel = 'Declarado por Usuario (Sin Documento)';
  }

  return {
    canSave,
    isDebtZero,
    requiresZeroConfirmation,
    verificationStatus,
    source,
    parsedDebt: finalDebt,
    parsedMinPayment,
    variance,
    reconciliationStatus,
    statusBadge: {
      label: badgeLabel,
      variant: badgeVariant,
    },
    displayDocumentRef,
  };
}
