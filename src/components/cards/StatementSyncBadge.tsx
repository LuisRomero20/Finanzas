import React from 'react';
import { CheckCircle2, CloudOff, Loader2, AlertTriangle, GitCompareArrows, HardDrive, RefreshCw } from 'lucide-react';
import { useCardStatementStore, type StatementSyncState } from '../../store/cardStatementStore';

/**
 * Muestra DÓNDE está guardada la conciliación (persistencia informática).
 * No indica verificación bancaria: eso lo expresa `verificationStatus` (statement_verified, etc.).
 */
export const STATEMENT_SYNC_LABELS: Record<StatementSyncState, string> = {
  idle: 'Sin cambios pendientes',
  syncing: 'Sincronizando…',
  remote_confirmed: 'Confirmada en Supabase',
  local_pending: 'Guardada en este dispositivo',
  sync_failed: 'Error recuperable',
  conflict: 'Versiones distintas',
};

const STYLES: Record<StatementSyncState, string> = {
  idle: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  syncing: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
  remote_confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
  local_pending: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
  sync_failed: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
  conflict: 'bg-orange-50 text-orange-800 border-orange-300 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800',
};

const ICONS: Record<StatementSyncState, React.ReactNode> = {
  idle: <HardDrive size={12} />,
  syncing: <Loader2 size={12} className="animate-spin" />,
  remote_confirmed: <CheckCircle2 size={12} />,
  local_pending: <CloudOff size={12} />,
  sync_failed: <AlertTriangle size={12} />,
  conflict: <GitCompareArrows size={12} />,
};

interface Props {
  className?: string;
  /** Muestra el mensaje detallado debajo de la etiqueta. */
  showMessage?: boolean;
}

export const StatementSyncBadge: React.FC<Props> = ({ className = '', showMessage = true }) => {
  const syncInfo = useCardStatementStore(s => s.syncInfo);
  const retrySync = useCardStatementStore(s => s.retrySync);
  const canRetry = syncInfo.state === 'local_pending' || syncInfo.state === 'sync_failed';

  return (
    <div className={`space-y-1 ${className}`} data-testid="statement-sync-badge" data-sync-state={syncInfo.state}>
      <div className="flex flex-wrap items-center gap-2">
        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${STYLES[syncInfo.state]}`}>
          {ICONS[syncInfo.state]}
          Nube: {STATEMENT_SYNC_LABELS[syncInfo.state]}
        </span>
        {canRetry && (
          <button
            type="button"
            onClick={() => { void retrySync(); }}
            className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer min-h-6"
          >
            <RefreshCw size={11} /> Reintentar
          </button>
        )}
      </div>
      {showMessage && syncInfo.message && syncInfo.state !== 'idle' && (
        <p className="text-[10px] leading-snug text-slate-500 dark:text-slate-400">{syncInfo.message}</p>
      )}
    </div>
  );
};
