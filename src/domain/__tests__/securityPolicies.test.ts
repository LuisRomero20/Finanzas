import { describe, expect, it } from 'vitest';

interface SyntheticRow {
  id: string;
  user_id: string;
  concepto: string;
  monto: number;
}

interface SecurityContext {
  role: 'anon' | 'authenticated';
  uid: string | null;
}

/**
 * Simulador de Semántica RLS de PostgreSQL para validación aislada de políticas.
 */
class PostgresRLSSimulator {
  private rows: SyntheticRow[] = [];
  private rlsEnabled = true;

  constructor(initialRows: SyntheticRow[]) {
    this.rows = [...initialRows];
  }

  // Simula REVOKE ALL FROM anon
  private checkRolePermission(context: SecurityContext, operation: 'select' | 'insert' | 'update' | 'delete' | 'truncate'): void {
    if (operation === 'truncate') {
      throw new Error('permission denied for table transacciones: TRUNCATE is revoked for all client roles.');
    }
    if (context.role === 'anon') {
      throw new Error(`permission denied for table transacciones: role anon does not have ${operation.toUpperCase()} privilege.`);
    }
  }

  // Simula SELECT usando (select auth.uid()) = user_id
  select(context: SecurityContext): SyntheticRow[] {
    if (context.role === 'anon') {
      return []; // Con RLS activa y sin permisos anon, retorna vacío
    }
    return this.rows.filter((row) => row.user_id === context.uid);
  }

