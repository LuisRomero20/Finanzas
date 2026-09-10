/**
 * FINPER Live Update & Real-Time Sync Service
 * 
 * Garantiza que cualquier actualización de código desplegada en Vercel y cualquier
 * cambio de datos realizado en PC o Supabase se reflejen instantáneamente en el
 * smartphone (iPhone / Android / PWA) sin requerir borrado manual de caché.
 */

import { useFinanceStore } from '../store/financeStore';
import { usePendingPaymentsStore } from '../store/pendingPaymentsStore';
import { usePrevMonthBridgeStore } from '../store/prevMonthBridgeStore';
import { useCreditCardStore } from '../store/creditCardStore';
import { useCreditLineStore } from '../store/creditLineStore';
import { useAppStore } from '../store';
import { useProjectionStore } from '../store/projectionStore';
import { supabase } from '../lib/supabase';

// Declaración global del build timestamp inyectado por Vite
declare const __APP_BUILD_TIME__: string | undefined;

const CLIENT_BUILD_TIME = typeof __APP_BUILD_TIME__ !== 'undefined' ? __APP_BUILD_TIME__ : 'dev';
let isReloading = false;
let lastSyncTimestamp = 0;

/**
 * Sincroniza todos los almacenes de datos desde Supabase en paralelo.
 * Protegido contra llamadas simultáneas en ráfaga (throttle de 2 segundos).
 */
export async function syncAllStoresFromSupabase(): Promise<void> {
  const now = Date.now();
  if (now - lastSyncTimestamp < 2000) return;
  lastSyncTimestamp = now;

  try {
    await Promise.allSettled([
      useFinanceStore.getState().syncFromSupabase(),
      usePendingPaymentsStore.getState().syncFromSupabase(),
      usePrevMonthBridgeStore.getState().syncFromSupabase(),
      useCreditCardStore.getState().syncFromSupabase(),
      useCreditLineStore.getState().syncFromSupabase(),
      useAppStore.getState().syncDeudasFromSupabase(),
      useProjectionStore.getState().syncFromSupabase(),
    ]);
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
      console.log(`🚀 Nueva versión detectada en Vercel (${data.version} vs ${CLIENT_BUILD_TIME}). Actualizando smartphone...`);
      isReloading = true;

      // Si hay service worker, pedirle que active la nueva versión de inmediato
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) {
          reg.waiting?.postMessage({ type: 'SKIP_WAITING' });
          await reg.update().catch(() => {});
        }
      }

      // Forzar recarga limpia en el navegador del teléfono
      window.location.reload();
      return true;
    }
  } catch (err) {
    // Falla silenciosa si no hay conexión a internet
  }

  return false;
}

/**
 * Inicializa los observadores de ciclo de vida del smartphone:
 * 1. Desbloqueo de pantalla / cambio de app (visibilitychange).
 * 2. Restauración desde BFCache de iOS Safari (pageshow).
 * 3. Enfoque de ventana (focus).
 * 4. Suscripción en tiempo real vía WebSocket a Supabase.
 * 5. Polling de respaldo cada 30 segundos.
 */
export function initLiveUpdateService(): () => void {
  // 1. Comprobación y sincronización inmediata al iniciar
  checkForAppUpdate().catch(() => {});
  syncAllStoresFromSupabase().catch(() => {});

  // 2. Evento: El usuario vuelve a la app en su teléfono (desbloquea o cambia de pestaña)
  const handleVisibilityOrFocus = () => {
    if (document.visibilityState === 'visible') {
      checkForAppUpdate().catch(() => {});
      syncAllStoresFromSupabase().catch(() => {});

      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistration().then((reg) => reg?.update()).catch(() => {});
      }
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityOrFocus);
  window.addEventListener('focus', handleVisibilityOrFocus);

  // 3. Evento: Safari en iPhone restaura la página desde BFCache
  const handlePageShow = (event: PageTransitionEvent) => {
    if (event.persisted) {
      checkForAppUpdate().catch(() => {});
      syncAllStoresFromSupabase().catch(() => {});
    }
  };
  window.addEventListener('pageshow', handlePageShow);

  // 4. Polling periódico de fondo cada 30 segundos mientras la app esté abierta
  const intervalId = setInterval(() => {
    if (document.visibilityState === 'visible') {
      checkForAppUpdate().catch(() => {});
      syncAllStoresFromSupabase().catch(() => {});
    }
  }, 30000);

  // 5. Suscripción Supabase Realtime a cambios en la base de datos
  let channel: ReturnType<typeof supabase.channel> | null = null;
  try {
    channel = supabase
      .channel('finper-realtime-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transacciones' },
        () => {
          console.log('📡 Cambio detectado en Supabase en tiempo real. Sincronizando smartphone...');
          syncAllStoresFromSupabase().catch(() => {});
        }
      )
      .subscribe();
  } catch (err) {
    console.warn('Realtime subscription warning:', err);
  }

  // Función de limpieza al desmontar
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    window.removeEventListener('focus', handleVisibilityOrFocus);
    window.removeEventListener('pageshow', handlePageShow);
    clearInterval(intervalId);
    if (channel) {
      supabase.removeChannel(channel).catch(() => {});
    }
  };
}
