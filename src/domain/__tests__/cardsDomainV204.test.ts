import { describe, it, expect } from 'vitest';
import {
  buildCardInstallmentSchedule,
  calculateMinimumPayment,
  type CardBillingRuleConfig,
} from '../cards/types';

describe('Credit Cards Domain Models (FINPER 2.1 Contracts)', () => {
  const defaultRule: CardBillingRuleConfig = {
    cutoffDay: 20,
    dueDay: 15,
  };

  it('generates accurate schedule for 1 installment (direct purchase) with 0 interest', () => {
    const schedule = buildCardInstallmentSchedule(
      {
        id: 'tx-direct-1',
        cardId: 'card-ibk-amex',
        date: '2026-10-05',
        amount: 350.50,
        installmentsCount: 1,
        tea: 0,
      },
      defaultRule,
    );

    expect(schedule.totalInstallments).toBe(1);
    expect(schedule.principal).toBe(350.50);
    expect(schedule.totalInterest).toBe(0);
    expect(schedule.totalPayable).toBe(350.50);
    expect(schedule.rows).toHaveLength(1);
    expect(schedule.rows[0].principalPayment).toBe(350.50);
    expect(schedule.rows[0].dueDate).toBe('2026-11-15');
    expect(schedule.rows[0].finalBalance).toBe(0);
  });

  it('correctly handles 0% interest promotion (e.g. 3 cuotas sin intereses en Ripley)', () => {
    const schedule = buildCardInstallmentSchedule(
      {
        id: 'tx-promo-zero',
        cardId: 'card-ripley',
        date: '2026-10-02',
        amount: 1000,
        installmentsCount: 3,
        tea: 0,
      },
      { cutoffDay: 3, dueDay: 1 },
    );

    expect(schedule.totalInstallments).toBe(3);
    expect(schedule.totalInterest).toBe(0);
    expect(schedule.totalPayable).toBe(1000);
    expect(schedule.rows).toHaveLength(3);

    // Sum of principal parts must exactly equal 1000
    const sumPrincipal = schedule.rows.reduce((sum, r) => sum + r.principalPayment, 0);
    expect(Number(sumPrincipal.toFixed(2))).toBe(1000);

    // First due date is 2026-11-01 (purchase before cutoff 3)
    expect(schedule.rows[0].dueDate).toBe('2026-11-01');
    expect(schedule.rows[1].dueDate).toBe('2026-12-01');
    expect(schedule.rows[2].dueDate).toBe('2027-01-01');
    expect(schedule.rows[2].finalBalance).toBe(0);
  });

  it('computes French amortization schedule with TEA and debt insurance', () => {
    const schedule = buildCardInstallmentSchedule(
      {
        id: 'tx-financed-1',
        cardId: 'card-bbva-bfree',
        date: '2026-10-15',
        amount: 2400,
        installmentsCount: 6,
        tea: 0.35, // 35% TEA
        insuranceMonthlyRate: 0.0039, // 0.39% mensual
        fixedMonthlyFee: 5.0, // S/ 5 comisión
      },
      { cutoffDay: 10, dueDay: 5 },
    );

    expect(schedule.totalInstallments).toBe(6);
    expect(schedule.tea).toBe(0.35);
    expect(schedule.tem).toBeGreaterThan(0.02); // ~2.5% monthly
    expect(schedule.totalInterest).toBeGreaterThan(0);
    expect(schedule.totalInsurance).toBeGreaterThan(0);
    expect(schedule.totalFees).toBe(30.0); // 6 * 5.0
    expect(schedule.totalPayable).toBeGreaterThan(2400);

    // Final balance of last row must be 0
    expect(schedule.rows[schedule.rows.length - 1].finalBalance).toBe(0);
  });

  it('handles edge case: zero amount or negative values gracefully', () => {
    const schedule = buildCardInstallmentSchedule(
      {
        id: 'tx-zero',
        cardId: 'card-ibk',
        date: '2026-10-10',
        amount: 0,
        installmentsCount: 0,
      },
      defaultRule,
    );

    expect(schedule.principal).toBe(0);
    expect(schedule.rows).toHaveLength(0);
    expect(schedule.totalPayable).toBe(0);
  });

  it('correctly shifts month days across short months (Feb 28, Apr 30, Oct 31)', () => {
    const rule31: CardBillingRuleConfig = { cutoffDay: 31, dueDay: 31 };
    const schedule = buildCardInstallmentSchedule(
      {
        id: 'tx-dates',
        cardId: 'card-test',
        date: '2026-12-15',
        amount: 400,
        installmentsCount: 4,
        tea: 0,
      },
      rule31,
    );

    expect(schedule.rows[0].dueDate).toBe('2027-01-31');
    expect(schedule.rows[1].dueDate).toBe('2027-02-28'); // Non-leap 2027 Feb has 28 days!
    expect(schedule.rows[2].dueDate).toBe('2027-03-31');
    expect(schedule.rows[3].dueDate).toBe('2027-04-30'); // April has 30 days!
  });

  it('calculates minimum payment according to SBS regulations', () => {
    // Case 1: Revolving debt only S/ 1,800 => 1800/36 = 50 (higher than floor 30)
    const min1 = calculateMinimumPayment(1800, 0, 'PEN');
    expect(min1).toBe(50);

    // Case 2: Revolving debt S/ 360 => 360/36 = 10 (< floor 30, so capped at 30)
    const min2 = calculateMinimumPayment(360, 0, 'PEN');
    expect(min2).toBe(30);

    // Case 3: Revolving debt S/ 20 => floor is 30, but balance is only 20, so min payment is 20
    const min3 = calculateMinimumPayment(20, 0, 'PEN');
    expect(min3).toBe(20);

    // Case 4: Revolving debt S/ 1,800 + cuota fija del mes S/ 250
    const min4 = calculateMinimumPayment(1800, 250, 'PEN');
    expect(min4).toBe(300); // 50 + 250

    // Case 5: Zero balance
    const min5 = calculateMinimumPayment(0, 0, 'PEN');
    expect(min5).toBe(0);
  });
});
