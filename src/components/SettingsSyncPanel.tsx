import { useState, useEffect } from 'react';
import { useSettingsSync, resolveSettings, syncPersonalSettings, downloadSyncBackup } from '../services/personalSettingsSync';
import { supabase } from '../lib/supabase';
import { getCurrentUser, getAuthDiagnostic, type AuthDiagnostic } from '../services/authService';
import { getPendingOutboxCount, flushPendingPaymentsOutbox } from '../services/pendingPaymentsOutbox';
import { pendingTransactions, flushTransactions } from '../services/transactionOutbox';
import { syncAllStoresFromSupabase } from '../utils/liveUpdateService';
import type { User } from '@supabase/supabase-js';
import { ShieldCheck, Lock, RefreshCw, AlertTriangle, CheckCircle, Database, Smartphone, Laptop, Clock, ArrowRight } from 'lucide-react';

interface SettingsSyncPanelProps {
  onOpenAuth?: () => void;
  currentUser?: User | null;
}

export function SettingsSyncPanel({ onOpenAuth, currentUser: propUser }: SettingsSyncPanelProps) {
  const { entries } = useSettingsSync();
  const [expanded, setExpanded] = useState(false);
  const [internalUser, setInternalUser] = useState<User | null>(propUser ?? null);
  const [authDiag, setAuthDiag] = useState<AuthDiagnostic | null>(null);
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

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
    return () => subscription.unsubscribe();
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
    } finally {
      setIsManualSyncing(false);
    }
  };

  // Si no está autenticado, mostrar banner amigable de inicio de sesión en lugar de errores
  if (!activeUser) {
    return (
      <section className="mb-4 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 dark:bg-emerald-950/40 p-4 text-xs shadow-lg backdrop-blur-sm animate-in fade-in duration-200" aria-label="Aviso de autenticación">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 w-full sm:w-auto">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Tu información financiera ahora está protegida</h4>
              <p className="text-slate-300 text-xs mt-0.5">
                Inicia sesión con tu cuenta para acceder a tus 2,246 registros y sincronizar tus dispositivos de forma segura.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenAuth}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition cursor-pointer shrink-0"
          >
            <Lock size={14} />
            <span>Iniciar Sesión</span>
          </button>
        </div>
      </section>
    );
  }

  const needsAttention = Object.values(entries).some(e => e.status === 'conflict' || e.status === 'error');
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

  return (
    <section className="mb-4 rounded-2xl border border-emerald-800/30 bg-white dark:bg-[#11191D] text-xs shadow-sm overflow-hidden" aria-label="Sincronización de ajustes financieros">
      {/* Barra superior de estado */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-4 py-3 bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-200/80 dark:border-slate-800">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2.5 text-left cursor-pointer flex-1 min-w-0"
          aria-expanded={expanded || needsAttention}
        >
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
            <ShieldCheck size={18} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-slate-800 dark:text-slate-100">
                {needsAttention ? 'Revisar sincronización multidispositivo' : syncing ? 'Sincronizando con Supabase…' : 'Sincronización Segura PC / iPhone'}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                RLS Activo
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
          >
            <span className="text-sm font-bold">{expanded || needsAttention ? '▲' : '▼'}</span>
          </button>
        </div>
      </div>

      {/* Detalle expandido */}
      {(expanded || needsAttention) && (
        <div className="p-4 space-y-4 animate-in fade-in duration-150">
          {/* Diagnóstico técnico amigable */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3 rounded-xl bg-slate-100/60 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Laptop size={15} className="text-slate-500 shrink-0" />
              <div>
                <span className="block text-[10px] text-slate-500 font-bold uppercase">Cola de Movimientos</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{pendingTxCount} pendientes</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Smartphone size={15} className="text-slate-500 shrink-0" />
              <div>
                <span className="block text-[10px] text-slate-500 font-bold uppercase">Cola de Pagos Pendientes</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{pendingPaymentsCount} pendientes</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={15} className="text-slate-500 shrink-0" />
              <div>
                <span className="block text-[10px] text-slate-500 font-bold uppercase">Estado de Sesión</span>
                <span className={`font-semibold ${authDiag?.status === 'authenticated' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600'}`}>
                  {authDiag?.status === 'authenticated' ? 'Validada en Supabase' : authDiag?.status === 'expired' ? 'Expirada' : 'Verificando…'}
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
                    <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-200 text-[11px]">
                      {entry.message}
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

                  {entry.status === 'conflict' && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        disabled={syncing}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm disabled:opacity-50 cursor-pointer"
                        onClick={() => void resolveSettings(name, 'local')}
                      >
                        Compartir este dispositivo a la nube
                      </button>
                      <button
                        disabled={syncing}
                        className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs disabled:opacity-50 cursor-pointer"
                        onClick={() => void resolveSettings(name, 'remote')}
                      >
                        Usar versión de la nube
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Acciones de respaldo */}
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
              Protocolo de sincronización Finanzas 2.0.1
            </span>
          </div>
        </div>
      )}
    </section>
  );
}
