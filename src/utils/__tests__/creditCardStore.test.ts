import { describe, it, expect, beforeEach } from 'vitest';
import { useCreditCardStore, DEFAULT_CARDS } from '../../store/creditCardStore';
import { calculateCardLivePosition } from '../creditCardCycles';
import type { Transaction } from '../../store/financeStore';

describe('CreditCardStore & Card Operations', () => {
  beforeEach(() => {
    // Reset store to default cards
    useCreditCardStore.setState({ cards: DEFAULT_CARDS });
  });

  it('initializes with exact cutoff and payment dates for the 3 master cards', () => {
    const cards = useCreditCardStore.getState().cards;
    
    // Interbank Amex: corte 21, pago 15
    const ibk = cards.find(c => c.entity === 'Interbank Amex')!;
    expect(ibk).toBeDefined();
    expect(ibk.cycleStartDay).toBe(21);
    expect(ibk.paymentDay).toBe(15);

    // BBVA Bfree: corte 10, pago 5
    const bbva = cards.find(c => c.entity === 'BBVA Bfree')!;
    expect(bbva).toBeDefined();
    expect(bbva.cycleStartDay).toBe(10);
    expect(bbva.paymentDay).toBe(5);

    // Ripley: corte 3, pago 1
    const ripley = cards.find(c => c.entity === 'Ripley')!;
    expect(ripley).toBeDefined();
    expect(ripley.cycleStartDay).toBe(3);
    expect(ripley.paymentDay).toBe(1);
  });

  it('allows adding a new credit card with all custom attributes', () => {
    const store = useCreditCardStore.getState();
    const newCard = store.addCard({
      name: 'Scotiabank Visa Infinite',
      entity: 'Scotiabank',
      cycleStartDay: 18,
      paymentDay: 12,
      creditLine: 15000,
      colorTheme: 'cyan',
    });

    expect(newCard.id).toBeDefined();
    expect(newCard.name).toBe('Scotiabank Visa Infinite');
    expect(newCard.entity).toBe('Scotiabank');
    expect(newCard.cycleStartDay).toBe(18);
    expect(newCard.paymentDay).toBe(12);
    expect(newCard.creditLine).toBe(15000);

    const updatedCards = useCreditCardStore.getState().cards;
    expect(updatedCards.length).toBe(4);
    expect(updatedCards.some(c => c.entity === 'Scotiabank')).toBe(true);
  });

  it('allows deleting a card when debt is completely settled (0 debt)', () => {
    const store = useCreditCardStore.getState();
    const newCard = store.addCard({
      name: 'BCP Visa Latam Pass',
      entity: 'BCP Visa',
      cycleStartDay: 25,
      paymentDay: 20,
      creditLine: 8000,
      colorTheme: 'blue',
    });

    const refDate = new Date(2026, 8, 9);
    const mockTxs: Transaction[] = []; // No transactions = 0 debt
    const pos = calculateCardLivePosition(newCard, mockTxs, refDate);

    // Condition to delete: liveDebt === 0
    expect(pos.liveDebt).toBe(0);

    // Can be deleted
    store.deleteCard(newCard.id);
    expect(useCreditCardStore.getState().cards.some(c => c.id === newCard.id)).toBe(false);
  });

  it('identifies live debt > 0 which prevents deletion', () => {
    const store = useCreditCardStore.getState();
    const bbva = store.cards.find(c => c.entity === 'BBVA Bfree')!;
    const refDate = new Date(2026, 8, 9);

    const activeTxs: Transaction[] = [
      {
        id: 'tx-bbva-1',
        Tipo: 'Egreso',
        Fecha: '2026-08-25',
        Concepto: 'Compra Supermercado',
        Categoria: 'Alimentación & Supermercado',
        Entidad: 'BBVA Bfree',
        Monto: 450,
        Mes: 'Agosto',
      },
    ];

    const pos = calculateCardLivePosition(bbva, activeTxs, refDate);
    // There is active debt -> deletion locked
    expect(pos.liveDebt).toBeGreaterThan(0);
    const canDelete = pos.liveDebt === 0;
    expect(canDelete).toBe(false);
  });
});
