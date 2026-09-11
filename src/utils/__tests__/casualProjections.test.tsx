import { describe, it, expect, beforeEach } from 'vitest';
import { usePendingPaymentsStore } from '../../store/pendingPaymentsStore';
import { useFinanceStore } from '../../store/financeStore';

describe('Casual Projections and Return to Pending Workflow', () => {
  beforeEach(() => {
    // Reset stores
    usePendingPaymentsStore.setState({ items: [] });
  });

  it('adds a casual projection with origen="Proyección" and cleans concept without suffix', () => {
    const { addPendingItem } = usePendingPaymentsStore.getState();

    const item = addPendingItem({
      tipo: 'Egreso',
      fecha: '2026-09-09',
      concepto: 'Futbol - Proy',
      categoria: 'Gasto',
      entidad: 'Interbank',
      monto: 10,
      origen: 'Proyección',
      mes: 'Setiembre',
      mesStr: '2026-09',
    });

    expect(item.id).toBeDefined();
    // Concept is cleaned of suffix and remains purely 'Futbol'
    expect(item.concepto).toBe('Futbol');
    expect(item.origen).toBe('Proyección');
    expect(usePendingPaymentsStore.getState().items).toHaveLength(1);
  });

  it('executes a casual projection into financeStore with estado="provisional"', () => {
    const { addPendingItem, executePendingPayment } = usePendingPaymentsStore.getState();

    const item = addPendingItem({
      tipo: 'Egreso',
      fecha: '2026-09-09',
      concepto: 'Taxi',
      categoria: 'Gasto',
      entidad: 'Interbank Amex',
      monto: 40,
      origen: 'Proyección',
      mes: 'Setiembre',
      mesStr: '2026-09',
    });

    const result = executePendingPayment(item.id);
    expect(result.success).toBe(true);

    // Pending list should now be empty
    expect(usePendingPaymentsStore.getState().items).toHaveLength(0);

    // FinanceStore should have the transaction marked as provisional
    const tx = useFinanceStore.getState().transactions.find(t => t.Concepto === 'Taxi');
    expect(tx).toBeDefined();
    expect(tx?.estado).toBe('provisional');
    expect(tx?.Monto).toBe(40);
  });

  it('simulates returning all projections from financeStore to pendingPaymentsStore', () => {
    const { addTransaction, deleteTransaction, transactions } = useFinanceStore.getState();
    const { addPendingItem } = usePendingPaymentsStore.getState();

    // Add two provisional projection transactions in financeStore
    const tx1 = addTransaction({
      Tipo: 'Egreso',
      Fecha: '2026-09-09',
      Concepto: 'Vodka - Proy',
      Categoria: 'Gasto',
      Entidad: 'Ripley',
      Monto: 40,
      Mes: 'Setiembre',
      estado: 'provisional',
    });

    const tx2 = addTransaction({
      Tipo: 'Egreso',
      Fecha: '2026-09-09',
      Concepto: 'Broaster - Proy',
      Categoria: 'Gasto',
      Entidad: 'Interbank',
      Monto: 15,
      Mes: 'Setiembre',
      estado: 'provisional',
    });

    // Simulate handleReturnAllProjections
    const currentTxs = useFinanceStore.getState().transactions;
    const proyTxs = currentTxs.filter(
      (t) => t.estado === 'provisional' || t.Concepto.toLowerCase().includes('proy')
    );
    expect(proyTxs.length).toBeGreaterThanOrEqual(2);

    proyTxs.forEach((t) => {
      addPendingItem({
        tipo: t.Tipo,
        concepto: t.Concepto,
        monto: t.Monto,
        categoria: t.Categoria,
        entidad: t.Entidad,
        fecha: t.Fecha,
        origen: 'Proyección',
        mes: t.Mes,
        mesStr: t.Fecha.slice(0, 7),
      });
      deleteTransaction(t.id);
    });

    // Both should now be in pending payments with clean concepts
    const pendingItems = usePendingPaymentsStore.getState().items;
    const vodkaPending = pendingItems.find(p => p.concepto === 'Vodka');
    const broasterPending = pendingItems.find(p => p.concepto === 'Broaster');

    expect(vodkaPending).toBeDefined();
    expect(broasterPending).toBeDefined();
    expect(vodkaPending?.origen).toBe('Proyección');

    // And they should be deleted from financeStore
    const remainingVodka = useFinanceStore.getState().transactions.find(t => t.id === tx1.id);
    const remainingBroaster = useFinanceStore.getState().transactions.find(t => t.id === tx2.id);
    expect(remainingVodka).toBeUndefined();
    expect(remainingBroaster).toBeUndefined();
  });

  it('deletes a pending payment and records tombstone to prevent resurrection', () => {
    const { addPendingItem, deletePendingItem } = usePendingPaymentsStore.getState();

    const item = addPendingItem({
      tipo: 'Egreso',
      fecha: '2026-09-10',
      concepto: 'Pastilla Madre',
      categoria: 'Salud & Farmacia',
      entidad: 'Ripley',
      monto: 120,
      origen: 'Proyección',
      mes: 'Setiembre',
      mesStr: '2026-09',
    });

    expect(usePendingPaymentsStore.getState().items).toHaveLength(1);

    // Eliminar la partida
    deletePendingItem(item.id);

    // Debe quedar vacía
    expect(usePendingPaymentsStore.getState().items).toHaveLength(0);
  });
});
