import { describe, it, expect } from 'vitest';
import {
  CARDS,
  getCycles,
  calculateCardLivePosition,
  getCardPaymentTxs,
} from '../creditCardCycles';
import type { Transaction } from '../../store/financeStore';

describe('Credit Card Cycles & Live Position Logic', () => {
  const mockTransactions: Transaction[] = [
    // Consumos ciclo facturado Amex (21-jul al 20-ago)
    {
      id: 'tx-1',
      Tipo: 'Egreso',
      Fecha: '2026-08-05',
      Concepto: 'Cena Restaurante',
      Categoria: 'Comida & Restaurantes',
      Entidad: 'Interbank Amex',
      Monto: 300,
      Mes: 'Agosto',
    },
    {
      id: 'tx-2',
      Tipo: 'Egreso',
      Fecha: '2026-08-10',
      Concepto: 'Ropa',
      Categoria: 'Compras & Ocio',
      Entidad: 'Interbank Amex',
      Monto: 451.89,
      Mes: 'Agosto',
    },
    // Consumos ciclo en curso Amex (21-ago al 20-set)
    {
      id: 'tx-3',
      Tipo: 'Egreso',
      Fecha: '2026-08-25',
      Concepto: 'Supermercado',
      Categoria: 'Alimentación & Supermercado',
      Entidad: 'Interbank Amex',
      Monto: 200,
      Mes: 'Agosto',
    },
    {
      id: 'tx-4',
      Tipo: 'Egreso',
      Fecha: '2026-09-02',
      Concepto: 'Gasolina',
      Categoria: 'Transporte & Movilidad',
      Entidad: 'Interbank Amex',
      Monto: 265.30,
      Mes: 'Setiembre',
    },
    // Pago de tarjeta realizado el 01-set desde cuenta Interbank
    {
      id: 'tx-pago-1',
      Tipo: 'Egreso',
      Fecha: '2026-09-01',
      Concepto: 'Pago de Tarjeta Interbank Amex',
      Categoria: 'Pagos de Tarjetas & Deudas',
      Entidad: 'Interbank',
      Monto: 751.89,
      Mes: 'Setiembre',
    },
  ];

  it('calcula los ciclos correctamente para Interbank Amex en fecha 09-09-2026', () => {
    const amex = CARDS.find((c) => c.entity === 'Interbank Amex')!;
    const refDate = new Date(2026, 8, 9); // 09 de Setiembre de 2026
    const { current, prev } = getCycles(refDate, amex);

    expect(prev.start.getMonth()).toBe(6); // Julio (mes 6)
    expect(prev.start.getDate()).toBe(21);
    expect(prev.end.getMonth()).toBe(7); // Agosto (mes 7)
    expect(prev.end.getDate()).toBe(20);

    expect(current.start.getMonth()).toBe(7); // Agosto (mes 7)
    expect(current.start.getDate()).toBe(21);
    expect(current.end.getMonth()).toBe(8); // Setiembre (mes 8)
    expect(current.end.getDate()).toBe(20);
  });

  it('detecta pagos de tarjeta buscando Pago de Tarjeta <Entidad>', () => {
    const amex = CARDS.find((c) => c.entity === 'Interbank Amex')!;
    const refDate = new Date(2026, 8, 9);
    const { prev } = getCycles(refDate, amex);

    const pagos = getCardPaymentTxs(mockTransactions, amex.entity, prev.prevPayDate, prev.payDate);
    expect(pagos.length).toBe(1);
    expect(pagos[0].Monto).toBe(751.89);
    expect(pagos[0].Concepto).toContain('Pago de Tarjeta Interbank Amex');
  });

  it('cancela la deuda facturada cuando llega el pago total y deja solo lo acumulado en curso', () => {
    const amex = CARDS.find((c) => c.entity === 'Interbank Amex')!;
    const refDate = new Date(2026, 8, 9);

    const pos = calculateCardLivePosition(amex, mockTransactions, refDate, 751.89);

    // Facturado saldado con 751.89
    expect(pos.isPaid).toBe(true);
    expect(pos.netToPay).toBe(0);
    expect(pos.prevTotal).toBe(751.89);
    expect(pos.paymentTotal).toBe(751.89);

    // En curso: 200 + 265.30 = 465.30
    expect(pos.currTotal).toBe(465.30);
    // Deuda viva = lo acumulando en curso
    expect(pos.liveDebt).toBe(465.30);
  });

  it('mantiene la deuda pendiente cuando aún no se ha realizado el pago', () => {
    const ripley = CARDS.find((c) => c.entity === 'Ripley')!;
    const refDate = new Date(2026, 8, 9);

    const ripleyTxs: Transaction[] = [
      {
        id: 'r-1',
        Tipo: 'Egreso',
        Fecha: '2026-08-20',
        Concepto: 'Compra Tienda',
        Categoria: 'Compras & Ocio',
        Entidad: 'Ripley',
        Monto: 395.81,
        Mes: 'Agosto',
      },
      {
        id: 'r-2',
        Tipo: 'Egreso',
        Fecha: '2026-09-06',
        Concepto: 'Farmacia',
        Categoria: 'Salud & Bienestar',
        Entidad: 'Ripley',
        Monto: 67,
        Mes: 'Setiembre',
      },
    ];

    const pos = calculateCardLivePosition(ripley, ripleyTxs, refDate);

    expect(pos.isPaid).toBe(false);
    expect(pos.netToPay).toBe(395.81);
    expect(pos.currTotal).toBe(67);
    expect(pos.liveDebt).toBe(395.81 + 67);
  });
});
