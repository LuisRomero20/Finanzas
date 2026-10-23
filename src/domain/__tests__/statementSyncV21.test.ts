/**
 * FINPER 2.1 · Sprint 01 — Cierre de sincronización de conciliaciones.
 *
 * IMPORTANTE (honestidad de la evidencia): estas pruebas son SIMULADAS y aisladas.
 * - "Supabase" es un doble en memoria (`remoteDb`) que reproduce la semántica de
 *   readSnapshot/writeSnapshot: manifiesto con head, escritura con control optimista
 *   (previousHead) y fallos inyectables (sin red, sesión, respuesta perdida, escritura no persistida).
 * - Cada "dispositivo" es una instancia independiente de los módulos (vi.resetModules) con su
 *   propio localStorage, de modo que PC e iPhone no comparten estado en memoria.
 * - NO se realiza ninguna llamada a la base productiva. La validación con dispositivos reales
 *   se documenta aparte en el tutorial y requiere un proyecto Supabase de pruebas.
 */
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import type { VerifiedStatement } from '../../store/cardStatementStore';
import { describeStatementSave } from '../cards/statementSyncFeedback';
import { buildPaymentIdempotencyKey, detectEquivalentPayment } from '../cards/smartCardEngine';
import { useFinanceStore } from '../../store/financeStore';
import { clearTransactionOutboxForTesting, flushTransactions, pendingTransactions } from '../../services/transactionOutbox';
import { insertTransactionToSupabase } from '../../services/supabaseService';

// ───────────────────────────── Dobles remotos ─────────────────────────────
const remoteDb = vi.hoisted(() => ({
  data: {} as Record<string, string | null>,
  head: {} as Record<string, string | null>,
  version: 0,
  writes: 0,
  offline: false,
  failWritesTimes: 0,
  dropWrites: false,
  authExpired: false,
  concurrentWriter: null as null | ((name: string) => void),
  txRows: new Map<string, unknown>(),
}));

vi.mock('../../services/settingsSnapshot', async importOriginal => ({
  ...(await importOriginal<typeof import('../../services/settingsSnapshot')>()),
  readSnapshot: vi.fn(async (name: string) => {
    if (remoteDb.authExpired) throw new Error('Sesión no disponible o expirada. Por favor valida tu sesión.');
    if (remoteDb.offline) throw new Error('Failed to fetch');
    return { value: remoteDb.data[name] ?? null, head: remoteDb.head[name] ?? null };
  }),
  writeSnapshot: vi.fn(async (name: string, value: string, previousHead: string | null) => {
    if (remoteDb.offline) throw new Error('Failed to fetch');
    if (remoteDb.failWritesTimes > 0) { remoteDb.failWritesTimes--; throw new Error('Failed to fetch'); }
    if (remoteDb.concurrentWriter) { const w = remoteDb.concurrentWriter; remoteDb.concurrentWriter = null; w(name); }
    if ((remoteDb.head[name] ?? null) !== previousHead) {
      throw new Error('Otro dispositivo actualizó los datos. Reintenta para comparar las versiones.');
    }
    remoteDb.writes++;
    remoteDb.head[name] = `rev-${++remoteDb.version}`;
    if (!remoteDb.dropWrites) remoteDb.data[name] = value; // dropWrites: respuesta OK pero NO persistió
  }),
}));

vi.mock('../../services/supabaseService', async importOriginal => ({
  ...(await importOriginal<typeof import('../../services/supabaseService')>()),
  insertTransactionToSupabase: vi.fn(),
  deleteTransactionFromSupabase: vi.fn(async () => true),
}));

// ───────────────────────────── Dispositivos simulados ─────────────────────────────
type StoreModule = typeof import('../../store/cardStatementStore');
type SyncModule = typeof import('../../services/personalSettingsSync');
interface Device { id: string; store: StoreModule; sync: SyncModule }

const lsByDevice: Record<string, Record<string, string>> = {};
function loadLS(id: string) {
  localStorage.clear();
  for (const [k, v] of Object.entries(lsByDevice[id] ?? {})) localStorage.setItem(k, v);
}
function dumpLS(id: string) {
  const out: Record<string, string> = {};
  for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i)!; out[k] = localStorage.getItem(k)!; }
  lsByDevice[id] = out;
}
async function on<T>(dev: { id: string }, fn: () => Promise<T> | T): Promise<T> {
  loadLS(dev.id);
  try { return await fn(); } finally { dumpLS(dev.id); }
}
/** Arranque (o recarga) de un dispositivo: módulos nuevos que releen su localStorage. */
async function boot(id: string): Promise<Device> {
  loadLS(id);
  try {
    vi.resetModules();
    const store = await import('../../store/cardStatementStore');
    const sync = await import('../../services/personalSettingsSync');
    return { id, store, sync };
  } finally { dumpLS(id); }
}

