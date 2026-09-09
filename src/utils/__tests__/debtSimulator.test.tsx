import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { DebtPayoffSimulatorWidget } from '../../components/DebtPayoffSimulatorWidget';

describe('Debt Simulator Widget (Deudas Próximas & Incógnito Help)', () => {
  const mockDebts = [
    {
      id: 'd1',
      acreedor: 'Prestamo Yape',
      monto: 701.1,
      tasa_anual: 0.45,
      plazo_meses: 6,
      meses_pagados: 2,
      tipo_tasa: 'efectiva',
      moneda: 'PEN',
      estado: 'activa',
    },
    {
      id: 'd2',
      acreedor: 'iPhone 16',
      monto: 2949,
      tasa_anual: 0.18,
      plazo_meses: 12,
      meses_pagados: 3,
      tipo_tasa: 'efectiva',
      moneda: 'PEN',
      estado: 'activa',
    },
  ];

  it('renders prospective debt simulator by default', () => {
    const html = renderToString(<DebtPayoffSimulatorWidget deudas={mockDebts} />);
    expect(html).toContain('Simulador de Deudas &amp; Pr\u00e9stamos');
    expect(html).toContain('Simular Pr\u00f3xima Deuda');
    expect(html).toContain('Motivo o Pr\u00f3ximo Pr\u00e9stamo');
    expect(html).toContain('Monto a Financiar');
    expect(html).toContain('Cuota Mensual Estimada');
    expect(html).toContain('Total Intereses a Pagar');
  });

  it('includes incognito (?) help buttons for options and strategies', () => {
    const html = renderToString(<DebtPayoffSimulatorWidget deudas={mockDebts} />);
    // The incognito button is rendered as '?'
    expect(html).toContain('?');
    expect(html).toContain('Tasa de Inter\u00e9s (TEA Anual)');
    expect(html).toContain('Abono Extra Mensual al Capital');
  });

  it('renders liquidation strategy for active debts tab trigger', () => {
    const html = renderToString(<DebtPayoffSimulatorWidget deudas={mockDebts} />);
    expect(html).toContain('Liquidaci');
    expect(html).toContain('Actuales');
    expect(html).toContain('Cronograma de Pagos Cuota por Cuota');
  });
});
