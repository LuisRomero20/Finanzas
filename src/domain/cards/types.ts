import type { BillingCycleResult, DateOnly } from './billingCycles';
import { roundMoney, toMinorUnits, fromMinorUnits } from '../finance/money';
import { convertTeaToTem } from '../finance/rates';
import { addMonthsKeepingDay, calculateBillingCycle } from './billingCycles';

export type CreditCardIssuer = 'Ripley' | 'Interbank' | 'BBVA' | 'Otro';

export type CreditCardVariant =
  | 'Ripley Mastercard'
  | 'Interbank Amex Benefit'
  | 'BBVA Bfree'
  | string;

export type CreditCardNetwork = 'Mastercard' | 'American Express' | 'Visa' | 'Otra';

export type CurrencyCode = 'PEN' | 'USD';

export interface CardBillingRuleConfig {
  cutoffDay: number;
  dueDay: number;
  purchaseOnCutoffStartsNewCycle?: boolean;
  moveWeekendDueDateToMonday?: boolean;
}

export interface CardFinancialRates {
  tea: number; // Tasa Efectiva Anual de compras
  tcea?: number; // Tasa de Costo Efectivo Anual
  debtInsuranceMonthlyRate?: number; // Tasa mensual de seguro de desgravamen (ej. 0.0039 para 0.39%)
  monthlyFixedFee?: number; // Membresía o comisión de administración mensual
}

export interface CreditCard {
  id: string;
  issuer: CreditCardIssuer;
  name: string;
  productVariant: CreditCardVariant;
  network: CreditCardNetwork;
  currency: CurrencyCode;
  creditLimit: number; // Línea total autorizada
  availableCredit: number; // Línea disponible
  currentBalance: number; // Saldo deudor acumulado actual
  billingCycle: CardBillingRuleConfig;
  financialRates: CardFinancialRates;
  billingRulesStatus: 'unverified' | 'user_confirmed' | 'statement_confirmed';
  status: 'active' | 'blocked' | 'closed';
  metadata?: Record<string, unknown>;
}

export interface CardPurchase {
  id: string;
  cardId: string;
  purchaseType: 'direct' | 'installments';
  date: DateOnly; // YYYY-MM-DD
  merchant: string;
  category: string;
  originalAmount: number;
  currency: CurrencyCode;
  installmentsCount: number; // 1 para directa, >=2 para compras en cuotas
  annualEffectiveRate: number; // TEA aplicable (0 para cuotas sin intereses)
  monthlyRate: number; // TEM derivada
  billingCycle: BillingCycleResult;
  status: 'pending' | 'billed' | 'amortizing' | 'paid' | 'cancelled';
  statementId?: string;
}

export interface InstallmentScheduleRow {
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
  status: 'pending' | 'due' | 'paid' | 'overdue';
}

export interface InstallmentSchedule {
  purchaseId: string;
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
  rows: InstallmentScheduleRow[];
}

export interface CardStatement {
  id: string;
  cardId: string;
  period: string; // YYYY-MM
  periodStart: DateOnly;
  periodEnd: DateOnly; // Fecha de corte
  dueDate: DateOnly; // Fecha límite de pago
  currency: CurrencyCode;
  previousBalance: number;
  periodPurchases: number;
  interestAndFees: number;
  paymentsAndCredits: number;
  finalDebt: number; // Saldo total del mes
  minimumPayment: number; // Pago mínimo reglamentario
  status: 'open' | 'closed' | 'paid' | 'partially_paid' | 'overdue';
  verifiedAt?: string;
}

/**
 * Genera el cronograma de amortización puro para una compra con tarjeta en cuotas.
 * Maneja compras directas (1 cuota), promociones a cuotas sin intereses (TEA 0%),
 * y financiamiento con intereses y seguro de desgravamen.
 */
