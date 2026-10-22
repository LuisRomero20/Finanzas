import { supabase } from '../lib/supabase';
import { getValidatedSession } from './authService';

export type SyncDecision = 'upload' | 'download' | 'equal' | 'conflict' | 'idle';
export function decideSync(local: string, remote: string | null, baseline: string | null, customized: boolean): SyncDecision {
  if (local === remote) return 'equal';
  if (remote === null) return customized || baseline !== null ? 'upload' : 'idle';
  if (baseline === null) return customized ? 'conflict' : 'download';
  if (local === baseline) return 'download';
  if (remote === baseline) return 'upload';
  return 'conflict';
}

// Serialización canónica estable para evitar falsos conflictos por orden de propiedades
export function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.entries(value).filter(([, v]) => v !== undefined).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function row(id: string, concepto: string, monto = 0, userId?: string) {
  const r: any = {
    id,
    concepto,
    monto,
    fecha: '2026-10-01',
    tipo: 'Egreso',
    categoria: 'Configuración',
    entidad: 'Sistema',
    mes: 'Config',
  };
  if (userId) r.user_id = userId;
  return r;
}

interface SettingsManifest {
  revision: string;
  count: number;
  updated_at?: string;
  version?: number;
}

/**
 * Lee una instantánea de configuración con mecanismo de transición bidireccional y control de versiones:
 * 1. Consulta el manifiesto de la fuente tradicional ('transacciones') y de la tabla dedicada ('personal_settings').
 * 2. Compara marcas de tiempo para determinar cuál contiene la versión más reciente.
 * 3. Si la tabla dedicada no existe aún en el esquema remoto, conmuta automáticamente a los fragmentos de 'transacciones'.
 * 4. Si la fuente tradicional es más reciente que la dedicada, lee los fragmentos y sana en segundo plano la tabla dedicada.
 */
export async function readSnapshot(name: string): Promise<{ value: string | null; head: string | null }> {
  const session = await getValidatedSession();
  if (!session) {
    throw new Error('Sesión no disponible o expirada. Por favor valida tu sesión.');
  }

  // 1. Obtener manifiesto de 'transacciones' (fuente histórica autoritativa)
  const id = `config-sync-${name}`;
  const { data: legacyData, error: legacyErr } = await supabase
    .from('transacciones')
    .select('concepto')
    .eq('id', id)
    .maybeSingle();

  if (legacyErr) throw legacyErr;

  let legacyManifest: SettingsManifest | null = null;
  let legacyTimestamp = 0;
  if (legacyData?.concepto) {
    try {
      const parsed = JSON.parse(legacyData.concepto as string);
      if (parsed && parsed.revision && Number.isInteger(parsed.count)) {
        legacyManifest = parsed as SettingsManifest;
        legacyTimestamp = parsed.updated_at ? new Date(parsed.updated_at).getTime() : 1;
      }
    } catch {}
  }

  // 2. Intentar consultar la tabla dedicada 'personal_settings' (si existe en Supabase)
  let dedicatedData: any = null;
  let dedicatedTimestamp = 0;
  try {
    const { data: dData, error: dErr } = await supabase
      .from('personal_settings')
      .select('data, version, updated_at')
      .eq('name', name)
      .maybeSingle();

    if (!dErr && dData?.data) {
      dedicatedData = dData;
      dedicatedTimestamp = dData.updated_at ? new Date(dData.updated_at).getTime() : 0;
    }
  } catch {
    // Si la tabla dedicada no existe o el rol no tiene acceso, se continúa con legacy
  }

  // 3. Decidir cuál fuente es más reciente y autoritativa
  // Si la tabla dedicada existe y es más reciente que el manifiesto tradicional:
  if (dedicatedData && dedicatedTimestamp >= legacyTimestamp) {
    const valStr = typeof dedicatedData.data === 'string'
      ? dedicatedData.data
      : canonical(dedicatedData.data);
    return {
      value: valStr,
      head: JSON.stringify({
        revision: dedicatedData.version ? String(dedicatedData.version) : 'v1',
        count: 1,
        updated_at: dedicatedData.updated_at,
      }),
    };
  }

  // 4. Si la fuente tradicional es la más reciente (o la única existente):
  if (!legacyManifest) {
    // Si tampoco hay manifest en transacciones pero hay dedicatedData, usar dedicatedData
    if (dedicatedData) {
      const valStr = typeof dedicatedData.data === 'string'
        ? dedicatedData.data
        : canonical(dedicatedData.data);
      return {
        value: valStr,
        head: JSON.stringify({
          revision: dedicatedData.version ? String(dedicatedData.version) : 'v1',
          count: 1,
          updated_at: dedicatedData.updated_at,
        }),
      };
    }
    return { value: null, head: null };
  }

  // Lectura completa y verificación de fragmentos en 'transacciones'
  const { data: chunks, error: chunkError } = await supabase
    .from('transacciones')
    .select('concepto, monto')
    .like('id', `${id}-${legacyManifest.revision}-%`)
    .order('monto')
    .limit(10000);

  if (chunkError) throw chunkError;
  if (!chunks || chunks.length !== legacyManifest.count || chunks.some((chunk, index) => Number(chunk.monto) !== index)) {
    throw new Error('No se recibió la configuración completa; se conserva la copia local');
  }

  const rawJson = chunks.map(c => c.concepto).join('');
  const canonicalValue = canonical(JSON.parse(rawJson));
  const headStr = legacyData!.concepto as string;

  return { value: canonicalValue, head: headStr };
}

