import { describe, it, expect } from 'vitest';
import { generateFinancialInsights } from '../financialInsights';
import type { Transaction } from '../masterData';

describe('Financial Insights - Liquid Balance and Savings Advice', () => {
  const sampleTransactions: Transaction[] = [
    {
      id: 'tx-inc-1',
      Tipo: 'Ingreso',
      Fecha: '2026-09-01',
      Categoria: 'Ingreso',
      Concepto: 'Sueldo Setiembre',
      Monto: 4000,
      Entidad: 'Interbank',
      Mes: 'Setiembre',
    },
    {
      id: 'tx-exp-1',
      Tipo: 'Egreso',
      Fecha: '2026-09-05',
      Categoria: 'Alimentacion',
      Concepto: 'Supermercado',
      Monto: 1000,
      Entidad: 'Interbank',
      Mes: 'Setiembre',
    },
    {
      id: 'tx-exp-2',
      Tipo: 'Egreso',
      Fecha: '2026-09-10',
      Categoria: 'Deuda',
      Concepto: 'Prestamo BCP',
      Monto: 800,
      Entidad: 'BCP',
      Mes: 'Setiembre',
    },
  ];

  it('generates savings advice when liquid balance is greater than 1k (e.g. S/ 2,200)', () => {
    const diagnostic = generateFinancialInsights(
      sampleTransactions,
      'Setiembre',
      ['Agosto', 'Setiembre'],
      {},
      2200 // liquid balance > 1000
    );

    const savingsInsight = diagnostic.insights.find(i => i.id === 'savings-liquid-advice-over-1k');
    expect(savingsInsight).toBeDefined();
    expect(savingsInsight?.type).toBe('success');
    expect(savingsInsight?.title).toContain('Oportunidad de Ahorro: Saldo Líquido > S/ 1,000');
    expect(savingsInsight?.description).toContain('Tu saldo líquido disponible en cuenta es de S/ 2,200.00');
    expect(savingsInsight?.description).toContain('ahorro no está mapeado');
    expect(savingsInsight?.description).toContain('te aconsejamos separar');
    expect(savingsInsight?.badge).toBe('Liquidez > 1k');
  });

  it('advises to keep as emergency cushion when liquid balance is positive but under 1k (e.g. S/ 244.32)', () => {
    const diagnostic = generateFinancialInsights(
      sampleTransactions,
      'Setiembre',
      ['Agosto', 'Setiembre'],
      {},
      244.32 // liquid balance < 1000
    );

    const savingsInsight = diagnostic.insights.find(i => i.id === 'savings-liquid-under-1k');
    expect(savingsInsight).toBeDefined();
    expect(savingsInsight?.type).toBe('info');
    expect(savingsInsight?.title).toContain('Saldo Líquido en Cuenta (S/ 244.32)');
    expect(savingsInsight?.description).toContain('inferior a S/ 1,000 y no tener ahorro mapeado');
    expect(savingsInsight?.description).toContain('colchón de contingencia');
    expect(savingsInsight?.badge).toBe('Colchón de Reserva');
  });

  it('reports zero savings when liquid balance is 0 or negative and no explicit savings', () => {
    const diagnostic = generateFinancialInsights(
      sampleTransactions,
      'Setiembre',
      ['Agosto', 'Setiembre'],
      {},
      0
    );

    const savingsInsight = diagnostic.insights.find(i => i.id === 'savings-zero');
    expect(savingsInsight).toBeDefined();
    expect(savingsInsight?.type).toBe('warning');
    expect(savingsInsight?.title).toContain('Sin Margen de Ahorro Líquido');
  });

  it('reports explicit savings if mapped in transactions', () => {
    const txWithExplicitSavings: Transaction[] = [
      ...sampleTransactions,
      {
        id: 'tx-save-1',
        Tipo: 'Egreso',
        Fecha: '2026-09-02',
        Categoria: 'Ahorro',
        Concepto: 'Aporte a Fondo Mutuo',
        Monto: 500,
        Entidad: 'Interbank',
        Mes: 'Setiembre',
      },
    ];

    const diagnostic = generateFinancialInsights(
      txWithExplicitSavings,
      'Setiembre',
      ['Agosto', 'Setiembre'],
      {},
      1500
    );

    const explicitInsight = diagnostic.insights.find(i => i.id === 'savings-explicit');
    expect(explicitInsight).toBeDefined();
    expect(explicitInsight?.type).toBe('success');
    expect(explicitInsight?.title).toContain('Ahorro Formal Registrado');
  });
});
