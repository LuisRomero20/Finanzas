import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  enqueueTransaction,
  flushTransactions,
  pendingTransactions,
  clearTransactionOutboxForTesting,
} from '../../services/transactionOutbox';
import {
  enqueuePendingSave,
  enqueuePendingDelete,
  getPendingOutboxItems,
  clearPendingOutboxForTesting,
} from '../../services/pendingPaymentsOutbox';
import * as supabaseService from '../../services/supabaseService';
import * as authService from '../../services/authService';
import type { Transaction } from '../../utils/masterData';

describe('FINPER 2.0.4 — Outbox de Transacciones y Persistencia Offline', () => {
  const dummyTx: Transaction = {
    id: 'tx-v204-idempotent-01',
    Tipo: 'Egreso',
    Fecha: '2026-10-22',
    Concepto: 'Operación Idempotente Outbox',
    Categoria: 'Servicios',
    Entidad: 'BCP',
    Monto: 85.0,
    Mes: 'Octubre',
  };

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    clearTransactionOutboxForTesting();
    clearPendingOutboxForTesting();

    vi.spyOn(authService, 'getValidatedSession').mockResolvedValue({
      access_token: 'valid-v204-token',
      refresh_token: 'valid-v204-refresh',
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      token_type: 'bearer',
      user: { id: '0fdea8f0-da9c-458b-a78c-4810a0685f2b', email: 'luis_jesusrc@hotmail.com' } as any,
    });
  });

  // 1. Idempotencia en encolado de transacciones
  it('garantiza unicidad e idempotencia: actualizar una misma transacción en cola no duplica registros', () => {
    enqueueTransaction('tx-v204-idempotent-01', dummyTx);
    expect(pendingTransactions()).toHaveLength(1);

    // Encolar nuevamente con nuevo monto antes del flush
    enqueueTransaction('tx-v204-idempotent-01', { ...dummyTx, Monto: 99.5 });
    const pending = pendingTransactions();
    expect(pending).toHaveLength(1);
    expect(pending[0].transaction?.Monto).toBe(99.5);
  });

  // 2. Persistencia en localStorage ante reinicio o recarga de navegador
  it('persiste la cola en localStorage para garantizar recuperación tras recarga de página', () => {
    enqueueTransaction('tx-v204-persisted-01', dummyTx);
    const rawStorage = localStorage.getItem('finper_transaction_outbox_v1');
    expect(rawStorage).toBeTruthy();

    const parsed = JSON.parse(rawStorage!);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].id).toBe('tx-v204-persisted-01');
    expect(parsed[0].transaction?.Concepto).toBe('Operación Idempotente Outbox');
  });

  // 3. Resiliencia y retención ante fallo de red
  it('retiene las transacciones en cola si Supabase retorna error de red sin perder los datos', async () => {
    vi.spyOn(supabaseService, 'insertTransactionToSupabase').mockResolvedValue({
      success: false,
      error: 'Network connection failed (offline)',
    });

    enqueueTransaction('tx-v204-fail-01', dummyTx);
    await flushTransactions();

    // La transacción debe permanecer en la cola para reintento
    const pending = pendingTransactions();
    expect(pending).toHaveLength(1);
    expect(pending[0].id).toBe('tx-v204-fail-01');
    expect(pending[0].attempts).toBe(1);
  });

  // 4. Remoción atómica únicamente tras confirmación remota exitosa
  it('remueve la transacción de la cola únicamente tras confirmación exitosa de Supabase', async () => {
    vi.spyOn(supabaseService, 'insertTransactionToSupabase').mockResolvedValue({
      success: true,
      data: [{ id: 'tx-v204-ok-01' }],
    });

    enqueueTransaction('tx-v204-ok-01', dummyTx);
    expect(pendingTransactions()).toHaveLength(1);

    await flushTransactions();
    expect(pendingTransactions()).toHaveLength(0);
    expect(localStorage.getItem('finper_transaction_outbox_v1')).toBe('[]');
  });

  // 5. Cancelación limpia en cola de pagos pendientes antes de tocar la nube
  it('cancela localmente un pago pendiente en cola si se elimina antes de haber tocado Supabase', () => {
    const pendingItem = {
      id: 'pend-v204-001',
      tipo: 'Egreso' as const,
      fecha: '2026-10-25',
      concepto: 'Pago que se cancela local',
      categoria: 'Servicios',
      entidad: 'Interbank',
      monto: 50.0,
      mes: 'Octubre',
    };

    // Encolar guardado
    enqueuePendingSave(pendingItem);
    expect(getPendingOutboxItems()).toHaveLength(1);

    // Cancelar/Eliminar antes de flush
    enqueuePendingDelete('pend-v204-001');
    expect(getPendingOutboxItems()).toHaveLength(0);
  });
});
