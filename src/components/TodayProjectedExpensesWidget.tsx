import React, { useState, useMemo } from 'react';
import { usePendingPaymentsStore, type PendingPaymentItem } from '../store/pendingPaymentsStore';
import { useFinanceStore, getMonthNameFromDate } from '../store/financeStore';
import { useAppStore } from '../store';
import type { Transaction } from '../utils/masterData';
import {
  Calendar,
  Sparkles,
  CheckCircle2,
  RotateCcw,
  Plus,
  ArrowRight,
  Zap,
  Clock,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { CasualProjectionsModal } from './CasualProjectionsModal';

const fmt = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' });

interface TodayProjectedExpensesWidgetProps {
  onOpenCasualModal?: () => void;
}

export const TodayProjectedExpensesWidget: React.FC<TodayProjectedExpensesWidgetProps> = ({
  onOpenCasualModal,
}) => {
  const { items: pendingItems, executePendingPayment, addPendingItem } = usePendingPaymentsStore();
  const { transactions, addTransaction, deleteTransaction } = useFinanceStore();
  const { agregarNotificacion } = useAppStore();

  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Fecha activa (por defecto hoy: ej. 2026-09-09)
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  const isToday = selectedDate === todayStr;

  // 1. Partidas pendientes programadas para esta fecha
  const todayPendingEgresos = useMemo(() => {
    return pendingItems.filter(
      (p) => p.fecha === selectedDate && p.tipo === 'Egreso' && p.estado === 'pendiente'
    );
  }, [pendingItems, selectedDate]);

  // 2. Transacciones ya cargadas en la lista maestra para esta fecha que sean proyecciones
  const todayProvisionalTxs = useMemo(() => {
    return transactions.filter(
      (t) =>
        t.Fecha === selectedDate &&
        t.Tipo === 'Egreso' &&
        (t.estado === 'provisional' || t.Concepto.toLowerCase().includes('proy'))
    );
  }, [transactions, selectedDate]);

  // Totales
  const totalPendingMonto = todayPendingEgresos.reduce((s, p) => s + p.monto, 0);
  const totalProvisionalMonto = todayProvisionalTxs.reduce((s, t) => s + t.Monto, 0);
  const totalGeneralHoy = totalPendingMonto + totalProvisionalMonto;

  const totalCount = todayPendingEgresos.length + todayProvisionalTxs.length;

  // Formatear fecha para el título
  const formattedDateTitle = useMemo(() => {
    try {
      const [y, m, d] = selectedDate.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      return dateObj.toLocaleDateString('es-PE', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  // Acción: Cargar pendiente como gasto provisional en la lista maestra
  const handleRegisterAsExpense = (item: PendingPaymentItem) => {
    const res = executePendingPayment(item.id);
    if (res.success) {
      agregarNotificacion(
        `⚡ "${item.concepto}" (${fmt.format(item.monto)}) cargado como gasto provisional en la lista maestra.`,
        'success'
      );
    }
  };

  // Acción: Regresar una transacción proyectada a la bandeja de pendientes
  const handleReturnToPending = (t: Transaction) => {
    addPendingItem({
      tipo: t.Tipo,
      concepto: t.Concepto,
      monto: t.Monto,
      categoria: t.Categoria,
      entidad: t.Entidad,
      fecha: t.Fecha,
      origen: 'Proyección',
      mes: t.Mes,
      mesStr: t.Fecha.slice(0, 7),
    });
    deleteTransaction(t.id);
    agregarNotificacion(
      `↩️ Gasto "${t.Concepto}" (${fmt.format(t.Monto)}) regresado a Pagos Pendientes.`,
      'info'
    );
  };

  return (
    <>
      <div className="w-full bg-gradient-to-br from-[#0F171B] via-[#0D1519] to-[#070C0E] border border-amber-500/40 dark:border-amber-500/30 rounded-3xl p-5 sm:p-6 shadow-xl text-white relative transition-all duration-200">
        
        {/* Glow ambient background */}
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header Superior */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-700 text-white rounded-2xl shadow-lg border border-amber-400/40">
              <Zap size={22} className="fill-white/20" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  Esto es lo que tienes proyectado gastar {isToday ? 'hoy día' : `el ${selectedDate}`}
                </h2>
                <span className="text-[10px] font-extrabold uppercase tracking-wider bg-amber-950/90 text-amber-300 border border-amber-600/60 px-2.5 py-0.5 rounded-full">
                  {totalCount} {totalCount === 1 ? 'partida' : 'partidas'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 capitalize font-medium">
                {formattedDateTitle}
              </p>
            </div>
          </div>

          {/* Selector de Fecha y Acciones Rápidas */}
          <div className="flex items-center gap-2.5 flex-wrap self-end sm:self-center">
            
            {/* Input de Fecha rápida */}
            <div className="flex items-center bg-slate-900/90 border border-slate-700/80 rounded-xl px-2.5 py-1 text-xs text-white">
              <Calendar size={13} className="text-amber-400 mr-1.5" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-white text-xs font-bold outline-none cursor-pointer"
              />
              {!isToday && (
                <button
                  onClick={() => setSelectedDate(todayStr)}
                  className="ml-2 pl-2 border-l border-slate-700 text-[10px] font-bold text-amber-400 hover:underline"
                >
                  Hoy
                </button>
              )}
            </div>

            {/* Botón Nuevo Gasto Proyectado */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 active:scale-95 text-white font-black text-xs rounded-xl shadow-md border border-amber-400/40 transition"
              title="Proyectar un nuevo gasto para hoy"
            >
              <Plus size={14} />
              <span>+ Proyectar Gasto</span>
            </button>

            {/* Minimizar / Desplegar */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
              title={isCollapsed ? 'Expandir detalle' : 'Minimizar'}
            >
              {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
            </button>

          </div>
        </div>

        {/* Resumen Métrico Rápido */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-800/80">
          <div className="bg-[#070C0E] border border-slate-800 rounded-2xl p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Total Proyectado para Hoy
            </span>
            <div className="text-2xl font-black text-white mt-0.5 tracking-tight">
              {fmt.format(totalGeneralHoy)}
            </div>
          </div>

          <div className="bg-[#070C0E] border border-slate-800 rounded-2xl p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block flex items-center gap-1">
              <Clock size={11} />
              <span>En Pendientes ({todayPendingEgresos.length})</span>
            </span>
            <div className="text-xl font-black text-amber-300 mt-0.5 tracking-tight">
              {fmt.format(totalPendingMonto)}
            </div>
          </div>

          <div className="bg-[#070C0E] border border-slate-800 rounded-2xl p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block flex items-center gap-1">
              <CheckCircle2 size={11} />
              <span>Cargado en Gastos ({todayProvisionalTxs.length})</span>
            </span>
            <div className="text-xl font-black text-emerald-300 mt-0.5 tracking-tight">
              {fmt.format(totalProvisionalMonto)}
            </div>
          </div>
        </div>

        {/* Listado Detallado de Partidas (Colapsable) */}
        {!isCollapsed && (
          <div className="mt-4 pt-2 animate-in fade-in duration-150">
            {totalCount === 0 ? (
              <div className="p-6 text-center bg-[#070C0E]/60 border border-dashed border-slate-800 rounded-2xl">
                <p className="text-xs text-slate-300 font-medium">
                  No tienes gastos proyectados programados para {isToday ? 'hoy día' : `el ${selectedDate}`}.
                </p>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600/30 hover:bg-amber-600/40 text-amber-300 font-bold text-xs rounded-xl border border-amber-500/40 transition"
                >
                  <Plus size={13} />
                  <span>¿Planeas un gasto casual hoy? Haz clic para proyectarlo</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {/* 1. Items en Pendientes */}
                {todayPendingEgresos.map((p) => {
                  const cleanConcept = p.concepto.replace(/\s*-\s*proy/gi, '').trim();
                  return (
                    <div
                      key={p.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-[#070C0E] hover:bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-xl transition"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="p-1.5 bg-amber-950/80 text-amber-400 border border-amber-800/80 rounded-lg shrink-0">
                          <Clock size={14} />
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-xs">{cleanConcept}</span>
                            <span className="text-[9px] bg-amber-950/80 text-amber-300 border border-amber-700/60 px-1.5 py-0.2 rounded font-bold">
                              Proy. Pendiente
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                            <span>{p.entidad}</span>
                            <span>•</span>
                            <span>{p.categoria}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3">
                        <span className="text-sm font-black text-white font-mono">
                          {fmt.format(p.monto)}
                        </span>
                        <button
                          onClick={() => handleRegisterAsExpense(p)}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-[11px] rounded-lg shadow-sm border border-emerald-400/40 transition"
                          title="Cargar a la lista maestra como gasto provisional"
                        >
                          <Zap size={12} className="text-emerald-200" />
                          <span>Cargar a Gasto (Proy)</span>
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* 2. Items ya en la lista maestra con etiqueta de proyección */}
                {todayProvisionalTxs.map((t) => {
                  const cleanConcept = t.Concepto.replace(/\s*-\s*proy/gi, '').trim();
                  return (
                    <div
                      key={t.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-amber-950/20 hover:bg-amber-950/30 border border-amber-600/40 rounded-xl transition"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="p-1.5 bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 rounded-lg shrink-0">
                          <CheckCircle2 size={14} />
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-xs">{cleanConcept}</span>
                            <span className="text-[9px] bg-emerald-900/80 text-emerald-300 border border-emerald-600/60 px-1.5 py-0.2 rounded font-bold">
                              ⚡ Gasto Activo (Provisional)
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-300 flex items-center gap-2 mt-0.5 font-medium">
                            <span>{t.Entidad}</span>
                            <span>•</span>
                            <span>{t.Categoria}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3">
                        <span className="text-sm font-black text-emerald-300 font-mono">
                          {fmt.format(t.Monto)}
                        </span>
                        <button
                          onClick={() => handleReturnToPending(t)}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 hover:text-white font-bold text-[11px] rounded-lg border border-slate-600 transition"
                          title="Devolver este gasto provisional a la bandeja de pendientes"
                        >
                          <RotateCcw size={12} className="text-amber-400" />
                          <span>Regresar a Pendientes</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Modal para proyectar gastos casuales preconfigurado para la fecha activa */}
      <CasualProjectionsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultDate={selectedDate}
      />
    </>
  );
};