const KEY = 'Interbank_2026-11-15';
const makeStatement = (over: Partial<VerifiedStatement> = {}): VerifiedStatement => ({
  id: `stmt-${KEY}`,
  cardEntity: 'Interbank',
  cycleKey: KEY,
  dueDate: '2026-11-15',
  cutoffDate: '2026-10-21',
  finalDebt: 400,
  fileName: 'Declaración Manual de Usuario (Sin Documento)',
  source: 'manual_entry',
  verificationStatus: 'user_declared',
  matchedCount: 0, totalStatementItems: 0, totalAppItems: 0,
  totalStatementCargos: 400, totalAppCargos: 400, diferenciaGastos: 0,
  verifiedAt: '2026-10-23T12:00:00.000Z',
  ...over,
});
const save = (d: Device, s: VerifiedStatement) => on(d, () => d.store.useCardStatementStore.getState().saveVerifiedStatementAndSync(s));
const syncNow = (d: Device) => on(d, () => d.sync.syncStatementsWithOutcome());
const remoteStatements = () => (remoteDb.data.statements ? JSON.parse(remoteDb.data.statements) : {});
const pendingMarker = (id: string) => lsByDevice[id]?.['finper_verified_card_statements_pending_v1'];

beforeEach(() => {
  for (const k of Object.keys(lsByDevice)) delete lsByDevice[k];
  remoteDb.data = {}; remoteDb.head = {}; remoteDb.version = 0; remoteDb.writes = 0;
  remoteDb.offline = false; remoteDb.failWritesTimes = 0; remoteDb.dropWrites = false;
  remoteDb.authExpired = false; remoteDb.concurrentWriter = null; remoteDb.txRows.clear();
  localStorage.clear();
});
afterEach(() => { vi.restoreAllMocks(); });

