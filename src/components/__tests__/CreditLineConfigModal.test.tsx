import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { CreditLineConfigModal } from '../CreditLineConfigModal';
import { useCreditLineStore } from '../../store/creditLineStore';

describe('CreditLineConfigModal (Fase 1)', () => {
  beforeEach(() => {
    cleanup();
    useCreditLineStore.setState({
      lines: { 'Interbank Amex': 1000, 'BBVA Bfree': 700 },
      labels: { 'Interbank Amex': 'Amex', 'Interbank': 'Sueldo' },
    });
  });

  it('separa tarjetas de cuentas bancarias en pestañas dedicadas', () => {
    render(<CreditLineConfigModal isOpen={true} onClose={vi.fn()} />);

    // Pestaña de tarjetas activa por defecto
    expect(screen.getByRole('button', { name: /Tarjetas de Crédito/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Cuentas Bancarias/i })).toBeTruthy();

    expect(screen.getByText('BBVA Bfree')).toBeTruthy();
    expect(screen.queryByText('Cuenta de Débito / Ahorros')).toBeNull();

    // Cambiar a pestaña de cuentas bancarias
    fireEvent.click(screen.getByRole('button', { name: /Cuentas Bancarias/i }));
    expect(screen.getByText('Interbank')).toBeTruthy();
    expect(screen.getAllByText('Cuenta de Débito / Ahorros').length).toBeGreaterThan(0);
  });

  it('los botones rápidos modifican solo el borrador y no persisten hasta hacer clic en Guardar Cambios', () => {
    const onClose = vi.fn();
    render(<CreditLineConfigModal isOpen={true} onClose={onClose} />);

    // La primera tarjeta mostrada es Interbank Amex (de DEFAULT_CARDS)
    const presetButtons = screen.getAllByRole('button', { name: /S\/ 3,000/i });
    expect(presetButtons.length).toBeGreaterThan(0);
    fireEvent.click(presetButtons[0]);

    // En el store, todavía debe tener el valor antiguo
    expect(useCreditLineStore.getState().lines['Interbank Amex']).toBe(1000);

    // Al guardar cambios, se actualiza el store
    const saveButton = screen.getByRole('button', { name: /Guardar Cambios/i });
    fireEvent.click(saveButton);

    expect(useCreditLineStore.getState().lines['Interbank Amex']).toBe(3000);
    expect(onClose).toHaveBeenCalled();
  });
});
