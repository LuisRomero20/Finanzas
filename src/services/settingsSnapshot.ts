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

// Stable serialization avoids false conflicts caused by object property order.
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

/**
 * Lee una instantánea de configuración con soporte de doble lectura:
 * 1. Intenta leer desde la tabla dedicada 'personal_settings' (si existe).
 * 2. Si no existe, realiza fallback seguro y transparente a los fragmentos heredados en 'transacciones'.
 */
export async function readSnapshot(name: string): Promise<{ value: string | null; head: string | null }> {
  const session = await getValidatedSession();
  if (!session) {
    throw new Error('Sesión no disponible o expirada. Por favor valida tu sesión.');
  }

  // 1. Intentar lectura desde tabla dedicada si ya estuviera migrada
  try {
    const { data: dedicatedData, error: dedicatedErr } = await supabase
      .from('personal_settings')
      .select('data, version, updated_at')
      .eq('name', name)
      .maybeSingle();

    if (!dedicatedErr && dedicatedData && dedicatedData.data) {
      const valStr = typeof dedicatedData.data === 'string'
        ? dedicatedData.data
        : canonical(dedicatedData.data);
      return {
        value: valStr,
        head: JSON.stringify({ version: dedicatedData.version, updated_at: dedicatedData.updated_at }),
      };
    }
  } catch {
    // Si la tabla no existe en el esquema remoto, continuar al fallback heredado
  }

  // 2. Lectura compatible de fragmentos en 'transacciones'
  const id = `config-sync-${name}`;
  const { data, error } = await supabase.from('transacciones').select('concepto').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!data) return { value: null, head: null };
  const head = data.concepto as string;
  const manifest = JSON.parse(head) as { revision: string; count: number };
  if (!manifest.revision || !Number.isInteger(manifest.count) || manifest.count < 1) throw new Error('Versión de configuración incompleta');
  const { data: chunks, error: chunkError } = await supabase
    .from('transacciones')
    .select('concepto, monto')
    .like('id', `${id}-${manifest.revision}-%`)
    .order('monto')
    .limit(10000);

  if (chunkError) throw chunkError;
  if (!chunks || chunks.length !== manifest.count || chunks.some((chunk, index) => Number(chunk.monto) !== index)) {
    throw new Error('No se recibió la configuración completa; se conserva la copia local');
  }

  return { value: canonical(JSON.parse(chunks.map(c => c.concepto).join(''))), head };
}

/**
 * Guarda una instantánea de configuración asegurando titularidad explícita (user_id).
 */
export async function writeSnapshot(name: string, value: string, previousHead: string | null): Promise<void> {
  const session = await getValidatedSession();
  if (!session?.user?.id) {
    throw new Error('Se requiere sesión activa y validada para sincronizar configuraciones');
  }
  const userId = session.user.id;

  // 1. Escritura en fragmentos compatibles en 'transacciones'
  const id = `config-sync-${name}`;
  const revision = crypto.randomUUID();
  const chars = Array.from(value);
  const chunks: string[] = [];
  for (let offset = 0; offset < chars.length; offset += 240) chunks.push(chars.slice(offset, offset + 240).join(''));
  if (!chunks.length) chunks.push('');

  const { error } = await supabase.from('transacciones').insert(chunks.map((chunk, index) => row(`${id}-${revision}-${index}`, chunk, index, userId)));
  if (error) throw error;
  const head = JSON.stringify({ revision, count: chunks.length });
  if (previousHead === null) {
    const result = await supabase.from('transacciones').insert(row(id, head, 0, userId));
    if (result.error) throw result.error;
  } else {
    const result = await supabase.from('transacciones').update({ concepto: head }).eq('id', id).eq('concepto', previousHead).select('id');
    if (result.error) throw result.error;
    if (!result.data?.length) throw new Error('Otro dispositivo actualizó los datos. Reintenta para comparar las versiones.');
  }

  // 2. Si la tabla dedicada 'personal_settings' existiera, dual-write para migración sin interrupciones
  try {
    await supabase.from('personal_settings').upsert({
      id: `${userId}-${name}`,
      user_id: userId,
      name,
      data: JSON.parse(value),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });
  } catch {
    // Si la tabla dedicada no existe todavía, la escritura en transacciones ya aseguró la persistencia.
  }
}
