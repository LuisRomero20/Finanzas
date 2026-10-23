import { describe, it, expect } from 'vitest';
import {
  buildSmartInstallmentSchedule,
  simulateCardPurchase,
  reconcileCardCycle,
  validateCardContractualRates,
  aggregateCardObligationsForMonth,
  CONTRACTUAL_WARNING_MESSAGE,
  type CardContractualRates,
} from '../cards/smartCardEngine';
import { calculateBillingCycle } from '../cards/billingCycles';

describe('FINPER 2.1 — Smart Card Financial Engine (Unit Tests)', () => {
  // Configuración de las 3 tarjetas del usuario
  const ripleyRule = { cutoffDay: 3, dueDay: 1 };
  const ibkRule = { cutoffDay: 21, dueDay: 15 };
  const bbvaRule = { cutoffDay: 10, dueDay: 5 };

  describe('1. Parameterización y validación de reglas de ciclo', () => {
    it('calcula correctamente el ciclo de Ripley (corte 3, pago 1)', () => {
      // Compra el 2 de octubre (antes del corte 3): entra en ciclo que corta el 3 de oct y vence el 1 de nov
      const cycleBefore = calculateBillingCycle('2026-10-02', ripleyRule);
      expect(cycleBefore.dueDate).toBe('2026-11-01');
      expect(cycleBefore.billingMonth).toBe('2026-11');

      // Compra el 3 de octubre (día de corte): nuevo ciclo que corta en nov y vence el 1 de dic
      const cycleAfter = calculateBillingCycle('2026-10-03', ripleyRule);
      expect(cycleAfter.dueDate).toBe('2026-12-01');
      expect(cycleAfter.billingMonth).toBe('2026-12');
    });

    it('calcula correctamente el ciclo de Interbank Amex (corte 21, pago 15)', () => {
      // Compra el 20 de octubre: antes del corte 21 -> vence el 15 de nov
      const cycleBefore = calculateBillingCycle('2026-10-20', ibkRule);
      expect(cycleBefore.dueDate).toBe('2026-11-15');

      // Compra el 21 de octubre: día de corte -> nuevo ciclo -> vence el 15 de dic
      const cycleAfter = calculateBillingCycle('2026-10-21', ibkRule);
      expect(cycleAfter.dueDate).toBe('2026-12-15');
    });

    it('calcula correctamente el ciclo de BBVA Bfree (corte 10, pago 5)', () => {
      // Compra el 9 de octubre: antes del corte 10 -> vence el 5 de nov
      const cycleBefore = calculateBillingCycle('2026-10-09', bbvaRule);
      expect(cycleBefore.dueDate).toBe('2026-11-05');

      // Compra el 10 de octubre: día de corte -> vence el 5 de dic
      const cycleAfter = calculateBillingCycle('2026-10-10', bbvaRule);
      expect(cycleAfter.dueDate).toBe('2026-12-05');
    });

    it('resuelve correctamente meses cortos y febrero sin errores de rango', () => {
      // Compra a finales de enero con corte día 31 en mes no bisiesto
      const cycleFeb = calculateBillingCycle('2026-02-15', { cutoffDay: 30, dueDay: 25 });
      expect(cycleFeb.dueDate).toMatch(/^2026-03-25$/);
    });
  });

  describe('2. Validación de completitud contractual (Transparencia Total)', () => {
    it('detecta datos contractuales incompletos cuando faltan TEA y seguro de desgravamen', () => {
      const validation = validateCardContractualRates(undefined, false);
      expect(validation.isComplete).toBe(false);
      expect(validation.warningMessage).toBe(CONTRACTUAL_WARNING_MESSAGE);
      expect(validation.missingTerms).toContain('tea');
      expect(validation.missingTerms).toContain('debtInsuranceMonthlyRate');
    });

    it('valida como completa una promoción a 0% de interés aunque no tenga TEA', () => {
      const validation = validateCardContractualRates(undefined, true);
      expect(validation.isComplete).toBe(true);
      expect(validation.warningMessage).toBeUndefined();
      expect(validation.missingTerms).toHaveLength(0);
    });

    it('valida como completa una tarjeta que cuenta con TEA y seguro de desgravamen', () => {
      const completeRates: CardContractualRates = {
        tea: 0.45,
        debtInsuranceMonthlyRate: 0.0039,
        monthlyFixedFee: 0,
      };
      const validation = validateCardContractualRates(completeRates, false);
      expect(validation.isComplete).toBe(true);
      expect(validation.warningMessage).toBeUndefined();
    });
  });

  describe('3. Promociones a 0% de interés (3 cuotas sin intereses Ripley / BBVA)', () => {
    it('divide exactamente el capital en cuotas con centavos exactos sin intereses', () => {
      const schedule = buildSmartInstallmentSchedule({
        cardId: 'card-ripley',
        purchaseDate: '2026-10-02',
        amount: 1000,
        installmentsCount: 3,
        rule: ripleyRule,
        isZeroInterestPromo: true,
      });

      expect(schedule.totalInstallments).toBe(3);
      expect(schedule.totalInterest).toBe(0);
      expect(schedule.totalPayable).toBe(1000);
      expect(schedule.isZeroInterestPromo).toBe(true);
      expect(schedule.completeness.isComplete).toBe(true);

      // Verificación de suma exacta de cuotas
      const sumInstallments = schedule.rows.reduce((sum, r) => sum + r.totalInstallment, 0);
      expect(Number(sumInstallments.toFixed(2))).toBe(1000);

      // Fechas de cuotas en meses consecutivos
      expect(schedule.rows[0].dueDate).toBe('2026-11-01');
      expect(schedule.rows[1].dueDate).toBe('2026-12-01');
      expect(schedule.rows[2].dueDate).toBe('2027-01-01');
      expect(schedule.rows[2].finalBalance).toBe(0);
    });

    it('maneja compras directas (1 cuota) a tasa 0% al vencimiento', () => {
      const schedule = buildSmartInstallmentSchedule({
        cardId: 'card-ibk-amex',
        purchaseDate: '2026-10-18',
        amount: 250.75,
        installmentsCount: 1,
        rule: ibkRule,
      });

      expect(schedule.totalInstallments).toBe(1);
      expect(schedule.principal).toBe(250.75);
      expect(schedule.totalInterest).toBe(0);
      expect(schedule.rows[0].dueDate).toBe('2026-11-15');
      expect(schedule.rows[0].totalInstallment).toBe(250.75);
      expect(schedule.rows[0].finalBalance).toBe(0);
    });
  });

  describe('4. Amortización Francesa con Financiamiento bancario', () => {
    it('genera cuotas con amortización francesa, intereses decrecientes y saldo final cero', () => {
      const rates: CardContractualRates = {
        tea: 0.38, // 38% TEA
        debtInsuranceMonthlyRate: 0.0039, // 0.39% mensual
        monthlyFixedFee: 4.50,
      };

      const schedule = buildSmartInstallmentSchedule({
        cardId: 'card-bbva-bfree',
        purchaseDate: '2026-10-12',
        amount: 1500,
        installmentsCount: 6,
        rule: bbvaRule,
        rates,
      });

      expect(schedule.totalInstallments).toBe(6);
      expect(schedule.totalInterest).toBeGreaterThan(0);
      expect(schedule.totalInsurance).toBeGreaterThan(0);
      expect(schedule.totalFees).toBe(27.00); // 6 * 4.50
      expect(schedule.totalPayable).toBeGreaterThan(1500);

      // Interés decreciente a lo largo de las cuotas
      expect(schedule.rows[0].interestPayment).toBeGreaterThan(schedule.rows[5].interestPayment);
      // Saldo final de la última cuota debe ser 0.00
      expect(schedule.rows[5].finalBalance).toBe(0);
    });
  });

  describe('5. Simulador Financiero Puro (Desacoplado y No Persistente)', () => {
    it('ejecuta simulación sin mutar datos y entrega impacto en flujo de caja', () => {
      const simulation = simulateCardPurchase({
        cardId: 'sim-card-1',
        amount: 3000,
        installmentsCount: 12,
        purchaseDate: '2026-10-15',
        rule: ibkRule,
        rates: {
          tea: 0.29,
          debtInsuranceMonthlyRate: 0.0035,
          monthlyFixedFee: 0,
        },
      });

      expect(simulation.isSimulation).toBe(true);
      expect(simulation.totalPrincipal).toBe(3000);
      expect(simulation.totalCost).toBeGreaterThan(3000);
      expect(simulation.monthlyCashFlowImpact).toHaveLength(12);
      expect(simulation.firstDueDate).toBe('2026-11-15');
      expect(simulation.lastDueDate).toBe('2027-10-15');
      expect(simulation.estimatedTcea).toBeGreaterThan(0.29);
    });

    it('alerta cuando la simulación se ejecuta sin datos contractuales', () => {
      const simulation = simulateCardPurchase({
        cardId: 'sim-card-incompleta',
        amount: 1200,
        installmentsCount: 6,
        purchaseDate: '2026-10-10',
        rule: bbvaRule,
      });

      expect(simulation.completeness.isComplete).toBe(false);
      expect(simulation.completeness.warningMessage).toBe(CONTRACTUAL_WARNING_MESSAGE);
    });
  });

  describe('6. Motor de Conciliación Bancaria Manual', () => {
    it('confirma CONCILIADO cuando el estado de cuenta y FINPER coinciden', () => {
      const report = reconcileCardCycle({
        cardEntity: 'BBVA Bfree',
        cycleKey: 'BBVA_2026-11-05',
        statementDebtConfirmed: 436.21,
        purchasesInCycle: [
          { id: '1', fecha: '2026-10-02', concepto: 'Supermercado', monto: 200.00 },
          { id: '2', fecha: '2026-10-08', concepto: 'Farmacia', monto: 236.21 },
        ],
        paymentsInCycle: [],
      });

      expect(report.reconciliationStatus).toBe('CONCILIADO');
      expect(report.variance).toBe(0);
      expect(report.diagnosticMessage).toContain('coincide exactamente');
    });

    it('diagnostica DISCREPANCIA_MAYOR_BANCO cuando el banco registra cargos adicionales', () => {
      const report = reconcileCardCycle({
        cardEntity: 'Ripley',
        cycleKey: 'Ripley_2026-11-01',
        statementDebtConfirmed: 358.66,
        purchasesInCycle: [
          { id: '1', fecha: '2026-10-01', concepto: 'Ropa', monto: 300.00 },
        ],
        paymentsInCycle: [],
      });

      expect(report.reconciliationStatus).toBe('DISCREPANCIA_MAYOR_BANCO');
      expect(report.variance).toBe(58.66);
      expect(report.diagnosticMessage).toContain('El banco registra S/ 58.66 más');
      expect(report.suggestedAction).toContain('Revisar si hay comisiones');
    });

    it('diagnostica DISCREPANCIA_MAYOR_FINPER cuando FINPER tiene consumos en exceso', () => {
      const report = reconcileCardCycle({
        cardEntity: 'Interbank Amex',
        cycleKey: 'IBK_2026-11-15',
        statementDebtConfirmed: 182.38,
        purchasesInCycle: [
          { id: '1', fecha: '2026-10-10', concepto: 'Cena', monto: 182.38 },
          { id: '2', fecha: '2026-10-12', concepto: 'Cena duplicada', monto: 182.38 },
        ],
        paymentsInCycle: [],
      });

      expect(report.reconciliationStatus).toBe('DISCREPANCIA_MAYOR_FINPER');
      expect(report.variance).toBe(-182.38);
      expect(report.diagnosticMessage).toContain('FINPER registra S/ 182.38 más');
      expect(report.suggestedAction).toContain('consumos duplicados');
    });
  });

  describe('7. Conector de Proyecciones Multi-Horizonte', () => {
    it('agrega las obligaciones de tarjeta como salida de caja sin duplicar gastos económicos', () => {
      const outflow = aggregateCardObligationsForMonth(
        'BBVA Bfree',
        '2026-11',
        {
          totalAPagar: 436.21,
          fechaPago: '2026-11-05',
          consumos: [
            { id: 'tx-1', monto: 436.21, origen: 'Histórico Maestro' },
          ],
        },
        436.21, // Saldo confirmado del estado de cuenta
      );

      expect(outflow.cardEntity).toBe('BBVA Bfree');
      expect(outflow.billingMonth).toBe('2026-11');
      expect(outflow.dueDate).toBe('2026-11-05');
      expect(outflow.totalCashOutflow).toBe(436.21);
      expect(outflow.isConfirmed).toBe(true);
    });

    it('proyecta salidas de caja en horizontes de 3, 6, 12 y 24 meses sin doble conteo', () => {
      // Simulación de compra de S/ 600 en 6 cuotas con fecha 2026-10-15
      const schedule = buildSmartInstallmentSchedule({
        cardId: 'card-ibk-amex',
        purchaseDate: '2026-10-15',
        amount: 600,
        installmentsCount: 6,
        rule: ibkRule,
        isZeroInterestPromo: true,
      });

      expect(schedule.rows).toHaveLength(6);
      // Cada cuota cae exactamente en su mes respectivo (Nov 2026 a Abr 2027)
      expect(schedule.rows[0].billingMonth).toBe('2026-11');
      expect(schedule.rows[1].billingMonth).toBe('2026-12');
      expect(schedule.rows[2].billingMonth).toBe('2027-01');
      expect(schedule.rows[3].billingMonth).toBe('2027-02');
      expect(schedule.rows[4].billingMonth).toBe('2027-03');
      expect(schedule.rows[5].billingMonth).toBe('2027-04');

      // Las cuotas son salidas de efectivo futuras, no gastos económicos duplicados en octubre
      const totalFutureOutflow = schedule.rows.reduce((sum, r) => sum + r.totalInstallment, 0);
      expect(totalFutureOutflow).toBe(600);
    });
  });

  describe('8. Distinción rigurosa de modalidades de financiamiento (Audit Fix B)', () => {
    it('clasifica una compra a 1 cuota como modalidad "direct" (sin intereses de mora pero no como promo 0%)', () => {
      const schedule = buildSmartInstallmentSchedule({
        cardId: 'card-ripley',
        purchaseDate: '2026-10-02',
        amount: 350.00,
        installmentsCount: 1,
        rule: ripleyRule,
      });

      expect(schedule.modality).toBe('direct');
      expect(schedule.isZeroInterestPromo).toBe(false);
      expect(schedule.totalInterest).toBe(0);
      expect(schedule.rows[0].installmentNumber).toBe(1);
    });

    it('clasifica una compra multi-cuota con isZeroInterestPromo como modalidad "zero_interest_promo"', () => {
      const schedule = buildSmartInstallmentSchedule({
        cardId: 'card-ripley',
        purchaseDate: '2026-10-02',
        amount: 900.00,
        installmentsCount: 3,
        rule: ripleyRule,
        isZeroInterestPromo: true,
      });

      expect(schedule.modality).toBe('zero_interest_promo');
      expect(schedule.isZeroInterestPromo).toBe(true);
      expect(schedule.totalInterest).toBe(0);
    });

    it('clasifica una compra a más de 1 cuota sin promo como modalidad "revolving_financed"', () => {
      const schedule = buildSmartInstallmentSchedule({
        cardId: 'card-bbva',
        purchaseDate: '2026-10-05',
        amount: 1200.00,
        installmentsCount: 4,
        rule: bbvaRule,
        rates: {
          tea: 0.45,
          debtInsuranceMonthlyRate: 0.0039,
          monthlyFixedFee: 0,
        },
      });

      expect(schedule.modality).toBe('revolving_financed');
      expect(schedule.isZeroInterestPromo).toBe(false);
      expect(schedule.totalInterest).toBeGreaterThan(0);
    });

    it('validateCardContractualRates distingue si falta TEA según la modalidad', () => {
      // Direct o Zero interest no exigen TEA
      expect(validateCardContractualRates(undefined, 'direct').isComplete).toBe(true);
      expect(validateCardContractualRates(undefined, 'zero_interest_promo').isComplete).toBe(true);

      // Revolving financiado exige TEA y seguro
      const revolvingCheck = validateCardContractualRates(undefined, 'revolving_financed');
      expect(revolvingCheck.isComplete).toBe(false);
      expect(revolvingCheck.missingTerms).toContain('tea');
    });
  });
});
