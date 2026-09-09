import { describe, it, expect, beforeEach } from 'vitest';
import { usePrevMonthBridgeStore } from '../../store/prevMonthBridgeStore';
import type { Transaction } from '../masterData';

describe('Previous Month Bridge Store and Logic', () => {
  beforeEach(() => {
    // Reset configs
    usePrevMonthBridgeStore.setState({ configs: {} });
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem('finper_prev_month_bridge_v1');
    }
  });

  describe('getPreviousMonthName', () => {
    it('returns the correct preceding month name in Spanish', () => {
      const { getPreviousMonthName } = usePrevMonthBridgeStore.getState();
      expect(getPreviousMonthName('Setiembre')).toBe('Agosto');
      expect(getPreviousMonthName('Septiembre')).toBe('Agosto');
      expect(getPreviousMonthName('Enero')).toBe('Diciembre');
      expect(getPreviousMonthName('Febrero')).toBe('Enero');
      expect(getPreviousMonthName('Diciembre')).toBe('Noviembre');
      expect(getPreviousMonthName('Julio')).toBe('Junio');
    });
  });

  describe('Configuration management', () => {
    it('returns default config when month is not yet configured', () => {
      const { getConfig } = usePrevMonthBridgeStore.getState();
      const config = getConfig('Setiembre');

      expect(config.targetMonth).toBe('Setiembre');
      expect(config.enabled).toBe(false);
      expect(config.movementType).toBe('Ambos');
      expect(config.includeInDashboardTotals).toBe(true);
    });

    it('toggles day on and off correctly', () => {
      const store = usePrevMonthBridgeStore.getState();
      
      store.toggleDay('Setiembre', 27);
      let config = usePrevMonthBridgeStore.getState().getConfig('Setiembre');
      expect(config.includedDays).toContain(27);
      expect(config.enabled).toBe(true); // Should auto-enable when day is added

      store.toggleDay('Setiembre', 15);
      config = usePrevMonthBridgeStore.getState().getConfig('Setiembre');
      expect(config.includedDays).toContain(27);
      expect(config.includedDays).toContain(15);

      // Toggle off 27
      store.toggleDay('Setiembre', 27);
      config = usePrevMonthBridgeStore.getState().getConfig('Setiembre');
      expect(config.includedDays).not.toContain(27);
      expect(config.includedDays).toContain(15);
    });

    it('updates movementType and includeInDashboardTotals', () => {
      const store = usePrevMonthBridgeStore.getState();

      store.setMovementType('Setiembre', 'Ingresos');
      let config = usePrevMonthBridgeStore.getState().getConfig('Setiembre');
      expect(config.movementType).toBe('Ingresos');

      store.setIncludeInDashboardTotals('Setiembre', false);
      config = usePrevMonthBridgeStore.getState().getConfig('Setiembre');
      expect(config.includeInDashboardTotals).toBe(false);
    });
  });

  describe('getBridgedTransactions', () => {
    const sampleTxs: Transaction[] = [
      {
        id: 'tx-aug-27-inc',
        Tipo: 'Ingreso',
        Fecha: '2026-08-27',
        Categoria: 'Ingreso',
        Concepto: 'Eduardo Abono',
        Monto: 100,
        Entidad: 'BCP',
        Mes: 'Agosto',
      },
      {
        id: 'tx-aug-27-exp',
        Tipo: 'Egreso',
        Fecha: '2026-08-27',
        Categoria: 'Alimentacion',
        Concepto: 'Broaster',
        Monto: 15,
        Entidad: 'Interbank',
        Mes: 'Agosto',
      },
      {
        id: 'tx-aug-31-inc',
        Tipo: 'Ingreso',
        Fecha: '2026-08-31',
        Categoria: 'Ingreso',
        Concepto: 'Sueldo Adelanto',
        Monto: 2500,
        Entidad: 'Interbank',
        Mes: 'Agosto',
      },
      {
        id: 'tx-aug-31-exp',
        Tipo: 'Egreso',
        Fecha: '2026-08-31',
        Categoria: 'Transporte',
        Concepto: 'Taxi regreso trabajo',
        Monto: 30,
        Entidad: 'Efectivo',
        Mes: 'Agosto',
      },
      {
        id: 'tx-sep-01-inc',
        Tipo: 'Ingreso',
        Fecha: '2026-09-01',
        Categoria: 'Ingreso',
        Concepto: 'Sueldo Setiembre',
        Monto: 2500,
        Entidad: 'Interbank',
        Mes: 'Setiembre',
      },
    ];

    it('returns empty array when bridge is disabled', () => {
      const store = usePrevMonthBridgeStore.getState();
      store.setIncludedDays('Setiembre', [27, 31]);
      store.setEnabled('Setiembre', false);

      const bridged = store.getBridgedTransactions('Setiembre', sampleTxs);
      expect(bridged).toHaveLength(0);
    });

    it('bridges both incomes and expenses when movementType is "Ambos"', () => {
      const store = usePrevMonthBridgeStore.getState();
      store.setIncludedDays('Setiembre', [27, 31]);
      store.setEnabled('Setiembre', true);
      store.setMovementType('Setiembre', 'Ambos');

      const bridged = store.getBridgedTransactions('Setiembre', sampleTxs);
      expect(bridged).toHaveLength(4);

      // Check bridged attributes
      expect(bridged.every(t => t.isBridgedFromPrevMonth === true)).toBe(true);
      expect(bridged.every(t => t.bridgedTargetMonth === 'Setiembre')).toBe(true);
      expect(bridged.map(t => t.Concepto)).toEqual([
        'Eduardo Abono',
        'Broaster',
        'Sueldo Adelanto',
        'Taxi regreso trabajo',
      ]);
    });

    it('bridges only incomes when movementType is "Ingresos"', () => {
      const store = usePrevMonthBridgeStore.getState();
      store.setIncludedDays('Setiembre', [27, 31]);
      store.setEnabled('Setiembre', true);
      store.setMovementType('Setiembre', 'Ingresos');

      const bridged = store.getBridgedTransactions('Setiembre', sampleTxs);
      expect(bridged).toHaveLength(2);
      expect(bridged.every(t => t.Tipo === 'Ingreso')).toBe(true);
      expect(bridged.map(t => t.Concepto)).toEqual(['Eduardo Abono', 'Sueldo Adelanto']);
    });

    it('bridges only expenses when movementType is "Egresos"', () => {
      const store = usePrevMonthBridgeStore.getState();
      store.setIncludedDays('Setiembre', [27, 31]);
      store.setEnabled('Setiembre', true);
      store.setMovementType('Setiembre', 'Egresos');

      const bridged = store.getBridgedTransactions('Setiembre', sampleTxs);
      expect(bridged).toHaveLength(2);
      expect(bridged.every(t => t.Tipo === 'Egreso')).toBe(true);
      expect(bridged.map(t => t.Concepto)).toEqual(['Broaster', 'Taxi regreso trabajo']);
    });

    it('filters strictly by selected days (e.g. only day 31)', () => {
      const store = usePrevMonthBridgeStore.getState();
      store.setIncludedDays('Setiembre', [31]);
      store.setEnabled('Setiembre', true);
      store.setMovementType('Setiembre', 'Ambos');

      const bridged = store.getBridgedTransactions('Setiembre', sampleTxs);
      expect(bridged).toHaveLength(2);
      expect(bridged.map(t => t.Concepto)).toEqual(['Sueldo Adelanto', 'Taxi regreso trabajo']);
    });
  });
});
