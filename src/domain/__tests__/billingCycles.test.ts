import { describe, expect, it } from 'vitest';
import { calculateBillingCycle, formatDateOnly, moveWeekendToMonday } from '../cards/billingCycles';

describe('credit-card billing cycles', () => {
  const bbva = { cutoffDay: 10, dueDay: 5 };

  it('assigns a purchase before cutoff to the next due month', () => {
    expect(calculateBillingCycle('2026-09-05', bbva)).toMatchObject({
      periodStart: '2026-08-10',
      periodEnd: '2026-09-09',
      dueDate: '2026-10-05',
    });
  });

  it('treats the cutoff date as the first day of a new cycle by default', () => {
    expect(calculateBillingCycle('2026-09-10', bbva).dueDate).toBe('2026-11-05');
  });

  it('supports banks that keep cutoff-day purchases in the closing cycle', () => {
    const result = calculateBillingCycle('2026-09-10', { ...bbva, purchaseOnCutoffStartsNewCycle: false });
    expect(result.dueDate).toBe('2026-10-05');
  });

  it('crosses December into the next year', () => {
    expect(calculateBillingCycle('2026-12-16', bbva).dueDate).toBe('2027-02-05');
  });

  it('clamps days that do not exist in February, including leap years', () => {
    expect(formatDateOnly(2027, 2, 31)).toBe('2027-02-28');
    expect(formatDateOnly(2028, 2, 31)).toBe('2028-02-29');
  });

  it('uses confirmed statement dates instead of calculated approximations', () => {
    const result = calculateBillingCycle('2026-09-12', bbva, [{
      periodStart: '2026-09-10',
      periodEnd: '2026-10-11',
      dueDate: '2026-11-07',
    }]);
    expect(result.source).toBe('confirmed_override');
    expect(result.dueDate).toBe('2026-11-07');
  });

  it('moves weekend dates only when the configured policy requests it', () => {
    expect(moveWeekendToMonday('2026-12-05')).toBe('2026-12-07');
    expect(calculateBillingCycle('2026-10-11', { ...bbva, moveWeekendDueDateToMonday: true }).dueDate).toBe('2026-12-07');
  });
});
