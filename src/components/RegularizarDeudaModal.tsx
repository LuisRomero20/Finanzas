import React, { useState, useMemo } from 'react';
import { X, CheckCircle2, SlidersHorizontal, CreditCard, RotateCcw, Wallet, AlertTriangle } from 'lucide-react';
import { useFinanceStore } from '../store/financeStore';
import { useCardStatementStore, type VerifiedStatement } from '../store/cardStatementStore';
import {
  evaluateCardPayment,
  buildPaymentIdempotencyKey,
  detectEquivalentPayment,
} from '../domain/cards/smartCardEngine';
import type { CardConfig, Cycle } from '../utils/creditCardCycles';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  card: CardConfig | null;
  prevCycle: Cycle | null;
  calculatedPrevTotal: number;
  netToPay: number;
  currTotal: number;
  liveDebt: number;
  isPaid: boolean;
  verifiedStatement?: VerifiedStatement;
  onSuccess: (msg: string) => void;
}

const fmt = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' });

export const RegularizarDeudaModal: React.FC<Props> = ({
  isOpen,
  onClose,
  card,
  prevCycle,
  calculatedPrevTotal,
  netToPay,
  currTotal: _currTotal,
  liveDebt,
  verifiedStatement,
  onSuccess,
}) => {
  const { transactions, registerPaymentTransaction } = useFinanceStore();
  const { saveVerifiedStatement, removeVerifiedStatement } = useCardStatementStore();

  const [activeTab, setActiveTab] = useState<'cancelar' | 'ajustar'>('cancelar');

  const pendingDebt = useMemo(() => {
    return netToPay > 0 ? netToPay : (calculatedPrevTotal > 0 ? calculatedPrevTotal : liveDebt);
  }, [netToPay, calculatedPrevTotal, liveDebt]);

  // Estado para cancelar con pago
  const [payAmount, setPayAmount] = useState<string>(() => {
    return pendingDebt > 0 ? pendingDebt.toFixed(2) : '';
  });
  const [payAccount, setPayAccount] = useState<string>('Interbank');
  const [payDate, setPayDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [confirmExternalZero, setConfirmExternalZero] = useState<boolean>(false);
  const [confirmExcess, setConfirmExcess] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [allowDuplicatePayment, setAllowDuplicatePayment] = useState<boolean>(false);

  // Evaluación financiera determinística del pago
  const paymentEval = useMemo(() => {
    return evaluateCardPayment({
      pendingDebt,
      paymentAmount: payAmount,
      confirmExcess,
    });
  }, [pendingDebt, payAmount, confirmExcess]);

  // Detección de pago equivalente para proteger contra reintentos accidentales
  const equivalentCheck = useMemo(() => {
    if (!card || !paymentEval.paymentAmount) return { hasEquivalentPayment: false };
    return detectEquivalentPayment({
      existingPayments: transactions,
      cardEntity: card.entity,
      paymentDate: payDate,
      amount: paymentEval.paymentAmount,
    });
  }, [transactions, card, payDate, paymentEval.paymentAmount]);

  // Estado para ajuste manual de deuda
  const [customDebt, setCustomDebt] = useState<string>(() => {
    if (verifiedStatement && typeof verifiedStatement.finalDebt === 'number') {
      return verifiedStatement.finalDebt.toFixed(2);
    }
    return (netToPay > 0 ? netToPay : calculatedPrevTotal).toFixed(2);
  });

  if (!isOpen || !card || !prevCycle) return null;

  const cycleKey = `${card.entity}_${prevCycle.payDate.toISOString().slice(0, 10)}`;

  // 1. Manejo: Registrar Pago con Evaluación Estricta e Idempotencia
  const handleRegisterPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!paymentEval.canProceed) {
      alert(paymentEval.errorMessage || 'Verifica el importe del pago antes de continuar.');
      return;
    }

    if (equivalentCheck.hasEquivalentPayment && !allowDuplicatePayment) {
      alert('Se ha detectado un pago equivalente registrado previamente. Marca la casilla de confirmación consciente si se trata de un segundo pago legítimo.');
      return;
    }

    try {
      setIsSubmitting(true);

      const dueDateStr = prevCycle.payDate.toISOString().slice(0, 10);
      const sequenceNumber = allowDuplicatePayment ? equivalentCheck.suggestedSequence : 1;
      const opId = buildPaymentIdempotencyKey({
        cardEntity: card.entity,
        dueDate: dueDateStr,
        paymentDate: payDate,
        amount: paymentEval.paymentAmount,
        sequence: sequenceNumber,
      });

      let concepto = `Pago de Tarjeta ${card.entity}`;
      if (paymentEval.classification === 'pago_parcial') {
        concepto = `Pago parcial de Tarjeta ${card.entity} (Ciclo vence ${dueDateStr})`;
      } else if (paymentEval.classification === 'pago_con_excedente') {
        concepto = `Pago con excedente de Tarjeta ${card.entity} (Ciclo vence ${dueDateStr})`;
      } else {
        concepto = `Pago total de Tarjeta ${card.entity} (Ciclo vence ${dueDateStr})`;
      }

      const res = await registerPaymentTransaction({
        id: opId,
        Tipo: 'Egreso',
        Categoria: 'Servicio',
        Concepto: concepto,
        Monto: paymentEval.paymentAmount,
        Entidad: payAccount,
        Fecha: payDate,
        idempotencyToken: opId,
        syncStatus: 'local_pending',
      });

      if (!res?.transaction) {
        throw new Error('No se pudo persistir la transacción de pago');
      }

      const statusTag = res.persistenceState === 'remote_confirmed'
        ? 'Movimiento contable confirmado por Supabase'
        : 'Guardado localmente en este dispositivo (en cola de sincronización con la nube)';

      onSuccess(`✅ ${paymentEval.summaryMessage} · ${statusTag}`);
      onClose();
    } catch (err) {
      alert(`Error al registrar el pago: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Manejo: Cancelar Directa a S/ 0 (Sin Egreso)
  const handleDirectCancel = () => {
    if (pendingDebt > 0 && !confirmExternalZero) {
      alert('Debes confirmar conscientemente que esta deuda fue saldada externamente.');
      return;
    }

    saveVerifiedStatement({
      id: `cancel-${Date.now()}`,
      cardEntity: card.entity,
      cycleKey,
      dueDate: prevCycle.payDate.toISOString().slice(0, 10),
      cutoffDate: prevCycle.end.toISOString().slice(0, 10),
      periodStart: prevCycle.start.toISOString().slice(0, 10),
      periodEnd: prevCycle.end.toISOString().slice(0, 10),
      finalDebt: 0,
      fileName: 'Cancelación Externa Directa (Sin Desembolso Contable)',
      source: 'external',
      verificationStatus: 'user_declared',
      matchedCount: 0,
      totalStatementItems: 0,
      totalAppItems: 0,
      totalStatementCargos: 0,
      totalAppCargos: calculatedPrevTotal,
      diferenciaGastos: 0,
      verifiedAt: new Date().toISOString(),
      notes: 'Cancelado directamente por el usuario como regularización externa (sin egreso contable en cuentas)',
    });

    onSuccess(`✨ Deuda de ${card.name} para este ciclo marcada como CANCELADA por regularización externa (sin egreso).`);
    onClose();
  };

  // 3. Manejo: Ajuste Manual de Monto de Deuda
  const handleSaveCustomDebt = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(customDebt);
    if (isNaN(amount) || amount < 0) {
      alert('Ingresa un monto válido');
      return;
    }

    saveVerifiedStatement({
      id: `adjust-${Date.now()}`,
      cardEntity: card.entity,
      cycleKey,
      dueDate: prevCycle.payDate.toISOString().slice(0, 10),
      cutoffDate: prevCycle.end.toISOString().slice(0, 10),
      periodStart: prevCycle.start.toISOString().slice(0, 10),
      periodEnd: prevCycle.end.toISOString().slice(0, 10),
      finalDebt: amount,
      fileName: 'Ajuste Manual de Deuda',
      source: 'manual_entry',
      verificationStatus: 'user_declared',
      matchedCount: 0,
      totalStatementItems: 0,
      totalAppItems: 0,
      totalStatementCargos: amount,
      totalAppCargos: calculatedPrevTotal,
      diferenciaGastos: 0,
      verifiedAt: new Date().toISOString(),
      notes: `Deuda ajustada manualmente por el usuario a ${fmt.format(amount)}`,
    });

    onSuccess(`💾 Deuda de ${card.name} regularizada a ${fmt.format(amount)}.`);
    onClose();
  };

  // 4. Restablecer al cálculo automático
  const handleResetToAuto = () => {
    removeVerifiedStatement(cycleKey);
    onSuccess(`🔄 Deuda de ${card.name} restablecida al cálculo automático.`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#11191D] rounded-3xl max-w-lg w-full flex flex-col max-h-[92dvh] sm:max-h-[85vh] overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl space-y-0">
        
        {/* Header Modal */}
        <div className={`bg-gradient-to-r ${card.headerBg} px-5 sm:px-6 py-4 text-white flex items-center justify-between shrink-0`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-white/20 rounded-xl shrink-0">
              <CreditCard size={18} />
            </div>
            <div className="min-w-0">
              <h3 className="font-black text-sm sm:text-base truncate">Registrar Pago & Regularización</h3>
              <p className="text-white/80 text-xs truncate">{card.name} · Vence: {prevCycle.payDate.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center shrink-0"
            aria-label="Cerrar modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* Segmented Control Tabs */}
        <div className="px-4 sm:px-6 pt-3 pb-2 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 shrink-0">
          <div className="grid grid-cols-2 p-1 bg-slate-200/60 dark:bg-slate-800/80 rounded-2xl gap-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('cancelar')}
              className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer min-h-[40px] ${
                activeTab === 'cancelar'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CheckCircle2 size={14} />
              <span>Registrar Pago</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ajustar')}
              className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer min-h-[40px] ${
                activeTab === 'ajustar'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <SlidersHorizontal size={14} />
              <span>Ajustar Conciliación</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 overscroll-contain pb-[max(1rem,env(safe-area-inset-bottom))]">
          
          {/* Resumen Deuda Actual */}
          <div className="grid grid-cols-3 gap-2.5 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-800 text-center">
            <div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Facturado</p>
              <p className="text-sm font-black text-slate-700 dark:text-slate-200 mt-0.5">
                {fmt.format(calculatedPrevTotal)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Obligación Neta</p>
              <p className={`text-sm font-black mt-0.5 ${pendingDebt > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {fmt.format(pendingDebt)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Deuda Viva Total</p>
              <p className="text-sm font-black text-slate-800 dark:text-slate-100 mt-0.5">
                {fmt.format(liveDebt)}
              </p>
            </div>
          </div>

          {/* TAB 1: REGISTRAR PAGO / CANCELAR */}
          {activeTab === 'cancelar' && (
            <div className="space-y-4">
              
              {/* Opción A: Registrar Pago en Cuenta */}
              <form onSubmit={handleRegisterPayment} className="space-y-3.5 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-900/40 rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 dark:text-emerald-300">
                    <Wallet size={15} />
                    <span>Opción A: Registrar Pago en Cuenta</span>
                  </div>
                  {paymentEval.isValid && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      paymentEval.statusBadge.variant === 'emerald'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : paymentEval.statusBadge.variant === 'amber'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                    }`}>
                      {paymentEval.statusBadge.label}
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Registra un egreso contable en tu cuenta seleccionada y actualiza el saldo deudor del ciclo.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">Monto a Abonar (S/)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={payAmount}
                      onChange={e => setPayAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full text-xs font-black px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">Cuenta Cargo</label>
                    <select
                      value={payAccount}
                      onChange={e => setPayAccount(e.target.value)}
                      className="w-full text-xs font-bold px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="Interbank">Interbank</option>
                      <option value="BCP">BCP</option>
                      <option value="Efectivo">Efectivo</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">Fecha</label>
                    <input
                      type="date"
                      required
                      value={payDate}
                      onChange={e => setPayDate(e.target.value)}
                      className="w-full text-xs font-bold px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Desglose previo a la confirmación (Saldo anterior -> Pago -> Saldo posterior) */}
                {paymentEval.isValid && (
                  <div className="p-3 bg-white dark:bg-slate-900/90 rounded-xl border border-emerald-100 dark:border-emerald-900/40 text-xs space-y-1">
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Deuda pendiente antes del pago:</span>
                      <strong className="text-slate-800 dark:text-slate-200">{fmt.format(pendingDebt)}</strong>
                    </div>
                    <div className="flex justify-between text-emerald-700 dark:text-emerald-400">
                      <span>Monto que se abonará:</span>
                      <strong className="font-bold">- {fmt.format(paymentEval.paymentAmount)}</strong>
                    </div>
                    <div className="border-t border-slate-100 dark:border-slate-800 pt-1 flex justify-between font-bold">
                      <span className="text-slate-700 dark:text-slate-300">Saldo pendiente resultante:</span>
                      <span className={paymentEval.remainingDebt > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}>
                        {paymentEval.remainingDebt > 0 ? fmt.format(paymentEval.remainingDebt) : 'S/ 0.00 (Cancelado)'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Checkbox para pago con excedente */}
                {paymentEval.requiresExcessConfirmation && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl text-xs space-y-1.5">
                    <div className="flex items-start gap-2 text-blue-900 dark:text-blue-200 font-bold">
                      <AlertTriangle size={15} className="text-blue-600 shrink-0 mt-0.5" />
                      <span>Pago con Excedente Detectado</span>
                    </div>
                    <p className="text-[11px] text-blue-800 dark:text-blue-300 leading-relaxed">
                      El monto ingresado ({fmt.format(paymentEval.paymentAmount)}) supera la obligación pendiente ({fmt.format(pendingDebt)}) en <strong>{fmt.format(paymentEval.excessAmount)}</strong>.
                    </p>
                    <label className="flex items-start gap-2 pt-1 cursor-pointer font-bold text-blue-950 dark:text-blue-100">
                      <input
                        type="checkbox"
                        checked={confirmExcess}
                        onChange={e => setConfirmExcess(e.target.checked)}
                        className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <span className="text-[11px]">
                        Confirmo conscientemente que este pago genera un saldo a favor / pago adelantado de {fmt.format(paymentEval.excessAmount)} en la tarjeta.
                      </span>
                    </label>
                  </div>
                )}

                {/* Alerta y confirmación consciente si se detecta pago equivalente */}
                {equivalentCheck.hasEquivalentPayment && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl text-xs space-y-2">
                    <div className="flex items-start gap-2 text-amber-900 dark:text-amber-200">
                      <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">Detección de Pago Equivalente</p>
                        <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5 leading-relaxed">
                          {equivalentCheck.warningMessage}
                        </p>
                      </div>
                    </div>
                    <label className="flex items-start gap-2 pt-1 cursor-pointer font-bold text-amber-950 dark:text-amber-200">
                      <input
                        type="checkbox"
                        checked={allowDuplicatePayment}
                        onChange={e => setAllowDuplicatePayment(e.target.checked)}
                        className="mt-0.5 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                      />
                      <span className="text-[11px]">
                        Confirmo conscientemente que este registro corresponde a un segundo pago legítimo idéntico.
                      </span>
                    </label>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!paymentEval.canProceed || isSubmitting || (equivalentCheck.hasEquivalentPayment && !allowDuplicatePayment)}
                  className={`w-full text-xs font-bold py-3 px-4 min-h-[44px] rounded-xl shadow-md transition flex items-center justify-center gap-1.5 mt-2 ${
                    paymentEval.canProceed && !isSubmitting && (!equivalentCheck.hasEquivalentPayment || allowDuplicatePayment)
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <CheckCircle2 size={14} />
                  <span>
                    {!paymentEval.isValid
                      ? 'Ingresa un monto mayor a S/ 0.00'
                      : equivalentCheck.hasEquivalentPayment && !allowDuplicatePayment
                      ? 'Autoriza el pago equivalente para continuar'
                      : paymentEval.classification === 'pago_parcial'
                      ? `Registrar Pago Parcial de ${fmt.format(paymentEval.paymentAmount)}`
                      : paymentEval.classification === 'pago_con_excedente'
                      ? `Registrar Pago con Excedente de ${fmt.format(paymentEval.paymentAmount)}`
                      : `Registrar Pago Total de ${fmt.format(paymentEval.paymentAmount)} y Cancelar`}
                  </span>
                </button>
              </form>

              {/* Opción B: Cancelar Directa sin Egreso */}
              <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-4 space-y-3">
                <div>
                  <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">Opción B: Marcar como Cancelada Directa (Sin Egreso)</h5>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Úsala únicamente si la deuda fue saldada por otros medios o no corresponde generar un egreso en tus cuentas registradas.
                  </p>
                </div>

                {pendingDebt > 0 && (
                  <label className="flex items-start gap-2.5 p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={confirmExternalZero}
                      onChange={e => setConfirmExternalZero(e.target.checked)}
                      className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <span className="text-[11px] font-bold text-amber-900 dark:text-amber-200">
                      Confirmo conscientemente que la deuda pendiente ({fmt.format(pendingDebt)}) fue cancelada externamente o no corresponde pagar nada en este ciclo (regularización externa sin egreso).
                    </span>
                  </label>
                )}

                <div className="flex justify-end">
                  <button
                    type="button"
                    disabled={pendingDebt > 0 && !confirmExternalZero}
                    onClick={handleDirectCancel}
                    className={`text-xs font-bold px-3.5 py-2 rounded-xl transition ${
                      pendingDebt > 0 && !confirmExternalZero
                        ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-sm'
                    }`}
                  >
                    Marcar S/ 0.00 (Regularización Externa)
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: AJUSTE MANUAL DE MONTO */}
          {activeTab === 'ajustar' && (
            <form onSubmit={handleSaveCustomDebt} className="space-y-4">
              <div className="p-4 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-900 dark:text-blue-200">
                  <SlidersHorizontal size={15} />
                  <span>Regularizar Monto Total de Facturación</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Si tu banco te cobró un monto distinto (por comisiones, intereses o redondeos), ingresa aquí el monto exacto que debes pagar.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Monto Facturado Exacto (S/)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">S/</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={customDebt}
                    onChange={e => setCustomDebt(e.target.value)}
                    className="w-full text-sm font-black pl-8 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                {verifiedStatement ? (
                  <button
                    type="button"
                    onClick={handleResetToAuto}
                    className="text-xs text-rose-600 dark:text-rose-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw size={12} />
                    <span>Restablecer automático</span>
                  </button>
                ) : <span />}

                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 px-5 rounded-xl shadow-md transition cursor-pointer"
                >
                  Guardar Deuda Regularizada
                </button>
              </div>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};
