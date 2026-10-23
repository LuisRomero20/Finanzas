import React, { useState } from 'react';
import {
  X,
  CreditCard,
  Save,
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

  const [creditLimitStr, setCreditLimitStr] = useState<string>(() => {
    return (card?.creditLine || card?.lineaCredito || card?.referenceCreditLine || 1000).toString();
  });

  const [cutoffDay, setCutoffDay] = useState<number>(() => card?.cycleStartDay ?? 1);
  const [dueDay, setDueDay] = useState<number>(() => card?.paymentDay ?? 1);

  const [teaStr, setTeaStr] = useState<string>(() => {
    return card?.annualEffectiveRate ? (card.annualEffectiveRate * 100).toString() : '';
  });

  const [insuranceStr, setInsuranceStr] = useState<string>(() => {
    return card?.debtInsurance ? (card.debtInsurance * 100).toString() : '';
  });

  const [membershipStr, setMembershipStr] = useState<string>(() => {
    return card?.membershipFee ? card.membershipFee.toString() : '0';
  });

  const [rulesStatus, setRulesStatus] = useState<'unverified' | 'user_confirmed' | 'statement_confirmed'>(() => {
    return card?.billingRulesStatus ?? 'unverified';
  });

  if (!isOpen || !card) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const creditLine = parseFloat(creditLimitStr);
    const tea = teaStr.trim() ? parseFloat(teaStr) / 100 : undefined;
    const debtInsurance = insuranceStr.trim() ? parseFloat(insuranceStr) / 100 : undefined;
    const membershipFee = parseFloat(membershipStr) || 0;

    updateCard(card.id, {
      creditLine: isNaN(creditLine) ? undefined : creditLine,
      lineaCredito: isNaN(creditLine) ? undefined : creditLine,
      cycleStartDay: Math.min(31, Math.max(1, cutoffDay)),
      paymentDay: Math.min(31, Math.max(1, dueDay)),
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
            <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                  Referencia Central de Riesgos ({card.referenceDate || '30/09/2026'})
                </span>
                <span className="text-[10px] font-bold bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded-full text-slate-600 dark:text-slate-300">
                  Informativo
                </span>
              </div>
              <p className="font-semibold text-slate-700 dark:text-slate-300">
                Línea Registrada: <strong>{fmt.format(card.referenceCreditLine)}</strong> · Saldo Deudor Ref.: <strong>{fmt.format(card.referenceUsedDebt || 0)}</strong>
              </p>
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
                placeholder="1000.00"
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
                value={cutoffDay}
                onChange={e => setCutoffDay(parseInt(e.target.value, 10) || 1)}
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
                value={dueDay}
                onChange={e => setDueDay(parseInt(e.target.value, 10) || 1)}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Fecha límite de pago sin mora</span>
            </div>
          </div>

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
              className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer"
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
