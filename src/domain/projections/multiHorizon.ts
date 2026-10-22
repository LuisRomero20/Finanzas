import { roundMoney, toMinorUnits, fromMinorUnits } from '../finance/money';
import { parseDateOnly } from '../cards/billingCycles';

export type ProjectionHorizonMonths = 3 | 6 | 12 | 24;

export interface MonthlyBucketBreakdown {
  month: string; // YYYY-MM
  monthIndex: number; // 0..11
  year: number;

  // 1. Histórico confirmado (ejecutado)
  historicalIncome: number;
  historicalExpense: number;
  historicalNet: number;

  // 2. Obligaciones confirmadas (cuotas de tarjetas ya emitidas, deudas fijas)
  confirmedCardObligations: number;
  confirmedLoanObligations: number;
  totalConfirmedObligations: number;

  // 3. Gastos e ingresos futuros estimados (recurrentes fijos/temporales)
  estimatedIncome: number;
  estimatedFixedExpenses: number;
  estimatedVariableExpenses: number;
  totalEstimatedExpenses: number;

  // 4. Simulaciones hipotéticas (compras en cuotas simuladas, prepagos)
  simulatedPurchases: number;
  simulatedSavingsOrPrepayments: number;
  netSimulatedImpact: number;

  // Totales proyectados del mes
  projectedTotalIncome: number;
  projectedTotalOutflow: number;
  projectedMonthlyNet: number;
  projectedCumulativeLiquidity: number;

  // Trazabilidad de partidas que alimentan el mes
  traceability: {
    confirmedItemsCount: number;
    estimatedItemsCount: number;
    simulationItemsCount: number;
    details: Array<{
      source: 'historical' | 'obligation' | 'estimate' | 'simulation';
      concept: string;
      category: string;
      amount: number;
      entity: string;
      dueDate?: string;
    }>;
  };
}

export interface MultiHorizonProjectionResult {
  horizonMonths: ProjectionHorizonMonths;
  startMonth: string; // YYYY-MM
  endMonth: string; // YYYY-MM
  initialLiquidBalance: number;
  finalProjectedLiquidBalance: number;
  lowestProjectedBalance: {
    month: string;
    balance: number;
  };
  months: MonthlyBucketBreakdown[];
}

export interface RawProjectionInputItem {
  id: string;
  source: 'historical' | 'obligation' | 'estimate' | 'simulation';
  type: 'Ingreso' | 'Egreso';
  month: string; // YYYY-MM
  date?: string; // YYYY-MM-DD
  concept: string;
  category: string;
  entity: string;
  amount: number;
  isInstallment?: boolean;
}

/**
 * Genera la secuencia de meses 'YYYY-MM' para el horizonte dado a partir del mes base.
 */
export function getHorizonMonthList(baseMonth: string, horizonMonths: ProjectionHorizonMonths): string[] {
  const parts = parseDateOnly(`${baseMonth}-01`);
  const months: string[] = [];

  for (let i = 0; i < horizonMonths; i++) {
    const rawMonth = parts.month - 1 + i;
    const year = parts.year + Math.floor(rawMonth / 12);
    const month = (rawMonth % 12) + 1;
    months.push(`${year}-${String(month).padStart(2, '0')}`);
  }

  return months;
}

/**
 * Calcula la proyección multihorizonte estructurada con trazabilidad y separación estricta
 * entre histórico, obligaciones confirmadas, estimados futuros y simulaciones.
 */
