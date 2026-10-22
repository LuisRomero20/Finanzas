import { roundMoney, toMinorUnits, fromMinorUnits } from './money';
import { addMonthsKeepingDay, parseDateOnly } from '../cards/billingCycles';

export interface AmortizationRow {
  installmentNumber: number;
  dueDate: string; // YYYY-MM-DD
  initialBalance: number;
  principalPayment: number;
  interestPayment: number;
  insurancePayment: number;
  feesPayment: number;
  totalInstallment: number;
  finalBalance: number;
}

export interface AmortizationSchedule {
  principal: number;
  tea: number; // Tasa Efectiva Anual (ej. 0.35 para 35%)
  tem: number; // Tasa Efectiva Mensual
  totalInstallments: number;
  monthlyInstallmentEstimate: number;
  totalInterest: number;
  totalInsurance: number;
  totalFees: number;
  totalPayable: number;
  rows: AmortizationRow[];
}

export interface PrepaymentSimulationResult {
  originalTotalInterest: number;
  newTotalInterest: number;
  interestSaved: number;
  originalDurationMonths: number;
  newDurationMonths: number;
  monthsReduced: number;
  schedule: AmortizationRow[];
}

export interface LoanOptions {
  startDate?: string; // YYYY-MM-DD
  preferredPaymentDay?: number;
  debtInsuranceMonthlyRate?: number; // Ej. 0.0035 para 0.35% mensual de seguro de desgravamen
  monthlyFixedFee?: number; // Cuota de mantenimiento/comisión fija mensual
}

/**
 * Convierte Tasa Efectiva Anual (TEA) a Tasa Efectiva Mensual (TEM).
 * Fórmula: TEM = (1 + TEA)^(1/12) - 1
 */
export function convertTeaToTem(tea: number): number {
  if (tea < 0) throw new RangeError('La TEA no puede ser negativa.');
  if (tea === 0) return 0;
  return Math.pow(1 + tea, 1 / 12) - 1;
}

/**
 * Convierte Tasa Efectiva Mensual (TEM) a Tasa Efectiva Anual (TEA).
 * Fórmula: TEA = (1 + TEM)^12 - 1
 */
export function convertTemToTea(tem: number): number {
  if (tem < 0) throw new RangeError('La TEM no puede ser negativa.');
  if (tem === 0) return 0;
  return Math.pow(1 + tem, 12) - 1;
}

/**
 * Calcula cuota periódica según el sistema francés (cuota nivelada).
 */
export function calculateFrenchInstallment(principal: number, tem: number, installments: number): number {
  if (installments <= 0 || !Number.isInteger(installments)) {
    throw new RangeError('El número de cuotas debe ser un entero positivo.');
  }
  if (principal <= 0) return 0;
  if (tem === 0) return roundMoney(principal / installments);

  const factor = Math.pow(1 + tem, installments);
  const cuota = principal * ((tem * factor) / (factor - 1));
  return roundMoney(cuota);
}

/**
 * Genera el cronograma de amortización detallado (método francés) con fechas y precisión monetaria.
 */
export function generateAmortizationSchedule(
  principal: number,
  tea: number,
  installments: number,
  options: LoanOptions = {},
): AmortizationSchedule {
  if (principal < 0) throw new RangeError('El capital no puede ser negativo.');
  if (installments <= 0 || !Number.isInteger(installments)) {
    throw new RangeError('El número de cuotas debe ser un entero positivo.');
  }

  const tem = convertTeaToTem(tea);
  const baseInstallment = calculateFrenchInstallment(principal, tem, installments);
  const startDate = options.startDate ?? '2026-10-01';
  const startParts = parseDateOnly(startDate);
  const preferredDay = options.preferredPaymentDay ?? startParts.day;
  const insuranceRate = options.debtInsuranceMonthlyRate ?? 0;
  const fixedFee = roundMoney(options.monthlyFixedFee ?? 0);

  let currentBalanceMinor = toMinorUnits(principal);
  const rows: AmortizationRow[] = [];
  let totalInterestMinor = 0;
  let totalInsuranceMinor = 0;
  let totalFeesMinor = 0;
  let totalPayableMinor = 0;

  for (let k = 1; k <= installments; k++) {
    const dueDate = addMonthsKeepingDay(startDate, k, preferredDay);
    const initialBalance = fromMinorUnits(currentBalanceMinor);

    const interest = roundMoney(initialBalance * tem);
    const insurance = roundMoney(initialBalance * insuranceRate);
    const fees = fixedFee;

    let principalPayment: number;
    let finalBalanceMinor: number;

    if (k === installments) {
      // En la última cuota, el capital amortizado es exactamente el saldo restante
      principalPayment = initialBalance;
      finalBalanceMinor = 0;
    } else {
      principalPayment = roundMoney(baseInstallment - interest);
      if (principalPayment > initialBalance) {
        principalPayment = initialBalance;
      }
      finalBalanceMinor = currentBalanceMinor - toMinorUnits(principalPayment);
    }

    const totalInstallment = roundMoney(principalPayment + interest + insurance + fees);

    totalInterestMinor += toMinorUnits(interest);
    totalInsuranceMinor += toMinorUnits(insurance);
    totalFeesMinor += toMinorUnits(fees);
    totalPayableMinor += toMinorUnits(totalInstallment);
    currentBalanceMinor = Math.max(0, finalBalanceMinor);

    rows.push({
      installmentNumber: k,
      dueDate,
      initialBalance,
      principalPayment,
      interestPayment: interest,
      insurancePayment: insurance,
      feesPayment: fees,
      totalInstallment,
      finalBalance: fromMinorUnits(currentBalanceMinor),
    });
  }

  return {
    principal,
    tea,
    tem,
    totalInstallments: installments,
    monthlyInstallmentEstimate: baseInstallment,
    totalInterest: fromMinorUnits(totalInterestMinor),
    totalInsurance: fromMinorUnits(totalInsuranceMinor),
    totalFees: fromMinorUnits(totalFeesMinor),
    totalPayable: fromMinorUnits(totalPayableMinor),
    rows,
  };
}

