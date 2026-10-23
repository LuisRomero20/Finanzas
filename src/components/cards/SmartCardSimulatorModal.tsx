import React, { useState, useMemo } from 'react';
import {
  X,
  Calculator,
  AlertTriangle,
  Info,
  ShieldCheck,
} from 'lucide-react';
import { useCreditCardStore } from '../../store/creditCardStore';
import {
  simulateCardPurchase,
  CONTRACTUAL_WARNING_MESSAGE,
  type SmartSimulationResult,
} from '../../domain/cards/smartCardEngine';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  defaultCardEntity?: string;
}

const fmt = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' });

export const SmartCardSimulatorModal: React.FC<Props> = ({
  isOpen,
  onClose,
  defaultCardEntity,
}) => {
  const { cards } = useCreditCardStore();

  const [selectedCardId, setSelectedCardId] = useState<string>(() => {
    if (defaultCardEntity) {
      const match = cards.find(c => c.entity === defaultCardEntity);
      if (match) return match.id;
    }
    return cards[0]?.id || '';
  });

  const [amountStr, setAmountStr] = useState<string>('1200');
  const [installments, setInstallments] = useState<number>(3);
  const [isZeroPromo, setIsZeroPromo] = useState<boolean>(true);
  const [purchaseDate, setPurchaseDate] = useState<string>(() => {
    return new Date().toISOString().slice(0, 10);
  });

  // Parámetros contractuales opcionales / editables para la simulación
  const [customTeaStr, setCustomTeaStr] = useState<string>('45.0');
  const [customInsuranceStr, setCustomInsuranceStr] = useState<string>('0.39');
  const [customFeeStr, setCustomFeeStr] = useState<string>('0.00');

  const selectedCard = useMemo(() => {
    return cards.find(c => c.id === selectedCardId) || cards[0];
  }, [cards, selectedCardId]);

  const simulationResult = useMemo<SmartSimulationResult | null>(() => {
    if (!selectedCard) return null;
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) return null;

    const tea = parseFloat(customTeaStr) / 100;
    const insurance = parseFloat(customInsuranceStr) / 100;
    const fee = parseFloat(customFeeStr);

    return simulateCardPurchase({
      cardId: selectedCard.id,
      amount,
      installmentsCount: installments,
      purchaseDate,
      rule: {
        cutoffDay: selectedCard.cycleStartDay,
        dueDay: selectedCard.paymentDay,
      },
      promoZeroInterest: isZeroPromo,
      rates: isZeroPromo
        ? undefined
        : {
            tea: isNaN(tea) ? undefined : tea,
            debtInsuranceMonthlyRate: isNaN(insurance) ? undefined : insurance,
            monthlyFixedFee: isNaN(fee) ? 0 : fee,
          },
      currency: 'PEN',
    });
  }, [selectedCard, amountStr, installments, isZeroPromo, purchaseDate, customTeaStr, customInsuranceStr, customFeeStr]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-[#11191D] w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="simulator-modal-title"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-600/10 via-teal-600/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-600 text-white rounded-2xl shadow-sm">
              <Calculator size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="simulator-modal-title" className="text-lg font-black text-slate-900 dark:text-white">
                  Simulador Financiero de Cuotas
                </h2>
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  Hipotético
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Proyección exacta de amortización francesa y promociones sin interés.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            aria-label="Cerrar simulador"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Banner de Garantía de Aislamiento */}
          <div className="p-3.5 bg-sky-50 dark:bg-sky-950/40 rounded-2xl border border-sky-200/80 dark:border-sky-800/60 flex items-start gap-3">
            <Info size={18} className="text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
            <p className="text-xs text-sky-800 dark:text-sky-200 leading-relaxed">
              <strong>Simulación 100% aislada:</strong> Esta calculadora es puramente matemática. No genera transacciones, no muta tus saldos en Supabase ni altera tu presupuesto real.
            </p>
          </div>

          {/* Formulario de Entrada */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Tarjeta */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Tarjeta de Crédito
              </label>
              <select
                value={selectedCardId}
                onChange={e => setSelectedCardId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {cards.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.issuer || 'Banco'}) · Corte: día {c.cycleStartDay}
                  </option>
                ))}
              </select>
            </div>

            {/* Importe */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Importe de Compra (S/)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">S/</span>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={amountStr}
                  onChange={e => setAmountStr(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="1200.00"
                />
              </div>
            </div>

            {/* Número de Cuotas */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Plazo en Cuotas
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
                {[1, 3, 6, 9, 12, 18].map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setInstallments(n)}
                    className={`py-1.5 text-xs font-black rounded-lg transition border cursor-pointer ${
                      installments === n
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {n} {n === 1 ? 'cuota' : 'm'}
                  </button>
                ))}
              </div>
            </div>

            {/* Fecha de Compra */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Fecha Estimada de Compra
              </label>
              <input
                type="date"
                value={purchaseDate}
                onChange={e => setPurchaseDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Modalidad de Financiamiento */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Modalidad de Cuotas</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsZeroPromo(true)}
                  className={`px-3 py-1 text-xs font-black rounded-lg transition border cursor-pointer ${
                    isZeroPromo
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  0% Interés (Promo)
                </button>
                <button
                  type="button"
                  onClick={() => setIsZeroPromo(false)}
                  className={`px-3 py-1 text-xs font-black rounded-lg transition border cursor-pointer ${
                    !isZeroPromo
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  Con Intereses (TEA)
                </button>
              </div>
            </div>

            {!isZeroPromo && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    TEA Compras (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    value={customTeaStr}
                    onChange={e => setCustomTeaStr(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-100"
                    placeholder="45.0"
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
                    value={customInsuranceStr}
                    onChange={e => setCustomInsuranceStr(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-100"
                    placeholder="0.39"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Comisión mensual (S/)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={customFeeStr}
                    onChange={e => setCustomFeeStr(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-100"
                    placeholder="0.00"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Advertencia de completitud contractual si aplica */}
          {simulationResult && !simulationResult.completeness.isComplete && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-center gap-3">
              <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400 shrink-0" />
              <div className="text-xs">
                <p className="font-bold text-amber-900 dark:text-amber-200">
                  {simulationResult.completeness.warningMessage || CONTRACTUAL_WARNING_MESSAGE}
                </p>
                <p className="text-amber-700 dark:text-amber-400 text-[11px] mt-0.5">
                  Faltan confirmar: {simulationResult.completeness.missingTerms.join(', ')}. La simulación usa valores referenciales.
                </p>
              </div>
            </div>
          )}

          {/* Resumen de Resultados */}
          {simulationResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Cuota Mensual</span>
                  <p className="text-lg font-black text-slate-900 dark:text-white mt-1">
                    {fmt.format(simulationResult.schedule.rows[0]?.totalInstallment || 0)}
                  </p>
                  <span className="text-[10px] text-slate-400 font-medium">x {installments} cuotas</span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Intereses Totales</span>
                  <p className={`text-lg font-black mt-1 ${simulationResult.totalInterest > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {fmt.format(simulationResult.totalInterest)}
                  </p>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {simulationResult.isZeroInterestPromo ? '0% interés promo' : `TEA ${customTeaStr}%`}
                  </span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Costo Total Final</span>
                  <p className="text-lg font-black text-slate-900 dark:text-white mt-1">
                    {fmt.format(simulationResult.totalCost)}
                  </p>
                  <span className="text-[10px] text-slate-400 font-medium">Capital + recargos</span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Periodo de Pago</span>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-2 truncate">
                    {simulationResult.firstDueDate}
                  </p>
                  <span className="text-[10px] text-slate-400 font-medium">al {simulationResult.lastDueDate}</span>
                </div>
              </div>

              {/* Cronograma de Amortización */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Cronograma de Pagos Cuota a Cuota
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">
                    {simulationResult.schedule.rows.length} vencimientos
                  </span>
                </div>
                <div className="max-h-56 overflow-y-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100/50 dark:bg-slate-800/50 text-slate-500 text-[10px] uppercase font-bold sticky top-0">
                      <tr>
                        <th className="px-3 py-2">N°</th>
                        <th className="px-3 py-2">Vencimiento</th>
                        <th className="px-3 py-2 text-right">Capital</th>
                        <th className="px-3 py-2 text-right">Interés</th>
                        <th className="px-3 py-2 text-right">Desgrav.</th>
                        <th className="px-3 py-2 text-right">Cuota Total</th>
                        <th className="px-3 py-2 text-right">Saldo Final</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {simulationResult.schedule.rows.map(row => (
                        <tr key={row.installmentNumber} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                          <td className="px-3 py-2 font-bold text-slate-600 dark:text-slate-400">#{row.installmentNumber}</td>
                          <td className="px-3 py-2 font-bold text-slate-800 dark:text-slate-200 tabular-nums">{row.dueDate}</td>
                          <td className="px-3 py-2 text-right font-medium text-slate-700 dark:text-slate-300 tabular-nums">{fmt.format(row.principalPayment)}</td>
                          <td className="px-3 py-2 text-right font-medium text-rose-600 dark:text-rose-400 tabular-nums">{fmt.format(row.interestPayment)}</td>
                          <td className="px-3 py-2 text-right font-medium text-slate-500 dark:text-slate-400 tabular-nums">{fmt.format(row.insurancePayment)}</td>
                          <td className="px-3 py-2 text-right font-black text-slate-900 dark:text-white tabular-nums">{fmt.format(row.totalInstallment)}</td>
                          <td className="px-3 py-2 text-right font-bold text-slate-400 tabular-nums">{fmt.format(row.finalBalance)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <ShieldCheck size={16} className="text-emerald-600" />
            <span>Los datos de esta simulación no se graban</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-bold rounded-xl transition cursor-pointer"
          >
            Cerrar Simulador
          </button>
        </div>
      </div>
    </div>
  );
};