// ═════════════════════ Conciliaciones PC ↔ nube ↔ iPhone ═════════════════════
describe('Conciliaciones — sincronización multidispositivo con confirmación verificable (SIMULADO)', () => {
  it('1-2. conciliación creada en PC: guardada localmente y confirmada solo tras releer la nube', async () => {
    const pc = await boot('pc');
    const res = await save(pc, makeStatement());

    expect(res.localSaved).toBe(true);
    expect(res.sync?.state).toBe('remote_confirmed');
    expect(remoteStatements()[KEY].finalDebt).toBe(400);
    expect(remoteDb.writes).toBe(1);
    expect(pc.store.useCardStatementStore.getState().syncInfo.state).toBe('remote_confirmed');
    expect(pendingMarker('pc')).toBeUndefined(); // sin pendientes tras la confirmación
  });

  it('3. otro cliente (iPhone) recupera exactamente la misma conciliación', async () => {
    const pc = await boot('pc');
    await save(pc, makeStatement({ finalDebt: 455.6 }));

    const phone = await boot('iphone');
    const out = await syncNow(phone);

    expect(out.state).toBe('remote_confirmed');
    const got = phone.store.useCardStatementStore.getState().statements[KEY];
    expect(got.finalDebt).toBe(455.6);
    expect(got.cycleKey).toBe(KEY);
  });

  it('4. fallo de red: la conciliación no se pierde, queda local_pending y se confirma al reintentar', async () => {
    const pc = await boot('pc');
    remoteDb.offline = true;
    const res = await save(pc, makeStatement());

    expect(res.localSaved).toBe(true);
    expect(res.sync?.state).toBe('local_pending');
    expect(res.sync?.state).not.toBe('remote_confirmed');
    expect(pc.store.useCardStatementStore.getState().statements[KEY].finalDebt).toBe(400);
    expect(pc.store.useCardStatementStore.getState().syncInfo.state).toBe('local_pending');
    expect(pendingMarker('pc')).toContain(KEY);
    expect(remoteStatements()[KEY]).toBeUndefined();

    remoteDb.offline = false;
    const retry = await on(pc, () => pc.store.useCardStatementStore.getState().retrySync());
    expect(retry.state).toBe('remote_confirmed');
    expect(remoteStatements()[KEY].finalDebt).toBe(400);
    expect(pendingMarker('pc')).toBeUndefined();
  });

  it('4b. error de sesión o escritura no verificada se informa como sync_failed (nunca como confirmado)', async () => {
    const pc = await boot('pc');

    remoteDb.authExpired = true;
    const auth = await save(pc, makeStatement());
    expect(auth.sync?.state).toBe('sync_failed');
    expect(auth.sync?.message).toMatch(/sesión/i);
    expect(pc.store.useCardStatementStore.getState().syncInfo.state).toBe('sync_failed');

    remoteDb.authExpired = false;
    remoteDb.dropWrites = true; // Supabase "acepta" pero no persiste: ausencia de excepción ≠ confirmación
    const lost = await save(pc, makeStatement());
    expect(lost.sync?.state).toBe('sync_failed');
    expect(lost.sync?.message).toMatch(/verificación remota/i);
    expect(pc.store.useCardStatementStore.getState().statements[KEY].finalDebt).toBe(400);

    remoteDb.dropWrites = false;
    const ok = await syncNow(pc);
    expect(ok.state).toBe('remote_confirmed');
    expect(remoteStatements()[KEY].finalDebt).toBe(400);
  });

  it('5. conflicto entre dos dispositivos: se detecta y ninguna versión sobrescribe a la otra', async () => {
    const pc = await boot('pc');
    const phone = await boot('iphone');
    await save(pc, makeStatement({ finalDebt: 400 }));
    await syncNow(phone); // ambos parten de la misma versión confirmada

    remoteDb.offline = true;                                   // el iPhone edita sin conexión…
    await save(phone, makeStatement({ finalDebt: 500 }));
    remoteDb.offline = false;
    await save(pc, makeStatement({ finalDebt: 450 }));          // …mientras el PC publica otra versión

    const out = await syncNow(phone);

    expect(out.state).toBe('conflict');
    expect(remoteStatements()[KEY].finalDebt).toBe(450);        // nube intacta
    expect(phone.store.useCardStatementStore.getState().statements[KEY].finalDebt).toBe(500); // local intacto
    const entry = phone.sync.useSettingsSync.getState().entries.statements;
    expect(entry.status).toBe('conflict');
    expect(entry.diffReport?.modifiedCount).toBe(1);
    expect(phone.store.useCardStatementStore.getState().syncInfo.state).toBe('conflict');
  });

  it('5b. carrera de escritura (head cambió entre lectura y escritura): conflicto explícito, sin pisar la nube', async () => {
    const pc = await boot('pc');
    await save(pc, makeStatement({ finalDebt: 400 }));

    const phone = await boot('iphone');
    await syncNow(phone);

    remoteDb.offline = true;
    await save(phone, makeStatement({ finalDebt: 520 }));
    remoteDb.offline = false;
    // Otro dispositivo escribe justo antes de que el iPhone publique
    remoteDb.concurrentWriter = name => {
      remoteDb.data[name] = JSON.stringify({ [KEY]: { ...makeStatement({ finalDebt: 610 }) } });
      remoteDb.head[name] = `rev-${++remoteDb.version}`;
    };

    const out = await syncNow(phone);
    expect(out.state).toBe('conflict');
    expect(out.errorKind).toBe('concurrency');
    expect(remoteStatements()[KEY].finalDebt).toBe(610);
    expect(phone.store.useCardStatementStore.getState().statements[KEY].finalDebt).toBe(520);
  });

  it('6. reintentos sin duplicación: misma clave estable, una sola entrada local y remota', async () => {
    const pc = await boot('pc');
    remoteDb.failWritesTimes = 1;
    const first = await save(pc, makeStatement());
    expect(first.sync?.state).toBe('local_pending');

    const second = await save(pc, makeStatement()); // reintento del mismo guardado
    expect(second.sync?.state).toBe('remote_confirmed');
    await syncNow(pc);                               // sincronización extra: no vuelve a escribir

    expect(Object.keys(pc.store.useCardStatementStore.getState().statements)).toEqual([KEY]);
    expect(Object.keys(remoteStatements())).toEqual([KEY]);
    expect(remoteDb.writes).toBe(1);
  });

  it('7. conserva referencias documentales; confirmación Supabase ≠ verificación bancaria', async () => {
    const pc = await boot('pc');
    await save(pc, makeStatement({
      verificationStatus: 'statement_verified', source: 'statement_file',
      documentReference: 'EECC_Interbank_Oct2026.pdf', fileName: 'EECC_Interbank_Oct2026.pdf',
    }));
    const declaredKey = 'BBVA_2026-11-05';
    const declared = await save(pc, makeStatement({
      id: `stmt-${declaredKey}`, cycleKey: declaredKey, cardEntity: 'BBVA', dueDate: '2026-11-05', finalDebt: 220,
    }));
    // La persistencia se confirmó, pero la verificación bancaria de la declaración manual NO cambia
    expect(declared.sync?.state).toBe('remote_confirmed');

    const phone = await boot('iphone');
    await syncNow(phone);
    const stmts = phone.store.useCardStatementStore.getState().statements;
    expect(stmts[KEY].verificationStatus).toBe('statement_verified');
    expect(stmts[KEY].documentReference).toBe('EECC_Interbank_Oct2026.pdf');
    expect(stmts[declaredKey].verificationStatus).toBe('user_declared');
    expect(stmts[declaredKey].documentReference).toBeUndefined();
  });

  it('8. recuperación tras recargar: lo no confirmado sigue pendiente y se confirma después', async () => {
    const pc = await boot('pc');
    remoteDb.offline = true;
    await save(pc, makeStatement({ finalDebt: 333.33 }));

    const reloaded = await boot('pc'); // recarga de la pestaña: módulos nuevos, mismo localStorage
    const info = reloaded.store.useCardStatementStore.getState();
    expect(info.statements[KEY].finalDebt).toBe(333.33);
    expect(info.syncInfo.state).toBe('local_pending');

    remoteDb.offline = false;
    const out = await syncNow(reloaded);
    expect(out.state).toBe('remote_confirmed');
    expect(remoteStatements()[KEY].finalDebt).toBe(333.33);
    expect(pendingMarker('pc')).toBeUndefined();
  });

  it('almacenamiento local fallido: no se anuncia éxito ni se intenta sincronizar', async () => {
    const pc = await boot('pc');
    loadLS('pc');
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('QuotaExceededError'); });
    const res = await pc.store.useCardStatementStore.getState().saveVerifiedStatementAndSync(makeStatement());
    vi.restoreAllMocks();
    dumpLS('pc');

    expect(res.localSaved).toBe(false);
    expect(res.sync).toBeUndefined();
    expect(pc.store.useCardStatementStore.getState().statements[KEY]).toBeUndefined();
    expect(remoteDb.writes).toBe(0);
    const fb = describeStatementSave(res, { cardName: 'Interbank', amountText: 'S/ 400.00', bankStatusText: 'declarada manualmente' });
    expect(fb.tone).toBe('error');
    expect(fb.canClose).toBe(false);
  });

  it('almacenamiento que no retiene lo escrito (relectura distinta) también se detecta', async () => {
    const pc = await boot('pc');
    loadLS('pc');
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { /* descarta la escritura */ });
    const res = await pc.store.useCardStatementStore.getState().saveVerifiedStatementAndSync(makeStatement());
    vi.restoreAllMocks();
    dumpLS('pc');
    expect(res.localSaved).toBe(false);
    expect(res.error).toMatch(/verificación de lectura/i);
  });
});

