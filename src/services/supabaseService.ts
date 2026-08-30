import { supabase } from '../lib/supabase';
import type { Transaction } from '../utils/masterData';
import { masterTransactions } from '../utils/masterData';

export interface CloudMigrationStatus {
  inProgress: boolean;
  total: number;
  migrated: number;
  percentage: number;
  statusText: string;
  error?: string;
  success?: boolean;
}

export interface SupabaseHealth {
  connected: boolean;
  tableExists: boolean;
  rowCount: number;
  message: string;
}

/**
 * Verifica la conectividad y existencia de la tabla 'transacciones' en Supabase.
 */
export async function checkSupabaseHealth(): Promise<SupabaseHealth> {
  try {
    const { count, error } = await supabase
      .from('transacciones')
      .select('*', { count: 'exact', head: true });

    if (error) {
      // Si la tabla no existe o las credenciales no son válidas
      return {
        connected: false,
        tableExists: false,
        rowCount: 0,
        message: error.message || 'No se pudo conectar a la tabla de transacciones.',
      };
    }

    return {
      connected: true,
      tableExists: true,
      rowCount: count || 0,
      message: `Conectado a Supabase (${count || 0} registros en la nube).`,
    };
  } catch (err: any) {
    return {
      connected: false,
      tableExists: false,
      rowCount: 0,
      message: err?.message || 'Error de red al contactar Supabase.',
    };
  }
}

/**
 * Inserta una transacción individual en Supabase.
 */
export async function insertTransactionToSupabase(tx: Transaction): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const payload = {
      id: tx.id,
      tipo: tx.Tipo,
      fecha: tx.Fecha,
      concepto: tx.Concepto,
      categoria: tx.Categoria,
      entidad: tx.Entidad,
      monto: tx.Monto,
      mes: tx.Mes,
    };

    const { data, error } = await supabase
      .from('transacciones')
      .upsert(payload)
      .select();

    if (error) {
      console.warn('Supabase insert warning:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err: any) {
    console.warn('Supabase insert catch:', err?.message);
    return { success: false, error: err?.message };
  }
}

/**
 * Elimina una transacción de Supabase.
 */
export async function deleteTransactionFromSupabase(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('transacciones').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

/**
 * Obtiene todas las transacciones guardadas en Supabase.
 */
export async function fetchTransactionsFromSupabase(): Promise<Transaction[] | null> {
  try {
    const { data, error } = await supabase
      .from('transacciones')
      .select('*')
      .order('fecha', { ascending: false });

    if (error || !data) {
      return null;
    }

    return data.map((row: any) => ({
      id: String(row.id),
      Tipo: row.tipo,
      Fecha: row.fecha,
      Concepto: row.concepto,
      Categoria: row.categoria,
      Entidad: row.entidad,
      Monto: Number(row.monto),
      Mes: row.mes,
    }));
  } catch {
    return null;
  }
}

/**
 * Migra en lotes (batches de 100) todo el histórico de masterTransactions a Supabase.
 */
export async function migrateMasterTransactionsToSupabase(
  onProgress?: (status: CloudMigrationStatus) => void,
  customList?: Transaction[]
): Promise<CloudMigrationStatus> {
  const sourceList = customList && customList.length > 0 ? customList : masterTransactions;
  const total = sourceList.length;
  const batchSize = 100;
  let migrated = 0;

  onProgress?.({
    inProgress: true,
    total,
    migrated: 0,
    percentage: 0,
    statusText: `Iniciando migración de ${total} registros hacia Supabase...`,
  });

  try {
    for (let i = 0; i < total; i += batchSize) {
      const batch = sourceList.slice(i, i + batchSize).map((t) => ({
        id: t.id,
        tipo: t.Tipo,
        fecha: t.Fecha,
        concepto: t.Concepto,
        categoria: t.Categoria,
        entidad: t.Entidad,
        monto: t.Monto,
        mes: t.Mes,
      }));

      const { error } = await supabase
        .from('transacciones')
        .upsert(batch, { onConflict: 'id' });

      if (error) {
        const errStatus: CloudMigrationStatus = {
          inProgress: false,
          total,
          migrated,
          percentage: Math.round((migrated / total) * 100),
          statusText: `Error en lote ${i + 1}-${Math.min(i + batchSize, total)}: ${error.message}`,
          error: error.message,
          success: false,
        };
        onProgress?.(errStatus);
        return errStatus;
      }

      migrated += batch.length;
      const pct = Math.round((migrated / total) * 100);

      onProgress?.({
        inProgress: true,
        total,
        migrated,
        percentage: pct,
        statusText: `Sincronizados ${migrated} de ${total} registros (${pct}%)...`,
      });
    }

    const finalStatus: CloudMigrationStatus = {
      inProgress: false,
      total,
      migrated,
      percentage: 100,
      statusText: `¡Migración completada con éxito! ${total} registros están en Supabase.`,
      success: true,
    };

    onProgress?.(finalStatus);
    return finalStatus;
  } catch (err: any) {
    const errorStatus: CloudMigrationStatus = {
      inProgress: false,
      total,
      migrated,
      percentage: Math.round((migrated / total) * 100),
      statusText: `Fallo durante la migración: ${err?.message || 'Error desconocido'}`,
      error: err?.message,
      success: false,
    };
    onProgress?.(errorStatus);
    return errorStatus;
  }
}
