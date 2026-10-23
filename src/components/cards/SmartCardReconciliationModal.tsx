import React, { useState, useMemo } from 'react';
import {
  X,
  FileCheck2,
  AlertTriangle,
  CheckCircle2,
  Save,
  RotateCcw,
  FileText,
  UserCheck,
  HelpCircle,
} from 'lucide-react';
import type { CardConfig, Cycle } from '../../utils/creditCardCycles';
import { useFinanceStore } from '../../store/financeStore';
import { useCardStatementStore } from '../../store/cardStatementStore';
import { describeStatementSave } from '../../domain/cards/statementSyncFeedback';
import { StatementSyncBadge } from './StatementSyncBadge';
import {
  reconcileCardCycle,
  evaluateReconciliationInput,
  type ReconciliationReport,
} from '../../domain/cards/smartCardEngine';
import { getCardTxs, getCardPaymentTxs } from '../../utils/creditCardCycles';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  card: CardConfig | null;
  cycle: Cycle | null;
  onSuccess: (msg: string) => void;
}

const fmt = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' });

export const SmartCardReconciliationModal: React.FC<Props> = ({
  isOpen,
  onClose,
  card,
  cycle,
  onSuccess,
}) => {
  const { transactions } = useFinanceStore();
  const { saveVerifiedStatementAndSync, removeVerifiedStatement, getVerifiedStatement } = useCardStatementStore();
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const cycleKey = card && cycle ? `${card.entity}_${cycle.payDate.toISOString().slice(0, 10)}` : '';

  const existingStatement = useMemo(() => {
    if (!card || !cycle) return undefined;
    return getVerifiedStatement(card.entity, cycle.payDate, cycle.end);
  }, [card, cycle, getVerifiedStatement]);

  // Consumos del ciclo en FINPER
  const purchasesInCycle = useMemo(() => {
    if (!card || !cycle) return [];
    return getCardTxs(transactions, card.entity, cycle.start, cycle.end).map(t => ({
      id: t.id || `${t.Fecha}-${t.Concepto}-${t.Monto}`,
      fecha: t.Fecha,
      concepto: t.Concepto,
      monto: t.Monto,
      categoria: t.Categoria,
      tipo: t.Tipo,
    }));
  }, [transactions, card, cycle]);

  // Pagos aplicados al ciclo
  const paymentsInCycle = useMemo(() => {
    if (!card || !cycle) return [];
    return getCardPaymentTxs(transactions, card.entity, cycle.prevPayDate, cycle.payDate).map(t => ({
      id: t.id || `${t.Fecha}-${t.Concepto}-${t.Monto}`,
      fecha: t.Fecha,
      concepto: t.Concepto,
      monto: t.Monto,
      categoria: t.Categoria,
      tipo: t.Tipo,
    }));
  }, [transactions, card, cycle]);

  const defaultCalculatedTotal = useMemo(() => {
    return purchasesInCycle.reduce((s, p) => s + p.monto, 0);
  }, [purchasesInCycle]);

  // Entradas de estado de cuenta bancario — Comienzan vacías para exigir ingreso consciente
  const [statementDebtStr, setStatementDebtStr] = useState<string>(() => {
    if (existingStatement && typeof existingStatement.finalDebt === 'number') {
      return existingStatement.finalDebt.toFixed(2);
    }
    return '';
  });

  const [minPaymentStr, setMinPaymentStr] = useState<string>(() => {
    if (existingStatement && typeof existingStatement.minPayment === 'number') {
      return existingStatement.minPayment.toFixed(2);
    }
    return '';
  });

  const [confirmZeroDebt, setConfirmZeroDebt] = useState<boolean>(() => {
    return existingStatement?.finalDebt === 0;
  });

  const [verificationMode, setVerificationMode] = useState<'user_declared' | 'statement_verified' | 'disputed'>(() => {
    if (existingStatement?.verificationStatus) {
      return existingStatement.verificationStatus === 'draft' ? 'user_declared' : existingStatement.verificationStatus;
    }
    return existingStatement?.documentReference ? 'statement_verified' : 'user_declared';
  });

  const [documentRef, setDocumentRef] = useState<string>(() => {
    return existingStatement?.documentReference || '';
  });

  const [notes, setNotes] = useState<string>(() => existingStatement?.notes || '');

  // Evaluación unificada de entradas y trazabilidad
  const reconEval = useMemo(() => {
    return evaluateReconciliationInput({
      statementDebtStr,
      minPaymentStr,
      calculatedDebt: defaultCalculatedTotal,
      documentReference: documentRef,
      isDocumentIdentified: verificationMode === 'statement_verified',
      confirmZeroDebt,
      isDisputed: verificationMode === 'disputed',
    });
  }, [statementDebtStr, minPaymentStr, defaultCalculatedTotal, documentRef, verificationMode, confirmZeroDebt]);

  // Reporte de Conciliación en tiempo real (solo si se ingresó un saldo bancario válido)
  const report = useMemo<ReconciliationReport | null>(() => {
    if (!card || !cycle || reconEval.parsedDebt === null) return null;

    return reconcileCardCycle({
      cardEntity: card.entity,
      cycleKey,
      statementDebtConfirmed: reconEval.parsedDebt,
      periodStart: cycle.start.toISOString().slice(0, 10),
      periodEnd: cycle.end.toISOString().slice(0, 10),
      dueDate: cycle.payDate.toISOString().slice(0, 10),
      purchasesInCycle,
      paymentsInCycle,
    });
  }, [card, cycle, cycleKey, reconEval.parsedDebt, purchasesInCycle, paymentsInCycle]);

  if (!isOpen || !card || !cycle) return null;

  const canSave = reconEval.canSave;

  const handleSaveReconciliation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    if (!reconEval.canSave || reconEval.parsedDebt === null) {
      alert(reconEval.validationError || 'Por favor ingresa un saldo deudor válido.');
      return;
    }

    if (reconEval.isDebtZero && !confirmZeroDebt) {
      alert('Para confirmar una deuda en S/ 0.00 debes marcar la casilla certificando que revisaste el estado de cuenta oficial del banco.');
      return;
    }

    const fallbackDocName = reconEval.verificationStatus === 'statement_verified'
      ? (reconEval.displayDocumentRef || 'Estado de Cuenta Oficial Identificado')
      : (reconEval.verificationStatus === 'disputed'
          ? 'Conciliación con Diferencia en Disputa'
          : 'Declaración Manual de Usuario (Sin Documento)');

    setIsSaving(true);
    setSaveError(null);
    // ID estable por tarjeta y ciclo: reintentar el guardado reemplaza el registro, nunca lo duplica.
    const result = await saveVerifiedStatementAndSync({
      id: existingStatement?.id || `stmt-${cycleKey}`,
      cardEntity: card.entity,
      cycleKey,
      dueDate: cycle.payDate.toISOString().slice(0, 10),
      cutoffDate: cycle.end.toISOString().slice(0, 10),
      periodStart: cycle.start.toISOString().slice(0, 10),
      periodEnd: cycle.end.toISOString().slice(0, 10),
      finalDebt: reconEval.parsedDebt,
      minPayment: reconEval.parsedMinPayment,
      fileName: fallbackDocName,
      documentReference: reconEval.displayDocumentRef,
      source: reconEval.source,
      verificationStatus: reconEval.verificationStatus,
      matchedCount: purchasesInCycle.length,
      totalStatementItems: purchasesInCycle.length,
      totalAppItems: purchasesInCycle.length,
      totalStatementCargos: reconEval.parsedDebt,
      totalAppCargos: defaultCalculatedTotal,
      diferenciaGastos: reconEval.variance,
      variance: reconEval.variance,
      reconciliationStatus: reconEval.reconciliationStatus,
      diagnosticMessage: report ? report.diagnosticMessage : undefined,
      verifiedAt: new Date().toISOString(),
      notes: notes.trim() || undefined,
    });

    setIsSaving(false);

    const bankStatusText = reconEval.verificationStatus === 'statement_verified'
      ? 'contrastada documentalmente'
      : (reconEval.verificationStatus === 'disputed' ? 'registrada con discrepancia en disputa' : 'declarada manualmente por el usuario');

    const feedback = describeStatementSave(result, {
      cardName: card.name,
      amountText: fmt.format(reconEval.parsedDebt),
      bankStatusText,
    });

    if (!feedback.canClose) {
      setSaveError(feedback.message);
      return;
    }
    onSuccess(feedback.message);
    onClose();
  };

  const handleResetReconciliation = () => {
    if (confirm(`¿Restablecer la conciliación de ${card.name} al cálculo automático por movimientos?`)) {
      removeVerifiedStatement(cycleKey);
      removeVerifiedStatement(card.entity);
      onSuccess(`Deuda de ${card.name} restablecida al cálculo automático de FINPER.`);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-[#11191D] w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reconciliation-modal-title"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-blue-600/10 via-sky-600/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 text-white rounded-2xl shadow-sm">
              <FileCheck2 size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="reconciliation-modal-title" className="text-lg font-black text-slate-900 dark:text-white">
                  Conciliación de Estado de Cuenta
                </h2>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  reconEval.statusBadge.variant === 'emerald'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : reconEval.statusBadge.variant === 'rose'
                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                }`}>
                  {reconEval.statusBadge.label}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {card.name} · Ciclo {cycle.start.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })} al {cycle.end.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Formulario & Comparador */}
        <form onSubmit={handleSaveReconciliation} className="overflow-y-auto p-4 sm:p-6 space-y-5 flex-1">
          {/* Tarjeta de Comparación Visual */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Calculado FINPER</span>
              <p className="text-xl font-black text-slate-800 dark:text-slate-100 mt-1">
                {fmt.format(defaultCalculatedTotal)}
              </p>
              <span className="text-[10px] text-slate-400 font-medium">{purchasesInCycle.length} consumos en ciclo</span>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Estado de Cuenta</span>
              <p className={`text-xl font-black mt-1 ${reconEval.parsedDebt !== null ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>
                {reconEval.parsedDebt !== null ? fmt.format(reconEval.parsedDebt) : '—'}
              </p>
              <span className="text-[10px] text-slate-400 font-medium">
                {reconEval.parsedDebt !== null ? (verificationMode === 'statement_verified' ? 'Identificado en doc.' : 'Declarado en app') : 'Pendiente de ingresar'}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Discrepancia</span>
              {report ? (
                <p className={`text-xl font-black mt-1 ${
                  report.reconciliationStatus === 'CONCILIADO'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-amber-600 dark:text-amber-400'
                }`}>
                  {report.variance > 0 ? `+${fmt.format(report.variance)}` : fmt.format(report.variance)}
                </p>
              ) : (
                <p className="text-xl font-black text-slate-400 mt-1">—</p>
              )}
              <span className="text-[10px] text-slate-400 font-medium">
                {report ? (report.reconciliationStatus === 'CONCILIADO' ? '✅ Conciliado exacto' : '⚠️ Diferencia detectada') : 'Requiere saldo bancario'}
              </span>
            </div>
          </div>

          {/* Diagnóstico Asistido */}
          {report ? (
            <div className={`p-3.5 rounded-2xl border flex items-start gap-3 text-xs ${
              report.reconciliationStatus === 'CONCILIADO'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
            }`}>
              {report.reconciliationStatus === 'CONCILIADO' ? (
                <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <p className="font-bold">{report.diagnosticMessage}</p>
                {report.suggestedAction && (
                  <p className="text-[11px] opacity-90">💡 <strong>Sugerencia:</strong> {report.suggestedAction}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="p-3.5 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300">
              <span className="text-base shrink-0">📄</span>
              <p>
                Ingresa el <strong>Saldo Total Facturado</strong> que figura en tu estado de cuenta oficial para que FINPER compare tus consumos registrados contra el banco.
              </p>
            </div>
          )}

          {/* Trazabilidad: Tipo de Origen de Conciliación */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2.5">
            <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block">
              Origen y Trazabilidad del Saldo Declarado
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <label className={`p-2.5 rounded-xl border flex flex-col gap-1 cursor-pointer transition text-xs ${
                verificationMode === 'user_declared'
                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-950 dark:text-amber-200'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}>
                <div className="flex items-center gap-2 font-bold">
                  <input
                    type="radio"
                    name="verificationMode"
                    value="user_declared"
                    checked={verificationMode === 'user_declared'}
                    onChange={() => setVerificationMode('user_declared')}
                    className="text-amber-600"
                  />
                  <UserCheck size={14} />
                  <span>Declaración Manual</span>
                </div>
                <span className="text-[10px] opacity-80 leading-tight">
                  Revisado en banca móvil o web sin vincular documento PDF.
                </span>
              </label>

              <label className={`p-2.5 rounded-xl border flex flex-col gap-1 cursor-pointer transition text-xs ${
                verificationMode === 'statement_verified'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-950 dark:text-emerald-200'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}>
                <div className="flex items-center gap-2 font-bold">
                  <input
                    type="radio"
                    name="verificationMode"
                    value="statement_verified"
                    checked={verificationMode === 'statement_verified'}
                    onChange={() => setVerificationMode('statement_verified')}
                    className="text-emerald-600"
                  />
                  <FileText size={14} />
                  <span>Estado de Cuenta</span>
                </div>
                <span className="text-[10px] opacity-80 leading-tight">
                  Respaldado con documento bancario oficial identificado.
                </span>
              </label>

              <label className={`p-2.5 rounded-xl border flex flex-col gap-1 cursor-pointer transition text-xs ${
                verificationMode === 'disputed'
                  ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-700 text-rose-950 dark:text-rose-200'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}>
                <div className="flex items-center gap-2 font-bold">
                  <input
                    type="radio"
                    name="verificationMode"
                    value="disputed"
                    checked={verificationMode === 'disputed'}
                    onChange={() => setVerificationMode('disputed')}
                    className="text-rose-600"
                  />
                  <HelpCircle size={14} />
                  <span>Diferencia en Disputa</span>
                </div>
                <span className="text-[10px] opacity-80 leading-tight">
                  Cargo no reconocido o diferencia pendiente de reclamo bancario.
                </span>
              </label>
            </div>

            {/* Referencia documental si se eligió verificación con estado de cuenta */}
            {verificationMode === 'statement_verified' && (
              <div className="pt-2 animate-in fade-in duration-150">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Referencia o Nombre del Archivo del Estado de Cuenta (Opcional)
                </label>
                <input
                  type="text"
                  value={documentRef}
                  onChange={e => setDocumentRef(e.target.value)}
                  placeholder="Ej. EECC_BBVA_Oct2026.pdf o N° Folio 48921"
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Identifica el documento de sustento sin inventar nombres ni evidencias ficticias.
                </span>
              </div>
            )}
          </div>

          {/* Inputs del Estado de Cuenta */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Saldo Total Facturado del Mes (S/)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={statementDebtStr}
                onChange={e => setStatementDebtStr(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej. 436.21"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Importe oficial que figura en tu estado de cuenta</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Pago Mínimo del Mes (S/) · Opcional
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={minPaymentStr}
                onChange={e => setMinPaymentStr(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Según estado de cuenta"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Dejar vacío si no deseas registrar pago mínimo</span>
            </div>

            {/* Checkbox consciente para saldo cero */}
            {reconEval.isDebtZero && (
              <div className="sm:col-span-2 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={confirmZeroDebt}
                    onChange={e => setConfirmZeroDebt(e.target.checked)}
                    className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                    Confirmo conscientemente que revisé el estado de cuenta oficial del banco y el saldo a pagar para este ciclo es exactamente S/ 0.00 (sin deuda facturada).
                  </span>
                </label>
              </div>
            )}

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Notas u Observaciones del Ciclo (opcional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej. Incluye membresía anual S/ 80 exonerada por reclamo"
              />
            </div>
          </div>

          {/* Consumos del Periodo para Inspección Rápida */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Consumos Computados por FINPER ({purchasesInCycle.length})
              </span>
              <span className="text-[10px] text-slate-400 font-bold">
                {cycle.start.toISOString().slice(5, 10)} al {cycle.end.toISOString().slice(5, 10)}
              </span>
            </div>
            {purchasesInCycle.length === 0 ? (
              <p className="text-xs text-slate-400 italic p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-800">
                No hay consumos registrados en este ciclo.
              </p>
            ) : (
              <div className="max-h-40 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800">
                {purchasesInCycle.map(p => (
                  <div key={p.id} className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <div className="min-w-0 pr-2">
                      <p className="font-bold text-slate-800 dark:text-slate-200 truncate">{p.concepto}</p>
                      <p className="text-[10px] text-slate-400">{p.fecha} · {p.categoria || 'Gasto'}</p>
                    </div>
                    <span className="font-black text-slate-900 dark:text-white tabular-nums shrink-0">
                      {fmt.format(p.monto)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Estado de persistencia (independiente de la verificación bancaria) */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 space-y-1">
            <p className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500">Guardado en la nube (no es verificación bancaria)</p>
            <StatementSyncBadge />
            {saveError && <p role="alert" className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">{saveError}</p>}
          </div>

          {/* Botones de Acción */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
            {existingStatement ? (
              <button
                type="button"
                onClick={handleResetReconciliation}
                className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 hover:underline text-xs font-bold cursor-pointer"
              >
                <RotateCcw size={14} />
                <span>Restablecer a Cálculo FINPER</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!canSave || isSaving}
                className={`w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2 text-xs font-bold rounded-xl shadow-md transition ${
                  canSave && !isSaving
                    ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Save size={14} />
                <span>{isSaving ? 'Guardando y confirmando…' : 'Guardar Conciliación'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
