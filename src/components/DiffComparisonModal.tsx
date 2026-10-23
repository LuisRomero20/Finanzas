import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  Download,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Layers,
  Check,
  Edit2,
  TrendingUp,
  Laptop,
  Cloud,
} from 'lucide-react';
import {
  type DiffReport,
  type DiffItemStatus,
  type ItemResolution,
  simulateReconciliationImpact,
} from '../domain/sync/diffComparison';

interface DiffComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: DiffReport | null;
  localRawStr?: string;
  remoteRawStr?: string;
  onResolveAssisted: (
    resolutions: Record<string, ItemResolution>,
    salaryProbabilityResolution: 'use_local' | 'use_remote',
  ) => Promise<void>;
  onDownloadBackup: (resolutions?: Record<string, ItemResolution>) => void;
  isResolving?: boolean;
}

export const DiffComparisonModal: React.FC<DiffComparisonModalProps> = ({
  isOpen,
  onClose,
  report,
  localRawStr = '',
  remoteRawStr = '',
  onResolveAssisted,
  onDownloadBackup,
  isResolving = false,
}) => {
  const [filter, setFilter] = useState<DiffItemStatus | 'all' | 'diffs_only'>('diffs_only');
  const [search, setSearch] = useState('');
  const [resolutions, setResolutions] = useState<Record<string, ItemResolution>>({});
  const [salaryProbResolution, setSalaryProbResolution] = useState<'use_local' | 'use_remote'>('use_local');
  const [editingCustomId, setEditingCustomId] = useState<string | null>(null);
  const [customAmountInput, setCustomAmountInput] = useState<string>('');
  const [confirmingAssisted, setConfirmingAssisted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Simulación financiera de impacto en tiempo real
  const simulation = useMemo(() => {
    if (!report || !localRawStr || !remoteRawStr) return null;
    return simulateReconciliationImpact(report.name, localRawStr, remoteRawStr, resolutions);
  }, [report, localRawStr, remoteRawStr, resolutions]);

  // Identificar partidas modificadas
  const modifiedItems = useMemo(() => {
    if (!report) return [];
    return report.items.filter(i => i.status === 'modified');
  }, [report]);

  const unresolvedCount = useMemo(() => {
    return modifiedItems.filter(i => {
      if (i.id === '__salary_probability_scenarios__') return false;
      return !resolutions[i.id];
    }).length;
  }, [modifiedItems, resolutions]);

  const filteredItems = useMemo(() => {
    if (!report) return [];
    return report.items.filter(item => {
      if (filter === 'diffs_only' && item.status === 'identical') return false;
      if (filter !== 'all' && filter !== 'diffs_only' && item.status !== filter) return false;

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

  // Acciones de resolución individual
  const setChoiceFor = (itemId: string, type: 'use_local' | 'use_remote') => {
    setResolutions(prev => ({
      ...prev,
      [itemId]: { itemId, type },
    }));
    setErrorMessage(null);
  };

  const handleStartCustomEdit = (item: any) => {
    setEditingCustomId(item.id);
    const curr = resolutions[item.id]?.customAmount ?? item.localRaw?.monto ?? item.remoteRaw?.monto ?? 0;
    setCustomAmountInput(String(curr));
  };

  const handleSaveCustomEdit = (itemId: string) => {
    const val = parseFloat(customAmountInput);
    if (!isNaN(val) && val >= 0) {
      setResolutions(prev => ({
        ...prev,
        [itemId]: {
          itemId,
          type: 'custom',
          customAmount: val,
        },
      }));
    }
    setEditingCustomId(null);
  };

  // Acciones en lote conscientes
  const handleSetAllModified = (choice: 'use_local' | 'use_remote') => {
    const next: Record<string, ItemResolution> = { ...resolutions };
    for (const item of modifiedItems) {
      if (item.id !== '__salary_probability_scenarios__') {
        next[item.id] = { itemId: item.id, type: choice };
      }
    }
    setResolutions(next);
    if (choice === 'use_remote') setSalaryProbResolution('use_remote');
    else setSalaryProbResolution('use_local');
    setErrorMessage(null);
  };

  const handleApplyResolution = async () => {
    if (unresolvedCount > 0) {
      setErrorMessage(`Hay ${unresolvedCount} partidas modificadas pendientes de decisión. Elige PC, Nube o edita cada una.`);
      return;
    }
    try {
      setErrorMessage(null);
      await onResolveAssisted(resolutions, salaryProbResolution);
      setConfirmingAssisted(false);
      onClose();
    } catch (e: any) {
      setErrorMessage(e?.message || 'Error al guardar la conciliación');
      setConfirmingAssisted(false);
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
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Layers size={18} />
            </div>
            <div>
              <h2 id="diff-modal-title" className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>Conciliación Financiera Asistida: {report.displayName}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  Cero Sobreescritura Automática
                </span>
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Los registros idénticos y exclusivos se preservan. Para cada partida con importes diferentes, tú eliges el valor final.
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

        {/* Panel de Simulación de Impacto Financiero en Tiempo Real */}
        {simulation && report.name === 'projections' && (
          <div className="px-5 py-3 bg-slate-100/80 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800 shrink-0">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="font-bold text-[11px] text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <TrendingUp size={14} className="text-emerald-600" />
                <span>Simulación de Impacto Financiero Pre-Guardado</span>
              </span>
              {unresolvedCount > 0 ? (
                <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/80 px-2.5 py-0.5 rounded-full border border-amber-300 dark:border-amber-800">
                  ⚠️ {unresolvedCount} partida(s) pendiente(s) de decisión
                </span>
              ) : (
                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                  <Check size={12} /> Todas las partidas modificadas han sido resueltas
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px]">
              <div className="p-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Ingresos Proyectados</span>
                <div className="flex items-baseline justify-between gap-1 mt-0.5">
                  <span className="text-slate-500 text-[10px]">PC: S/ {simulation.localTotalIncome.toFixed(2)}</span>
                  <span className="text-sm font-extrabold text-emerald-600">
                    S/ {simulation.resolvedTotalIncome.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Obligaciones y Pagos de Tarjetas</span>
                <div className="flex items-baseline justify-between gap-1 mt-0.5">
                  <span className="text-slate-500 text-[10px]">PC: S/ {simulation.localTotalObligations.toFixed(2)}</span>
                  <span className="text-sm font-extrabold text-rose-600">
                    S/ {simulation.resolvedTotalObligations.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Variación Neta vs PC</span>
                <div className="flex items-baseline justify-between gap-1 mt-0.5">
                  <span className="text-slate-500 text-[10px]">
                    {simulation.netObligationChangeVsLocal >= 0 ? '+' : ''}
                    S/ {simulation.netObligationChangeVsLocal.toFixed(2)} en obligaciones
                  </span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {simulation.totalItemsCount} partidas totales
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Barra de Atajos y Filtros */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 shrink-0">
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
              onClick={() => setFilter('modified')}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition cursor-pointer whitespace-nowrap ${
                filter === 'modified'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              Modificados ({report.modifiedCount})
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
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition cursor-pointer whitespace-nowrap ${
                filter === 'all'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              Todos ({report.items.length})
            </button>
          </div>

          {/* Atajos conscientes para partidas modificadas */}
          {modifiedItems.length > 0 && (
            <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
              <span className="text-[10px] text-slate-400 hidden md:inline">Atajos:</span>
              <button
                type="button"
                onClick={() => handleSetAllModified('use_remote')}
                className="px-2 py-1 rounded-lg border border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 text-[10px] font-bold cursor-pointer"
                title="Marca todas las partidas modificadas con el importe de la nube"
              >
                Todas con Nube
              </button>
              <button
                type="button"
                onClick={() => handleSetAllModified('use_local')}
                className="px-2 py-1 rounded-lg border border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 text-[10px] font-bold cursor-pointer"
                title="Marca todas las partidas modificadas con el importe de esta PC"
              >
                Todas con PC
              </button>
            </div>
          )}
        </div>

        {/* Buscador */}
        <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Filtrar por concepto (ej. Interbank, Ripley, Sueldo, BBVA)…"
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Mensaje de Error si lo hubiese */}
        {errorMessage && (
          <div className="px-4 py-2.5 bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-b border-rose-200 dark:border-rose-900 text-xs flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <AlertTriangle size={15} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage(null)} className="cursor-pointer text-xs font-bold">×</button>
          </div>
        )}

        {/* Lista de Ítems */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <CheckCircle2 size={32} className="mx-auto mb-2 text-emerald-500 opacity-60" />
              <p className="font-semibold text-xs">No hay elementos que coincidan con el filtro actual</p>
            </div>
          ) : (
            filteredItems.map(item => {
              const decision = resolutions[item.id];
              const isModified = item.status === 'modified';
              const isEditing = editingCustomId === item.id;

              const badgeColors: Record<DiffItemStatus, string> = {
                local_only: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300',
                remote_only: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-300',
                modified: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300',
                identical: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-300',
              };

              const badgeLabels: Record<DiffItemStatus, string> = {
                local_only: 'Solo en PC (se conserva)',
                remote_only: 'Solo en Nube (se incorpora)',
                modified: 'Importes Diferentes',
                identical: 'Coincidente',
              };

              return (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-2xl border transition ${
                    isModified
                      ? decision
                        ? 'border-emerald-400/80 bg-emerald-50/15 dark:bg-emerald-950/20'
                        : 'border-amber-400/90 bg-amber-50/20 dark:bg-amber-950/30 ring-1 ring-amber-400/40'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">
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

                    {/* Controles de Resolución Asistida para partidas modificadas */}
                    {isModified && (
                      <div className="flex flex-wrap items-center gap-1.5 shrink-0 pt-1 sm:pt-0">
                        {/* Botón PC */}
                        <button
                          type="button"
                          onClick={() => setChoiceFor(item.id, 'use_local')}
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border font-bold text-xs cursor-pointer transition ${
                            decision?.type === 'use_local'
                              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                              : 'border-slate-300 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <Laptop size={12} />
                          <span>PC: {item.differences?.find(d => d.fieldName === 'Monto')?.localValue || 'Local'}</span>
                          {decision?.type === 'use_local' && <Check size={12} className="ml-0.5" />}
                        </button>

                        {/* Botón Nube */}
                        <button
                          type="button"
                          onClick={() => setChoiceFor(item.id, 'use_remote')}
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border font-bold text-xs cursor-pointer transition ${
                            decision?.type === 'use_remote'
                              ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                              : 'border-slate-300 dark:border-slate-700 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <Cloud size={12} />
                          <span>Nube: {item.differences?.find(d => d.fieldName === 'Monto')?.remoteValue || 'Nube'}</span>
                          {decision?.type === 'use_remote' && <Check size={12} className="ml-0.5" />}
                        </button>

                        {/* Botón Editar Manual */}
                        <button
                          type="button"
                          onClick={() => handleStartCustomEdit(item)}
                          className={`flex items-center gap-1 px-2 py-1.5 rounded-xl border text-xs font-bold cursor-pointer transition ${
                            decision?.type === 'custom'
                              ? 'bg-amber-600 text-white border-amber-600'
                              : 'border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                          title="Indicar un importe exacto personalizado"
                        >
                          <Edit2 size={12} />
                          <span>{decision?.type === 'custom' ? `S/ ${decision.customAmount?.toFixed(2)}` : 'Editar'}</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Editor en línea para valor personalizado */}
                  {isEditing && (
                    <div className="mt-2.5 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2">
                      <span className="text-[11px] font-bold text-amber-900 dark:text-amber-200">
                        Importe personalizado para {item.title}: S/
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        value={customAmountInput}
                        onChange={e => setCustomAmountInput(e.target.value)}
                        className="w-28 px-2 py-1 rounded bg-white dark:bg-slate-800 border border-amber-400 text-xs font-bold"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveCustomEdit(item.id)}
                        className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs cursor-pointer"
                      >
                        Aceptar
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingCustomId(null)}
                        className="px-2 py-1 rounded border border-slate-300 text-xs cursor-pointer"
                      >
                        Cancelar
                      </button>
                    </div>
                  )}

                  {/* Tabla de campos con diferencias */}
                  {isModified && item.differences && item.differences.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                      {item.differences.map(d => (
                        <div key={d.fieldName} className="p-2 rounded-xl bg-amber-500/5 border border-amber-500/20">
                          <span className="font-bold text-amber-900 dark:text-amber-200 block text-[10px] uppercase">
                            {d.fieldName}
                          </span>
                          <div className="flex items-center justify-between gap-2 mt-0.5">
                            <span className="text-slate-600 dark:text-slate-400 truncate">
                              PC: <strong className="text-slate-900 dark:text-slate-100">{String(d.localValue)}</strong>
                            </span>
                            <span className="text-slate-400">vs</span>
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
        {confirmingAssisted && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/70 border-t border-emerald-300 dark:border-emerald-800 animate-in fade-in shrink-0">
            <div className="flex items-start gap-2.5">
              <AlertTriangle size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="flex-1 text-xs text-emerald-950 dark:text-emerald-200">
                <p className="font-bold text-sm">
                  ¿Confirmar y guardar Conciliación Financiera?
                </p>
                <p className="mt-1 text-[11px] text-emerald-900 dark:text-emerald-300">
                  - Se verificará la versión actual de Supabase antes de escribir (rechazando carreras concurrentes).<br />
                  - Se guardará un respaldo previo con ambas versiones completas en este equipo.<br />
                  - Cada decisión sobre tus {modifiedItems.length} partidas modificadas será aplicada exactamente como elegiste.
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <button
                    type="button"
                    disabled={isResolving}
                    onClick={handleApplyResolution}
                    className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer disabled:opacity-50 shadow-sm"
                  >
                    {isResolving ? 'Guardando en Supabase…' : 'Sí, confirmar y sincronizar'}
                  </button>
                  <button
                    type="button"
                    disabled={isResolving}
                    onClick={() => setConfirmingAssisted(false)}
                    className="px-3 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-900 dark:text-emerald-200 font-bold text-xs cursor-pointer"
                  >
                    Regresar a revisar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Barra de Acciones Final */}
        {!confirmingAssisted && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 shrink-0">
            <button
              type="button"
              onClick={() => onDownloadBackup(resolutions)}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs cursor-pointer text-slate-700 dark:text-slate-300 shrink-0"
              title="Descargar ambas versiones y diferencias en archivo JSON"
            >
              <Download size={14} />
              <span>Descargar Respaldo JSON</span>
            </button>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs cursor-pointer text-slate-600 dark:text-slate-400"
              >
                Cerrar sin guardar
              </button>

              <button
                type="button"
                onClick={() => setConfirmingAssisted(true)}
                disabled={isResolving || unresolvedCount > 0}
                className={`flex items-center gap-1.5 px-5 py-2 rounded-xl font-bold text-xs shadow-md cursor-pointer transition ${
                  unresolvedCount > 0
                    ? 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed shadow-none'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                }`}
              >
                <Sparkles size={14} />
                <span>
                  {unresolvedCount > 0
                    ? `Faltan ${unresolvedCount} partidas por resolver`
                    : 'Guardar Conciliación Asistida'}
                </span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
