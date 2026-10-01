import React, { useState } from 'react';
import { X, CheckCircle2, SlidersHorizontal, CreditCard, RotateCcw, Wallet } from 'lucide-react';
import { useFinanceStore } from '../store/financeStore';
import { useCardStatementStore, type VerifiedStatement } from '../store/cardStatementStore';
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
  liveDebt,
  verifiedStatement,
  onSuccess,
}) => {
  const { addTransaction } = useFinanceStore();
  const { saveVerifiedStatement, removeVerifiedStatement } = useCardStatementStore();

  const [activeTab, setActiveTab] = useState<'cancelar' | 'ajustar'>('cancelar');

  // Estado para cancelar con pago
  const [payAmount, setPayAmount] = useState<string>(() => {
    const amt = netToPay > 0 ? netToPay : (liveDebt > 0 ? liveDebt : 0);
    return amt.toFixed(2);
  });
  const [payAccount, setPayAccount] = useState<string>('Interbank');
  const [payDate, setPayDate] = useState<string>(() => new Date().toISOString().slice(0, 10));

  // Estado para ajuste manual de deuda
  const [customDebt, setCustomDebt] = useState<string>(() => {
    if (verifiedStatement && typeof verifiedStatement.finalDebt === 'number') {
      return verifiedStatement.finalDebt.toFixed(2);
    }
    return (netToPay > 0 ? netToPay : calculatedPrevTotal).toFixed(2);
  });

  if (!isOpen || !card || !prevCycle) return null;

  const cycleKey = `${card.entity}_${prevCycle.payDate.toISOString().slice(0, 10)}`;

  // 1. Manejo: Registrar Pago y Cancelar
  const handleRegisterPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(payAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Ingresa un monto válido mayor a 0');
      return;
    }

    addTransaction({
      Tipo: 'Egreso',
      Categoria: 'Servicio',
      Concepto: `Pago de Tarjeta ${card.entity}`,
      Monto: amount,
      Entidad: payAccount,
      Fecha: payDate,
    });

    onSuccess(`✅ ¡Pago de ${fmt.format(amount)} registrado! La tarjeta ${card.name} quedó marcada como cancelada.`);
    onClose();
  };

  // 2. Manejo: Cancelar Directa a S/ 0 (Sin Egreso)
  const handleDirectCancel = () => {
    saveVerifiedStatement({
      id: `cancel-${Date.now()}`,
      cardEntity: card.entity,
      cycleKey,
      dueDate: prevCycle.payDate.toISOString().slice(0, 10),
      cutoffDate: prevCycle.end.toISOString().slice(0, 10),
      periodStart: prevCycle.start.toISOString().slice(0, 10),
      periodEnd: prevCycle.end.toISOString().slice(0, 10),
      finalDebt: 0,
      fileName: 'Regularización (Cancelado Directo S/ 0)',
      matchedCount: 0,
      totalStatementItems: 0,
      totalAppItems: 0,
      totalStatementCargos: 0,
      totalAppCargos: calculatedPrevTotal,
      diferenciaGastos: 0,
      verifiedAt: new Date().toISOString(),
      notes: 'Cancelado directamente por el usuario',
    });

    onSuccess(`✨ Deuda de ${card.name} para este ciclo marcada como CANCELADA (S/ 0.00).`);
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
      fileName: 'Deuda Regularizada Manualmente',
      matchedCount: 0,
      totalStatementItems: 0,
      totalAppItems: 0,
      totalStatementCargos: amount,
      totalAppCargos: calculatedPrevTotal,
      diferenciaGastos: 0,
      verifiedAt: new Date().toISOString(),
      notes: `Deuda regularizada a ${fmt.format(amount)}`,
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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#11191D] rounded-3xl max-w-lg w-full overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl space-y-0">
        
        {/* Header Modal */}
        <div className={`bg-gradient-to-r ${card.headerBg} px-6 py-4 text-white flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <CreditCard size={18} />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base">Regularizar Deuda & Cancelación</h3>
              <p className="text-white/80 text-xs">{card.name} · Vence: {prevCycle.payDate.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition">
            <X size={16} />
          </button>
        </div>

        {/* Segmented Control Tabs */}
        <div className="px-6 pt-4 pb-2 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40">
          <div className="grid grid-cols-2 p-1 bg-slate-200/60 dark:bg-slate-800/80 rounded-2xl gap-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('cancelar')}
              className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
                activeTab === 'cancelar'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CheckCircle2 size={14} />
              <span>Poner como Cancelada</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ajustar')}
              className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
                activeTab === 'ajustar'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <SlidersHorizontal size={14} />
              <span>Ajustar Monto</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          
          {/* Resumen Deuda Actual */}
          <div className="grid grid-cols-3 gap-2.5 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-800 text-center">
            <div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Facturado</p>
              <p className="text-sm font-black text-slate-700 dark:text-slate-200 mt-0.5">
                {fmt.format(calculatedPrevTotal)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Por Pagar</p>
              <p className={`text-sm font-black mt-0.5 ${netToPay > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {fmt.format(netToPay)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Deuda Viva Total</p>
              <p className="text-sm font-black text-slate-800 dark:text-slate-100 mt-0.5">
                {fmt.format(liveDebt)}
              </p>
            </div>
          </div>

          {/* TAB 1: PONER COMO CANCELADA */}
          {activeTab === 'cancelar' && (
            <div className="space-y-4">
              
              {/* Opción A: Registrar Pago */}
              <form onSubmit={handleRegisterPayment} className="space-y-3 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-900/40 rounded-2xl p-4">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 dark:text-emerald-300">
                  <Wallet size={15} />
                  <span>Opción A: Registrar Pago en Cuenta (Recomendado)</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Crea un egreso de débito que salda la tarjeta y descuenta el saldo bancario real.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">Monto a Pagar (S/)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={payAmount}
                      onChange={e => setPayAmount(e.target.value)}
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

                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer mt-2"
                >
                  <CheckCircle2 size={14} />
                  <span>Registrar Pago de {fmt.format(Number(payAmount) || 0)} y Cancelar</span>
                </button>
              </form>

              {/* Opción B: Cancelar Directa sin Egreso */}
              <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">Opción B: Marcar como Cancelada Directa</h5>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Úsala si ya la pagaste por fuera o no deseas generar un egreso en cuentas.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDirectCancel}
                    className="bg-slate-200 dark:bg-slate-800 hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-600 text-slate-700 dark:text-slate-300 text-xs font-bold px-3.5 py-2 rounded-xl transition cursor-pointer shrink-0 ml-2"
                  >
                    Marcar S/ 0.00
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
