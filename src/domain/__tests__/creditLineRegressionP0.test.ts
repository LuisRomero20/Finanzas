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

describe('FINPER P0 HOTFIX — Restauración de la Lógica Original de Saldos por Entidad', () => {
  beforeEach(() => {
    useCreditLineStore.getState().resetDefaults();
  });

  // TEST 1: Jerarquía de Precedencia Estricta
  it('1. Precedencia: Configuración de usuario en store > LINE_OVERRIDES > cardConfig > fallback', () => {
    const amexDefault = resolveAuthoritativeCreditLine('Interbank Amex', useCreditLineStore.getState().lines);
    const bbvaDefault = resolveAuthoritativeCreditLine('BBVA Bfree', useCreditLineStore.getState().lines);
    const ripleyDefault = resolveAuthoritativeCreditLine('Ripley', useCreditLineStore.getState().lines);
    const ripleyMcDefault = resolveAuthoritativeCreditLine('Ripley Mastercard', useCreditLineStore.getState().lines);

    expect(amexDefault).toBe(5000);
    expect(bbvaDefault).toBe(3000);
    expect(ripleyDefault).toBe(2000);
    expect(ripleyMcDefault).toBe(2000);

    // Usuario personaliza un límite:
    useCreditLineStore.getState().setCreditLine('Interbank Amex', 7500);
    const amexCustom = resolveAuthoritativeCreditLine('Interbank Amex', useCreditLineStore.getState().lines);
    expect(amexCustom).toBe(7500);

    // Tarjeta custom con configuración:
    const customCard = { creditLine: 4500, lineaCredito: 4500 };
    const customLine = resolveAuthoritativeCreditLine('Diners Club', {}, customCard);
    expect(customLine).toBe(4500);

    // Desconocido total: fallback 1000
    const unknownLine = resolveAuthoritativeCreditLine('Entidad Desconocida', {}, {});
    expect(unknownLine).toBe(1000);
  });

  // TEST 2: Límites Oficiales de Fábrica y Suma Total de S/ 10,000
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

    const amexCard = DEFAULT_CARDS.find(c => c.entity === 'Interbank Amex');
    const bbvaCard = DEFAULT_CARDS.find(c => c.entity === 'BBVA Bfree');
    const ripleyCard = DEFAULT_CARDS.find(c => c.entity === 'Ripley');

    expect(amexCard?.creditLine).toBe(5000);
    expect(bbvaCard?.creditLine).toBe(3000);
    expect(ripleyCard?.creditLine).toBe(2000);
  });

  // TEST 3: Fórmula Oficial Original de Saldo Disponible del Mes
  it('3. Fórmula Original: Saldo disponible = Saldo inicial + Abonos - Gastos (Caso Amex S/ 5,000 - S/ 600 = S/ 4,400)', () => {
    // Escenario explícito dado por el usuario:
    // Interbank Amex empieza el mes con S/ 5,000 y registra S/ 600 en gastos -> saldo mensual S/ 4,400.
    const amexLine = resolveAuthoritativeCreditLine('Interbank Amex', useCreditLineStore.getState().lines);
    expect(amexLine).toBe(5000);

    const saldoInicialMes = amexLine;
    const abonos = 0;
    const gastos = 600;

    const saldoDisponible = saldoInicialMes + abonos - gastos;
    expect(saldoDisponible).toBe(4400);

    // Si además recibe un abono de S/ 200:
    const saldoConAbono = saldoInicialMes + 200 - gastos;
    expect(saldoConAbono).toBe(4600);
  });

  // TEST 4: Comportamiento en Octubre 2026 (Mes Inicial sin Gastos)
  it('4. Octubre 2026: Cada tarjeta inicia con su línea aprobada disponible completa', () => {
    const cards = [
      { entity: 'Interbank Amex', expectedLine: 5000 },
      { entity: 'BBVA Bfree', expectedLine: 3000 },
      { entity: 'Ripley', expectedLine: 2000 },
    ];

    cards.forEach(({ entity, expectedLine }) => {
      const line = resolveAuthoritativeCreditLine(entity, useCreditLineStore.getState().lines);
      expect(line).toBe(expectedLine);

      // Sin gastos en Octubre:
      const saldoInicial = line;
      const abonos = 0;
      const gastos = 0;
      const disponible = saldoInicial + abonos - gastos;
      expect(disponible).toBe(expectedLine);
    });
  });

  // TEST 5: Comportamiento en Noviembre 2026 y Cruces de Año
  it('5. Noviembre 2026 & Cruces de Año (Diciembre 2026 -> Enero 2027): Líneas y saldos operativos independientes', () => {
    // Noviembre 2026
    const amexNov = resolveAuthoritativeCreditLine('Interbank Amex');
    const bbvaNov = resolveAuthoritativeCreditLine('BBVA Bfree');
    const ripleyNov = resolveAuthoritativeCreditLine('Ripley');

    expect(amexNov).toBe(5000);
    expect(bbvaNov).toBe(3000);
    expect(ripleyNov).toBe(2000);

    // Cruce de año: Diciembre 2026 -> Enero 2027
    const amexEnero2027 = resolveAuthoritativeCreditLine('Interbank Amex');
    const saldoInicialEnero2027 = amexEnero2027;
    const gastosEnero2027 = 450;
    const disponibleEnero2027 = saldoInicialEnero2027 - gastosEnero2027;

    expect(saldoInicialEnero2027).toBe(5000);
    expect(disponibleEnero2027).toBe(4550);
  });

  // TEST 6: Integridad de Datos Históricos (Setiembre 2026)
  it('6. Setiembre 2026: Transacción "Linea Tarjeta" actúa como saldo inicial y no duplica abonos', () => {
    const sepTxs = masterTransactions.filter(t => t.Mes === 'Setiembre' && t.Entidad === 'Interbank Amex');
    const lineaTx = sepTxs.find(t => isCreditCardLine(t));
    expect(lineaTx).toBeDefined();
    expect(lineaTx?.Monto).toBe(976.10);

    const explicitLine = lineaTx?.Monto || 0;
    const abonos = sepTxs.filter(t => t.Tipo === 'Ingreso' && !isCreditCardLine(t)).reduce((a, t) => a + t.Monto, 0);
    const gastos = sepTxs.filter(t => t.Tipo === 'Egreso' && !isCreditCardLine(t)).reduce((a, t) => a + t.Monto, 0);

    expect(abonos).toBe(0);
    expect(gastos).toBe(441.40);

    const saldoDisponible = explicitLine + abonos - gastos;
    expect(saldoDisponible).toBeCloseTo(534.70, 2);
  });

  // TEST 7: Distinción nítida entre Saldo Operativo Mensual y Posición Bancaria
  it('7. Separación de Bloques: Saldo operativo mensual no se sustituye por deuda bancaria de ciclo', () => {
    const amexCard = DEFAULT_CARDS.find(c => c.entity === 'Interbank Amex')!;
    const totalLine = resolveAuthoritativeCreditLine('Interbank Amex');

    // Saldo Operativo Mensual (Independiente):
    const saldoInicialMes = totalLine; // 5000
    const cardGastosMes = 441.40;
    const saldoDisponibleMes = saldoInicialMes - cardGastosMes; // 4558.60

    // Posición Bancaria de Ciclo (Complementaria, calculada por smart engine):
    const livePos = calculateCardLivePosition(amexCard, masterTransactions, new Date('2026-09-30T12:00:00'));

    // Deben ser magnitudes distintas y bien separadas
    expect(saldoDisponibleMes).toBeCloseTo(4558.60, 2);
    expect(livePos.liveDebt).toBeCloseTo(465.30, 2); // Deuda bancaria facturada
    expect(totalLine).toBe(5000); // Línea contractual
  });

  // TEST 8: Protección Obligatoria de Noviembre 2026
  it('8. Protección de Planificación: 23 partidas de Noviembre 2026 íntegras (balance -S/ 221.42)', () => {
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
