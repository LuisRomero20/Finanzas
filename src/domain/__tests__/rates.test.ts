import { describe, expect, it } from 'vitest';
import {
  convertTeaToTem,
  convertTemToTea,
  calculateFrenchInstallment,
  generateAmortizationSchedule,
  simulatePrepayment,
} from '../finance/rates';
import { sumMoney } from '../finance/money';

describe('Financial Engine - Rates and Amortization', () => {
  it('converts TEA to TEM and back accurately', () => {
    const tea = 0.35; // 35% TEA
    const tem = convertTeaToTem(tea);
    // (1 + 0.35)^(1/12) - 1 ≈ 0.025324
    expect(tem).toBeCloseTo(0.025324, 5);

    const backToTea = convertTemToTea(tem);
    expect(backToTea).toBeCloseTo(tea, 6);
  });

  it('handles zero rate edge case gracefully', () => {
    expect(convertTeaToTem(0)).toBe(0);
    expect(convertTemToTea(0)).toBe(0);
    expect(calculateFrenchInstallment(1200, 0, 12)).toBe(100);
  });

  it('calculates French installment with precision', () => {
    const principal = 10000;
    const tem = convertTeaToTem(0.24); // 24% TEA
    const installment = calculateFrenchInstallment(principal, tem, 12);
    expect(installment).toBeGreaterThan(900);
    expect(installment).toBeLessThan(1000);
  });

  it('generates a full amortization schedule where principal is fully paid down without cent leakage', () => {
    const principal = 5000;
    const tea = 0.28;
    const installments = 6;
    const schedule = generateAmortizationSchedule(principal, tea, installments, {
      startDate: '2026-10-05',
      preferredPaymentDay: 5,
      debtInsuranceMonthlyRate: 0.0035, // 0.35% mensual
      monthlyFixedFee: 10,
    });

    expect(schedule.rows).toHaveLength(6);
    expect(schedule.rows[schedule.rows.length - 1].finalBalance).toBe(0);

    // Sum of principal payments must equal the original principal exactly
    const totalPrincipalPaid = sumMoney(schedule.rows.map((r) => r.principalPayment));
    expect(totalPrincipalPaid).toBe(principal);

    // Each row's dates follow the preferred day across month and year boundaries
    expect(schedule.rows[0].dueDate).toBe('2026-11-05');
    expect(schedule.rows[1].dueDate).toBe('2026-12-05');
    expect(schedule.rows[2].dueDate).toBe('2027-01-05'); // Year crossover!
    expect(schedule.rows[3].dueDate).toBe('2027-02-05');
  });

  it('simulates prepayment reducing term while calculating interest savings', () => {
    const principal = 10000;
    const tea = 0.30;
    const totalInstallments = 12;

    const simulation = simulatePrepayment(
      principal,
      tea,
      totalInstallments,
      3, // Prepago en cuota 3
      3000, // Amortización extraordinaria de S/ 3,000
      'reduce_term',
      { startDate: '2026-10-01' },
    );

    expect(simulation.interestSaved).toBeGreaterThan(0);
    expect(simulation.newDurationMonths).toBeLessThan(totalInstallments);
    expect(simulation.monthsReduced).toBeGreaterThan(0);
    expect(simulation.newTotalInterest).toBeLessThan(simulation.originalTotalInterest);
  });

  it('simulates prepayment reducing monthly installment while keeping duration', () => {
    const principal = 8000;
    const tea = 0.25;
    const totalInstallments = 10;

    const simulation = simulatePrepayment(
      principal,
      tea,
      totalInstallments,
      2,
      2500,
      'reduce_installment',
      { startDate: '2026-10-01' },
    );

    expect(simulation.interestSaved).toBeGreaterThan(0);
    expect(simulation.newDurationMonths).toBe(totalInstallments);
    expect(simulation.monthsReduced).toBe(0);
  });
});
