import React, { useState } from 'react';
import { Calendar as CalendarIcon, X, ArrowUpRight, ArrowDownRight, CreditCard } from 'lucide-react';
import type { Transaction } from '../utils/masterData';
import { getEffectiveCategoryLabel } from '../utils/categoryClassification';

interface Props {
  transactions: Transaction[];
  selectedMonth: string;
}

const MONTH_MAP: Record<string, number> = {
  Enero: 0,
  Febrero: 1,
  Marzo: 2,
  Abril: 3,
  Mayo: 4,
  Junio: 5,
  Julio: 6,
  Agosto: 7,
  Setiembre: 8,
  Octubre: 9,
  Noviembre: 10,
  Diciembre: 11,
};

export const FinancialCalendarWidget: React.FC<Props> = ({ transactions = [], selectedMonth = 'Setiembre' }) => {
  const [selectedDayDetail, setSelectedDayDetail] = useState<{
    dayNumber: number;
    incomes: Transaction[];
    expenses: Transaction[];
    events: string[];
  } | null>(null);

  const monthIdx = MONTH_MAP[selectedMonth] ?? 8;
  const year = 2026; // Año base del sistema

  // Días en el mes
  const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
  const firstDayOfWeek = (new Date(year, monthIdx, 1).getDay() + 6) % 7; // 0: Lunes, 6: Domingo

  const safeList = Array.isArray(transactions) ? transactions : [];

  // Filtrar transacciones del mes
  const monthTransactions = safeList.filter((t) => {
    const mes = t.Mes || (t as any).mes;
    return mes === selectedMonth;
  });

  // Mapear transacciones por día
  const dayData: Record<
    number,
    { incomes: Transaction[]; expenses: Transaction[]; totalIncome: number; totalExpense: number; events: string[] }
  > = {};

  for (let d = 1; d <= daysInMonth; d++) {
    dayData[d] = { incomes: [], expenses: [], totalIncome: 0, totalExpense: 0, events: [] };

    // Hitos bancarios fijos
    if (d === 1) dayData[d].events.push('💳 Pago Ripley (Día 01)');
    if (d === 4) dayData[d].events.push('✂️ Corte BBVA & Ripley (Día 04)');
    if (d === 15) dayData[d].events.push('✂️ Corte Interbank (Día 15)');
    if (d === 25 || d === 30) dayData[d].events.push('💰 Día de Sueldo Estimado');
  }

  monthTransactions.forEach((t) => {
    const fecha = t.Fecha || (t as any).fecha || '';
    let day = 0;
    if (fecha) {
      if (fecha.includes('-')) {
        day = parseInt(fecha.split('-')[2], 10);
      } else if (fecha.includes('/')) {
        day = parseInt(fecha.split('/')[0], 10);
      }
    }

    if (day >= 1 && day <= daysInMonth) {
      const amount = Number(t.Monto || (t as any).monto) || 0;
      const tipo = t.Tipo || (t as any).tipo;
      if (tipo === 'Ingreso') {
        dayData[day].incomes.push(t);
        dayData[day].totalIncome += amount;
      } else {
        dayData[day].expenses.push(t);
        dayData[day].totalExpense += amount;
      }
    }
  });

  const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  return (
    <div className="bg-white dark:bg-[#0D1518] rounded-3xl p-5 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
      
      {/* Cabecera del Calendario */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <CalendarIcon size={20} />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              Calendario Financiero
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 uppercase tracking-wider">
                {selectedMonth} {year}
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Agenda de gastos, cobros y fechas de corte bancarias
            </p>
          </div>
        </div>

        {/* Leyenda */}
        <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> Ingreso
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-rose-500" /> Gasto
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-500" /> Tarjeta / Corte
          </span>
        </div>
      </div>

      {/* Cuadrícula del Calendario */}
      <div>
        {/* Cabecera de días de la semana */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center text-xs font-bold text-slate-400 dark:text-slate-500">
          {weekDays.map((wd) => (
            <div key={wd} className="py-1">
              {wd}
            </div>
          ))}
        </div>

        {/* Celdas de días */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {/* Celdas vacías de inicio de mes */}
          {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
            <div key={`empty-${idx}`} className="h-16 sm:h-20 rounded-2xl bg-slate-50/40 dark:bg-slate-900/20 opacity-40" />
          ))}

          {/* Días del mes */}
          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const dayNum = idx + 1;
            const data = dayData[dayNum];
            const hasIncome = data.totalIncome > 0;
            const hasExpense = data.totalExpense > 0;
            const hasEvents = data.events.length > 0;

            return (
              <button
                key={`day-${dayNum}`}
                type="button"
                onClick={() =>
                  setSelectedDayDetail({
                    dayNumber: dayNum,
                    incomes: data.incomes,
                    expenses: data.expenses,
                    events: data.events,
                  })
                }
                className="h-16 sm:h-20 rounded-2xl p-1.5 sm:p-2 text-left border border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/50 hover:border-emerald-500/50 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20 transition cursor-pointer flex flex-col justify-between group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                    {dayNum}
                  </span>
                  {hasEvents && (
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 ring-2 ring-amber-300 dark:ring-amber-900" title="Evento de Tarjeta" />
                  )}
                </div>

                <div className="space-y-0.5">
                  {hasIncome && (
                    <div className="text-[9px] sm:text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 truncate">
                      +S/{data.totalIncome >= 1000 ? `${(data.totalIncome / 1000).toFixed(1)}k` : data.totalIncome.toFixed(0)}
                    </div>
                  )}
                  {hasExpense && (
                    <div className="text-[9px] sm:text-[10px] font-extrabold text-rose-600 dark:text-rose-400 truncate">
                      -S/{data.totalExpense >= 1000 ? `${(data.totalExpense / 1000).toFixed(1)}k` : data.totalExpense.toFixed(0)}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Modal de Detalle Diario */}
      {selectedDayDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#0D1518] rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 flex items-center justify-center font-black">
                  {selectedDayDetail.dayNumber}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                    Movimientos del Día {selectedDayDetail.dayNumber}
                  </h4>
                  <p className="text-xs text-slate-400">{selectedMonth} {year}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDayDetail(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Hitos Bancarios */}
            {selectedDayDetail.events.length > 0 && (
              <div className="space-y-1.5">
                {selectedDayDetail.events.map((ev, i) => (
                  <div key={i} className="px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-2">
                    <CreditCard size={14} />
                    <span>{ev}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Listado de Transacciones */}
            <div className="space-y-2.5">
              {selectedDayDetail.incomes.length === 0 && selectedDayDetail.expenses.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  No hay transacciones registradas en este día.
                </div>
              ) : (
                <>
                  {selectedDayDetail.incomes.map((inc) => {
                    const concepto = inc.Concepto || (inc as any).concepto;
                    const entidad = inc.Entidad || (inc as any).entidad || (inc as any).medio;
                    const monto = Number(inc.Monto || (inc as any).monto) || 0;
                    return (
                      <div key={inc.id} className="p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/40 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                            <ArrowUpRight size={14} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{concepto}</p>
                            <p className="text-[10px] text-slate-400">{entidad}</p>
                          </div>
                        </div>
                        <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 shrink-0">
                          +S/ {monto.toFixed(2)}
                        </span>
                      </div>
                    );
                  })}

                  {selectedDayDetail.expenses.map((exp) => {
                    const concepto = exp.Concepto || (exp as any).concepto;
                    const cat = getEffectiveCategoryLabel(exp);
                    const entidad = exp.Entidad || (exp as any).entidad || (exp as any).medio;
                    const monto = Number(exp.Monto || (exp as any).monto) || 0;
                    return (
                      <div key={exp.id} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="p-1.5 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400">
                            <ArrowDownRight size={14} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{concepto}</p>
                            <p className="text-[10px] text-slate-400 truncate">{cat} · {entidad}</p>
                          </div>
                        </div>
                        <span className="text-xs font-black text-rose-600 dark:text-rose-400 shrink-0">
                          -S/ {monto.toFixed(2)}
                        </span>
                      </div>
                    );
                  })}
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => setSelectedDayDetail(null)}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold text-xs hover:opacity-90 transition cursor-pointer"
            >
              Cerrar Detalle
            </button>

          </div>
        </div>
      )}

    </div>
  );
};
