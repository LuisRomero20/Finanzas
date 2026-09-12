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
 * Inserta o actualiza una transacción individual en Supabase.
 */
export async function insertTransactionToSupabase(tx: Transaction): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const payload: any = {
      id: tx.id,
      tipo: tx.Tipo,
      fecha: tx.Fecha,
      concepto: tx.Concepto,
      categoria: tx.Categoria,
      entidad: tx.Entidad,
      monto: tx.Monto,
      mes: tx.Mes,
    };
    if (tx.estado) {
      payload.estado = tx.estado;
    }
    if (tx.createdAt) {
      payload.created_at = tx.createdAt;
    }

    let { data, error } = await supabase
      .from('transacciones')
      .upsert(payload)
      .select();

    // Si la columna 'estado' no existiera aún en el esquema remoto, reintentar sin ella
    if (error && error.message?.toLowerCase().includes('estado')) {
      delete payload.estado;
      const retry = await supabase.from('transacciones').upsert(payload).select();
      data = retry.data;
      error = retry.error;
    }

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
    if (error) {
      console.warn('Supabase delete warning:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase delete catch:', err);
    return false;
  }
}

/**
 * Obtiene todas las transacciones guardadas en Supabase (excluyendo registros de sistema/pendientes).
 */
export async function fetchTransactionsFromSupabase(): Promise<Transaction[] | null> {
  try {
    const { data, error } = await supabase
      .from('transacciones')
      .select('*')
      .not('id', 'like', 'pending-%')
      .not('id', 'like', 'config-%')
      .order('fecha', { ascending: false });

    if (error || !data) {
      return null;
    }

    return data.map((row: any) => {
      const isProvisional =
        row.estado === 'provisional' ||
        row.estado === 'pendiente' ||
        (row.estado !== 'confirmado' && (
          String(row.id).startsWith('proy-') ||
          (typeof row.concepto === 'string' && /\[proy\]|\(proy\)/i.test(row.concepto))
        ));

      return {
        id: String(row.id),
        Tipo: row.tipo,
        Fecha: row.fecha,
        Concepto: row.concepto,
        Categoria: row.categoria,
        Entidad: row.entidad,
        Monto: Number(row.monto),
        Mes: row.mes,
        estado: isProvisional ? 'provisional' : (row.estado || 'confirmado'),
        createdAt: row.created_at,
      };
    });
  } catch {
    return null;
  }
}

/**
 * Obtiene todos los pagos pendientes guardados en Supabase para sincronizar entre PC y móvil.
 * Normaliza el campo 'tipo' a formato correcto ('Ingreso' | 'Egreso') independientemente de mayúsculas.
 */
export async function fetchPendingPaymentsFromSupabase(): Promise<any[] | null> {
  try {
    const { data, error } = await supabase
      .from('transacciones')
      .select('*')
      .like('id', 'pending-%')
      .order('fecha', { ascending: true });

    if (error || !data) return null;

    return data.map((row: any) => {
      // Normalizar tipo para que siempre sea 'Ingreso' o 'Egreso' (con mayúscula inicial)
      const rawTipo = String(row.tipo || 'Egreso');
      const tipo = rawTipo.charAt(0).toUpperCase() + rawTipo.slice(1).toLowerCase();
      const tipoNorm = tipo === 'Ingreso' ? 'Ingreso' : 'Egreso';

      return {
        id: String(row.id).replace(/^pending-/, ''),
        tipo: tipoNorm,
        fecha: row.fecha,
        concepto: row.concepto,
        categoria: row.categoria,
        entidad: row.entidad,
        monto: Number(row.monto),
        mes: row.mes,
        mesStr: row.fecha ? row.fecha.slice(0, 7) : '2026-10',
        estado: 'pendiente',
        origen: 'Proyección',
        fechaCreacion: row.created_at || new Date().toISOString(),
      };
    });
  } catch (e) {
    console.warn('Error fetching pending payments from Supabase:', e);
    return null;
  }
}

/**
 * Guarda la configuración de tarjetas de crédito en Supabase (para sincronizar entre dispositivos).
 */
export async function saveCardsConfigToSupabase(cards: any[]): Promise<boolean> {
  try {
    const payload = {
      id: 'config-credit-cards-v2',
      tipo: 'Egreso',
      fecha: '2026-01-01',
      concepto: JSON.stringify(cards),
      categoria: 'Config',
      entidad: 'Sistema',
      monto: 0,
      mes: 'Config',
    };
    const { error } = await supabase
      .from('transacciones')
      .upsert(payload, { onConflict: 'id' });
    return !error;
  } catch {
    return false;
  }
}

/**
 * Obtiene la configuración de tarjetas de crédito desde Supabase.
 */
