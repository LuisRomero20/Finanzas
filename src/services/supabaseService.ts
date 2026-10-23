import { supabase } from '../lib/supabase';
import type { Transaction } from '../utils/masterData';
import { masterTransactions } from '../utils/masterData';
import { getValidatedSession } from './authService';

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
    const session = await getValidatedSession();
    if (!session?.user?.id) {
      return { success: false, error: 'Se requiere sesión activa y validada para sincronizar transacciones' };
    }
    const payload: any = {
      id: tx.id,
      tipo: tx.Tipo,
      fecha: tx.Fecha,
      concepto: tx.Concepto,
      categoria: tx.Categoria,
      entidad: tx.Entidad,
      monto: tx.Monto,
      mes: tx.Mes,
      user_id: session.user.id,
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
    const session = await getValidatedSession();
    if (!session?.user?.id) {
      console.warn('deleteTransactionFromSupabase: no authenticated session');
      return false;
    }
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
      .order('fecha', { ascending: false })
      .limit(50000);

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

      let cuotasVal = row.cuotas ? Number(row.cuotas) : undefined;
      if (!cuotasVal && typeof row.concepto === 'string') {
        const match = row.concepto.match(/\[(\d+)\s*cuotas?\]|\((\d+)\s*cuotas?\)/i);
        if (match) cuotasVal = parseInt(match[1] || match[2], 10);
      }
      const montoNum = Number(row.monto);

      return {
        id: String(row.id),
        Tipo: row.tipo,
        Fecha: row.fecha,
        Concepto: row.concepto,
        Categoria: row.categoria,
        Entidad: row.entidad,
        Monto: montoNum,
        Mes: row.mes,
        estado: isProvisional ? 'provisional' : (row.estado || 'confirmado'),
        createdAt: row.created_at,
        cuotas: cuotasVal && cuotasVal > 1 ? cuotasVal : undefined,
        esCuotas: Boolean(cuotasVal && cuotasVal > 1),
        montoTotal: montoNum,
        montoCuota: cuotasVal && cuotasVal > 1 ? Math.round((montoNum / cuotasVal) * 100) / 100 : undefined,
      };
    });
  } catch {
    return null;
  }
}

/**
 * Obtiene todos los pagos pendientes guardados en Supabase para sincronizar entre PC y móvil.
 */
