import { supabase } from '../lib/supabase';

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

function row(id: string, concepto: string, monto = 0) {
  return { id, concepto, monto, fecha: '2026-10-01', tipo: 'Egreso', categoria: 'Configuración', entidad: 'Sistema', mes: 'Config' };
}

export async function readSnapshot(name: string): Promise<{ value: string | null; head: string | null }> {
  const id = `config-sync-${name}`;
  const { data, error } = await supabase.from('transacciones').select('concepto').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!data) return { value: null, head: null };
  const head = data.concepto as string;
  const manifest = JSON.parse(head) as { revision: string; count: number };
  if (!manifest.revision || !Number.isInteger(manifest.count) || manifest.count < 1) throw new Error('Versión de configuración incompleta');
  const { data: chunks, error: chunkError } = await supabase.from('transacciones').select('concepto, monto').like('id', `${id}-${manifest.revision}-%`).order('monto').limit(10000);
  if (chunkError) throw chunkError;
  if (!chunks || chunks.length !== manifest.count || chunks.some((chunk, index) => chunk.monto !== index)) throw new Error('No se recibió la configuración completa; se conserva la copia local');
  return { value: canonical(JSON.parse(chunks.map(c => c.concepto).join(''))), head };
}

export async function writeSnapshot(name: string, value: string, previousHead: string | null): Promise<void> {
  const id = `config-sync-${name}`;
  const revision = crypto.randomUUID();
  const chars = Array.from(value);
  const chunks: string[] = [];
  for (let offset = 0; offset < chars.length; offset += 240) chunks.push(chars.slice(offset, offset + 240).join(''));
  if (!chunks.length) chunks.push('');
  // Immutable chunks: readers cannot observe a mixture of two devices' writes.
  // Keep prior versions for recovery. Financial movements are never modified.
  const { error } = await supabase.from('transacciones').insert(chunks.map((chunk, index) => row(`${id}-${revision}-${index}`, chunk, index)));
  if (error) throw error;
  const head = JSON.stringify({ revision, count: chunks.length });
  if (previousHead === null) {
    const result = await supabase.from('transacciones').insert(row(id, head));
    if (result.error) throw result.error;
  } else {
    const result = await supabase.from('transacciones').update({ concepto: head }).eq('id', id).eq('concepto', previousHead).select('id');
    if (result.error) throw result.error;
    if (!result.data?.length) throw new Error('Otro dispositivo actualizó los datos. Reintenta para comparar las versiones.');
  }
}