export function calculateMultiHorizonProjection(
  baseMonth: string,
  horizonMonths: ProjectionHorizonMonths,
  initialLiquidCash: number,
  items: readonly RawProjectionInputItem[],
): MultiHorizonProjectionResult {
  const monthList = getHorizonMonthList(baseMonth, horizonMonths);
  let runningCumulativeMinor = toMinorUnits(initialLiquidCash);

  let lowestBalance = initialLiquidCash;
  let lowestMonth = monthList[0];

  const monthlyResults: MonthlyBucketBreakdown[] = monthList.map((month) => {
    const monthItems = items.filter((item) => item.month === month);

    let histIncMinor = 0;
    let histExpMinor = 0;
    let oblCardMinor = 0;
    let oblLoanMinor = 0;
    let estIncMinor = 0;
    let estFixedExpMinor = 0;
    let estVarExpMinor = 0;
    let simPurchMinor = 0;
    let simSaveMinor = 0;

    const details: MonthlyBucketBreakdown['traceability']['details'] = [];
    let confCount = 0;
    let estCount = 0;
    let simCount = 0;

    for (const item of monthItems) {
      const amtMinor = toMinorUnits(Math.abs(item.amount));
      details.push({
        source: item.source,
        concept: item.concept,
        category: item.category,
        amount: item.amount,
        entity: item.entity,
        dueDate: item.date,
      });

      if (item.source === 'historical') {
        if (item.type === 'Ingreso') histIncMinor += amtMinor;
        else histExpMinor += amtMinor;
      } else if (item.source === 'obligation') {
        confCount++;
        const isCard = /tarjeta|amex|bfree|ripley|visa|mastercard/i.test(item.entity) || /tarjeta/i.test(item.category);
        if (isCard) oblCardMinor += amtMinor;
        else oblLoanMinor += amtMinor;
      } else if (item.source === 'estimate') {
        estCount++;
        if (item.type === 'Ingreso') {
          estIncMinor += amtMinor;
        } else {
          const isFixed = /vivienda|alquiler|servicios|luz|agua|internet|seguro/i.test(item.category);
          if (isFixed) estFixedExpMinor += amtMinor;
          else estVarExpMinor += amtMinor;
        }
      } else if (item.source === 'simulation') {
        simCount++;
        if (item.type === 'Egreso') simPurchMinor += amtMinor;
        else simSaveMinor += amtMinor;
      }
    }

    const totalIncomeMinor = histIncMinor + estIncMinor + simSaveMinor;
    const totalOutflowMinor = histExpMinor + oblCardMinor + oblLoanMinor + estFixedExpMinor + estVarExpMinor + simPurchMinor;
    const monthlyNetMinor = totalIncomeMinor - totalOutflowMinor;

    runningCumulativeMinor += monthlyNetMinor;
    const currentCumulative = fromMinorUnits(runningCumulativeMinor);

    if (currentCumulative < lowestBalance) {
      lowestBalance = currentCumulative;
      lowestMonth = month;
    }

    const [yStr, mStr] = month.split('-');
    const year = Number(yStr);
    const monthIndex = Number(mStr) - 1;

    return {
      month,
      monthIndex,
      year,
      historicalIncome: fromMinorUnits(histIncMinor),
      historicalExpense: fromMinorUnits(histExpMinor),
      historicalNet: fromMinorUnits(histIncMinor - histExpMinor),
      confirmedCardObligations: fromMinorUnits(oblCardMinor),
      confirmedLoanObligations: fromMinorUnits(oblLoanMinor),
      totalConfirmedObligations: fromMinorUnits(oblCardMinor + oblLoanMinor),
      estimatedIncome: fromMinorUnits(estIncMinor),
      estimatedFixedExpenses: fromMinorUnits(estFixedExpMinor),
      estimatedVariableExpenses: fromMinorUnits(estVarExpMinor),
      totalEstimatedExpenses: fromMinorUnits(estFixedExpMinor + estVarExpMinor),
      simulatedPurchases: fromMinorUnits(simPurchMinor),
      simulatedSavingsOrPrepayments: fromMinorUnits(simSaveMinor),
      netSimulatedImpact: fromMinorUnits(simSaveMinor - simPurchMinor),
      projectedTotalIncome: fromMinorUnits(totalIncomeMinor),
      projectedTotalOutflow: fromMinorUnits(totalOutflowMinor),
      projectedMonthlyNet: fromMinorUnits(monthlyNetMinor),
      projectedCumulativeLiquidity: currentCumulative,
      traceability: {
        confirmedItemsCount: confCount,
        estimatedItemsCount: estCount,
        simulationItemsCount: simCount,
        details,
      },
    };
  });

  return {
    horizonMonths,
    startMonth: monthList[0],
    endMonth: monthList[monthList.length - 1],
    initialLiquidBalance: roundMoney(initialLiquidCash),
    finalProjectedLiquidBalance: fromMinorUnits(runningCumulativeMinor),
    lowestProjectedBalance: {
      month: lowestMonth,
      balance: roundMoney(lowestBalance),
    },
    months: monthlyResults,
  };
}
