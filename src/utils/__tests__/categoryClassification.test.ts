import { describe, it, expect } from 'vitest';
import {
  CONCEPTO_A_CATEGORIA,
  CATEGORIAS_PERSONALES,
  autoClassify,
  getCategoryByIdOrLabel,
  getEffectiveCategory,
  getEffectiveCategoryLabel,
  getEffectiveCategoryId,
  isDebtTransaction,
} from '../categoryClassification';
import { masterTransactions } from '../masterData';

describe('Category Classification Engine', () => {
  it('contains all user requested concepts and categories', () => {
    expect(CONCEPTO_A_CATEGORIA['Broaster']).toBe('🍔 Comida & Restaurantes');
    expect(CONCEPTO_A_CATEGORIA['Gaseosa']).toBe('🛒 Supermercado & Alimentos');
    expect(CONCEPTO_A_CATEGORIA['IA']).toBe('💻 Tecnología & Gadgets');
    expect(CONCEPTO_A_CATEGORIA['Pago de Tarjeta BBVA Bfree']).toBe('💳 Pagos de Tarjetas & Deudas');
    expect(CONCEPTO_A_CATEGORIA['Sueldo']).toBe('💵 Sueldos & Beneficios Laborales');
    expect(CONCEPTO_A_CATEGORIA['Concierto Bad Bunny']).toBe('🎤 Conciertos & Eventos');
    expect(CONCEPTO_A_CATEGORIA['Viaje Argentina']).toBe('✈️ Viajes & Hospedaje');
    expect(CONCEPTO_A_CATEGORIA['Aaron']).toBe('👥 Familia & Transferencias');
  });

  it('classifies 100% of master transactions accurately', () => {
    let matched = 0;
    masterTransactions.forEach((t) => {
      const catId = autoClassify(t);
      if (catId) {
        matched++;
        const catInfo = getCategoryByIdOrLabel(catId);
        expect(catInfo).toBeDefined();
      }
    });

    expect(matched).toBe(masterTransactions.length);
  });

  it('resolves category by ID, by full label and by plain name', () => {
    const byId = getCategoryByIdOrLabel('comida');
    expect(byId?.nombre).toBe('Comida & Restaurantes');
    expect(byId?.emoji).toBe('🍔');

    const byLabel = getCategoryByIdOrLabel('🍔 Comida & Restaurantes');
    expect(byLabel?.id).toBe('comida');

    const byNombre = getCategoryByIdOrLabel('Comida & Restaurantes');
    expect(byNombre?.id).toBe('comida');
  });

  it('correctly resolves getEffectiveCategory and getEffectiveCategoryLabel', () => {
    const tx = {
      id: 'tx-icloud-test',
      Tipo: 'Egreso' as const,
      Fecha: '2026-09-23',
      Categoria: 'Servicio',
      Concepto: 'iCloud',
      Monto: 15.00,
      Entidad: 'Interbank',
      Mes: 'Setiembre',
    };

    const effective = getEffectiveCategory(tx);
    expect(effective?.id).toBe('entretenimiento');
    expect(getEffectiveCategoryLabel(tx)).toBe('🎮 Entretenimiento & Streaming');

    // With manual override
    const manualOverrides = { 'tx-icloud-test': 'tecnologia' };
    const overridden = getEffectiveCategory(tx, manualOverrides);
    expect(overridden?.id).toBe('tecnologia');
    expect(getEffectiveCategoryLabel(tx, manualOverrides)).toBe('💻 Tecnología & Gadgets');
  });

  it('identifies debt and non-debt transactions accurately with isDebtTransaction', () => {
    const debtTx1 = {
      id: 'tx-prestamo',
      Tipo: 'Egreso' as const,
      Fecha: '2026-09-01',
      Categoria: 'Deuda',
      Concepto: 'Prestamo Yape',
      Monto: 116.85,
      Entidad: 'Interbank',
      Mes: 'Setiembre',
    };
    expect(isDebtTransaction(debtTx1)).toBe(true);

    const debtTx2 = {
      id: 'tx-pago-tarjeta',
      Tipo: 'Egreso' as const,
      Fecha: '2026-09-01',
      Categoria: 'Pagos de Tarjetas & Deudas',
      Concepto: 'Pago de Tarjeta BBVA Bfree',
      Monto: 500,
      Entidad: 'BBVA Bfree',
      Mes: 'Setiembre',
    };
    expect(isDebtTransaction(debtTx2)).toBe(true);

    const expenseTx = {
      id: 'tx-broaster',
      Tipo: 'Egreso' as const,
      Fecha: '2026-09-01',
      Categoria: 'Gasto',
      Concepto: 'Broaster',
      Monto: 15.00,
      Entidad: 'Interbank',
      Mes: 'Setiembre',
    };
    expect(isDebtTransaction(expenseTx)).toBe(false);
  });
});