export function buildCardInstallmentSchedule(
  purchase: {
    id: string;
    cardId: string;
    date: DateOnly;
    amount: number;
    installmentsCount: number;
    tea?: number;
    currency?: CurrencyCode;
    insuranceMonthlyRate?: number;
    fixedMonthlyFee?: number;
  },
  cardRule: CardBillingRuleConfig,
): InstallmentSchedule {
  const { id, cardId, date, amount } = purchase;
  const installmentsCount = Math.max(1, Math.floor(purchase.installmentsCount || 1));
  const tea = Math.max(0, purchase.tea ?? 0);
  const tem = tea > 0 ? convertTeaToTem(tea) : 0;
  const insuranceRate = Math.max(0, purchase.insuranceMonthlyRate ?? 0);
  const fixedFee = Math.max(0, purchase.fixedMonthlyFee ?? 0);
  const currency: CurrencyCode = purchase.currency ?? 'PEN';

  const initialCycle = calculateBillingCycle(date, cardRule);
  const firstDueDate = initialCycle.dueDate;

  if (amount <= 0) {
    return {
      purchaseId: id,
      cardId,
      principal: 0,
      tea,
      tem,
      totalInstallments: installmentsCount,
      currency,
      totalInterest: 0,
      totalInsurance: 0,
      totalFees: 0,
      totalPayable: 0,
      rows: [],
    };
  }

  // Caso A: Compra directa (1 cuota) o Promoción 0% de interés
  if (installmentsCount === 1 || tea === 0) {
    const principalMinor = toMinorUnits(amount);
    const baseMinor = Math.floor(principalMinor / installmentsCount);
    const remainder = principalMinor % installmentsCount;

    let balanceMinor = principalMinor;
    const totalInterest = 0;
    let totalInsurance = 0;
    let totalFees = 0;
    const rows: InstallmentScheduleRow[] = [];

    for (let i = 1; i <= installmentsCount; i++) {
      const currentDueDate = i === 1 ? firstDueDate : addMonthsKeepingDay(firstDueDate, i - 1, cardRule.dueDay);
      const isLast = i === installmentsCount;
      const principalPortionMinor = isLast ? balanceMinor : baseMinor + (i <= remainder ? 1 : 0);
      const initialBalance = fromMinorUnits(balanceMinor);
      const principalPayment = fromMinorUnits(principalPortionMinor);
      const insurancePayment = roundMoney(initialBalance * insuranceRate);
      const feesPayment = roundMoney(fixedFee);
      const totalInstallment = roundMoney(principalPayment + insurancePayment + feesPayment);

      balanceMinor -= principalPortionMinor;
      const finalBalance = fromMinorUnits(Math.max(0, balanceMinor));

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
        status: 'pending',
      });
    }

    return {
      purchaseId: id,
      cardId,
      principal: amount,
      tea,
      tem,
      totalInstallments: installmentsCount,
      currency,
      totalInterest,
      totalInsurance,
      totalFees,
      totalPayable: roundMoney(amount + totalInterest + totalInsurance + totalFees),
      rows,
    };
  }

  // Caso B: Cuotas regulares con intereses bancarios (método francés)
  const factor = Math.pow(1 + tem, installmentsCount);
  const levelPayment = amount * ((tem * factor) / (factor - 1));
  let currentBalance = amount;
  let totalInterest = 0;
  let totalInsurance = 0;
  let totalFees = 0;
  const rows: InstallmentScheduleRow[] = [];

  for (let i = 1; i <= installmentsCount; i++) {
    const currentDueDate = i === 1 ? firstDueDate : addMonthsKeepingDay(firstDueDate, i - 1, cardRule.dueDay);
    const isLast = i === installmentsCount;

    const interestPayment = roundMoney(currentBalance * tem);
    const insurancePayment = roundMoney(currentBalance * insuranceRate);
    const feesPayment = roundMoney(fixedFee);

    let principalPayment = isLast ? roundMoney(currentBalance) : roundMoney(levelPayment - interestPayment);
    if (principalPayment > currentBalance) principalPayment = roundMoney(currentBalance);

    const totalInstallment = roundMoney(principalPayment + interestPayment + insurancePayment + feesPayment);
    const initialBalance = roundMoney(currentBalance);
    currentBalance = Math.max(0, roundMoney(currentBalance - principalPayment));

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
      finalBalance: currentBalance,
      status: 'pending',
    });
  }

  return {
    purchaseId: id,
    cardId,
    principal: amount,
    tea,
    tem,
    totalInstallments: installmentsCount,
    currency,
    totalInterest,
    totalInsurance,
    totalFees,
    totalPayable: roundMoney(amount + totalInterest + totalInsurance + totalFees),
    rows,
  };
}

/**
 * Calcula el pago mínimo bancario reglamentario para tarjetas de crédito (normativa SBS Perú):
 * Pago Mínimo = Cuota del mes de compras en cuotas + Máximo(1/36 de deuda revolvente, S/ 30 o equivalente).
 */
export function calculateMinimumPayment(
  revolvingBalance: number,
  installmentDueThisMonth: number,
  currency: CurrencyCode = 'PEN',
): number {
  if (revolvingBalance <= 0 && installmentDueThisMonth <= 0) return 0;
  const revolvingPortion = revolvingBalance > 0 ? revolvingBalance / 36 : 0;
  const floorThreshold = currency === 'USD' ? 10 : 30; // S/ 30 o $10
  const effectiveRevolving = revolvingBalance > 0 ? Math.max(revolvingPortion, Math.min(revolvingBalance, floorThreshold)) : 0;
  return roundMoney(effectiveRevolving + Math.max(0, installmentDueThisMonth));
}
