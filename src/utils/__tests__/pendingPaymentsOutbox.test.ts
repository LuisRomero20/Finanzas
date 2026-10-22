import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  enqueuePendingSave,
  enqueuePendingDelete,
  flushPendingPaymentsOutbox,
  getPendingOutboxCount,
  getPendingOutboxItems,
  clearPendingOutboxForTesting,
} from '../../services/pendingPaymentsOutbox';
import * as supabaseService from '../../services/supabaseService';
import * as authService from '../../services/authService';
import type { PendingPaymentItem } from '../../store/pendingPaymentsStore';

describe('Pending Payments Outbox & Offline Sync Queue', () => {
  const dummyItem: PendingPaymentItem = {
    id: 'pend-test-123',
    concepto: 'GYM Cuota',
    monto: 150,
    tipo: 'Egreso',
    categoria: 'Salud & Gimnasio',
    entidad: 'Interbank',
    fecha: '2026-10-25',
    mes: 'Octubre',
    mesStr: '2026-10',
    estado: 'pendiente',
    origen: 'Manual',
    fechaCreacion: '2026-10-22T10:00:00.000Z',
  };

  beforeEach(() => {
    localStorage.clear();
    clearPendingOutboxForTesting();
    vi.restoreAllMocks();
    // Default valid session
    vi.spyOn(authService, 'getValidatedSession').mockResolvedValue({
      access_token: 'valid-token',
      refresh_token: 'valid-refresh',
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      token_type: 'bearer',
      user: { id: '0fdea8f0-da9c-458b-a78c-4810a0685f2b', email: 'luis_jesusrc@hotmail.com' } as any,
    });
  });

  it('enqueues a pending payment save and flushes automatically on active session', async () => {
    const saveSpy = vi.spyOn(supabaseService, 'savePendingPaymentToSupabase').mockResolvedValue(true);

    enqueuePendingSave(dummyItem);

    // After flush runs
    await flushPendingPaymentsOutbox();

    expect(saveSpy).toHaveBeenCalledWith(dummyItem);
    expect(getPendingOutboxCount()).toBe(0);
  });

  it('preserves operation in outbox when cloud returns false (network/server failure)', async () => {
    vi.spyOn(supabaseService, 'savePendingPaymentToSupabase').mockResolvedValue(false);

    enqueuePendingSave(dummyItem);
    const result = await flushPendingPaymentsOutbox();

    expect(result.remaining).toBe(1);
    expect(getPendingOutboxCount()).toBe(1);

    const items = getPendingOutboxItems();
    expect(items[0].id).toBe('test-123');
    expect(items[0].attempts).toBe(1);
  });

  it('re-tries and flushes successfully when cloud connectivity is restored', async () => {
    const saveSpy = vi.spyOn(supabaseService, 'savePendingPaymentToSupabase')
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);

    enqueuePendingSave(dummyItem);
    await flushPendingPaymentsOutbox();
    expect(getPendingOutboxCount()).toBe(1);

    // Second flush succeeds
    const retryResult = await flushPendingPaymentsOutbox();
    expect(retryResult.flushed).toBe(1);
    expect(getPendingOutboxCount()).toBe(0);
    expect(saveSpy).toHaveBeenCalledTimes(2);
  });

  it('enqueues pending delete and flushes idempotently', async () => {
    const deleteSpy = vi.spyOn(supabaseService, 'deletePendingPaymentFromSupabase').mockResolvedValue(true);

    enqueuePendingDelete('pend-test-123', {
      fecha: '2026-10-25',
      concepto: 'GYM Cuota',
      entidad: 'Interbank',
      monto: 150,
    });

    await flushPendingPaymentsOutbox();

    expect(deleteSpy).toHaveBeenCalledWith('test-123', {
      fecha: '2026-10-25',
      concepto: 'GYM Cuota',
      entidad: 'Interbank',
      monto: 150,
    });
    expect(getPendingOutboxCount()).toBe(0);
  });
});
