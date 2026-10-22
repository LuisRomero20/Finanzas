import { describe, expect, it } from 'vitest';
import { useProjectionStore } from '../../store/projectionStore';

describe('useProjectionStore - getMultiHorizon', () => {
  it('computes 3, 6, 12, and 24 month projections with detailed traceability', () => {
    const store = useProjectionStore.getState();

    const horizon3 = store.getMultiHorizon('2026-10', 3, 1000);
    expect(horizon3.horizonMonths).toBe(3);
    expect(horizon3.months).toHaveLength(3);
    expect(horizon3.initialLiquidBalance).toBe(1000);

    const horizon6 = store.getMultiHorizon('2026-10', 6, 1000);
    expect(horizon6.horizonMonths).toBe(6);
    expect(horizon6.months).toHaveLength(6);

    const horizon12 = store.getMultiHorizon('2026-10', 12, 1000);
    expect(horizon12.horizonMonths).toBe(12);
    expect(horizon12.months).toHaveLength(12);

    const horizon24 = store.getMultiHorizon('2026-10', 24, 1000);
    expect(horizon24.horizonMonths).toBe(24);
    expect(horizon24.months).toHaveLength(24);

    // Each month must have traceability details
    for (const m of horizon3.months) {
      expect(Array.isArray(m.traceability.details)).toBe(true);
      expect(typeof m.projectedCumulativeLiquidity).toBe('number');
    }
  });

  it('evaluates simulated hypothetical purchases without modifying store items', () => {
    const store = useProjectionStore.getState();
    const originalItemCount = store.items.length;

    const simulatedResult = store.getMultiHorizon('2026-10', 3, 2000, [
      {
        id: 'hypothetical-purchase-1',
        tipo: 'Egreso',
        categoria: 'Tecnología',
        concepto: 'Monitor 4K',
        monto: 1200,
        entidad: 'BBVA Bfree',
        dia: 15,
        mesInicio: '2026-11',
        recurrencia: 'unico',
      },
    ]);

    // Store items must remain unchanged
    expect(store.items.length).toBe(originalItemCount);

    // Simulated month (2026-11) must reflect simulated purchase
    const monthNov = simulatedResult.months.find((m) => m.month === '2026-11');
    expect(monthNov).toBeDefined();
    expect(monthNov!.simulatedPurchases).toBe(1200);
    expect(monthNov!.traceability.simulationItemsCount).toBe(1);
  });
});