/**
 * Simula un pago anticipado (amortización extraordinaria) sin modificar los datos reales.
 */
export function simulatePrepayment(
  principal: number,
  tea: number,
  totalInstallments: number,
  prepaymentInstallment: number,
  prepaymentAmount: number,
  mode: 'reduce_term' | 'reduce_installment',
  options: LoanOptions = {},
): PrepaymentSimulationResult {
  const original = generateAmortizationSchedule(principal, tea, totalInstallments, options);

  if (prepaymentInstallment < 1 || prepaymentInstallment >= totalInstallments) {
    throw new RangeError('El pago anticipado debe realizarse entre la cuota 1 y antes de la última cuota.');
  }

  const targetRow = original.rows[prepaymentInstallment - 1];
  const balanceBeforePrepayment = targetRow.finalBalance;

  if (prepaymentAmount <= 0 || prepaymentAmount >= balanceBeforePrepayment) {
    throw new RangeError('El monto de prepago debe ser mayor a 0 y menor al saldo deudor.');
  }

  const remainingPrincipal = roundMoney(balanceBeforePrepayment - prepaymentAmount);
  const remainingMonths = totalInstallments - prepaymentInstallment;
  const tem = convertTeaToTem(tea);
  const startDate = targetRow.dueDate;
  const preferredDay = options.preferredPaymentDay ?? parseDateOnly(startDate).day;

  let newRowsTail: AmortizationRow[] = [];

  if (mode === 'reduce_installment') {
    // Mantener plazo restante pero reducir cuota mensual
    const subSchedule = generateAmortizationSchedule(remainingPrincipal, tea, remainingMonths, {
      ...options,
      startDate,
      preferredPaymentDay: preferredDay,
    });
    newRowsTail = subSchedule.rows.map((r, i) => ({
      ...r,
      installmentNumber: prepaymentInstallment + i + 1,
    }));
  } else {
    // Reducir plazo manteniendo la cuota mensual original
    const originalInstallment = original.monthlyInstallmentEstimate;
    let currBalMinor = toMinorUnits(remainingPrincipal);
    let count = 0;
    while (currBalMinor > 0 && count < remainingMonths) {
      count++;
      const initBal = fromMinorUnits(currBalMinor);
      const interest = roundMoney(initBal * tem);
      const insurance = roundMoney(initBal * (options.debtInsuranceMonthlyRate ?? 0));
      const fees = roundMoney(options.monthlyFixedFee ?? 0);

      let princ = roundMoney(originalInstallment - interest);
      if (princ >= initBal || count === remainingMonths) {
        princ = initBal;
        currBalMinor = 0;
      } else {
        currBalMinor -= toMinorUnits(princ);
      }
      const tot = roundMoney(princ + interest + insurance + fees);
      newRowsTail.push({
        installmentNumber: prepaymentInstallment + count,
        dueDate: addMonthsKeepingDay(startDate, count, preferredDay),
        initialBalance: initBal,
        principalPayment: princ,
        interestPayment: interest,
        insurancePayment: insurance,
        feesPayment: fees,
        totalInstallment: tot,
        finalBalance: fromMinorUnits(Math.max(0, currBalMinor)),
      });
    }
  }

  const combinedRows = [...original.rows.slice(0, prepaymentInstallment), ...newRowsTail];
  const newTotalInterest = roundMoney(combinedRows.reduce((acc, r) => acc + r.interestPayment, 0));
  const interestSaved = roundMoney(Math.max(0, original.totalInterest - newTotalInterest));

  return {
    originalTotalInterest: original.totalInterest,
    newTotalInterest,
    interestSaved,
    originalDurationMonths: totalInstallments,
    newDurationMonths: combinedRows.length,
    monthsReduced: totalInstallments - combinedRows.length,
    schedule: combinedRows,
  };
}
