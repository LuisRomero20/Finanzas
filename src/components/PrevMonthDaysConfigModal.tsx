import React from 'react';
import { X, Calendar, ArrowUpRight, ArrowDownRight, Check, SlidersHorizontal, Sparkles, AlertCircle } from 'lucide-react';
import { usePrevMonthBridgeStore, type BridgeMovementType } from '../store/prevMonthBridgeStore';
import type { Transaction } from '../store/financeStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentMonth: string;
  allTransactions: Transaction[];
}

const MONTH_MAP: Record<string, number> = {
  Enero: 0, Febrero: 1, Marzo: 2, Abril: 3, Mayo: 4, Junio: 5,
  Julio: 6, Agosto: 7, Setiembre: 8, Octubre: 9, Noviembre: 10, Diciembre: 11
};

export const PrevMonthDaysConfigModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentMonth,
  allTransactions,
}) => {
  const {
    getConfig,
    setEnabled,
    setMovementType,
    setIncludeInDashboardTotals,
    setIncludedDays,
    toggleDay,
    getPreviousMonthName,
  } = usePrevMonthBridgeStore();

  if (!isOpen) return null;

  const activeMonth = currentMonth === 'Todos' ? 'Setiembre' : currentMonth;
  const prevMonthName = getPreviousMonthName(activeMonth);
  const config = getConfig(activeMonth);

  const prevMonthIdx = MONTH_MAP[prevMonthName] ?? 7;
  const year = 2026;
  const daysInPrevMonth = new Date(year, prevMonthIdx + 1, 0).getDate();

  // Calcular movimientos de cada uno de los últimos 10 días del mes anterior
  const daysRange: number[] = [];
  const startDay = Math.max(1, daysInPrevMonth - 9); // Últimos 10 días (ej. 22 al 31)
  for (let d = startDay; d <= daysInPrevMonth; d++) {
    daysRange.push(d);
  }

  // Pre-calcular montos de cada día en el mes anterior
  const dayStats: Record<number, { incomes: number; expenses: number; count: number }> = {};
  daysRange.forEach((d) => {
    dayStats[d] = { incomes: 0, expenses: 0, count: 0 };
  });

  (allTransactions || []).forEach((t) => {
    const mes = t.Mes || (t as any).mes;
    if (mes !== prevMonthName) return;

    const fecha = t.Fecha || (t as any).fecha || '';
    let day = 0;
    if (fecha.includes('-')) {
      day = parseInt(fecha.split('-')[2], 10);
    } else if (fecha.includes('/')) {
      day = parseInt(fecha.split('/')[0], 10);
    }

    if (dayStats[day]) {
      const monto = Number(t.Monto || (t as any).monto) || 0;
      const tipo = t.Tipo || (t as any).tipo;
      if (tipo === 'Ingreso') {
        dayStats[day].incomes += monto;
      } else {
        dayStats[day].expenses += monto;
      }
      dayStats[day].count++;
    }
  });

  // Calcular totales acumulados de los días seleccionados
  let totalSelectedIncomes = 0;
  let totalSelectedExpenses = 0;
  config.includedDays.forEach((d) => {
    if (dayStats[d]) {
      if (config.movementType === 'Ambos' || config.movementType === 'Ingresos') {
        totalSelectedIncomes += dayStats[d].incomes;
      }
      if (config.movementType === 'Ambos' || config.movementType === 'Egresos') {
        totalSelectedExpenses += dayStats[d].expenses;
      }
    }
  });

  const handlePreset = (preset: 'last1' | 'last3' | 'last5' | 'withMoves' | 'clear') => {
    if (preset === 'last1') {
      setIncludedDays(activeMonth, [daysInPrevMonth]);
    } else if (preset === 'last3') {
      setIncludedDays(activeMonth, [daysInPrevMonth - 2, daysInPrevMonth - 1, daysInPrevMonth]);
    } else if (preset === 'last5') {
      const days = [];
      for (let d = daysInPrevMonth - 4; d <= daysInPrevMonth; d++) days.push(d);
      setIncludedDays(activeMonth, days);
    } else if (preset === 'withMoves') {
      const daysWithMoves = daysRange.filter((d) => dayStats[d].count > 0);
      setIncludedDays(activeMonth, daysWithMoves.length > 0 ? daysWithMoves : [daysInPrevMonth]);
    } else if (preset === 'clear') {
      setIncludedDays(activeMonth, []);
    }
  };

  const formatterPEN = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' });

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-[#0D1518] rounded-3xl max-w-xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Encabezado */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
              <Calendar size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  Días de {prevMonthName} en {activeMonth}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300">
                  Puente Contable
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Considera ingresos (ej. sueldo de fin de mes) o egresos del mes anterior como parte de este periodo.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Switch Principal: Activar / Desactivar */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Sparkles size={14} className="text-indigo-500" />
              Activar inclusión de días de {prevMonthName}
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Muestra los días seleccionados en el Calendario Financiero y sus movimientos.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setEnabled(activeMonth, !config.enabled)}
            className={`w-12 h-6.5 rounded-full transition-colors relative cursor-pointer focus:outline-none ${
              config.enabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform transform absolute top-0.5 ${
                config.enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Selector de Tipo de Movimiento */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
            ¿Qué movimientos deseas considerar?
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['Ambos', 'Ingresos', 'Egresos'] as BridgeMovementType[]).map((tipo) => (
              <button
                key={tipo}
                type="button"
                onClick={() => setMovementType(activeMonth, tipo)}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition text-center cursor-pointer ${
                  config.movementType === tipo
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-white dark:bg-[#11191D] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                {tipo === 'Ambos' ? '🟢 Ambos (Ing. y Egr.)' : tipo === 'Ingresos' ? '💰 Solo Ingresos' : '🛒 Solo Egresos'}
              </button>
            ))}
          </div>
        </div>

        {/* Selector de Días del Mes Anterior */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <SlidersHorizontal size={13} className="text-indigo-500" />
              Seleccionar días a considerar de {prevMonthName} ({daysInPrevMonth} días):
            </label>
            <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
              {config.includedDays.length} días seleccionados
            </span>
          </div>

          {/* Botones de selección rápida */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => handlePreset('last1')}
              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer transition"
            >
              Último día ({daysInPrevMonth})
            </button>
            <button
              type="button"
              onClick={() => handlePreset('last3')}
              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer transition"
            >
              Últimos 3 días
            </button>
            <button
              type="button"
              onClick={() => handlePreset('last5')}
              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer transition"
            >
              Últimos 5 días
            </button>
            <button
              type="button"
              onClick={() => handlePreset('withMoves')}
              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80 hover:bg-indigo-100 cursor-pointer transition"
            >
              Con movimientos
            </button>
            <button
              type="button"
              onClick={() => handlePreset('clear')}
              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer transition"
            >
              Limpiar
            </button>
          </div>

          {/* Grilla interactiva de días */}
          <div className="grid grid-cols-5 sm:grid-cols-5 gap-2 pt-1">
            {daysRange.map((d) => {
              const isSelected = config.includedDays.includes(d);
              const stats = dayStats[d];
              const hasIncomes = stats.incomes > 0;
              const hasExpenses = stats.expenses > 0;

              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleDay(activeMonth, d)}
                  className={`p-2 rounded-2xl text-left border transition cursor-pointer flex flex-col justify-between min-h-[64px] relative ${
                    isSelected
                      ? 'bg-indigo-500/10 border-indigo-500 text-indigo-900 dark:text-indigo-100 ring-2 ring-indigo-500/20'
                      : 'bg-white dark:bg-[#11191D] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-black">
                      {d} <span className="text-[10px] font-medium opacity-60">Ago</span>
                    </span>
                    {isSelected && (
                      <span className="h-4 w-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">
                        <Check size={10} strokeWidth={3} />
                      </span>
                    )}
                  </div>

                  <div className="space-y-0.5 mt-1">
                    {hasIncomes && (
                      <div className="text-[9px] font-extrabold text-emerald-600 dark:text-emerald-400 truncate">
                        +S/{stats.incomes >= 1000 ? `${(stats.incomes / 1000).toFixed(1)}k` : stats.incomes.toFixed(0)}
                      </div>
                    )}
                    {hasExpenses && (
                      <div className="text-[9px] font-extrabold text-rose-600 dark:text-rose-400 truncate">
                        -S/{stats.expenses >= 1000 ? `${(stats.expenses / 1000).toFixed(1)}k` : stats.expenses.toFixed(0)}
                      </div>
                    )}
                    {!hasIncomes && !hasExpenses && (
                      <span className="text-[9px] text-slate-400">Sin movs</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Switch: Impactar en el Dashboard */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40">
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              Considerar en el Balance y Totales del Dashboard
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Suma estos montos a los totales de Ingresos/Egresos de {activeMonth} en el Dashboard.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIncludeInDashboardTotals(activeMonth, !config.includeInDashboardTotals)}
            className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer focus:outline-none ${
              config.includeInDashboardTotals ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <div
              className={`w-4.5 h-4.5 rounded-full bg-white transition-transform transform absolute top-0.75 ${
                config.includeInDashboardTotals ? 'translate-x-5.5' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Resumen del Impacto en el Periodo */}
        <div className="p-4 rounded-2xl bg-slate-900 dark:bg-[#07130D] text-white space-y-2 border border-slate-800">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Total Ingresos añadidos de {prevMonthName}:</span>
            <span className="font-bold text-emerald-400 tabular-nums">
              +{formatterPEN.format(totalSelectedIncomes)}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Total Egresos añadidos de {prevMonthName}:</span>
            <span className="font-bold text-rose-400 tabular-nums">
              -{formatterPEN.format(totalSelectedExpenses)}
            </span>
          </div>
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs font-black">
            <span className="text-white">Impacto Neto en {activeMonth}:</span>
            <span
              className={`text-sm tabular-nums ${
                totalSelectedIncomes - totalSelectedExpenses >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {formatterPEN.format(totalSelectedIncomes - totalSelectedExpenses)}
            </span>
          </div>
        </div>

        {/* Botón de Cierre */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition cursor-pointer"
          >
            Guardar y Aplicar al Calendario
          </button>
        </div>
      </div>
    </div>
  );
};