  // Simula INSERT con check ((select auth.uid()) = user_id)
  insert(context: SecurityContext, newRow: SyntheticRow): { success: boolean; row?: SyntheticRow; error?: string } {
    try {
      this.checkRolePermission(context, 'insert');
      if (context.uid !== newRow.user_id) {
        return { success: false, error: 'new row violates row-level security policy for table "transacciones"' };
      }
      this.rows.push(newRow);
      return { success: true, row: newRow };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  // Simula UPDATE usando y check ((select auth.uid()) = user_id)
  update(context: SecurityContext, id: string, updates: Partial<SyntheticRow>): { modifiedCount: number; error?: string } {
    try {
      this.checkRolePermission(context, 'update');
      let count = 0;
      this.rows = this.rows.map((row) => {
        if (row.id === id && row.user_id === context.uid) {
          count++;
          return { ...row, ...updates, user_id: row.user_id }; // user_id inmutable
        }
        return row;
      });
      return { modifiedCount: count };
    } catch (e: any) {
      return { modifiedCount: 0, error: e.message };
    }
  }

  // Simula DELETE usando ((select auth.uid()) = user_id)
  delete(context: SecurityContext, id: string): { deletedCount: number; error?: string } {
    try {
      this.checkRolePermission(context, 'delete');
      const before = this.rows.length;
      this.rows = this.rows.filter((row) => !(row.id === id && row.user_id === context.uid));
      return { deletedCount: before - this.rows.length };
    } catch (e: any) {
      return { deletedCount: 0, error: e.message };
    }
  }

  // Simula TRUNCATE
  truncate(context: SecurityContext): void {
    this.checkRolePermission(context, 'truncate');
    this.rows = [];
  }
}

describe('Isolated Security & RLS Policy Simulation', () => {
  const OWNER_UID = 'user-luis-owner-1234';
  const ATTACKER_UID = 'user-intruder-9999';

  const syntheticDataset: SyntheticRow[] = [
    { id: 'tx-1', user_id: OWNER_UID, concepto: 'Sueldo Octubre', monto: 8000 },
    { id: 'tx-2', user_id: OWNER_UID, concepto: 'Supermercado', monto: 350 },
    { id: 'tx-3', user_id: 'other-user-5678', concepto: 'Gasto Ajeno', monto: 120 },
  ];

  it('blocks anonymous clients from reading any financial records', () => {
    const db = new PostgresRLSSimulator(syntheticDataset);
    const anonContext: SecurityContext = { role: 'anon', uid: null };

    const rows = db.select(anonContext);
    expect(rows).toHaveLength(0);
  });

  it('rejects anonymous write, update, delete and truncate attempts', () => {
    const db = new PostgresRLSSimulator(syntheticDataset);
    const anonContext: SecurityContext = { role: 'anon', uid: null };

    const insertResult = db.insert(anonContext, {
      id: 'tx-hack',
      user_id: OWNER_UID,
      concepto: 'Intento Inyección',
      monto: 999,
    });
    expect(insertResult.success).toBe(false);
    expect(insertResult.error).toContain('permission denied');

    const updateResult = db.update(anonContext, 'tx-1', { monto: 0 });
    expect(updateResult.modifiedCount).toBe(0);
    expect(updateResult.error).toContain('permission denied');

    const deleteResult = db.delete(anonContext, 'tx-1');
    expect(deleteResult.deletedCount).toBe(0);
    expect(deleteResult.error).toContain('permission denied');

    expect(() => db.truncate(anonContext)).toThrow(/permission denied/);
  });

  it('allows authenticated owner full CRUD over their own records', () => {
    const db = new PostgresRLSSimulator(syntheticDataset);
    const ownerContext: SecurityContext = { role: 'authenticated', uid: OWNER_UID };

    // SELECT
    const ownRows = db.select(ownerContext);
    expect(ownRows).toHaveLength(2);
    expect(ownRows.map((r) => r.id)).toEqual(['tx-1', 'tx-2']);

    // INSERT
    const insertRes = db.insert(ownerContext, {
      id: 'tx-owner-new',
      user_id: OWNER_UID,
      concepto: 'Cena de Trabajo',
      monto: 180,
    });
    expect(insertRes.success).toBe(true);
    expect(db.select(ownerContext)).toHaveLength(3);

    // UPDATE
    const updateRes = db.update(ownerContext, 'tx-1', { monto: 8500 });
    expect(updateRes.modifiedCount).toBe(1);
    const updatedRow = db.select(ownerContext).find((r) => r.id === 'tx-1');
    expect(updatedRow?.monto).toBe(8500);

    // DELETE
    const deleteRes = db.delete(ownerContext, 'tx-owner-new');
    expect(deleteRes.deletedCount).toBe(1);
    expect(db.select(ownerContext)).toHaveLength(2);
  });

  it('prevents an authenticated user from accessing or modifying another users records', () => {
    const db = new PostgresRLSSimulator(syntheticDataset);
    const attackerContext: SecurityContext = { role: 'authenticated', uid: ATTACKER_UID };

    // SELECT must return 0 rows for other users
    const visibleRows = db.select(attackerContext);
    expect(visibleRows).toHaveLength(0);

    // INSERT with someone else's user_id must be rejected by check policy
    const forgedInsert = db.insert(attackerContext, {
      id: 'tx-forged',
      user_id: OWNER_UID,
      concepto: 'Gasto Falso',
      monto: 500,
    });
    expect(forgedInsert.success).toBe(false);
    expect(forgedInsert.error).toContain('violates row-level security policy');

    // UPDATE on someone else's row affects 0 rows
    const updateResult = db.update(attackerContext, 'tx-1', { monto: 1 });
    expect(updateResult.modifiedCount).toBe(0);

    // DELETE on someone else's row affects 0 rows
    const deleteResult = db.delete(attackerContext, 'tx-1');
    expect(deleteResult.deletedCount).toBe(0);

    // Verify original owner data remains completely untouched
    const ownerContext: SecurityContext = { role: 'authenticated', uid: OWNER_UID };
    expect(db.select(ownerContext)).toHaveLength(2);
    expect(db.select(ownerContext).find((r) => r.id === 'tx-1')?.monto).toBe(8000);
  });

  it('blocks TRUNCATE even for authenticated users', () => {
    const db = new PostgresRLSSimulator(syntheticDataset);
    const ownerContext: SecurityContext = { role: 'authenticated', uid: OWNER_UID };

    expect(() => db.truncate(ownerContext)).toThrow(/TRUNCATE is revoked/);
  });
});
