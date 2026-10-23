import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  Download,
  GitMerge,
  UploadCloud,
  DownloadCloud,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Layers,
} from 'lucide-react';
import type { DiffReport, DiffItemStatus } from '../domain/sync/diffComparison';

interface DiffComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: DiffReport | null;
  onResolve: (choice: 'merge' | 'local' | 'remote') => Promise<void>;
  onDownloadBackup: () => void;
  isResolving?: boolean;
}

export const DiffComparisonModal: React.FC<DiffComparisonModalProps> = ({
  isOpen,
  onClose,
  report,
  onResolve,
  onDownloadBackup,
  isResolving = false,
}) => {
  const [filter, setFilter] = useState<DiffItemStatus | 'all' | 'diffs_only'>('diffs_only');
  const [search, setSearch] = useState('');
  const [confirmingChoice, setConfirmingChoice] = useState<'merge' | 'local' | 'remote' | null>(null);

  const filteredItems = useMemo(() => {
    if (!report) return [];
    return report.items.filter(item => {
      // Filtro de estado
      if (filter === 'diffs_only' && item.status === 'identical') return false;
      if (filter !== 'all' && filter !== 'diffs_only' && item.status !== filter) return false;

      // Filtro de búsqueda
      if (search.trim()) {
        const query = search.trim().toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(query);
        const matchesCat = (item.category || '').toLowerCase().includes(query);
        const matchesInfo = (item.secondaryInfo || '').toLowerCase().includes(query);
        return matchesTitle || matchesCat || matchesInfo;
      }
      return true;
    });
  }, [report, filter, search]);

  if (!isOpen || !report) return null;

  const totalDiffs = report.localOnlyCount + report.remoteOnlyCount + report.modifiedCount;

  const handleApplyResolution = async (choice: 'merge' | 'local' | 'remote') => {
    try {
      await onResolve(choice);
      setConfirmingChoice(null);
      onClose();
    } catch {
      setConfirmingChoice(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="diff-modal-title"
    >
      <div className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-white dark:bg-[#11191D] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden text-slate-800 dark:text-slate-100 text-xs">
        
        {/* Encabezado */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Layers size={18} />
            </div>
            <div>
              <h2 id="diff-modal-title" className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                Comparación Detallada: {report.displayName}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Revisa ítem por ítem antes de resolver. No se aplicará ningún cambio sin tu confirmación.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer"
            title="Cerrar ventana"
          >
            <X size={18} />
          </button>
        </div>

        {/* Métricas Resumen */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-4 bg-slate-100/60 dark:bg-slate-900/30 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="p-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total en PC</span>
            <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100">{report.localTotal}</span>
          </div>
          <div className="p-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total en Nube</span>
            <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100">{report.remoteTotal}</span>
          </div>
          <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 shadow-xs">
            <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 block">Solo en esta PC</span>
            <span className="text-sm font-extrabold text-blue-700 dark:text-blue-300">+{report.localOnlyCount}</span>
          </div>
          <div className="p-2.5 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900 shadow-xs">
            <span className="text-[10px] uppercase font-bold text-purple-600 dark:text-purple-400 block">Solo en Nube</span>
            <span className="text-sm font-extrabold text-purple-700 dark:text-purple-300">+{report.remoteOnlyCount}</span>
          </div>
          <div className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 shadow-xs col-span-2 sm:col-span-1">
            <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 block">Modificados</span>
            <span className="text-sm font-extrabold text-amber-700 dark:text-amber-300">{report.modifiedCount}</span>
          </div>
        </div>

        {/* Barra de Filtros y Búsqueda */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 px-4 py-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setFilter('diffs_only')}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition cursor-pointer whitespace-nowrap ${
                filter === 'diffs_only'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              Diferencias ({totalDiffs})
            </button>
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition cursor-pointer whitespace-nowrap ${
                filter === 'all'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              Todos ({report.items.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('local_only')}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition cursor-pointer whitespace-nowrap ${
                filter === 'local_only'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              Solo PC ({report.localOnlyCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter('remote_only')}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition cursor-pointer whitespace-nowrap ${
                filter === 'remote_only'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              Solo Nube ({report.remoteOnlyCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter('modified')}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition cursor-pointer whitespace-nowrap ${
                filter === 'modified'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              Modificados ({report.modifiedCount})
            </button>
          </div>

          <div className="relative shrink-0 sm:w-60">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por concepto…"
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Lista de Ítems */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <CheckCircle2 size={32} className="mx-auto mb-2 text-emerald-500 opacity-60" />
              <p className="font-semibold text-xs">No hay elementos que coincidan con el filtro actual</p>
            </div>
          ) : (
            filteredItems.map(item => {
              const badgeColors: Record<DiffItemStatus, string> = {
                local_only: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300',
                remote_only: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-300',
                modified: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300',
                identical: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-300',
              };

              const badgeLabels: Record<DiffItemStatus, string> = {
                local_only: 'Solo en PC',
                remote_only: 'Solo en Nube',
                modified: 'Modificado',
                identical: 'Idéntico',
              };

              return (
                <div
                  key={item.id}
                  className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:border-slate-300 dark:hover:border-slate-700 transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 dark:text-slate-100 text-xs truncate">
                          {item.title}
                        </span>
                        {item.category && (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                            {item.category}
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badgeColors[item.status]}`}>
                          {badgeLabels[item.status]}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        {item.secondaryInfo}
                      </p>
                    </div>
                  </div>

                  {/* Tabla de campos con diferencias */}
                  {item.status === 'modified' && item.differences && item.differences.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                      {item.differences.map(d => (
                        <div key={d.fieldName} className="p-2 rounded-xl bg-amber-500/5 border border-amber-500/20">
                          <span className="font-bold text-amber-900 dark:text-amber-200 block text-[10px] uppercase">
                            {d.fieldName}
                          </span>
                          <div className="flex items-center justify-between gap-2 mt-1">
                            <span className="text-slate-600 dark:text-slate-400 truncate">
                              PC: <strong className="text-slate-900 dark:text-slate-100">{String(d.localValue)}</strong>
                            </span>
                            <span className="text-slate-400">→</span>
                            <span className="text-slate-600 dark:text-slate-400 truncate">
                              Nube: <strong className="text-slate-900 dark:text-slate-100">{String(d.remoteValue)}</strong>
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Diálogo de Confirmación Embebido */}
        {confirmingChoice && (
          <div className="p-4 bg-amber-50 dark:bg-amber-950/70 border-t border-amber-200 dark:border-amber-900 animate-in fade-in shrink-0">
            <div className="flex items-start gap-2.5">
              <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1 text-xs text-amber-900 dark:text-amber-200">
                <p className="font-bold">
                  {confirmingChoice === 'merge' && '¿Aplicar Fusión Inteligente?'}
                  {confirmingChoice === 'local' && '¿Conservar la versión de esta PC?'}
                  {confirmingChoice === 'remote' && '¿Usar la versión de la nube?'}
                </p>
                <p className="mt-0.5 text-[11px] text-amber-800 dark:text-amber-300">
                  {confirmingChoice === 'merge' &&
                    'Se combinarán todos los registros únicos sin duplicados. Se guardará un respaldo previo en este equipo.'}
                  {confirmingChoice === 'local' &&
                    'La versión local se subirá a Supabase. Se guardará un respaldo previo en este equipo.'}
                  {confirmingChoice === 'remote' &&
                    'Se descargará la versión remota sobreescribiendo el estado actual. Se guardará un respaldo previo en este equipo.'}
                </p>
                <div className="flex items-center gap-2 mt-2.5">
                  <button
                    type="button"
                    disabled={isResolving}
                    onClick={() => handleApplyResolution(confirmingChoice)}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs cursor-pointer disabled:opacity-50"
                  >
                    {isResolving ? 'Aplicando…' : 'Sí, confirmar y aplicar'}
                  </button>
                  <button
                    type="button"
                    disabled={isResolving}
                    onClick={() => setConfirmingChoice(null)}
                    className="px-3 py-1.5 rounded-xl border border-amber-300 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-900 dark:text-amber-200 font-bold text-xs cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Barra de Acciones Final */}
        {!confirmingChoice && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 shrink-0">
            <button
              type="button"
              onClick={onDownloadBackup}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs cursor-pointer text-slate-700 dark:text-slate-300 shrink-0"
              title="Descargar ambas versiones y diferencias en archivo JSON"
            >
              <Download size={14} />
              <span>Descargar Respaldo JSON</span>
            </button>

            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmingChoice('remote')}
                disabled={isResolving}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs cursor-pointer disabled:opacity-50"
              >
                <DownloadCloud size={14} />
                <span>Usar Nube</span>
              </button>
              <button
                type="button"
                onClick={() => setConfirmingChoice('local')}
                disabled={isResolving}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs cursor-pointer disabled:opacity-50"
              >
                <UploadCloud size={14} />
                <span>Conservar PC</span>
              </button>
              <button
                type="button"
                onClick={() => setConfirmingChoice('merge')}
                disabled={isResolving}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md cursor-pointer disabled:opacity-50"
              >
                <Sparkles size={14} />
                <GitMerge size={14} />
                <span>Fusión Inteligente (Recomendado)</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