export async function fetchCardsConfigFromSupabase(): Promise<any[] | null> {
  try {
    const { data, error } = await supabase
      .from('transacciones')
      .select('*')
      .eq('id', 'config-credit-cards-v2')
      .single();

    if (error || !data || !data.concepto) return null;
    const parsed = JSON.parse(data.concepto);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Guarda la configuración de líneas de crédito en Supabase.
 */
export async function saveCreditLinesConfigToSupabase(lines: Record<string, number>, labels: Record<string, string>): Promise<boolean> {
  try {
    const payload = {
      id: 'config-credit-lines-v2',
      tipo: 'Egreso',
      fecha: '2026-01-01',
      concepto: JSON.stringify({ lines, labels }),
      categoria: 'Config',
      entidad: 'Sistema',
      monto: 0,
      mes: 'Config',
    };
    const { error } = await supabase
      .from('transacciones')
      .upsert(payload, { onConflict: 'id' });
    return !error;
  } catch {
    return false;
  }
}

/**
 * Obtiene la configuración de líneas de crédito desde Supabase.
 */
export async function fetchCreditLinesConfigFromSupabase(): Promise<{ lines: Record<string, number>; labels: Record<string, string> } | null> {
  try {
    const { data, error } = await supabase
      .from('transacciones')
      .select('*')
      .eq('id', 'config-credit-lines-v2')
      .single();

    if (error || !data || !data.concepto) return null;
    const parsed = JSON.parse(data.concepto);
    if (parsed && typeof parsed.lines === 'object') return parsed;
    return null;
  } catch {
    return null;
  }
}

/**
 * Guarda o actualiza un pago pendiente en Supabase.
 */
export async function savePendingPaymentToSupabase(item: any): Promise<boolean> {
  try {
    const cleanId = String(item.id).replace(/^pending-/, '');
    const payload = {
      id: `pending-${cleanId}`,
      tipo: item.tipo,
      fecha: item.fecha,
      concepto: item.concepto,
      categoria: item.categoria,
      entidad: item.entidad,
      monto: Number(item.monto),
      mes: item.mes,
    };

    const { error } = await supabase
      .from('transacciones')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.warn('Error saving pending payment to Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Catch saving pending payment to Supabase:', err);
    return false;
  }
}

/**
 * Elimina un pago pendiente de Supabase.
 * Soporta borrado por ID y opcionalmente por coincidencia exacta de datos comerciales
 * para erradicar cualquier duplicado zombie que haya quedado en la nube.
 */
export async function deletePendingPaymentFromSupabase(
  id: string,
  matchCriteria?: { fecha?: string; concepto?: string; entidad?: string; monto?: number }
): Promise<boolean> {
  try {
    const cleanId = String(id).replace(/^pending-/, '');
    const { error } = await supabase
      .from('transacciones')
      .delete()
      .eq('id', `pending-${cleanId}`);

    if (error) {
      console.warn('Error deleting pending payment from Supabase:', error.message);
    }

    // Si tenemos datos comerciales del item, eliminar también cualquier fila pendiente duplicada en Supabase con los mismos datos
    if (matchCriteria?.fecha && matchCriteria?.concepto) {
      const cleanConcepto = matchCriteria.concepto.replace(/\s*-\s*proy/gi, '').trim();
      let query = supabase
        .from('transacciones')
        .delete()
        .like('id', 'pending-%')
        .eq('fecha', matchCriteria.fecha)
        .ilike('concepto', `%${cleanConcepto}%`);

      if (matchCriteria.entidad) {
        query = query.eq('entidad', matchCriteria.entidad);
      }
      if (matchCriteria.monto !== undefined && Number(matchCriteria.monto) > 0) {
        query = query.eq('monto', Number(matchCriteria.monto));
      }

      const { error: matchErr } = await query;
      if (matchErr) {
        console.warn('Error deleting matching pending duplicates from Supabase:', matchErr.message);
      }
    }

    return true;
  } catch (err) {
    console.warn('Catch deleting pending payment from Supabase:', err);
    return false;
  }
}

/**
 * Guarda la configuración de días puente de mes anterior en Supabase.
 */
export async function saveBridgeConfigToSupabase(configs: Record<string, any>): Promise<boolean> {
  try {
    const payload = {
      id: 'config-prev-month-bridge',
      tipo: 'Egreso',
      fecha: '2026-01-01',
      concepto: JSON.stringify(configs),
      categoria: 'Config',
      entidad: 'Interbank',
      monto: 0,
      mes: 'Config',
    };
    const { error } = await supabase
      .from('transacciones')
      .upsert(payload, { onConflict: 'id' });
    return !error;
  } catch {
    return false;
  }
}

/**
 * Obtiene la configuración de días puente de mes anterior de Supabase.
 */
export async function fetchBridgeConfigFromSupabase(): Promise<Record<string, any> | null> {
  try {
    const { data, error } = await supabase
      .from('transacciones')
      .select('*')
      .eq('id', 'config-prev-month-bridge')
      .single();

    if (error || !data || !data.concepto) return null;
    return JSON.parse(data.concepto);
  } catch {
    return null;
  }
}

/**
 * Guarda las metas de ahorro en Supabase para sincronizar entre PC y celular.
 */
export async function saveSavingsGoalsToSupabase(goals: any[]): Promise<boolean> {
  try {
    const payload = {
      id: 'config-savings-goals-v1',
      tipo: 'Egreso',
      fecha: '2026-01-01',
      concepto: JSON.stringify(goals),
      categoria: 'Config',
      entidad: 'Sistema',
      monto: 0,
      mes: 'Config',
    };
    const { error } = await supabase
      .from('transacciones')
      .upsert(payload, { onConflict: 'id' });
    return !error;
  } catch {
    return false;
  }
}

/**
 * Obtiene las metas de ahorro desde Supabase.
 */
export async function fetchSavingsGoalsFromSupabase(): Promise<any[] | null> {
  try {
    const { data, error } = await supabase
      .from('transacciones')
      .select('*')
      .eq('id', 'config-savings-goals-v1')
      .single();

    if (error || !data || !data.concepto) return null;
    const parsed = JSON.parse(data.concepto);
    return Array.isArray(parsed) ? parsed : null;
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
