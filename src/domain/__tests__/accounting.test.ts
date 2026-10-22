import { describe, expect, it } from 'vitest';
import { evaluateTransactionImpact, aggregateImpacts } from '../finance/accounting';

describe('Financial Engine - Accounting & Double Impact Rules', () => {
  it('classifies a credit card purchase as economic expense and liability increase without immediate cash loss', () => {
    const evaluation = evaluateTransactionImpact(
      'Egreso',
      'Supermercado Wong',
      'Alimentación',
      'Interbank Amex',
      350.5,
      true, // esTarjeta
    );

    expect(evaluation.kind).toBe('card_purchase');
    expect(evaluation.impact.economicImpact).toBe(-350.5);
    expect(evaluation.impact.cashImpact).toBe(0); // No cash out yet
    expect(evaluation.impact.liabilityImpact).toBe(350.5); // Debt increased
  });

  it('classifies a card payment as liability reduction and cash deduction WITHOUT duplicating economic expense', () => {
    const evaluation = evaluateTransactionImpact(
      'Egreso',
      'Pago Tarjeta Interbank Amex mes Octubre',
      'Pago Tarjeta',
      'BCP Sueldo',
      1200.0,
      false,
    );

    expect(evaluation.kind).toBe('card_payment');
    // CRITICAL: Economic impact must be 0 so budget / P&L does not duplicate the expense
    expect(evaluation.impact.economicImpact).toBe(0);
    expect(evaluation.impact.cashImpact).toBe(-1200.0);
    expect(evaluation.impact.liabilityImpact).toBe(-1200.0);
  });

  it('correctly aggregates combined purchases and payments without double counting expenses', () => {
    const purchase1 = evaluateTransactionImpact('Egreso', 'Cena', 'Restaurantes', 'BBVA Bfree', 100, true).impact;
    const purchase2 = evaluateTransactionImpact('Egreso', 'Zapatillas', 'Ropa', 'Ripley', 200, true).impact;
    const payment = evaluateTransactionImpact('Egreso', 'Pago Tarjeta BBVA', 'Pago Tarjeta', 'BCP', 100, false).impact;

    const net = aggregateImpacts([purchase1, purchase2, payment]);

    // Total economic expenses should ONLY be the two purchases (300), NOT 400!
    expect(net.economicImpact).toBe(-300);
    // Cash impact should ONLY be the payment (-100)
    expect(net.cashImpact).toBe(-100);
    // Net liability impact should be 300 - 100 = 200
    expect(net.liabilityImpact).toBe(200);
  });

  it('classifies interest and fees as economic expenses that add to card liability', () => {
    const fee = evaluateTransactionImpact('Egreso', 'Seguro de desgravamen', 'Comisiones', 'Interbank Amex', 15.9, true);
    expect(fee.kind).toBe('fee');
    expect(fee.impact.economicImpact).toBe(-15.9);
    expect(fee.impact.liabilityImpact).toBe(15.9);
    expect(fee.impact.cashImpact).toBe(0);
  });
});
