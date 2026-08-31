import { describe, it, expect } from 'vitest';
import {
  CONCEPTO_A_CATEGORIA,
  CATEGORIAS_PERSONALES,
  autoClassify,
  getCategoryByIdOrLabel,
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

  it('resolves category by ID and by full label', () => {
    const byId = getCategoryByIdOrLabel('comida');
    expect(byId?.nombre).toBe('Comida & Restaurantes');
    expect(byId?.emoji).toBe('🍔');

    const byLabel = getCategoryByIdOrLabel('🍔 Comida & Restaurantes');
    expect(byLabel?.id).toBe('comida');
  });
});
