import { describe, expect, it } from 'vitest';
import { allocateMoney, roundMoney, sumMoney, toMinorUnits } from '../finance/money';

describe('money arithmetic', () => {
  it('rounds decimal amounts to integer cents', () => {
    expect(toMinorUnits(10.1 + 20.2)).toBe(3030);
    expect(roundMoney(1.005)).toBe(1.01);
  });

  it('allocates residual cents without changing the total', () => {
    const installments = allocateMoney(100, 3);
    expect(installments).toEqual([33.33, 33.33, 33.34]);
    expect(sumMoney(installments)).toBe(100);
  });

  it('supports refunds while preserving the exact total', () => {
    const allocations = allocateMoney(-10, 3);
    expect(allocations).toEqual([-3.33, -3.33, -3.34]);
    expect(sumMoney(allocations)).toBe(-10);
  });
});