// ═════════════════════ Mensajes de interfaz (verificación ≠ nube) ═════════════════════
describe('Mensajes de guardado — estados comprensibles y separados', () => {
  const ctx = { cardName: 'BBVA Bfree', amountText: 'S/ 650.00', bankStatusText: 'declarada manualmente por el usuario' };
  const base = { localSaved: true, key: KEY } as const;

  it('cada resultado produce un mensaje distinto y solo remote_confirmed declara confirmación', () => {
    const confirmed = describeStatementSave({ ...base, sync: { state: 'remote_confirmed', message: 'ok' } }, ctx);
    const pending = describeStatementSave({ ...base, sync: { state: 'local_pending', message: 'Sin conexión' } }, ctx);
    const failed = describeStatementSave({ ...base, sync: { state: 'sync_failed', message: 'Sesión expirada.' } }, ctx);
    const conflict = describeStatementSave({ ...base, sync: { state: 'conflict', message: 'x' } }, ctx);

    expect(confirmed.remoteConfirmed).toBe(true);
    expect(confirmed.message).toContain('Confirmada en Supabase');
    for (const f of [pending, failed, conflict]) {
      expect(f.remoteConfirmed).toBe(false);
      expect(f.message).not.toContain('Confirmada en Supabase');
      expect(f.canClose).toBe(true);
    }
    expect(pending.message).toContain('este dispositivo');
    expect(failed.message).toContain('Sesión expirada.');
    expect(conflict.message).toContain('NO se sobrescribió');
    // La verificación bancaria siempre se informa aparte
    for (const f of [confirmed, pending, failed, conflict]) expect(f.message).toContain('Verificación bancaria: declarada manualmente por el usuario');
  });
});

