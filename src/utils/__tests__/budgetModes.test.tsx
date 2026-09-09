import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { useBudgetStore, DEFAULT_BUDGETS } from '../../store/budgetStore';
import { BudgetOverviewWidget } from '../../components/BudgetOverviewWidget';
import { BudgetConfigModal } from '../../components/BudgetConfigModal';

describe('Budget Modes & Customization (Sugeridos vs Por mi cuenta)', () => {
  it('allows switching between suggested and manual budget modes', () => {
    const store = useBudgetStore.getState();

    // Test setting a category manually
    store.setBudget('comida', 650, 'manual');
    expect(useBudgetStore.getState().budgets['comida']).toBe(650);
    expect(useBudgetStore.getState().budgetModes['comida']).toBe('manual');

    // Test switching back to suggested
    store.applySuggested('comida');
    expect(useBudgetStore.getState().budgets['comida']).toBe(DEFAULT_BUDGETS['comida']);
    expect(useBudgetStore.getState().budgetModes['comida']).toBe('sugerido');

    // Test applyAllSuggested
    store.setBudget('transporte', 300, 'manual');
    store.setBudget('ocio', 400, 'manual');
    store.applyAllSuggested();

    expect(useBudgetStore.getState().budgets['transporte']).toBe(DEFAULT_BUDGETS['transporte']);
    expect(useBudgetStore.getState().budgetModes['transporte']).toBe('sugerido');
    expect(useBudgetStore.getState().budgetModes['ocio']).toBe('sugerido');
  });

  it('renders BudgetOverviewWidget with Sugeridos vs Por mi cuenta features', () => {
    const html = renderToString(<BudgetOverviewWidget />);
    expect(html).toContain('Control de Presupuestos Semaf\u00f3rico');
    expect(html).toContain('Sugeridos vs Por mi cuenta');
    expect(html).toContain('Consumo Presupuestario Global');
    expect(html).toContain('Sugerido');
  });

  it('renders BudgetConfigModal when open', () => {
    const html = renderToString(
      <BudgetConfigModal
        isOpen={true}
        onClose={() => {}}
        selectedMonth="Setiembre"
        categorySpent={{ comida: 176, transporte: 24 }}
      />
    );
    expect(html).toContain('Configuraci\u00f3n de Presupuestos Semaf\u00f3ricos');
    expect(html).toContain('Aplicar todos los sugeridos');
    expect(html).toContain('Por mi cuenta');
  });
});
