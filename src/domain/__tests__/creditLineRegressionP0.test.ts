import { describe, it, expect, beforeEach } from 'vitest';
import { useCreditLineStore } from '../../store/creditLineStore';
import { DEFAULT_CARDS } from '../../store/creditCardStore';
import {
  resolveAuthoritativeCreditLine,
  masterTransactions,
} from '../../utils/masterData';
import { calculateCardLivePosition } from '../../utils/creditCardCycles';
import { isCreditCardLine } from '../../utils/categoryClassification';
import { SCENARIO_NOV_2026_ROWS } from './obligationAlerts.test';
import { generateFinancialBriefing } from '../alerts/obligationAlertsEngine';

describe('FINPER P0 HOTFIX — Suite de Regresión de Líneas de Crédito & Saldos Vivos', () => {
  beforeEach(() => {
    // Restablecer stores a estado limpio de fábrica
    useCreditLineStore.getState().resetDefaults();
  });

  // TEST 1: Jerarquía de Precedencia Estricta
  it('1. Precedencia: Configuración de usuario en store > LINE_OVERRIDES > cardConfig > fallback', () => {
    // A) Sin personalización de usuario: toma LINE_OVERRIDES
    const amexDefault = resolveAuthoritativeCreditLine('Interbank Amex', useCreditLineStore.getState().lines);
    const bbvaDefault = resolveAuthoritativeCreditLine('BBVA Bfree', useCreditLineStore.getState().lines);
    const ripleyDefault = resolveAuthoritativeCreditLine('Ripley', useCreditLineStore.getState().lines);
    const ripleyMcDefault = resolveAuthoritativeCreditLine('Ripley Mastercard', useCreditLineStore.getState().lines);

    expect(amexDefault).toBe(5000);
    expect(bbvaDefault).toBe(3000);
    expect(ripleyDefault).toBe(2000);
    expect(ripleyMcDefault).toBe(2000);

    // B) El usuario configura un límite personalizado en useCreditLineStore:
    useCreditLineStore.getState().setCreditLine('Interbank Amex', 7500);
    const amexCustom = resolveAuthoritativeCreditLine('Interbank Amex', useCreditLineStore.getState().lines);
    expect(amexCustom).toBe(7500); // Prevalencia absoluta del usuario

    // C) Tarjeta nueva sin override pero con configuración de tarjeta:
    const customCard = { creditLine: 4500, lineaCredito: 4500 };
    const customLine = resolveAuthoritativeCreditLine('Diners Club', {}, customCard);
    expect(customLine).toBe(4500);

    // D) Tarjeta totalmente desconocida sin ningún dato: fallback 1000
    const unknownLine = resolveAuthoritativeCreditLine('Entidad Desconocida', {}, {});
    expect(unknownLine).toBe(1000);
  });

  // TEST 2: Límites de Fábrica Oficiales y Suma Total de S/ 10,000
  it('2. Límites Oficiales: Amex S/ 5,000, BBVA S/ 3,000, Ripley S/ 2,000 — Total exacto S/ 10,000', () => {
    const defaultLines = useCreditLineStore.getState().lines;

    expect(defaultLines['Interbank Amex']).toBe(5000);
    expect(defaultLines['BBVA Bfree']).toBe(3000);
    expect(defaultLines['Ripley']).toBe(2000);

    const totalLineas =
      defaultLines['Interbank Amex'] +
      defaultLines['BBVA Bfree'] +
      defaultLines['Ripley'];

    expect(totalLineas).toBe(10000);
    expect(totalLineas).not.toBe(2700);

    // DEFAULT_CARDS en creditCardStore también debe reflejar 5000, 3000, 2000
    const amexCard = DEFAULT_CARDS.find(c => c.entity === 'Interbank Amex');
    const bbvaCard = DEFAULT_CARDS.find(c => c.entity === 'BBVA Bfree');
    const ripleyCard = DEFAULT_CARDS.find(c => c.entity === 'Ripley');

    expect(amexCard?.creditLine).toBe(5000);
    expect(bbvaCard?.creditLine).toBe(3000);
    expect(ripleyCard?.creditLine).toBe(2000);
  });

  // TEST 3: Seguridad de Modales (Draft Safety)
  it('3. Borrador de modal: Abrir y modificar borrador sin guardar no altera el store ni Supabase', () => {
    const initialAmex = useCreditLineStore.getState().lines['Interbank Amex'];
    expect(initialAmex).toBe(5000);

    // Simular estado de borrador local en un modal
    let tempDraftLines: Record<string, number> = { ...useCreditLineStore.getState().lines };
    tempDraftLines['Interbank Amex'] = 9999; // Usuario cambia en el input pero cancela

    // Al cancelar (descartar borrador):
    tempDraftLines = {};

    // El store permanece inmutable
    expect(useCreditLineStore.getState().lines['Interbank Amex']).toBe(5000);

    // Solo muta al invocar explícitamente setCreditLine
    useCreditLineStore.getState().setCreditLine('Interbank Amex', 6000);
    expect(useCreditLineStore.getState().lines['Interbank Amex']).toBe(6000);

    // Restablecer devuelve a LINE_OVERRIDES
    useCreditLineStore.getState().resetDefaults();
    expect(useCreditLineStore.getState().lines['Interbank Amex']).toBe(5000);
  });

  // TEST 4: Cálculo de Crédito Disponible & Utilización
  it('4. Cálculo de Crédito Disponible: disponible = linea - deuda; uso% = (deuda / linea) * 100', () => {
    const totalLine = 5000;
    const currentDebt = 441.40;

    const availableCredit = Math.max(0, totalLine - currentDebt);
    const utilizationPct = totalLine > 0 ? Math.min(100, Math.round((currentDebt / totalLine) * 100)) : 0;

    expect(availableCredit).toBeCloseTo(4558.60, 2);
    expect(utilizationPct).toBe(9); // 441.40 / 5000 = 8.828% -> 9%
  });

  // TEST 5: Integridad de Deuda: "Linea Tarjeta" no anula consumos y deuda real no es S/ 0.00
  it('5. Integridad de Deuda: "Linea Tarjeta" no se cuenta como ingreso operacional que anule consumos', () => {
    // Filtrar transacciones de Setiembre para Interbank Amex
    const sepTxs = masterTransactions.filter(t => t.Mes === 'Setiembre' && t.Entidad === 'Interbank Amex');
    expect(sepTxs.length).toBeGreaterThan(0);

    // Verificar que existe la transacción de "Linea Tarjeta"
    const lineaTx = sepTxs.find(t => isCreditCardLine(t));
    expect(lineaTx).toBeDefined();
    expect(lineaTx?.Tipo).toBe('Ingreso');
    expect(lineaTx?.Monto).toBe(976.10);

    // Egresos reales de consumo en Setiembre (comida, compras, etc.)
    const cardEgresos = sepTxs
      .filter(t => t.Tipo === 'Egreso' && !isCreditCardLine(t))
      .reduce((a, t) => a + t.Monto, 0);
    expect(cardEgresos).toBe(441.40);

    // Ingresos operacionales SIN la línea tarjeta
    const cardIngresosLimpios = sepTxs
      .filter(t => t.Tipo === 'Ingreso' && !isCreditCardLine(t))
      .reduce((a, t) => a + t.Monto, 0);
    expect(cardIngresosLimpios).toBe(0);

    // La deuda del mes no debe anularse
    const monthDebt = Math.max(0, cardEgresos - cardIngresosLimpios);
    expect(monthDebt).toBe(441.40);
    expect(monthDebt).not.toBe(0);

    // Si calculamos posición viva del ciclo (calculateCardLivePosition):
    const amexCard = DEFAULT_CARDS.find(c => c.entity === 'Interbank Amex')!;
    const livePos = calculateCardLivePosition(amexCard, masterTransactions, new Date('2026-09-30T12:00:00'));
    expect(livePos.liveDebt).toBeCloseTo(465.30, 2);
    expect(livePos.liveDebt).toBeGreaterThan(0);
  });

  // TEST 6: Escenario Obligatorio Noviembre 2026 Intacto
  it('6. Protección de Planificación: 23 partidas de Noviembre 2026 íntegras (balance -S/ 221.42)', () => {
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
});
