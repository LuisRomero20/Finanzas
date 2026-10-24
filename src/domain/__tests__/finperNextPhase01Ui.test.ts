import { describe, it, expect } from 'vitest';
import { generateFinancialBriefing } from '../alerts/obligationAlertsEngine';
import { SCENARIO_NOV_2026_ROWS } from './obligationAlerts.test';
import { useCreditLineStore } from '../../store/creditLineStore';
import { DEFAULT_CARDS } from '../../store/creditCardStore';

describe('FINPER NEXT — Fase 1 (UI Profesional & Simplificación)', () => {
  it('1.1 & 1.2: El motor de briefing distingue cero real de ausencia de datos y no dispara falsa alarma de déficit', () => {
    const emptyBriefing = generateFinancialBriefing({
      projectedRows: [],
      executedTransactions: [],
    });

    expect(emptyBriefing.liquidityStatus).toBe('insufficient_data');
    expect(emptyBriefing.liquidityAlertMessage).toBeUndefined();
    expect(emptyBriefing.monthlyProjectedBalance).toBe(0);
  });

  it('1.2: Escenario de regresión obligatoria Noviembre 2026 intacto (23 partidas, -S/ 221.42)', () => {
    expect(SCENARIO_NOV_2026_ROWS).toHaveLength(23);

    const briefingNov = generateFinancialBriefing({
      projectedRows: SCENARIO_NOV_2026_ROWS,
      executedTransactions: [],
      targetMonth: '2026-11',
    });

    expect(briefingNov.monthlyProjectedIncome).toBe(4007.32);
    expect(briefingNov.monthlyProjectedExpense).toBe(4228.74);
    expect(briefingNov.monthlyProjectedBalance).toBe(-221.42);
    expect(briefingNov.liquidityStatus).toBe('deficit');
    expect(briefingNov.liquidityAlertMessage).toContain('Déficit mensual proyectado de S/ 221.42');
  });

  it('1.3 & 1.4: Diferenciación nítida entre cuentas bancarias líquidas y líneas de crédito de tarjetas', () => {
    const lines = useCreditLineStore.getState().lines;

    // Tarjetas tienen límites autorizados
    expect(lines['BBVA Bfree']).toBeDefined();
    expect(lines['Interbank Amex']).toBeDefined();
    expect(lines['Ripley']).toBeDefined();

    // Las tarjetas de DEFAULT_CARDS tienen reglas de facturación y días de pago
    const bbva = DEFAULT_CARDS.find(c => c.entity === 'BBVA Bfree');
    expect(bbva?.cycleStartDay).toBe(10);
    expect(bbva?.paymentDay).toBe(5);

    const amex = DEFAULT_CARDS.find(c => c.entity === 'Interbank Amex');
    expect(amex?.cycleStartDay).toBe(21);
    expect(amex?.paymentDay).toBe(15);

    const ripley = DEFAULT_CARDS.find(c => c.entity === 'Ripley');
    expect(ripley?.cycleStartDay).toBe(3);
    expect(ripley?.paymentDay).toBe(1);
  });
});