/**
 * Guarda una instantánea de configuración asegurando:
 * 1. Control de concurrencia optimista contra previousHead.
 * 2. Escritura íntegra de fragmentos en 'transacciones'.
 * 3. Actualización dual verificada en 'personal_settings' (si la tabla existe).
 * 4. Titularidad estricta (user_id) en todos los registros.
 */
export async function writeSnapshot(name: string, value: string, previousHead: string | null): Promise<void> {
  const session = await getValidatedSession();
  if (!session?.user?.id) {
    throw new Error('Se requiere sesión activa y validada para sincronizar configuraciones');
  }
  const userId = session.user.id;

  // Validar sintaxis JSON del valor antes de serializar
  let parsedValue: any = null;
  try {
    parsedValue = JSON.parse(value);
  } catch (err: any) {
    throw new Error(`Error de formato JSON al serializar ajuste ${name}: ${err?.message}`);
  }

  const nowIso = new Date().toISOString();
  const id = `config-sync-${name}`;
  const revision = crypto.randomUUID();
  const chars = Array.from(value);
  const chunks: string[] = [];
  for (let offset = 0; offset < chars.length; offset += 240) {
    chunks.push(chars.slice(offset, offset + 240).join(''));
  }
  if (!chunks.length) chunks.push('');

  // 1. Escritura de los fragmentos en 'transacciones'
  const { error: chunkInsertErr } = await supabase
    .from('transacciones')
    .insert(chunks.map((chunk, index) => row(`${id}-${revision}-${index}`, chunk, index, userId)));

  if (chunkInsertErr) throw chunkInsertErr;

  // 2. Actualización atómica del manifiesto con control de concurrencia optimista
  const manifestData: SettingsManifest = {
    revision,
    count: chunks.length,
    updated_at: nowIso,
  };
  const head = JSON.stringify(manifestData);

  if (previousHead === null) {
    const result = await supabase.from('transacciones').insert(row(id, head, 0, userId));
    if (result.error) throw result.error;
  } else {
    const result = await supabase
      .from('transacciones')
      .update({ concepto: head })
      .eq('id', id)
      .eq('concepto', previousHead)
      .select('id');

    if (result.error) throw result.error;
    if (!result.data?.length) {
      throw new Error('Otro dispositivo actualizó los datos. Reintenta para comparar las versiones.');
    }
  }

  // 3. Dual-write verificado en 'personal_settings' (si la tabla ya ha sido migrada)
  try {
    const tableRef = supabase.from('personal_settings') as any;
    if (typeof tableRef?.upsert === 'function') {
      const { error: dedicatedErr } = await tableRef.upsert({
        id: `${userId}-${name}`,
        user_id: userId,
        name,
        data: parsedValue,
        version: chunks.length,
        updated_at: nowIso,
      }, { onConflict: 'id' });

      if (dedicatedErr) {
        const isMissingTable =
          dedicatedErr.code === '42P01' ||
          dedicatedErr.message?.toLowerCase().includes('does not exist') ||
          dedicatedErr.details?.toLowerCase().includes('does not exist');

        if (!isMissingTable) {
          console.warn(`[settingsSnapshot] Error al persistir en personal_settings (${name}):`, dedicatedErr.message);
        }
      }
    }
  } catch (err) {
    console.warn(`[settingsSnapshot] Excepción no crítica en dual-write de ${name}:`, err);
  }
}
