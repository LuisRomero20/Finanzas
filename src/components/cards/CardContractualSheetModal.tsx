import React, { useState } from 'react';
import {
  X,
  CreditCard,
  Save,
  AlertTriangle,
} from 'lucide-react';
import type { CardConfig } from '../../store/creditCardStore';
import { useCreditCardStore } from '../../store/creditCardStore';
import { useCreditLineStore } from '../../store/creditLineStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  card: CardConfig | null;
  onSuccess: (msg: string) => void;
}

const fmt = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' });

export const CardContractualSheetModal: React.FC<Props> = ({
  isOpen,
  onClose,
  card,
  onSuccess,
}) => {
  const { updateCard } = useCreditCardStore();

  // Estado contractual — Comienza vacío si no está confirmado explícitamente (sin fallbacks arbitrarios)
  const [creditLimitStr, setCreditLimitStr] = useState<string>(() => {
    const val = card?.creditLine ?? card?.lineaCredito;
    return typeof val === 'number' && val > 0 ? val.toString() : '';
  });

  const [cutoffDayStr, setCutoffDayStr] = useState<string>(() => {
    return card?.cycleStartDay ? card.cycleStartDay.toString() : '';
  });

  const [dueDayStr, setDueDayStr] = useState<string>(() => {
    return card?.paymentDay ? card.paymentDay.toString() : '';
  });

  const [teaStr, setTeaStr] = useState<string>(() => {
    return card?.annualEffectiveRate ? (card.annualEffectiveRate * 100).toString() : '';
  });

  const [insuranceStr, setInsuranceStr] = useState<string>(() => {
    return card?.debtInsurance ? (card.debtInsurance * 100).toString() : '';
  });

  const [membershipStr, setMembershipStr] = useState<string>(() => {
    return card?.membershipFee ? card.membershipFee.toString() : '';
  });

  const [rulesStatus, setRulesStatus] = useState<'unverified' | 'user_confirmed' | 'statement_confirmed'>(() => {
    return card?.billingRulesStatus ?? 'unverified';
  });

  const [confirmRulesChange, setConfirmRulesChange] = useState<boolean>(false);

  if (!isOpen || !card) return null;

  const originalCutoff = card?.cycleStartDay;
  const originalDue = card?.paymentDay;
  const cutoffDayNum = parseInt(cutoffDayStr, 10);
  const dueDayNum = parseInt(dueDayStr, 10);
  const hasCycleRulesChanged = (!isNaN(cutoffDayNum) && cutoffDayNum !== originalCutoff) || (!isNaN(dueDayNum) && dueDayNum !== originalDue);
  const canSave = !hasCycleRulesChanged || confirmRulesChange;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (hasCycleRulesChanged && !confirmRulesChange) {
      alert('Debes confirmar que deseas cambiar las reglas de ciclo de facturación de esta tarjeta.');
      return;
    }

    const creditLine = creditLimitStr.trim() ? parseFloat(creditLimitStr) : undefined;
    const tea = teaStr.trim() ? parseFloat(teaStr) / 100 : undefined;
    const debtInsurance = insuranceStr.trim() ? parseFloat(insuranceStr) / 100 : undefined;
    const membershipFee = membershipStr.trim() ? parseFloat(membershipStr) : undefined;

    const finalCutoff = !isNaN(cutoffDayNum) && cutoffDayNum >= 1 && cutoffDayNum <= 31 ? cutoffDayNum : card.cycleStartDay;
    const finalDue = !isNaN(dueDayNum) && dueDayNum >= 1 && dueDayNum <= 31 ? dueDayNum : card.paymentDay;

    updateCard(card.id, {
      creditLine: creditLine && !isNaN(creditLine) ? creditLine : undefined,
      lineaCredito: creditLine && !isNaN(creditLine) ? creditLine : undefined,
      cycleStartDay: finalCutoff,
      paymentDay: finalDue,
      annualEffectiveRate: tea,
      debtInsurance,
      membershipFee,
      billingRulesStatus: rulesStatus,
    });

    if (creditLine && creditLine > 0) {
      try {
        useCreditLineStore.getState().setCreditLine(card.entity, creditLine);
      } catch (err) {
        console.warn('Error sincronizando línea:', err);
      }
    }

    onSuccess(`Ficha contractual de ${card.name} actualizada correctamente.`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-[#11191D] w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="contractual-modal-title"
      >
        {/* Header */}
        <div className={`bg-gradient-to-r ${card.headerBg} px-6 py-5 text-white flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-2xl">
              <CreditCard size={22} className="text-white" />
            </div>
            <div>
              <h2 id="contractual-modal-title" className="text-lg font-black tracking-tight">
                Ficha Contractual · {card.name}
              </h2>
              <p className="text-xs text-white/80">
                {card.issuer || 'Entidad Financiera'} · Red {card.network || 'Universal'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/70 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSave} className="overflow-y-auto p-4 sm:p-6 space-y-5 flex-1">
          {/* Referencia Central de Riesgos (Informativo) */}
          {card.referenceCreditLine && (
            <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                  Referencia Central de Riesgos ({card.referenceDate || '30/09/2026'})
                </span>
                <span className="text-[10px] font-bold bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded-full text-slate-600 dark:text-slate-300">
                  Informativo
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-slate-700 dark:text-slate-300">
                  Línea Registrada: <strong>{fmt.format(card.referenceCreditLine)}</strong> · Saldo Deudor Ref.: <strong>{fmt.format(card.referenceUsedDebt || 0)}</strong>
                </p>
                {!creditLimitStr && (
                  <button
                    type="button"
                    onClick={() => setCreditLimitStr(card.referenceCreditLine!.toString())}
                    className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline shrink-0 cursor-pointer"
                  >
                    Copiar a contractual
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Línea de Crédito y Estado de Verificación */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Línea de Crédito Autorizada (S/)
              </label>
              <input
                type="number"
                step="50"
                min="0"
                value={creditLimitStr}
                onChange={e => setCreditLimitStr(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Pendiente (ej. 1000.00)"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Estado de Fechas y Reglas
              </label>
              <select
                value={rulesStatus}
                onChange={e => setRulesStatus(e.target.value as any)}
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="unverified">Pendiente de confirmar con banco</option>
                <option value="user_confirmed">Confirmado por el usuario</option>
                <option value="statement_confirmed">Verificado contra estado de cuenta</option>
              </select>
            </div>
          </div>

          {/* Días de Ciclo */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Día de Corte de Ciclo
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={cutoffDayStr}
                onChange={e => setCutoffDayStr(e.target.value)}
                placeholder="Ej. 20"
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Día del mes que cierra facturación</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Día Límite de Pago
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={dueDayStr}
                onChange={e => setDueDayStr(e.target.value)}
                placeholder="Ej. 15"
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Fecha límite de pago sin mora</span>
            </div>
          </div>

          {/* Advertencia si cambian reglas de ciclo */}
          {hasCycleRulesChanged && (
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 rounded-2xl text-xs space-y-2">
              <div className="flex items-start gap-2 text-amber-800 dark:text-amber-200 font-bold">
                <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <span>Advertencia: Cambio en las Reglas de Ciclo de Facturación</span>
              </div>
              <p className="text-amber-700 dark:text-amber-300 text-[11px] leading-relaxed">
                Modificar el día de corte o de pago alterará las fechas estimadas de vencimiento de las cuotas activas y el flujo proyectado para esta tarjeta.
              </p>
              <label className="flex items-center gap-2 pt-1 cursor-pointer font-bold text-slate-800 dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={confirmRulesChange}
                  onChange={e => setConfirmRulesChange(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                />
                <span className="text-xs">Confirmo que estas nuevas fechas corresponden al contrato o estado de cuenta bancario</span>
              </label>
            </div>
          )}

          {/* Tasas Contractuales y Seguros */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">
              Tasas y Comisiones Contractuales (Opcional)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  TEA Compras (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={teaStr}
                  onChange={e => setTeaStr(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-100"
                  placeholder="Ej. 45.0"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Desgravamen mensual (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={insuranceStr}
                  onChange={e => setInsuranceStr(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-100"
                  placeholder="Ej. 0.39"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Membresía anual (S/)
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={membershipStr}
                  onChange={e => setMembershipStr(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-100"
                  placeholder="0.00"
                />
              </div>
            </div>
            <p className="text-[10px] text-slate-400">
              💡 Si dejas las tasas vacías, FINPER mantendrá la advertencia de transparencia: <em>"Estimación incompleta: faltan datos contractuales"</em>.
            </p>
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!canSave}
              className={`flex items-center gap-1.5 px-5 py-2 text-white text-xs font-bold rounded-xl shadow-md transition ${
                canSave
                  ? 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer'
                  : 'bg-slate-400 cursor-not-allowed opacity-60'
              }`}
            >
              <Save size={14} />
              <span>Guardar Ficha</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
