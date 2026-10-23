import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { DailyFinancialBriefingWidget } from '../DailyFinancialBriefingWidget';
import { useProjectionStore } from '../../store/projectionStore';
import { useFinanceStore } from '../../store/financeStore';

describe('DailyFinancialBriefingWidget Component', () => {
  it('renderiza la cabecera compacta con la zona horaria America/Lima y permite colapsar/expandir', () => {
    render(<DailyFinancialBriefingWidget />);

    expect(screen.getByText(/Briefing Financiero 7:30 a. m./i)).toBeDefined();
    expect(screen.getByText(/America\/Lima/i)).toBeDefined();

    // El control de expansión existe
    const expandButtons = screen.getAllByLabelText(/Expandir briefing/i);
    expect(expandButtons.length).toBeGreaterThan(0);

    // Expandir
    fireEvent.click(expandButtons[0]);
    expect(screen.getByText('Vencen Hoy')).toBeDefined();
    expect(screen.getByText('Vencidos sin Confirmar')).toBeDefined();
    expect(screen.getAllByText(/Próximos 7 días/i).length).toBeGreaterThan(0);

    // Colapsar
    const collapseButtons = screen.getAllByLabelText(/Colapsar briefing/i);
    fireEvent.click(collapseButtons[0]);
    expect(screen.queryByText('Vencidos sin Confirmar')).toBeNull();
  });

  it('no crea transacciones ni modifica los datos de projectionStore o financeStore', () => {
    const initialTxsCount = useFinanceStore.getState().transactions.length;
    const initialProjCount = useProjectionStore.getState().items.length;

    render(<DailyFinancialBriefingWidget />);

    expect(useFinanceStore.getState().transactions.length).toBe(initialTxsCount);
    expect(useProjectionStore.getState().items.length).toBe(initialProjCount);
  });
});
