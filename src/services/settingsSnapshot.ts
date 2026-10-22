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

export interface MirrorSyncReport {
  status: 'synced' | 'desynced' | 'table_not_migrated';
  lastSync?: string;
  error?: string;
}

// Registro en memoria y local del estado de sincronización del mirror secundario (personal_settings)
const MIRROR_STATUS_STORAGE_KEY = 'finper_mirror_sync_status_v1';

function loadMirrorStatusMap(): Record<string, MirrorSyncReport> {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(MIRROR_STATUS_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    }
  } catch {}
  return {};
}

const mirrorStatusMap: Record<string, MirrorSyncReport> = loadMirrorStatusMap();

function persistMirrorStatus(): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(MIRROR_STATUS_STORAGE_KEY, JSON.stringify(mirrorStatusMap));
    }
  } catch {}
}

export function getMirrorSyncStatus(name?: string): Record<string, MirrorSyncReport> | MirrorSyncReport {
  if (name) {
    return mirrorStatusMap[name] || { status: 'table_not_migrated' };
  }
  return { ...mirrorStatusMap };
}

/**
 * Lee una instantánea de configuración estableciendo a 'public.transacciones' como
 * la ÚNICA FUENTE DE VERDAD AUTORITATIVA (Single Source of Truth).
 * 
 * Reglas de lectura:
 * 1. Consulta el manifiesto canónico en 'transacciones'.
 * 2. Si existe y sus fragmentos están íntegros, devuelve el valor canónico y el head autoritativo.
 * 3. Nunca permite que lecturas secundarias desfasadas sobreescriban la versión autoritativa.
 * 4. Únicamente si los fragmentos están incompletos en 'transacciones', recurre a 'personal_settings' como rescate.
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
  if (legacyData?.concepto) {
    try {
      const parsed = JSON.parse(legacyData.concepto as string);
      if (parsed && parsed.revision && Number.isInteger(parsed.count)) {
        legacyManifest = parsed as SettingsManifest;
      }
    } catch {}
  }

  // Si existe el manifiesto autoritativo en 'transacciones', recuperar sus fragmentos:
  if (legacyManifest) {
    const { data: chunks, error: chunkError } = await supabase
      .from('transacciones')
      .select('concepto, monto')
      .like('id', `${id}-${legacyManifest.revision}-%`)
      .order('monto')
      .limit(10000);

    if (chunkError) throw chunkError;

    if (chunks && chunks.length === legacyManifest.count && chunks.every((chunk, index) => Number(chunk.monto) === index)) {
      const rawJson = chunks.map(c => c.concepto).join('');
      const canonicalValue = canonical(JSON.parse(rawJson));
      const authoritativeHead = legacyData!.concepto as string;
      return { value: canonicalValue, head: authoritativeHead };
    }

    // Si los fragmentos autoritativos están incompletos o dañados:
    // Intentar rescate desde la tabla secundaria personal_settings:
    try {
      const { data: dedicatedData, error: dErr } = await supabase
        .from('personal_settings')
        .select('data, version, updated_at')
        .eq('name', name)
        .maybeSingle();

      if (!dErr && dedicatedData?.data) {
        const valStr = typeof dedicatedData.data === 'string'
          ? dedicatedData.data
          : canonical(dedicatedData.data);
        return { value: valStr, head: legacyData?.concepto as string };
      }
    } catch {}

    throw new Error('No se recibió la configuración completa; se conserva la copia local');
  }

  // 2. Si no existe registro en 'transacciones', consultar 'personal_settings' como contingencia
  try {
    const { data: dedicatedData, error: dErr } = await supabase
      .from('personal_settings')
      .select('data, version, updated_at')
      .eq('name', name)
      .maybeSingle();

    if (!dErr && dedicatedData?.data) {
      const valStr = typeof dedicatedData.data === 'string'
        ? dedicatedData.data
        : canonical(dedicatedData.data);
      const authoritativeHead = (legacyData?.concepto as string) || null;
      return { value: valStr, head: authoritativeHead };
    }
  } catch {}

  return { value: null, head: null };
}

/**
 * Guarda una instantánea de configuración asegurando:
 * 1. Control de concurrencia optimista estricto contra previousHead (Cero UPDATEs ciegos en colisiones 23505).
 * 2. Escritura íntegra de fragmentos y manifiesto en 'transacciones' (fuente autoritativa).
 * 3. Dual-write verificado y reportable en 'personal_settings' (fuente secundaria).
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
    // Intento de creación inicial de manifiesto
    const { error: insertErr } = await supabase.from('transacciones').insert(row(id, head, 0, userId));
    if (insertErr) {
      // Si la fila ya existía en transacciones (código 23505 unique violation), NUNCA sobreescribir sin versión.
      // Es una colisión concurrente real: otro dispositivo ya creó o actualizó la configuración.
      // Se rechaza la escritura para forzar la comparación de versiones y evitar pérdidas de datos.
      if (
        insertErr.code === '23505' ||
        insertErr.message?.toLowerCase().includes('duplicate key') ||
        insertErr.message?.toLowerCase().includes('unique')
      ) {
        throw new Error('Otro dispositivo actualizó los datos. Reintenta para comparar las versiones.');
      }
      throw insertErr;
    }
  } else {
    // Actualización con verificación estricta de versión previa (previousHead)
    const result = await supabase
      .from('transacciones')
      .update({ concepto: head })
      .eq('id', id)
      .eq('concepto', previousHead)
      .select('id');

    if (result.error) throw result.error;
    if (!result.data?.length) {
      // La versión en Supabase ya no coincide con previousHead -> carrera concurrente
      throw new Error('Otro dispositivo actualizó los datos. Reintenta para comparar las versiones.');
    }
  }

  // 3. Dual-write verificable en la tabla secundaria 'personal_settings'
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

        if (isMissingTable) {
          mirrorStatusMap[name] = { status: 'table_not_migrated', lastSync: nowIso };
        } else {
          // Divergencia en mirror detectada y registrada de forma verificable
          mirrorStatusMap[name] = {
            status: 'desynced',
            lastSync: nowIso,
            error: dedicatedErr.message || 'Error al persistir en mirror secundario',
          };
          console.warn(`[settingsSnapshot] Divergencia detectada en personal_settings (${name}):`, dedicatedErr.message);
        }
      } else {
        mirrorStatusMap[name] = { status: 'synced', lastSync: nowIso };
      }
      persistMirrorStatus();
    }
  } catch (err: any) {
    mirrorStatusMap[name] = {
      status: 'desynced',
      lastSync: nowIso,
      error: err?.message || 'Excepción al conectar con mirror secundario',
    };
    persistMirrorStatus();
  }
}

/**
 * Repara y reconcilia verificablemente la tabla secundaria 'personal_settings'
 * sincronizando desde la fuente autoritativa ('transacciones').
 */
export async function repairMirrorSync(name: string): Promise<boolean> {
  const session = await getValidatedSession();
  if (!session?.user?.id) return false;

  try {
    const snapshot = await readSnapshot(name);
    if (!snapshot.value) return false;

    const parsed = JSON.parse(snapshot.value);
    const tableRef = supabase.from('personal_settings') as any;
    if (typeof tableRef?.upsert !== 'function') return false;

    const { error } = await tableRef.upsert({
      id: `${session.user.id}-${name}`,
      user_id: session.user.id,
      name,
      data: parsed,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });

    if (!error) {
      mirrorStatusMap[name] = { status: 'synced', lastSync: new Date().toISOString() };
      persistMirrorStatus();
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
