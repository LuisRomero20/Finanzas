import React, { useState } from 'react';
import { Flame, Snowflake, Zap, CheckCircle2, TrendingDown, Info, ShieldCheck } from 'lucide-react';
import { calculateDebtPayoff, type DebtItem } from '../utils/debtPayoffSimulator';

interface DeudaItemStore {
  id: string;
  acreedor: string;
  monto: number;
  tasa_anual: number;
  plazo_meses: number;
  meses_pagados: number;
  tipo_tasa: string;
  moneda: string;
  estado: string;
}

interface Props {
  deudas?: DeudaItemStore[];
}

export const DebtPayoffSimulatorWidget: React.FC<Props> = ({ deudas = [] }) => {
  const [strategy, setStrategy] = useState<'snowball' | 'avalanche'>('snowball');
  const [extraPayment, setExtraPayment] = useState<number>(200);

  // Mapear estrictamente las deudas reales registradas (excluyendo tarjetas corrientes)
  const activeDebts: DebtItem[] = deudas
    .filter((d) => d.estado === 'activa')
    .map((d) => {
      const i_m = d.tipo_tasa === 'efectiva' ? Math.pow(1 + d.tasa_anual, 1 / 12) - 1 : d.tasa_anual / 12;
      const n = Math.max(1, d.plazo_meses - d.meses_pagados);
      const cuota = i_m > 0 ? (d.monto * i_m) / (1 - Math.pow(1 + i_m, -n)) : d.monto / n;

      return {
        id: d.id,
        name: d.acreedor,
        balance: d.monto,
        minPayment: Math.max(10, Math.round(cuota)),
        interestRate: Number((d.tasa_anual * 100).toFixed(1)),
      };
    });

  const totalBalance = activeDebts.reduce((acc, d) => acc + d.balance, 0);
  const payoff = calculateDebtPayoff(activeDebts, extraPayment, strategy);

  if (activeDebts.length === 0) {
    return (
      <div className="bg-white dark:bg-[#0D1518] rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-start gap-4">
        <div className="h-10 w-10 rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 flex items-center justify-center shrink-0">
          <ShieldCheck size={22} />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
            Sin Pasivos Estructurados ni Préstamos Bancarios Activos
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Tus tarjetas de crédito se gestionan como <strong>consumos operativos mensuales</strong> y no como pasivos a largo plazo. 
            Si registras un préstamo personal, vehicular o bancario mediante el botón <em>"Registrar Nueva Deuda"</em>, podrás simular aquí su liquidación acelerada mediante Bola de Nieve o Avalancha.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#0D1518] rounded-3xl p-5 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
      
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-rose-500/20">
            <TrendingDown size={20} />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              Simulador de Liquidación de Pasivos
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300 uppercase tracking-wider">
                Deuda Total: S/ {totalBalance.toLocaleString('es-PE')}
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Estrategias para amortizar préstamos y créditos bancarios (excluye consumos mensuales de tarjetas)
            </p>
          </div>
        </div>

        {/* Selector de Estrategia */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 shrink-0">
          <button
            type="button"
            onClick={() => setStrategy('snowball')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              strategy === 'snowball'
                ? 'bg-white dark:bg-[#0D1518] text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-200 dark:ring-slate-700'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Snowflake size={14} className="text-cyan-500" />
            <span>Bola de Nieve</span>
          </button>
          <button
            type="button"
            onClick={() => setStrategy('avalanche')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              strategy === 'avalanche'
                ? 'bg-white dark:bg-[#0D1518] text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-200 dark:ring-slate-700'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Flame size={14} className="text-amber-500" />
            <span>Avalancha</span>
          </button>
        </div>
      </div>

      {/* Control Deslizante de Abono Extra */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-amber-500" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
              Abono Extra Mensual al Capital
            </span>
          </div>
          <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
            +S/ {extraPayment} / mes
          </span>
        </div>

        <input
          type="range"
          min="0"
          max="1000"
          step="50"
          value={extraPayment}
          onChange={(e) => setExtraPayment(Number(e.target.value))}
          className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
        />

        <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
          <span>S/ 0 (Solo cuotas programadas)</span>
          <span>S/ 500</span>
          <span>S/ 1,000 / mes</span>
        </div>
      </div>

      {/* Métricas de Resultado */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 text-center">
          <p className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400">Tiempo de Liquidación</p>
          <p className="text-xl font-black text-emerald-800 dark:text-emerald-200 mt-0.5">
            {payoff.totalMonths} Meses
          </p>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">
            {payoff.totalMonths <= 12 ? '¡Menos de 1 año!' : `~${(payoff.totalMonths / 12).toFixed(1)} años`}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 text-center">
          <p className="text-[10px] uppercase font-bold text-blue-700 dark:text-blue-400">Intereses Totales Estimados</p>
          <p className="text-xl font-black text-blue-800 dark:text-blue-200 mt-0.5">
            S/ {payoff.totalInterestPaid.toLocaleString('es-PE', { maximumFractionDigits: 0 })}
          </p>
          <p className="text-[10px] text-blue-600 dark:text-blue-400 mt-0.5">Costo financiero estimado</p>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 text-center">
          <p className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400">Ahorro en Intereses</p>
          <p className="text-xl font-black text-amber-800 dark:text-amber-200 mt-0.5">
            S/ {payoff.interestSaved.toLocaleString('es-PE', { maximumFractionDigits: 0 })}
          </p>
          <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">Por abonos adicionales</p>
        </div>
      </div>

      {/* Orden de Liquidación de Deudas */}
      <div>
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
          Cronograma y Orden de Liquidación
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {payoff.debtOrder.map((d, index) => (
            <div
              key={d.name}
              className="p-3 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="h-6 w-6 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black text-xs flex items-center justify-center shrink-0">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{d.name}</p>
                  <p className="text-[10px] text-slate-400">Saldo: S/ {d.balance.toLocaleString('es-PE')}</p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
                  Mes {d.monthsToPayoff}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