// ═════════════════════ Pagos: idempotencia y Outbox ═════════════════════
describe('Pagos — tres pagos legítimos iguales y Outbox sin eliminaciones prematuras (SIMULADO)', () => {
  const payment = (id: string) => ({
    id, Tipo: 'Egreso' as const, Categoria: 'Servicio', Concepto: 'Pago de Tarjeta Interbank',
    Monto: 100, Entidad: 'Interbank', Fecha: '2026-10-23',
  });
  const insertMock = vi.mocked(insertTransactionToSupabase);

  beforeEach(() => {
    clearTransactionOutboxForTesting();
    insertMock.mockReset();
  });

  it('9. tres pagos legítimos idénticos obtienen IDs distintos y los tres se conservan', async () => {
    const before = useFinanceStore.getState().transactions.length;
    const ids: string[] = [];
    for (let i = 0; i < 3; i++) {
      const check = detectEquivalentPayment({
        existingPayments: useFinanceStore.getState().transactions as never,
        cardEntity: 'Interbank', paymentDate: '2026-10-23', amount: 100,
      });
      const id = buildPaymentIdempotencyKey({
        cardEntity: 'Interbank', dueDate: '2026-11-15', paymentDate: '2026-10-23', amount: 100,
        sequence: check.suggestedSequence,
      });
      ids.push(id);
      const res = await useFinanceStore.getState().registerPaymentTransaction(payment(id), { skipImmediateFlush: true });
      expect(res.persistenceState).toBe('local_pending');
    }
    expect(new Set(ids).size).toBe(3);
    expect(ids[1]).toMatch(/-seq2$/);
    expect(ids[2]).toMatch(/-seq3$/);
    expect(useFinanceStore.getState().transactions.length).toBe(before + 3);
    ids.forEach(id => useFinanceStore.getState().deleteTransaction(id));
  });

  it('10a. respuesta de error o excepción: la operación permanece en el Outbox y no se muestra remote_confirmed', async () => {
    insertMock.mockResolvedValueOnce({ success: false, error: 'HTTP 503' });
    const res = await useFinanceStore.getState().registerPaymentTransaction(payment('pay-outbox-a'));
    expect(res.persistenceState).not.toBe('remote_confirmed');
    expect(pendingTransactions().some(op => op.id === 'pay-outbox-a')).toBe(true);
    expect(pendingTransactions().find(op => op.id === 'pay-outbox-a')?.attempts).toBe(1);

    insertMock.mockRejectedValueOnce(new Error('Failed to fetch'));
    await flushTransactions(true);
    expect(pendingTransactions().some(op => op.id === 'pay-outbox-a')).toBe(true);
    expect(JSON.parse(localStorage.getItem('finper_transaction_outbox_v1') || '[]').some((op: { id: string }) => op.id === 'pay-outbox-a')).toBe(true);
    useFinanceStore.getState().deleteTransaction('pay-outbox-a');
  });

  it('10b. respuesta perdida tras escritura exitosa: el reintento con el mismo ID no inserta una fila nueva', async () => {
    // Doble remoto con semántica upsert por id (como supabase.from("transacciones").upsert)
    insertMock.mockImplementation(async tx => { remoteDb.txRows.set(tx.id, tx); return { success: true }; });
    insertMock.mockImplementationOnce(async tx => { remoteDb.txRows.set(tx.id, tx); throw new Error('Failed to fetch'); }); // el servidor escribió, el cliente no lo sabe

    const first = await useFinanceStore.getState().registerPaymentTransaction(payment('pay-lost-resp'));
    expect(first.persistenceState).not.toBe('remote_confirmed');
    expect(remoteDb.txRows.size).toBe(1);
    expect(pendingTransactions().some(op => op.id === 'pay-lost-resp')).toBe(true);

    const retry = await useFinanceStore.getState().registerPaymentTransaction(payment('pay-lost-resp'));
    expect(retry.persistenceState).toBe('remote_confirmed');
    expect(remoteDb.txRows.size).toBe(1);                       // sin duplicación remota
    expect(pendingTransactions().some(op => op.id === 'pay-lost-resp')).toBe(false); // sale solo tras éxito
    useFinanceStore.getState().deleteTransaction('pay-lost-resp');
  });

  it('10c. doble envío desde dispositivos distintos con el mismo ID termina en una sola fila remota', async () => {
    insertMock.mockImplementation(async tx => { remoteDb.txRows.set(tx.id, tx); return { success: true }; });
    const id = buildPaymentIdempotencyKey({ cardEntity: 'Interbank', dueDate: '2026-11-15', paymentDate: '2026-10-23', amount: 100 });
    await useFinanceStore.getState().registerPaymentTransaction(payment(id));  // "PC"
    clearTransactionOutboxForTesting();
    await useFinanceStore.getState().registerPaymentTransaction(payment(id));  // "iPhone" (misma intención)
    expect(remoteDb.txRows.size).toBe(1);
    useFinanceStore.getState().deleteTransaction(id);
  });
});
