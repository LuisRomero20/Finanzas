import { supabase } from '../lib/supabase';

let realtimeChannel: ReturnType<typeof supabase.channel> | null = null;
let localBroadcastBus: BroadcastChannel | null = null;

try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    localBroadcastBus = new BroadcastChannel('finper_realtime_sync_bus');
  }
} catch {
  localBroadcastBus = null;
}

export function setRealtimeChannel(channel: ReturnType<typeof supabase.channel> | null) {
  realtimeChannel = channel;
}

export function getRealtimeChannel() {
  return realtimeChannel;
}

export function getLocalBroadcastBus() {
  return localBroadcastBus;
}

/**
 * Notifica cambios en los almacenes financieros a través de dos capas:
 * 1. BroadcastChannel local: 0ms de latencia entre pestañas en el mismo dispositivo.
 * 2. Supabase Realtime Broadcast: latencia menor a 100ms entre celular y PC sin saturar Postgres.
 */
export function broadcastRealtimeSync(source: string = 'general'): void {
  // 1. Notificar a otras pestañas en el mismo navegador/dispositivo
  try {
    if (localBroadcastBus) {
      localBroadcastBus.postMessage({ type: 'sync_stores', source, timestamp: Date.now() });
    }
  } catch {}

  // 2. Notificar remotamente vía Supabase WebSocket a celulares y computadoras (<100ms)
  try {
    if (realtimeChannel) {
      realtimeChannel.send({
        type: 'broadcast',
        event: 'store_update',
        payload: { source, timestamp: Date.now() },
      }).catch(() => {});
    }
  } catch {}
}