export async function fetchPendingPaymentsFromSupabase(): Promise<any[] | null> {
  try {
    const { data, error } = await supabase
      .from('transacciones')
      .select('*')
      .like('id', 'pending-%')
      .order('fecha', { ascending: true })
      .limit(50000);

    if (error || !data) return null;

    return data.map((row: any) => {
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
 * Guarda la configuración de tarjetas de crédito en Supabase.
 */
export async function saveCardsConfigToSupabase(cards: any[]): Promise<boolean> {
  try {
    const session = await getValidatedSession();
    const payload: any = {
      id: 'config-credit-cards-v2',
      tipo: 'Egreso',
      fecha: '2026-01-01',
      concepto: JSON.stringify(cards),
      categoria: 'Config',
      entidad: 'Sistema',
      monto: 0,
      mes: 'Config',
    };
    if (session?.user?.id) {
      payload.user_id = session.user.id;
    }
    const { error } = await supabase
      .from('transacciones')
      .upsert(payload, { onConflict: 'id' });
    return !error;
  } catch {
    return false;
  }
}

export type ConfigQueryStatus =
  | 'found'
  | 'not_found'
  | 'permission_denied'
  | 'network_error'
  | 'multiple_rows'
  | 'parse_error';

export interface OptionalConfigResult<T> {
  data: T | null;
  status: ConfigQueryStatus;
  statusCode?: number;
  error?: string;
}

/**
 * Consulta un registro opcional de configuración en 'transacciones' utilizando .maybeSingle().
 * Previene respuestas HTTP 406 (Not Acceptable) cuando el registro aún no existe en Supabase.
 * Diferencia con precisión entre: registro inexistente, error RLS de permisos (403/42501),
 * fallo de red, colisión de múltiples filas o error de deserialización JSON.
 */
export async function fetchOptionalConfigRow<T>(
  configId: string,
  parser: (rawConcepto: string) => T | null,
  debugLabel = configId
): Promise<OptionalConfigResult<T>> {
  try {
    const { data, error, status } = await supabase
      .from('transacciones')
      .select('*')
      .eq('id', configId)
      .maybeSingle();

    if (error) {
      const errCode = (error as any)?.code;
      const errMsg = error.message || '';

      if (errCode === 'PGRST116' || errMsg.includes('multiple') || errMsg.includes('0 or 1 row')) {
        console.warn(`[Supabase Config] Múltiples filas encontradas para ${debugLabel}. Se requiere deduplicación.`);
        return { data: null, status: 'multiple_rows', statusCode: status, error: errMsg };
      }

      if (errCode === '42501' || status === 403 || status === 401) {
        console.warn(`[Supabase Config] Permiso denegado por RLS al consultar ${debugLabel} (${errCode || status}): ${errMsg}`);
        return { data: null, status: 'permission_denied', statusCode: status, error: errMsg };
      }

      console.warn(`[Supabase Config] Error consultando ${debugLabel} (${errCode || status}): ${errMsg}`);
      return { data: null, status: 'network_error', statusCode: status, error: errMsg };
    }

    if (!data || !data.concepto) {
      return { data: null, status: 'not_found', statusCode: status };
    }

    try {
      const parsed = parser(data.concepto);
      if (parsed === null) {
        console.warn(`[Supabase Config] Formato no compatible en ${debugLabel}`);
        return { data: null, status: 'parse_error', statusCode: status, error: 'Formato no compatible' };
      }
      return { data: parsed, status: 'found', statusCode: status };
    } catch (parseErr: any) {
      console.warn(`[Supabase Config] Error al procesar JSON en ${debugLabel}:`, parseErr?.message);
      return { data: null, status: 'parse_error', statusCode: status, error: parseErr?.message };
    }
  } catch (err: any) {
    console.warn(`[Supabase Config] Error inesperado de red al consultar ${debugLabel}:`, err?.message || err);
    return { data: null, status: 'network_error', error: err?.message };
  }
}

/**
 * Obtiene la configuración de tarjetas de crédito desde Supabase (.maybeSingle() para evitar 406).
 */
export async function fetchCardsConfigFromSupabase(): Promise<any[] | null> {
  const result = await fetchOptionalConfigRow<any[]>(
    'config-credit-cards-v2',
    (raw) => {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : null;
    },
    'Tarjetas de Crédito (config-credit-cards-v2)'
  );
  return result.data;
}

/**
 * Guarda la configuración de líneas de crédito en Supabase.
 */
export async function saveCreditLinesConfigToSupabase(lines: Record<string, number>, labels: Record<string, string>): Promise<boolean> {
  try {
    const session = await getValidatedSession();
    const payload: any = {
      id: 'config-credit-lines-v2',
      tipo: 'Egreso',
      fecha: '2026-01-01',
      concepto: JSON.stringify({ lines, labels }),
      categoria: 'Config',
      entidad: 'Sistema',
      monto: 0,
      mes: 'Config',
    };
    if (session?.user?.id) {
      payload.user_id = session.user.id;
    }
    const { error } = await supabase
      .from('transacciones')
      .upsert(payload, { onConflict: 'id' });
    return !error;
  } catch {
    return false;
  }
}

/**
 * Obtiene la configuración de líneas de crédito desde Supabase (.maybeSingle() para evitar 406).
 */
export async function fetchCreditLinesConfigFromSupabase(): Promise<{ lines: Record<string, number>; labels: Record<string, string> } | null> {
  const result = await fetchOptionalConfigRow<{ lines: Record<string, number>; labels: Record<string, string> }>(
    'config-credit-lines-v2',
    (raw) => {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.lines === 'object') return parsed;
      return null;
    },
    'Líneas de Crédito (config-credit-lines-v2)'
  );
  return result.data;
}

/**
 * Guarda o actualiza un pago pendiente en Supabase.
 */
export async function savePendingPaymentToSupabase(item: any): Promise<boolean> {
  try {
    const session = await getValidatedSession();
    const cleanId = String(item.id).replace(/^(pending-|pend-)/, '');
    const payload: any = {
      id: `pending-${cleanId}`,
      tipo: item.tipo,
      fecha: item.fecha,
      concepto: item.concepto,
      categoria: item.categoria,
      entidad: item.entidad,
      monto: Number(item.monto),
      mes: item.mes,
    };
    if (session?.user?.id) {
      payload.user_id = session.user.id;
    }

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
 */
export async function deletePendingPaymentFromSupabase(
  id: string,
  matchCriteria?: { fecha?: string; concepto?: string; entidad?: string; monto?: number }
): Promise<boolean> {
  try {
    const cleanId = String(id).replace(/^(pending-|pend-)/, '');
    const { error } = await supabase
      .from('transacciones')
      .delete()
      .eq('id', `pending-${cleanId}`);

    if (error) {
      console.warn('Error deleting pending payment from Supabase:', error.message);
    }

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
    const session = await getValidatedSession();
    const payload: any = {
      id: 'config-prev-month-bridge',
      tipo: 'Egreso',
      fecha: '2026-01-01',
      concepto: JSON.stringify(configs),
      categoria: 'Config',
      entidad: 'Interbank',
      monto: 0,
      mes: 'Config',
    };
    if (session?.user?.id) {
      payload.user_id = session.user.id;
    }
    const { error } = await supabase
      .from('transacciones')
      .upsert(payload, { onConflict: 'id' });
    return !error;
  } catch {
    return false;
  }
}

/**
 * Obtiene la configuración de días puente de mes anterior de Supabase (.maybeSingle() para evitar 406).
 */
export async function fetchBridgeConfigFromSupabase(): Promise<Record<string, any> | null> {
  const result = await fetchOptionalConfigRow<Record<string, any>>(
    'config-prev-month-bridge',
    (raw) => JSON.parse(raw),
    'Días Puente (config-prev-month-bridge)'
  );
  return result.data;
}

/**
 * Guarda las metas de ahorro en Supabase para sincronizar entre PC y celular.
 */
export async function saveSavingsGoalsToSupabase(goals: any[]): Promise<boolean> {
  try {
    const session = await getValidatedSession();
    const payload: any = {
      id: 'config-savings-goals-v1',
      tipo: 'Egreso',
      fecha: '2026-01-01',
      concepto: JSON.stringify(goals),
      categoria: 'Config',
      entidad: 'Sistema',
      monto: 0,
      mes: 'Config',
    };
    if (session?.user?.id) {
      payload.user_id = session.user.id;
    }
    const { error } = await supabase
      .from('transacciones')
      .upsert(payload, { onConflict: 'id' });
    return !error;
  } catch {
    return false;
  }
}

/**
 * Obtiene las metas de ahorro desde Supabase (.maybeSingle() para evitar 406).
 */
export async function fetchSavingsGoalsFromSupabase(): Promise<any[] | null> {
  const result = await fetchOptionalConfigRow<any[]>(
    'config-savings-goals-v1',
    (raw) => {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : null;
    },
    'Metas de Ahorro (config-savings-goals-v1)'
  );
  return result.data;
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
    const session = await getValidatedSession();
    const userId = session?.user?.id;

    for (let i = 0; i < total; i += batchSize) {
      const batch = sourceList.slice(i, i + batchSize).map((t) => {
        const item: any = {
          id: t.id,
          tipo: t.Tipo,
          fecha: t.Fecha,
          concepto: t.Concepto,
          categoria: t.Categoria,
          entidad: t.Entidad,
          monto: t.Monto,
          mes: t.Mes,
        };
        if (userId) item.user_id = userId;
        return item;
      });

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
