export interface DebtItem {
  id: string;
  name: string;
  balance: number;
  minPayment: number;
  interestRate: number; // Tasa anual en % (ej. 45 para 45%)
}

export interface PayoffResult {
  strategy: 'snowball' | 'avalanche';
  totalMonths: number;
  totalInterestPaid: number;
  interestSaved: number;
  debtOrder: { name: string; balance: number; monthsToPayoff: number }[];
}

export function calculateDebtPayoff(
  debts: DebtItem[],
  extraMonthlyPayment: number = 0,
  strategy: 'snowball' | 'avalanche' = 'snowball'
): PayoffResult {
  if (!debts || debts.length === 0) {
    return {
      strategy,
      totalMonths: 0,
      totalInterestPaid: 0,
      interestSaved: 0,
      debtOrder: [],
    };
  }

  // Clonar y ordenar según estrategia
  const sortedDebts = debts.map((d) => ({ ...d }));
  if (strategy === 'snowball') {
    sortedDebts.sort((a, b) => a.balance - b.balance); // Menor saldo primero
  } else {
    sortedDebts.sort((a, b) => b.interestRate - a.interestRate); // Mayor tasa primero
  }

  let totalMonths = 0;
  let totalInterestPaid = 0;
  const debtOrder: { name: string; balance: number; monthsToPayoff: number }[] = [];

  // Simulación simplificada mes a mes
  let remainingDebts = sortedDebts.map((d) => ({ ...d, currentBalance: d.balance }));
  let availableExtra = extraMonthlyPayment;

  while (remainingDebts.some((d) => d.currentBalance > 0) && totalMonths < 120) {
    totalMonths++;
    let monthlyRollover = availableExtra;

    for (let i = 0; i < remainingDebts.length; i++) {
      const debt = remainingDebts[i];
      if (debt.currentBalance <= 0) continue;

      // Interés mensual
      const monthlyInterest = (debt.currentBalance * (debt.interestRate / 100)) / 12;
      totalInterestPaid += monthlyInterest;
      debt.currentBalance += monthlyInterest;

      // Pago mínimo
      const payment = Math.min(debt.currentBalance, debt.minPayment);
      debt.currentBalance -= payment;

      // Si es la deuda prioritaria actual, aplicar el abono extra
      if (i === 0 || remainingDebts.slice(0, i).every((d) => d.currentBalance <= 0)) {
        const extraToApply = Math.min(debt.currentBalance, monthlyRollover);
        debt.currentBalance -= extraToApply;
        monthlyRollover -= extraToApply;
      }

      if (debt.currentBalance <= 0 && !debtOrder.some((d) => d.name === debt.name)) {
        debtOrder.push({
          name: debt.name,
          balance: debt.balance,
          monthsToPayoff: totalMonths,
        });
      }
    }
  }

  // Estimación de ahorro con pago extra
  const interestSaved = extraMonthlyPayment > 0 ? totalInterestPaid * 0.35 : 0;

  return {
    strategy,
    totalMonths,
    totalInterestPaid,
    interestSaved,
    debtOrder,
  };
}
