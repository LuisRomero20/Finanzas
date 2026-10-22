import { describe, expect, it } from 'vitest';
import {
  getHorizonMonthList,
  calculateMultiHorizonProjection,
  RawProjectionInputItem,
} from '../projections/multiHorizon';

describe('Financial Engine - Multi-Horizon Projections (3, 6, 12, 24 months)', () => {
  it('generates the exact sequence of months for 3, 6, 12, and 24 month horizons across year boundaries', () => {
    const list3 = getHorizonMonthList('2026-11', 3);
    expect(list3).toEqual(['2026-11', '2026-12', '2027-01']);

    const list6 = getHorizonMonthList('2026-10', 6);
    expect(list6).toEqual(['2026-10', '2026-11', '2026-12', '2027-01', '2027-02', '2027-03']);

    const list12 = getHorizonMonthList('2026-10', 12);
    expect(list12).toHaveLength(12);
    expect(list12[11]).toBe('2027-09');

    const list24 = getHorizonMonthList('2026-10', 24);
    expect(list24).toHaveLength(24);
    expect(list24[23]).toBe('2028-09');
  });

  it('correctly aggregates distinct buckets: historical, obligations, estimates, and simulations', () => {
    const items: RawProjectionInputItem[] = [
      {
        id: 'h1',
        source: 'historical',
        type: 'Ingreso',
        month: '2026-10',
        concept: 'Sueldo Octubre',
        category: 'Ingreso Trabajo',
        entity: 'BCP',
        amount: 8000,
      },
      {
        id: 'o1',
        source: 'obligation',
        type: 'Egreso',
        month: '2026-11',
        concept: 'Cuota 2/6 Laptop',
        category: 'Tecnología',
        entity: 'Interbank Amex',
        amount: 650,
      },
      {
        id: 'e1',
        source: 'estimate',
        type: 'Egreso',
        month: '2026-11',
        concept: 'Alquiler',
        category: 'Vivienda',
        entity: 'BCP',
        amount: 2200,
      },
      {
        id: 's1',
        source: 'simulation',
        type: 'Egreso',
        month: '2026-11',
        concept: 'Viaje simulado',
        category: 'Ocio',
        entity: 'BBVA Bfree',
        amount: 1500,
      },
    ];

    const result = calculateMultiHorizonProjection('2026-10', 3, 5000, items);

    expect(result.horizonMonths).toBe(3);
    expect(result.startMonth).toBe('2026-10');
    expect(result.endMonth).toBe('2026-12');

    // Month 1 (2026-10): only historical income 8000 + initial 5000 = 13000
    expect(result.months[0].historicalIncome).toBe(8000);
    expect(result.months[0].projectedCumulativeLiquidity).toBe(13000);

    // Month 2 (2026-11):
    // obligations: 650
    // estimates: 2200
    // simulations: 1500
    // total outflow: 4350
    // net: -4350
    // cumulative: 13000 - 4350 = 8650
    expect(result.months[1].confirmedCardObligations).toBe(650);
    expect(result.months[1].estimatedFixedExpenses).toBe(2200);
    expect(result.months[1].simulatedPurchases).toBe(1500);
    expect(result.months[1].projectedMonthlyNet).toBe(-4350);
    expect(result.months[1].projectedCumulativeLiquidity).toBe(8650);

    // Traceability details must record all 3 items for month 2026-11
    expect(result.months[1].traceability.details).toHaveLength(3);
    expect(result.months[1].traceability.confirmedItemsCount).toBe(1);
    expect(result.months[1].traceability.estimatedItemsCount).toBe(1);
    expect(result.months[1].traceability.simulationItemsCount).toBe(1);
  });
});
