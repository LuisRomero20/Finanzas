/**
 * FINPER Live Update & Real-Time Sync Service
 * 
 * Garantiza sincronización bidireccional inmediata en tiempo real entre Celular (PWA/Safari/Android)
 * y Computadora (Web Desktop/Laptop):
 * 1. Supabase Realtime WebSocket (Broadcast + Postgres changes).
 * 2. Cross-tab BroadcastChannel para sincronía instantánea en el mismo dispositivo.
 * 3. Polling reactivo cada 4 segundos cuando la app está activa.
 * 4. Sincronización al desbloquear pantalla, volver de pestañas (visibilitychange, pageshow, focus).
 * 5. Actualizaciones automáticas de despliegues en Vercel sin caché pegado.
 */

import { useFinanceStore } from '../store/financeStore';
import { usePendingPaymentsStore } from '../store/pendingPaymentsStore';
import { usePrevMonthBridgeStore } from '../store/prevMonthBridgeStore';
import { useCreditCardStore } from '../store/creditCardStore';
import { useCreditLineStore } from '../store/creditLineStore';
import { useAppStore } from '../store';
import { useProjectionStore } from '../store/projectionStore';
import { useSavingsGoalsStore } from '../store/savingsGoalsStore';
import { supabase } from '../lib/supabase';
import { watchPersonalSettings } from '../services/personalSettingsSync';
import {
  setRealtimeChannel,
  getRealtimeChannel,
  getLocalBroadcastBus,
  broadcastRealtimeSync,
} from './syncBus';

export { broadcastRealtimeSync };

// Declaración global del build timestamp inyectado por Vite
declare const __APP_BUILD_TIME__: string | undefined;

const CLIENT_BUILD_TIME = typeof __APP_BUILD_TIME__ !== 'undefined' ? __APP_BUILD_TIME__ : 'dev';
let isReloading = false;
let lastSyncTimestamp = 0;

/**
 * Sincroniza todos los almacenes de datos desde Supabase en paralelo.
 * Protegido contra llamadas simultáneas en ráfaga (throttle de 800ms) y entornos de prueba.
 */
export async function syncAllStoresFromSupabase(force: boolean = false): Promise<void> {
  const now = Date.now();
  if (!force && now - lastSyncTimestamp < 800) return;
  lastSyncTimestamp = now;

  try {
    const promises: Promise<any>[] = [];
    if (useFinanceStore?.getState?.()?.syncFromSupabase) promises.push(useFinanceStore.getState().syncFromSupabase());
    if (usePendingPaymentsStore?.getState?.()?.syncFromSupabase) promises.push(usePendingPaymentsStore.getState().syncFromSupabase());
    if (usePrevMonthBridgeStore?.getState?.()?.syncFromSupabase) promises.push(usePrevMonthBridgeStore.getState().syncFromSupabase());
    if (useCreditCardStore?.getState?.()?.syncFromSupabase) promises.push(useCreditCardStore.getState().syncFromSupabase());
    if (useCreditLineStore?.getState?.()?.syncFromSupabase) promises.push(useCreditLineStore.getState().syncFromSupabase());
    if (useAppStore?.getState?.()?.syncDeudasFromSupabase) promises.push(useAppStore.getState().syncDeudasFromSupabase());
    if (useProjectionStore?.getState?.()?.syncFromSupabase) promises.push(useProjectionStore.getState().syncFromSupabase());
    if (useSavingsGoalsStore?.getState?.()?.syncFromSupabase) promises.push(useSavingsGoalsStore.getState().syncFromSupabase());
    await Promise.allSettled(promises);
  } catch (err) {
    console.warn('Sync all stores error:', err);
  }
}

/**
 * Consulta el endpoint /version.json en Vercel para detectar si hay una nueva versión
 * de la web recién compilada. Si la versión del servidor es diferente, recarga
 * la página de inmediato para mostrar las últimas actualizaciones al usuario.
 */
