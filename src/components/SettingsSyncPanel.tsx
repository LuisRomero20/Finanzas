import { useState, useEffect } from 'react';
import { useSettingsSync, resolveSettings, resolveSettingsAssisted, syncPersonalSettings, downloadSyncBackup, downloadDiffReportJson, type SettingsName } from '../services/personalSettingsSync';
import { DiffComparisonModal } from './DiffComparisonModal';
import {
  supabase,
  getSupabaseConfigHealth,
  subscribeSupabaseConfigHealth,
  verifySupabaseConfiguration,
  type SupabaseConfigHealth,
} from '../lib/supabase';
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

const EXPANDED_SESSION_KEY = 'finper_sync_panel_expanded';

export function SettingsSyncPanel({ onOpenAuth, currentUser: propUser }: SettingsSyncPanelProps) {
  const { entries } = useSettingsSync();
  const [expanded, setExpanded] = useState(() => {
    try {
      return sessionStorage.getItem(EXPANDED_SESSION_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [internalUser, setInternalUser] = useState<User | null>(propUser ?? null);
  const [authDiag, setAuthDiag] = useState<AuthDiagnostic | null>(null);
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [diffModalName, setDiffModalName] = useState<SettingsName | null>(null);
  const [configHealth, setConfigHealth] = useState<SupabaseConfigHealth>(() => getSupabaseConfigHealth());

  const toggleExpanded = () => {
    setExpanded(current => {
      const next = !current;
      try {
        sessionStorage.setItem(EXPANDED_SESSION_KEY, String(next));
      } catch {
        // La preferencia de sesión es opcional (por ejemplo, en modo privado estricto).
      }
      return next;
    });
  };

  useEffect(() => {
    const unsubscribe = subscribeSupabaseConfigHealth(setConfigHealth);
    void verifySupabaseConfiguration().then(setConfigHealth);
    return unsubscribe;
  }, []);

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
    const verifiedHealth = await verifySupabaseConfiguration();
    if (!verifiedHealth.isHealthy) return;
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

  const problemModuleCount = Object.values(entries).filter(e => e.status === 'conflict' || e.status === 'error').length;
  const needsAttention = problemModuleCount > 0 || !configHealth.isHealthy;
  const syncing = Object.values(entries).some(e => e.status === 'syncing') || isManualSyncing;
  const configStatusLabel = configHealth.isHealthy
    ? 'Conexión configurada correctamente'
    : configHealth.configurationState === 'unverified'
      ? 'Conexión pendiente de verificación'
      : configHealth.configurationState === 'missing'
        ? 'Configuración ausente'
        : 'Configuración bloqueada';
  const configAlertClasses = configHealth.severity === 'critical'
    ? 'text-rose-700 dark:text-rose-300'
    : 'text-amber-700 dark:text-amber-300';
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
      {/* Barra superior de estado */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-4 py-3 bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-200/80 dark:border-slate-800">
        <button
          type="button"
          onClick={toggleExpanded}
          className="flex items-center gap-2.5 text-left cursor-pointer flex-1 min-w-0"
          aria-expanded={expanded}
          aria-controls="finper-sync-panel-details"
          aria-label={expanded ? 'Colapsar detalles de sincronización' : 'Expandir detalles de sincronización'}
        >
          <div className={`p-1.5 rounded-lg shrink-0 ${needsAttention ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'}`}>
            {needsAttention ? <AlertTriangle size={18} /> : <ShieldCheck size={18} />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-slate-800 dark:text-slate-100">
                Sincronización PC / iPhone
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                RLS sin cambios
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${configHealth.isHealthy ? 'bg-emerald-500' : 'bg-rose-500 animate-ping'}`} />
                {configHealth.activeProjectRef}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700">
                v{configHealth.appVersion}
              </span>
            </div>
            <p className={`text-[11px] mt-0.5 font-semibold ${configHealth.isHealthy ? 'text-emerald-700 dark:text-emerald-300' : configAlertClasses}`}>
              {syncing ? 'Sincronizando con Supabase…' : configStatusLabel}
              {` · Módulos con problemas: ${problemModuleCount}`}
              {` · Operaciones pendientes: ${totalOutboxPending}`}
            </p>
            {!configHealth.isHealthy && (
              <p className={`text-[10px] mt-0.5 line-clamp-2 ${configAlertClasses}`} role="alert">
                {configHealth.errorMessage} Las escrituras permanecen protegidas.
              </p>
            )}
            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
              Sesión: <span className="font-semibold text-slate-700 dark:text-slate-300">{activeUser.email}</span>
              {lastSyncTime && ` · Última sincronía: ${lastSyncTime}`}
            </p>
          </div>
        </button>

        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          {expanded && (
            <button
              type="button"
              onClick={handleManualSyncAll}
              disabled={syncing || !configHealth.isHealthy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
              title={configHealth.isHealthy ? 'Sincronizar todos los movimientos y ajustes ahora' : 'Sincronización bloqueada hasta verificar la configuración'}
            >
              <RefreshCw size={13} className={syncing ? 'animate-spin' : ''} />
              <span>{syncing ? 'Sincronizando…' : 'Sincronizar Todo'}</span>
            </button>
          )}
          <button
            type="button"
            onClick={toggleExpanded}
            className="p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-slate-500 transition cursor-pointer"
            title={expanded ? 'Colapsar panel' : 'Expandir detalle'}
            aria-label={expanded ? 'Colapsar panel de sincronización' : 'Expandir panel de sincronización'}
            aria-expanded={expanded}
            aria-controls="finper-sync-panel-details"
          >
            <span className="text-sm font-bold" aria-hidden="true">{expanded ? '▲' : '▼'}</span>
          </button>
        </div>
      </div>

      {/* Detalle expandido */}
      {expanded && (
        <div id="finper-sync-panel-details" className="p-4 space-y-4 animate-in fade-in duration-150">
          {!configHealth.isHealthy && (
            <div className={`${configHealth.severity === 'critical' ? 'bg-rose-50 border-rose-300 text-rose-800 dark:bg-rose-950/30 dark:border-rose-800 dark:text-rose-200' : 'bg-amber-50 border-amber-300 text-amber-800 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-200'} flex items-start gap-2 rounded-xl border p-3`} role="alert">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <div>
                <strong className="block">Diagnóstico de configuración</strong>
                <span>{configHealth.errorMessage} No se ha vaciado ninguna cola ni se ha modificado información financiera.</span>
              </div>
            </div>
          )}
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
                        disabled={syncing || !configHealth.isHealthy}
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
                          disabled={syncing || !configHealth.isHealthy}
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
                          disabled={syncing || !configHealth.isHealthy}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs disabled:opacity-50 cursor-pointer"
                          onClick={() => void resolveSettings(name, 'merge')}
                          title="Combina los registros únicos demostrablemente no conflictivos"
                        >
                          <span>✨ Fusión Segura</span>
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={syncing || !configHealth.isHealthy}
                        className="px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs disabled:opacity-50 cursor-pointer"
                        onClick={() => void resolveSettings(name, 'local')}
                      >
                        Conservar PC
                      </button>
                      <button
                        type="button"
                        disabled={syncing || !configHealth.isHealthy}
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

          {/* Acciones de respaldo. El panel no limpia cachés ni datos locales. */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={downloadSyncBackup}
              className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 hover:underline font-bold text-xs cursor-pointer"
            >
              <Database size={13} />
              <span>Descargar copia de seguridad local (JSON)</span>
            </button>
            <span className="text-[11px] text-slate-400">
              Protocolo de sincronización Finanzas {configHealth.appVersion}
            </span>
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
