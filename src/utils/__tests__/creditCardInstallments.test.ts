import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateCardPaymentDate,
  calculateCardInstallmentSchedule,
  getCardDueDetailsForMonth,
  useProjectionStore,
} from '../../store/projectionStore';
import { useFinanceStore } from '../../store/financeStore';

describe('Credit Card Installments & Temporal Projections', () => {
  beforeEach(() => {
    useFinanceStore.setState({ transactions: [] });
  });

  it('calculates installment schedule correctly for purchases after cutoff day (BBVA corte 10)', () => {
    // Compra realizada el 16 de setiembre de 2026 con BBVA Bfree por S/ 300 en 3 cuotas
    // Al ser día 16 >= 10, entra al ciclo que cierra el 09/10 y se factura en Noviembre (05/11)
    const schedule = calculateCardInstallmentSchedule('BBVA Bfree', '2026-09-16', 300, 3);

    expect(schedule).toHaveLength(3);

    // Cuota 1
    expect(schedule[0].cuotaNumber).toBe(1);
    expect(schedule[0].totalCuotas).toBe(3);
    expect(schedule[0].mesPago).toBe('2026-11');
    expect(schedule[0].fechaPago).toBe('2026-11-05');
    expect(schedule[0].montoCuota).toBe(100);
    expect(schedule[0].mesLabel).toBe('Noviembre 2026');

    // Cuota 2
    expect(schedule[1].cuotaNumber).toBe(2);
    expect(schedule[1].mesPago).toBe('2026-12');
    expect(schedule[1].fechaPago).toBe('2026-12-05');
    expect(schedule[1].montoCuota).toBe(100);
    expect(schedule[1].mesLabel).toBe('Diciembre 2026');

    // Cuota 3
    expect(schedule[2].cuotaNumber).toBe(3);
    expect(schedule[2].mesPago).toBe('2027-01');
    expect(schedule[2].fechaPago).toBe('2027-01-05');
    expect(schedule[2].montoCuota).toBe(100);
    expect(schedule[2].mesLabel).toBe('Enero 2027');
  });

  it('calculates installment schedule correctly for purchases before cutoff day (BBVA corte 10)', () => {
    // Compra realizada el 05 de setiembre de 2026 (antes del corte 10)
    // Se factura en el mes siguiente: Octubre 2026 (05/10)
    const schedule = calculateCardInstallmentSchedule('BBVA Bfree', '2026-09-05', 450, 3);

    expect(schedule).toHaveLength(3);
    expect(schedule[0].mesPago).toBe('2026-10');
    expect(schedule[0].montoCuota).toBe(150);
    expect(schedule[1].mesPago).toBe('2026-11');
    expect(schedule[1].montoCuota).toBe(150);
    expect(schedule[2].mesPago).toBe('2026-12');
    expect(schedule[2].montoCuota).toBe(150);
  });

  it('adjusts rounding cents accurately in the last installment', () => {
    // S/ 100 divididos en 3 cuotas -> 33.33 + 33.33 + 33.34 = 100.00
    const schedule = calculateCardInstallmentSchedule('BBVA Bfree', '2026-09-16', 100, 3);

    expect(schedule).toHaveLength(3);
    expect(schedule[0].montoCuota).toBe(33.33);
    expect(schedule[1].montoCuota).toBe(33.33);
    expect(schedule[2].montoCuota).toBe(33.34);
    const sum = schedule.reduce((acc, s) => acc + s.montoCuota, 0);
    expect(sum).toBe(100);
  });

  it('splits credit card transaction debt across getCardDueDetailsForMonth in future billing months', () => {
    // Registrar compra en cuotas en financeStore
    useFinanceStore.getState().addTransaction({
      Tipo: 'Egreso',
      Fecha: '2026-09-16',
      Concepto: 'Zapatillas Nike',
      Categoria: 'Ropa & Calzado',
      Entidad: 'BBVA Bfree',
      Monto: 300,
      cuotas: 3,
      esCuotas: true,
      montoTotal: 300,
    });

    // Octubre 2026: No debe aparecer porque el corte de 16/09 factura en Noviembre
    const octDue = getCardDueDetailsForMonth('BBVA Bfree', '2026-10', []);
    const octConsumo = octDue.consumos.find(c => c.concepto.includes('Zapatillas Nike'));
    expect(octConsumo).toBeUndefined();

    // Noviembre 2026: Debe figurar Cuota 1/3 por S/ 100
    const novDue = getCardDueDetailsForMonth('BBVA Bfree', '2026-11', []);
    const novConsumo = novDue.consumos.find(c => c.concepto.includes('Zapatillas Nike'));
    expect(novConsumo).toBeDefined();
    expect(novConsumo?.monto).toBe(100);
    expect(novConsumo?.concepto).toContain('(Cuota 1/3)');

    // Diciembre 2026: Debe figurar Cuota 2/3 por S/ 100
    const dicDue = getCardDueDetailsForMonth('BBVA Bfree', '2026-12', []);
    const dicConsumo = dicDue.consumos.find(c => c.concepto.includes('Zapatillas Nike'));
    expect(dicConsumo).toBeDefined();
    expect(dicConsumo?.monto).toBe(100);
    expect(dicConsumo?.concepto).toContain('(Cuota 2/3)');

    // Enero 2027: Debe figurar Cuota 3/3 por S/ 100
    const eneDue = getCardDueDetailsForMonth('BBVA Bfree', '2027-01', []);
    const eneConsumo = eneDue.consumos.find(c => c.concepto.includes('Zapatillas Nike'));
    expect(eneConsumo).toBeDefined();
    expect(eneConsumo?.monto).toBe(100);
    expect(eneConsumo?.concepto).toContain('(Cuota 3/3)');

    // Febrero 2027: No debe figurar (terminó el plan de 3 cuotas)
    const febDue = getCardDueDetailsForMonth('BBVA Bfree', '2027-02', []);
    const febConsumo = febDue.consumos.find(c => c.concepto.includes('Zapatillas Nike'));
    expect(febConsumo).toBeUndefined();
  });

  it('generates temporal projected rows with Cuota X/N in getMonthlyProjections', () => {
    useFinanceStore.getState().addTransaction({
      Tipo: 'Egreso',
      Fecha: '2026-09-16',
      Concepto: 'iPhone 16 Pro',
      Categoria: 'Tecnología & Gadgets',
      Entidad: 'BBVA Bfree',
      Monto: 600,
      cuotas: 3,
      esCuotas: true,
      montoTotal: 600,
    });

    const store = useProjectionStore.getState();

    // Noviembre 2026 (Cuota 1/3)
    const novRows = store.getMonthlyProjections('2026-11');
    const novItem = novRows.find(r => r.concepto.includes('iPhone 16 Pro'));
    expect(novItem).toBeDefined();
    expect(novItem?.esTemporal).toBe(true);
    expect(novItem?.monto).toBe(200);
    expect(novItem?.concepto).toContain('(Cuota 1/3)');

    // Diciembre 2026 (Cuota 2/3)
    const dicRows = store.getMonthlyProjections('2026-12');
    const dicItem = dicRows.find(r => r.concepto.includes('iPhone 16 Pro'));
    expect(dicItem).toBeDefined();
    expect(dicItem?.esTemporal).toBe(true);
    expect(dicItem?.monto).toBe(200);
    expect(dicItem?.concepto).toContain('(Cuota 2/3)');

    // Enero 2027 (Cuota 3/3)
    const eneRows = store.getMonthlyProjections('2027-01');
    const eneItem = eneRows.find(r => r.concepto.includes('iPhone 16 Pro'));
    expect(eneItem).toBeDefined();
    expect(eneItem?.esTemporal).toBe(true);
    expect(eneItem?.monto).toBe(200);
    expect(eneItem?.concepto).toContain('(Cuota 3/3)');

    // Febrero 2027: Ya no aparece
    const febRows = store.getMonthlyProjections('2027-02');
    const febItem = febRows.find(r => r.concepto.includes('iPhone 16 Pro'));
    expect(febItem).toBeUndefined();
  });
});