export async function checkForAppUpdate(): Promise<boolean> {
  if (isReloading || CLIENT_BUILD_TIME === 'dev') return false;

  try {
    const res = await fetch(`/version.json?_t=${Date.now()}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      },
    });

    if (!res.ok) return false;

    const data = await res.json();
    if (data && data.version && data.version !== CLIENT_BUILD_TIME) {
      console.log(`🚀 Nueva versión detectada en Vercel (${data.version} vs ${CLIENT_BUILD_TIME}). Actualizando...`);
      isReloading = true;

      // Si hay service worker, pedirle que active la nueva versión de inmediato
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) {
          reg.waiting?.postMessage({ type: 'SKIP_WAITING' });
          await reg.update().catch(() => {});
        }
      }

      // Forzar recarga limpia en el navegador del teléfono/web
      window.location.reload();
      return true;
    }
  } catch {
    // Falla silenciosa si no hay conexión a internet
  }

  return false;
}

/**
 * Inicializa los observadores de ciclo de vida del smartphone y web:
 * 1. Sincronización y comprobación inicial instantánea.
 * 2. Desbloqueo de pantalla / cambio de app / foco (visibilitychange, pageshow, focus).
 * 3. Suscripción en tiempo real vía WebSocket a Supabase (Broadcast + Postgres changes).
 * 4. Suscripción a canal local BroadcastChannel & Storage Event.
 * 5. Polling activo de respaldo cada 4 segundos mientras la app está abierta.
 * 6. Detección de reconexión de red (online).
 */
export function initLiveUpdateService(): () => void {
  const stopSettingsWatcher = watchPersonalSettings();
  let disposed = false;
  let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
  // 1. Comprobación y sincronización inmediata al iniciar
  checkForAppUpdate().catch(() => {});
  syncAllStoresFromSupabase(true).catch(() => {});

  // 2. Evento: El usuario vuelve a la app (desbloquea teléfono, cambia de pestaña o enfoca)
  const handleActiveEvent = () => {
    if (document.visibilityState === 'visible') {
      checkForAppUpdate().catch(() => {});
      syncAllStoresFromSupabase().catch(() => {});

      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistration().then((reg) => reg?.update()).catch(() => {});
      }
    }
  };

  document.addEventListener('visibilitychange', handleActiveEvent);
  window.addEventListener('focus', handleActiveEvent);
  window.addEventListener('online', handleActiveEvent);

  // 3. Evento: Safari en iPhone restaura la página desde BFCache
  const handlePageShow = (event: PageTransitionEvent) => {
    if (event.persisted) {
      checkForAppUpdate().catch(() => {});
      syncAllStoresFromSupabase(true).catch(() => {});
    }
  };
  window.addEventListener('pageshow', handlePageShow);

  // 4. Interacción del usuario: si interactúa y han pasado > 4s, refrescar silenciosamente
  let lastTouchCheck = Date.now();
  const handleUserInteraction = () => {
    const now = Date.now();
    if (now - lastTouchCheck > 4000) {
      lastTouchCheck = now;
      syncAllStoresFromSupabase().catch(() => {});
    }
  };
  window.addEventListener('touchstart', handleUserInteraction, { passive: true });
  window.addEventListener('pointerdown', handleUserInteraction, { passive: true });

  // 5. Escuchar cambios de almacenamiento en otras pestañas locales (Storage Event)
  const handleStorageEvent = (e: StorageEvent) => {
    if (e.key && e.key.startsWith('finper_')) {
      syncAllStoresFromSupabase().catch(() => {});
    }
  };
  window.addEventListener('storage', handleStorageEvent);

  // 6. Escuchar BroadcastChannel local
  const localBus = getLocalBroadcastBus();
  if (localBus) {
    localBus.onmessage = (event) => {
      if (event.data?.type === 'sync_stores') {
        syncAllStoresFromSupabase().catch(() => {});
      }
    };
  }

  // 7. Polling reactivo cada 4 segundos mientras la app esté abierta y visible
  const intervalId = setInterval(() => {
    if (document.visibilityState === 'visible') {
      syncAllStoresFromSupabase().catch(() => {});
    }
  }, 4000);

  // 8. Suscripción Supabase Realtime a cambios en la base de datos (Postgres & Broadcast)
  const setupRealtime = () => {
    if (disposed) return;
    try {
      const existingChannel = getRealtimeChannel();
      if (existingChannel) {
        supabase.removeChannel(existingChannel).catch(() => {});
      }

      const channel = supabase.channel('finper-realtime-sync', {
        config: {
          broadcast: { ack: false, self: false },
        },
      });

      setRealtimeChannel(channel);

      channel
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'transacciones' },
          () => {
            syncAllStoresFromSupabase().catch(() => {});
          }
        )
        .on('broadcast', { event: 'store_update' }, () => {
          syncAllStoresFromSupabase().catch(() => {});
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            // Canal activo y sincronizando
          } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            // Reconexión tras pausa de red en móviles
            clearTimeout(reconnectTimer);
            reconnectTimer = setTimeout(() => {
              if (document.visibilityState === 'visible') {
                setupRealtime();
              }
            }, 3000);
          }
        });
    } catch (err) {
      console.warn('Realtime subscription warning:', err);
    }
  };

  setupRealtime();

  // Función de limpieza al desmontar
  return () => {
    disposed = true;
    clearTimeout(reconnectTimer);
    stopSettingsWatcher();
    if (localBus) localBus.onmessage = null;
    document.removeEventListener('visibilitychange', handleActiveEvent);
    window.removeEventListener('focus', handleActiveEvent);
    window.removeEventListener('online', handleActiveEvent);
    window.removeEventListener('pageshow', handlePageShow);
    window.removeEventListener('touchstart', handleUserInteraction);
    window.removeEventListener('pointerdown', handleUserInteraction);
    window.removeEventListener('storage', handleStorageEvent);
    clearInterval(intervalId);
    const channel = getRealtimeChannel();
    if (channel) {
      supabase.removeChannel(channel).catch(() => {});
      setRealtimeChannel(null);
    }
  };
}
