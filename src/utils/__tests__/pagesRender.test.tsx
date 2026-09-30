import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { useProjectionStore, calculateCardPaymentDate } from '../../store/projectionStore';
import { Dashboard } from '../../pages/Dashboard';
import { RegistroMovimientoPage } from '../../pages/RegistroMovimientoPage';
import { ProyeccionPage } from '../../pages/ProyeccionPage';
import { CronogramaPagos } from '../../pages/CronogramaPagos';
import { HojaDeudas } from '../../pages/HojaDeudas';
import { ClasificacionPage } from '../../pages/ClasificacionPage';
import { DashboardsPage } from '../../pages/DashboardsPage';
import { FinancialCalendarWidget } from '../../components/FinancialCalendarWidget';

describe('Projection store & card due calculation', () => {
  it('calculates card payment dates correctly', () => {
    // BBVA (corte 10, pago 5)
    expect(calculateCardPaymentDate('BBVA Bfree', 2026, 8, 9).mesPago).toBe('2026-10'); // 9 Sep -> 05 Oct
    expect(calculateCardPaymentDate('BBVA Bfree', 2026, 8, 10).mesPago).toBe('2026-11'); // 10 Sep -> 05 Nov
    
    // Ripley (corte 3, pago 1)
    expect(calculateCardPaymentDate('Ripley', 2026, 8, 2).mesPago).toBe('2026-10'); // 2 Sep -> 01 Oct
    expect(calculateCardPaymentDate('Ripley', 2026, 8, 3).mesPago).toBe('2026-11'); // 3 Sep -> 01 Nov

    // Interbank Amex (corte 21, pago 15)
    expect(calculateCardPaymentDate('Interbank Amex', 2026, 8, 20).mesPago).toBe('2026-10'); // 20 Sep -> 15 Oct
    expect(calculateCardPaymentDate('Interbank Amex', 2026, 8, 21).mesPago).toBe('2026-11'); // 21 Sep -> 15 Nov
  });

  it('calculates monthly projections for Oct 2026 and Nov 2026 without error', () => {
    const store = useProjectionStore.getState();
    const octRows = store.getMonthlyProjections('2026-10');
    expect(octRows.length).toBeGreaterThan(0);

    const novRows = store.getMonthlyProjections('2026-11');
    expect(novRows.length).toBeGreaterThan(0);
  });
});

describe('All Pages Rendering Tests', () => {
  it('renders all 7 app pages without crashing', () => {
    expect(renderToString(<Dashboard />).length).toBeGreaterThan(0);
    expect(renderToString(<RegistroMovimientoPage />).length).toBeGreaterThan(0);
    expect(renderToString(<ProyeccionPage />).length).toBeGreaterThan(0);
    expect(renderToString(<CronogramaPagos />).length).toBeGreaterThan(0);
    expect(renderToString(<HojaDeudas />).length).toBeGreaterThan(0);
    expect(renderToString(<ClasificacionPage />).length).toBeGreaterThan(0);
    expect(renderToString(<DashboardsPage />).length).toBeGreaterThan(0);
  });

  it('renders Posición por Cuenta Bancaria y Tarjeta steady regardless of selectedMonth', () => {
    const htmlSetiembre = renderToString(<Dashboard />);
    expect(htmlSetiembre).toContain('Posición por Cuenta Bancaria y Tarjeta');
    expect(htmlSetiembre).toContain('Interbank Amex');
    expect(htmlSetiembre).toContain('BBVA Bfree');
    expect(htmlSetiembre).toContain('Ripley');
  });

  it('does not count Linea Tarjeta as income in FinancialCalendarWidget', () => {
    const txs: any[] = [
      {
        id: 't-1',
        Tipo: 'Ingreso',
        Fecha: '2026-10-01',
        Concepto: 'Linea Tarjeta',
        Monto: 370.99,
        Entidad: 'BBVA Bfree',
        Mes: 'Octubre',
      },
      {
        id: 't-2',
        Tipo: 'Ingreso',
        Fecha: '2026-10-01',
        Concepto: 'Sueldo',
        Monto: 2384.15,
        Entidad: 'Interbank',
        Mes: 'Octubre',
      },
    ];

    const html = renderToString(
      <FinancialCalendarWidget transactions={txs} selectedMonth="Octubre" />
    );
    // Sueldo is counted (2,384.15 -> 2.4k)
    expect(html).toContain('2.4k');
    // Linea Tarjeta is NOT counted, so it won't be 2.8k
    expect(html).not.toContain('2.8k');
  });

  it('includes Linea Tarjeta in card Ingresos on Dashboard Posición por Tarjeta', () => {
    const html = renderToString(<Dashboard />);
    expect(html).toContain('Posición por Cuenta Bancaria y Tarjeta');
    expect(html).toContain('BBVA Bfree');
  });
});
