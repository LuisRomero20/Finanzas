import { useState, useEffect } from 'react';
import { useSettingsSync, resolveSettings, resolveSettingsAssisted, syncPersonalSettings, downloadSyncBackup, downloadDiffReportJson } from '../services/personalSettingsSync';
import { DiffComparisonModal } from './DiffComparisonModal';
import { supabase, getSupabaseConfigHealth, type SupabaseConfigHealth } from '../lib/supabase';
import { getCurrentUser, getAuthDiagnostic, type AuthDiagnostic } from '../services/authService';
import { getPendingOutboxCount, flushPendingPaymentsOutbox } from '../services/pendingPaymentsOutbox';
import { pendingTransactions, flushTransactions } from '../services/transactionOutbox';
import { syncAllStoresFromSupabase } from '../utils/liveUpdateService';
import type { User } from '@supabase/supabase-js';
import { ShieldCheck, RefreshCw, Database, Smartphone, Laptop, Clock, Server, AlertTriangle } from 'lucide-react';

interface SettingsSyncPanelProps {
  onOpenAuth?: () => void;
  currentUser?: User | null;
}

export function SettingsSyncPanel({ onOpenAuth, currentUser: propUser }: SettingsSyncPanelProps) {
  const { entries } = useSettingsSync();
  const [expanded, setExpanded] = useState(false);
  const [showSecurityAlert, setShowSecurityAlert] = useState(true);
  const [internalUser, setInternalUser] = useState<User | null>(propUser ?? null);
  const [authDiag, setAuthDiag] = useState<AuthDiagnostic | null>(null);
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [isClearingCache, setIsClearingCache] = useState(false);
  const [diffModalName, setDiffModalName] = useState<Name | null>(null);
  const configHealth: SupabaseConfigHealth = getSupabaseConfigHealth();

  useEffect(() => {
    if (propUser !== undefined) {
      setInternalUser(propUser);
      getAuthDiagnostic().then(setAuthDiag);
      return;
    }
    getCurrentUser().then(u => {
      setInternalUser(u);
      getAuthDiagnostic().then(setAuthDiag);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setInternalUser(session?.user ?? null);
      getAuthDiagnostic().then(setAuthDiag);
    });

    const handleConnectivity = () => {
      getAuthDiagnostic().then(setAuthDiag);
    };
    window.addEventListener('online', handleConnectivity);
    window.addEventListener('offline', handleConnectivity);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('online', handleConnectivity);
      window.removeEventListener('offline', handleConnectivity);
    };
  }, [propUser]);

  const activeUser = propUser !== undefined ? propUser : internalUser;
  const pendingTxCount = pendingTransactions().length;
  const pendingPaymentsCount = getPendingOutboxCount();
  const totalOutboxPending = pendingTxCount + pendingPaymentsCount;

  const handleManualSyncAll = async () => {
    setIsManualSyncing(true);
    try {
      await Promise.allSettled([
        flushTransactions(),
        flushPendingPaymentsOutbox(),
        syncAllStoresFromSupabase(true),
        syncPersonalSettings(),
      ]);
      setLastSyncTime(new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      getAuthDiagnostic().then(setAuthDiag);
    } finally {
      setIsManualSyncing(false);
    }
  };

  const handleForceClearPwaCache = async () => {
    setIsClearingCache(true);
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          await reg.unregister();
        }
      }
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      // Forzar recarga completa desde la red
      window.location.reload();
    } catch (err) {
      console.warn('Error al limpiar caché PWA:', err);
      window.location.reload();
    } finally {
      setIsClearingCache(false);
    }
  };

  const getSessionBadge = () => {
    switch (authDiag?.verificationState) {
      case 'server_verified':
        return { label: 'Validada en Supabase', color: 'text-emerald-600 dark:text-emerald-400' };
      case 'offline_cached':
        return { label: 'Offline (Caché local)', color: 'text-amber-600 dark:text-amber-400' };
      case 'local_recoverable':
        return { label: 'Sesión local (Verificando…)', color: 'text-sky-600 dark:text-sky-400' };
      case 'sdk_active':
        return { label: 'Activa en SDK', color: 'text-emerald-500' };
      case 'expired':
        return { label: 'Sesión expirada', color: 'text-rose-600 dark:text-rose-400' };
      case 'unauthenticated':
        return { label: 'Sin autenticar', color: 'text-slate-500' };
      default:
        return {
          label: authDiag?.status === 'authenticated' ? 'Sesión activa' : 'Verificando…',
          color: authDiag?.status === 'authenticated' ? 'text-emerald-600' : 'text-slate-500',
        };
    }
  };

  // Si no está autenticado, mostrar banner amigable de inicio de sesión en lugar de errores
  if (!activeUser) {
    return (
      <section className="mb-4 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 dark:bg-emerald-950/40 p-4 text-xs shadow-lg backdrop-blur-sm animate-in fade-in duration-200" aria-label="Aviso de autenticación">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 w-full sm:w-auto">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
              <ShieldCheck size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-100 text-sm">Finanzas Personales 2.0</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-emerald-900/60 text-emerald-300 border border-emerald-700/60">
                  v{configHealth.appVersion}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-slate-800 text-slate-300 border border-slate-700">
                  {configHealth.targetProjectRef}
                </span>
              </div>
              <p className="text-slate-400 mt-0.5 leading-relaxed">
                Inicia sesión para sincronizar automáticamente tus movimientos, presupuestos y proyecciones en tiempo real entre tu PC y tu iPhone.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenAuth}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-950/40 transition-all cursor-pointer whitespace-nowrap"
          >
            Iniciar Sesión
          </button>
        </div>
      </section>
    );
  }

  const needsAttention = Object.values(entries).some(e => e.status === 'conflict' || e.status === 'error') || !configHealth.isHealthy;
  const syncing = Object.values(entries).some(e => e.status === 'syncing') || isManualSyncing;
  const labels = {
    budgets: 'Presupuestos por Categoría',
    projections: 'Proyecciones & Ingresos Fijos',
    statements: 'Deudas regularizadas de tarjetas',
    classifications: 'Clasificación de movimientos',
  } as const;

  const stateBadges = {
    waiting: { label: 'Pendiente de compartir', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300' },
    syncing: { label: 'Sincronizando…', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-200 border-blue-400 animate-pulse' },
    synced: { label: 'Sincronizado', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-400' },
    conflict: { label: 'Versiones distintas', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-400' },
    error: { label: 'Pendiente de reintento', color: 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border-rose-400' },
  };

  const sessionBadge = getSessionBadge();

  return (
    <section className="mb-4 rounded-2xl border border-emerald-800/30 bg-white dark:bg-[#11191D] text-xs shadow-sm overflow-hidden" aria-label="Sincronización de ajustes financieros">
      {/* Alerta visible si existe discrepancia de proyecto Supabase */}
      {!configHealth.isHealthy && showSecurityAlert && (
        <div className="bg-rose-600 text-white px-4 py-2.5 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="shrink-0" />
            <span>
              <strong>Alerta de Seguridad:</strong> {configHealth.errorMessage} — Las escrituras están temporalmente protegidas.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleForceClearPwaCache}
              disabled={isClearingCache}
              className="px-2.5 py-1 rounded bg-white text-rose-700 font-bold hover:bg-slate-100 cursor-pointer text-[11px] disabled:opacity-50"
            >
              {isClearingCache ? 'Actualizando…' : 'Limpiar Caché'}
            </button>
            <button
              type="button"
              onClick={() => setShowSecurityAlert(false)}
              className="px-2.5 py-1 rounded border border-white/60 text-white font-bold hover:bg-white/20 cursor-pointer text-[11px]"
              aria-label="Ocultar aviso detallado de seguridad"
              title="Ocultar aviso; las escrituras seguirán protegidas"
            >
              Ocultar
            </button>
          </div>
        </div>
      )}

      {/* Barra superior de estado */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-4 py-3 bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-200/80 dark:border-slate-800">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2.5 text-left cursor-pointer flex-1 min-w-0"
          aria-expanded={expanded}
          aria-controls="finper-sync-details"
        >
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
            {needsAttention ? <AlertTriangle size={18} /> : <ShieldCheck size={18} />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-slate-800 dark:text-slate-100">
                {needsAttention ? 'Revisar sincronización multidispositivo' : syncing ? 'Sincronizando con Supabase…' : 'Sincronización Segura PC / iPhone'}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                RLS Activo
              </span>
              {!configHealth.isHealthy && (
                <span className="text-[10px] px-2 py-0.5 rounded-full border border-rose-500 text-rose-700 dark:text-rose-300 font-semibold" role="status">
                  Escrituras protegidas
                </span>
              )}
              <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${configHealth.isHealthy ? 'bg-emerald-500' : 'bg-rose-500 animate-ping'}`} />
                {configHealth.activeProjectRef}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700">
                v{configHealth.appVersion}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
              Sesión: <span className="font-semibold text-slate-700 dark:text-slate-300">{activeUser.email}</span>
              {lastSyncTime && ` · Última sincronía: ${lastSyncTime}`}
              {totalOutboxPending > 0 && ` · ${totalOutboxPending} en cola`}
            </p>
          </div>
        </button>

        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          <button
            type="button"
            onClick={handleManualSyncAll}
            disabled={syncing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm disabled:opacity-50 transition cursor-pointer"
            title="Sincronizar todos los movimientos y ajustes ahora"
          >
            <RefreshCw size={13} className={syncing ? 'animate-spin' : ''} />
            <span>{syncing ? 'Sincronizando…' : 'Sincronizar Todo'}</span>
          </button>
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-slate-500 transition cursor-pointer"
            title={expanded ? 'Colapsar panel' : 'Expandir detalle'}
            aria-label={expanded ? 'Colapsar panel de sincronización' : 'Expandir detalles de sincronización'}
            aria-expanded={expanded}
            aria-controls="finper-sync-details"
          >
            <span className="text-sm font-bold">{expanded ? '▲' : '▼'}</span>
          </button>
        </div>
      </div>

      {/* Detalle expandido */}
      {expanded && (
        <div id="finper-sync-details" className="p-4 space-y-4 animate-in fade-in duration-150">
          {/* Diagnóstico técnico amigable */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-slate-100/60 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Laptop size={15} className="text-slate-500 shrink-0" />
              <div>
                <span className="block text-[10px] text-slate-500 font-bold uppercase">Movimientos en Cola</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{pendingTxCount} pendientes</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Smartphone size={15} className="text-slate-500 shrink-0" />
              <div>
                <span className="block text-[10px] text-slate-500 font-bold uppercase">Pagos en Cola</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{pendingPaymentsCount} pendientes</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={15} className="text-slate-500 shrink-0" />
              <div>
                <span className="block text-[10px] text-slate-500 font-bold uppercase">Estado de Sesión</span>
                <span className={`font-semibold ${sessionBadge.color}`}>
                  {sessionBadge.label}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Server size={15} className="text-slate-500 shrink-0" />
              <div>
                <span className="block text-[10px] text-slate-500 font-bold uppercase">Servidor Destino</span>
                <span className="font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  {configHealth.activeProjectRef}
                </span>
              </div>
            </div>
          </div>

          <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
            Los cambios registrados en tu PC o en tu iPhone se sincronizan automáticamente. Si en algún módulo aparecen <strong>«Versiones distintas»</strong>, elige cuál dispositivo tiene los datos más recientes; la otra versión quedará respaldada de forma segura.
          </p>

          {/* Listado de módulos de configuración */}
          <div className="space-y-3">
            {(Object.keys(labels) as Array<keyof typeof labels>).map((name) => {
              const entry = entries[name];
              const badge = stateBadges[entry.status];

              return (
                <div
                  key={name}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-2"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <strong className="text-slate-800 dark:text-slate-200">{labels[name]}</strong>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border self-start sm:self-auto ${badge.color}`}>
                      {badge.label}
                    </span>
                  </div>

                  {entry.message && (
                    <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-200 text-[11px] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span>{entry.message}</span>
                    </div>
                  )}

                  {entry.localSummary && entry.remoteSummary && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <div>
                        <span className="font-bold text-slate-500 block">Este dispositivo:</span>
                        <span className="text-slate-700 dark:text-slate-300">{entry.localSummary}</span>
                      </div>
                      <div>
                        <span className="font-bold text-slate-500 block">En la nube (Supabase):</span>
                        <span className="text-slate-700 dark:text-slate-300">{entry.remoteSummary}</span>
                      </div>
                    </div>
                  )}

                  {/* En caso de error de conexión: solo permitir reintentar para no sobreescribir datos por fallas de red */}
                  {entry.status === 'error' && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        disabled={syncing}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm disabled:opacity-50 cursor-pointer"
                        onClick={() => void syncPersonalSettings()}
                      >
                        Reintentar sincronización
                      </button>
                    </div>
                  )}

                  {/* En caso de versiones distintas (conflicto legítimo): ofrecer comparación detallada y resolución consciente */}
                  {entry.status === 'conflict' && (
                    <div className="flex flex-wrap items-center gap-2 pt-1.5">
                      {entry.diffReport && entry.diffReport.modifiedCount > 0 ? (
                        <button
                          type="button"
                          disabled={syncing}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-xs cursor-pointer disabled:opacity-50"
                          onClick={() => setDiffModalName(name)}
                          title="Examina y concilia los importes modificados antes de guardar"
                        >
                          <span>🔍 Conciliación Asistida Requerida</span>
                          <span className="px-1.5 py-0.5 rounded-md bg-black/15 text-[10px] font-mono font-bold">
                            {entry.diffReport.modifiedCount} modificadas · {entry.diffReport.localOnlyCount + entry.diffReport.remoteOnlyCount} exclusivas
                          </span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={syncing}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs disabled:opacity-50 cursor-pointer"
                          onClick={() => void resolveSettings(name, 'merge')}
                          title="Combina los registros únicos demostrablemente no conflictivos"
                        >
                          <span>✨ Fusión Segura</span>
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={syncing}
                        className="px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs disabled:opacity-50 cursor-pointer"
                        onClick={() => void resolveSettings(name, 'local')}
                      >
                        Conservar PC
                      </button>
                      <button
                        type="button"
                        disabled={syncing}
                        className="px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs disabled:opacity-50 cursor-pointer"
                        onClick={() => void resolveSettings(name, 'remote')}
                      >
                        Usar Nube
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Acciones de respaldo y mantenimiento de caché */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={downloadSyncBackup}
              className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 hover:underline font-bold text-xs cursor-pointer"
            >
              <Database size={13} />
              <span>Descargar copia de seguridad local (JSON)</span>
            </button>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleForceClearPwaCache}
                disabled={isClearingCache}
                className="text-[11px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline cursor-pointer disabled:opacity-50"
                title="Elimina service workers y cachés obsoletas para cargar la versión más reciente"
              >
                {isClearingCache ? 'Actualizando…' : 'Limpiar caché PWA'}
              </button>
              <span className="text-[11px] text-slate-400">
                Protocolo de sincronización Finanzas 2.0.3
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Conciliación Financiera Asistida */}
      {diffModalName && (
        <DiffComparisonModal
          isOpen={Boolean(diffModalName)}
          onClose={() => setDiffModalName(null)}
          report={entries[diffModalName]?.diffReport ?? null}
          localRawStr={entries[diffModalName]?.localValueRaw}
          remoteRawStr={entries[diffModalName]?.remoteValueRaw}
          onResolveAssisted={async (resolutions, salaryProbResolution) => {
            await resolveSettingsAssisted(diffModalName, resolutions, salaryProbResolution);
          }}
          onDownloadBackup={(resolutions) => {
            downloadDiffReportJson(diffModalName, resolutions);
          }}
        />
      )}
    </section>
  );
}
