import React, { useState, useMemo } from 'react';
import {
  useProjectionStore,
  type EffectiveProjectedRow,
  type ProjectedItem,
  type ProjectedRecurrence,
  type CardCycleDueDetail,
  CARD_RULES,
  getCardDueDetailsForMonth,
} from '../store/projectionStore';
import { Card } from '../components/ui/Card';
import { Metric } from '../components/ui/Metric';
import { Badge } from '../components/ui/Badge';
import {
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  TrendingUp,
  TrendingDown,
  Wallet,
  CreditCard,
  Building2,
  Calendar,
  Layers,
  Sparkles,
  Edit2,
  Trash2,
  EyeOff,
  RotateCcw,
  CheckCircle2,
  X,
  AlertCircle,
  HelpCircle,
  Clock,
  ArrowRight,
  FileSpreadsheet,
  Send,
} from 'lucide-react';
import { usePendingPaymentsStore } from '../store/pendingPaymentsStore';

const fmt = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' });

const CATEGORIAS_DISPONIBLES = [
  'Sueldo',
  'Servicio',
  'Gasto',
  'Ahorro',
  'Deuda',
  'Negocio',
  'Otro Ing',
  'Otro Egre',
];

const ENTIDADES_DISPONIBLES = [
  'Interbank',
  'BBVA Bfree',
  'Interbank Amex',
  'Ripley',
  'BCP',
  'Scotiabank',
  'Efectivo',
];

const MESES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Setiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const ProyeccionPage: React.FC = () => {
  // Mes activo para proyección (default: Octubre 2026)
  const [activeYear, setActiveYear] = useState<number>(2026);
  const [activeMonthIndex, setActiveMonthIndex] = useState<number>(9); // 9 = Octubre (0-indexed)

  const activeMonthStr = `${activeYear}-${String(activeMonthIndex + 1).padStart(2, '0')}`;
  const activeMonthLabel = `${MESES_ES[activeMonthIndex]} ${activeYear}`;

  const {
    items,
    probabilidadSueldoPorMes,
    addItem,
    updateItem,
    deleteItem,
    suppressInMonth,
    modifyAmountInMonth,
    clearMonthException,
    setProbabilidadSueldo,
    getMonthlyProjections,
    resetToDefaults,
  } = useProjectionStore();

  // Modal para auditoría de liquidación de tarjeta de crédito
  const [selectedCardAudit, setSelectedCardAudit] = useState<CardCycleDueDetail | null>(null);

  // Modal para agregar o editar partida
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ProjectedItem | null>(null);

  // Modal para modificar monto en un solo mes
  const [modifyModalData, setModifyModalData] = useState<{ id: string; concepto: string; currentAmount: number } | null>(null);
  const [tempAmount, setTempAmount] = useState<number>(0);

  // Form State
  const [formTipo, setFormTipo] = useState<'Ingreso' | 'Egreso'>('Egreso');
  const [formConcepto, setFormConcepto] = useState('');
  const [formMonto, setFormMonto] = useState<number>(0);
  const [formCategoria, setFormCategoria] = useState('Servicio');
  const [formEntidad, setFormEntidad] = useState('Interbank');
  const [formDia, setFormDia] = useState<number>(1);
  const [formRecurrencia, setFormRecurrencia] = useState<ProjectedRecurrence>('fijo');
  const [formMesesDuracion, setFormMesesDuracion] = useState<number>(3);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Navegación de meses
  const shiftMonth = (delta: number) => {
    let newM = activeMonthIndex + delta;
    let newY = activeYear;
    if (newM < 0) {
      newM = 11;
      newY--;
    } else if (newM > 11) {
      newM = 0;
      newY++;
    }
    setActiveMonthIndex(newM);
    setActiveYear(newY);
  };

  // Filas proyectadas para el mes seleccionado
  const projectedRows = useMemo(() => {
    return getMonthlyProjections(activeMonthStr);
  }, [getMonthlyProjections, activeMonthStr, items]);

  // Cálculos consolidados
  const totalIngresos = useMemo(() => {
    return projectedRows.filter(r => r.tipo === 'Ingreso').reduce((s, r) => s + r.monto, 0);
  }, [projectedRows]);

  const totalEgresos = useMemo(() => {
    return projectedRows.filter(r => r.tipo === 'Egreso').reduce((s, r) => s + r.monto, 0);
  }, [projectedRows]);

  // Desglose por entidad
  const entityBreakdown = useMemo(() => {
    const interbankDebitTxs = projectedRows.filter(r => r.entidad === 'Interbank' && r.tipo === 'Egreso');
    const interbankIncomeTxs = projectedRows.filter(r => r.entidad === 'Interbank' && r.tipo === 'Ingreso');

    const totalInterbankDebit = interbankDebitTxs.reduce((s, r) => s + r.monto, 0);
    const totalInterbankIncome = interbankIncomeTxs.reduce((s, r) => s + r.monto, 0);
    const saldoNetoInterbank = totalInterbankIncome - totalInterbankDebit;

    // Tarjetas de crédito - Consumos registrados en este mes
    const amexTxs = projectedRows.filter(r => r.entidad === 'Interbank Amex' && r.tipo === 'Egreso');
    const totalAmex = amexTxs.reduce((s, r) => s + r.monto, 0);

    const bbvaTxs = projectedRows.filter(r => r.entidad === 'BBVA Bfree' && r.tipo === 'Egreso');
    const totalBbva = bbvaTxs.reduce((s, r) => s + r.monto, 0);

    const ripleyTxs = projectedRows.filter(r => r.entidad === 'Ripley' && r.tipo === 'Egreso');
    const totalRipley = ripleyTxs.reduce((s, r) => s + r.monto, 0);

    // Liquidaciones de ciclo que se pagan en este mes (procedentes de histórico y proyección)
    const amexDueDetail = getCardDueDetailsForMonth('Interbank Amex', activeMonthStr, items);
    const bbvaDueDetail = getCardDueDetailsForMonth('BBVA Bfree', activeMonthStr, items);
    const ripleyDueDetail = getCardDueDetailsForMonth('Ripley', activeMonthStr, items);

    // Probabilidad de Sueldo / Escenario
    const sueldoProbable = probabilidadSueldoPorMes[activeMonthStr] ?? 2700.0;
    const sueldoBaseRegistrado = interbankIncomeTxs.find(r => r.categoria === 'Sueldo')?.monto ?? 0;
    const deltaSueldo = Math.max(0, sueldoProbable - sueldoBaseRegistrado);
    const saldoFinalProyectado = saldoNetoInterbank + deltaSueldo;

    return {
      interbankDebitTxs,
      interbankIncomeTxs,
      totalInterbankDebit,
      totalInterbankIncome,
      saldoNetoInterbank,
      amexTxs,
      totalAmex,
      bbvaTxs,
      totalBbva,
      ripleyTxs,
      totalRipley,
      amexDueDetail,
      bbvaDueDetail,
      ripleyDueDetail,
      sueldoProbable,
      saldoFinalProyectado,
    };
  }, [projectedRows, probabilidadSueldoPorMes, activeMonthStr]);

  // Manejo de Modal de Creación / Edición
  const handleOpenNewModal = () => {
    setEditingItem(null);
    setFormTipo('Egreso');
    setFormConcepto('');
    setFormMonto(0);
    setFormCategoria('Servicio');
    setFormEntidad('Interbank');
    setFormDia(1);
    setFormRecurrencia('fijo');
    setFormMesesDuracion(3);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (row: EffectiveProjectedRow) => {
    const orig = items.find(i => i.id === row.itemId);
    if (!orig) return;
    setEditingItem(orig);
    setFormTipo(orig.tipo);
    setFormConcepto(orig.concepto);
    setFormMonto(orig.monto);
    setFormCategoria(orig.categoria);
    setFormEntidad(orig.entidad);
    setFormDia(orig.dia);
    setFormRecurrencia(orig.recurrencia);
    setFormMesesDuracion(orig.mesesDuracion || 3);
    setIsModalOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formConcepto.trim()) return;

    if (editingItem) {
      updateItem(editingItem.id, {
        tipo: formTipo,
        concepto: formConcepto.trim(),
        monto: Number(formMonto),
        categoria: formCategoria,
        entidad: formEntidad,
        dia: Number(formDia),
        recurrencia: formRecurrencia,
        mesesDuracion: formRecurrencia === 'temporal' ? Number(formMesesDuracion) : undefined,
      });
      showToast(`Partida "${formConcepto}" actualizada correctamente.`);
    } else {
      addItem({
        tipo: formTipo,
        concepto: formConcepto.trim(),
        monto: Number(formMonto),
        categoria: formCategoria,
        entidad: formEntidad,
        dia: Number(formDia),
        mesInicio: activeMonthStr,
        recurrencia: formRecurrencia,
        mesesDuracion: formRecurrencia === 'temporal' ? Number(formMesesDuracion) : undefined,
      });
      showToast(`Partida "${formConcepto}" agregada a las proyecciones.`);
    }

    setIsModalOpen(false);
  };

  const handleSuppressInMonth = (row: EffectiveProjectedRow) => {
    suppressInMonth(row.itemId, activeMonthStr);
    showToast(`"${row.concepto}" suprimido para ${activeMonthLabel}.`);
  };

  const handleOpenModifyAmount = (row: EffectiveProjectedRow) => {
    setModifyModalData({
      id: row.itemId,
      concepto: row.concepto,
      currentAmount: row.monto,
    });
    setTempAmount(row.monto);
  };

  const handleSaveModifiedAmount = () => {
    if (!modifyModalData) return;
    modifyAmountInMonth(modifyModalData.id, activeMonthStr, Number(tempAmount));
    showToast(`Monto de "${modifyModalData.concepto}" actualizado a ${fmt.format(Number(tempAmount))} solo para ${activeMonthLabel}.`);
    setModifyModalData(null);
  };

  const handleRestoreOriginal = (row: EffectiveProjectedRow) => {
    clearMonthException(row.itemId, activeMonthStr);
    showToast(`"${row.concepto}" restaurado a su valor original.`);
  };

  const handleDeleteItem = (row: EffectiveProjectedRow) => {
    if (confirm(`¿Eliminar definitivamente "${row.concepto}" de todas las proyecciones?`)) {
      deleteItem(row.itemId);
      showToast(`"${row.concepto}" eliminado.`);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Toast Notificación */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-2.5 text-xs font-bold animate-in fade-in slide-in-from-bottom">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ── HEADER EJECUTIVO & NAVEGADOR DE MESES ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-[#11191D] rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Proyecciones & Presupuesto Futuro
            </h1>
            <span className="text-[10px] font-bold uppercase tracking-widest bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 rounded-full">
              Cashflow Pro
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Planificación financiera por mes, cálculo de ciclos de tarjetas y consolidación por cuenta.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          
          {/* Navegador de Mes Proyectado */}
          <div className="flex items-center bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-2xl px-3 py-1.5 shadow-inner gap-2">
            <button
              onClick={() => shiftMonth(-1)}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 transition"
              title="Mes anterior"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 min-w-[130px] justify-center">
              <Calendar size={14} className="text-emerald-700 dark:text-emerald-400" />
              <span>{activeMonthLabel}</span>
            </div>
            <button
              onClick={() => shiftMonth(1)}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 transition"
              title="Mes siguiente"
            >
              <ChevronRight size={16} />
            </button>
            <button
              onClick={() => {
                setActiveYear(2026);
                setActiveMonthIndex(9); // Octubre
              }}
              className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline pl-1 border-l border-slate-200 dark:border-slate-700"
            >
              Oct 2026
            </button>
          </div>

          {/* Botón Enviar a Pagos Pendientes */}
          <button
            onClick={() => {
              const res = usePendingPaymentsStore.getState().importFromProjection(activeMonthStr, projectedRows);
              if (res.added === 0 && res.updated === 0) {
                showToast(`ℹ️ Las partidas de ${activeMonthLabel} ya están sincronizadas (sin duplicados).`);
              } else {
                showToast(`📤 ${res.added} partidas nuevas y ${res.updated} actualizadas en Pagos Pendientes para ${activeMonthLabel}.`);
              }
            }}
            className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm hover:shadow-md transition"
            title="Enviar todas las partidas de este mes a la bandeja de Pagos Pendientes en el Dashboard"
          >
            <Send size={15} />
            <span>Enviar a Pagos Pendientes</span>
          </button>

          {/* Botón Agregar Partida */}
          <button
            onClick={handleOpenNewModal}
            className="flex items-center gap-1.5 bg-[#0F2A1D] dark:bg-slate-800 hover:bg-black dark:hover:bg-slate-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm hover:shadow-md transition border border-slate-700/50"
          >
            <PlusCircle size={15} />
            <span>Agregar Partida</span>
          </button>

          {/* Botón Restaurar */}
          <button
            onClick={() => {
              if (confirm('¿Restaurar las proyecciones a la plantilla base de Octubre 2026?')) {
                resetToDefaults();
                showToast('Proyecciones restauradas a la plantilla base.');
              }
            }}
            className="p-2.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition"
            title="Restaurar plantilla inicial"
          >
            <RotateCcw size={15} />
          </button>

        </div>
      </div>

      {/* ── KPI METRICS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <Card className="bg-gradient-to-br from-white to-emerald-50/40 dark:from-[#11191D] dark:to-emerald-950/20 border-emerald-100 dark:border-slate-800">
          <Metric 
            label="Ingresos Proyectados" 
            value={fmt.format(totalIngresos)} 
            subValue={`Total estimado para ${MESES_ES[activeMonthIndex]}`}
            icon={<TrendingUp className="text-emerald-700 dark:text-emerald-400" size={20} />}
            color="text-emerald-950 dark:text-emerald-300"
          />
        </Card>

        <Card className="bg-gradient-to-br from-white to-slate-50 dark:from-[#11191D] dark:to-slate-800/30 border-slate-200 dark:border-slate-800">
          <Metric 
            label="Egresos en Cuenta (Débito)" 
            value={fmt.format(entityBreakdown.totalInterbankDebit)} 
            subValue="Desembolsos directos Interbank"
            icon={<TrendingDown className="text-slate-600 dark:text-slate-400" size={20} />}
            color="text-slate-900 dark:text-slate-100"
          />
        </Card>

        <Card className="bg-gradient-to-br from-white to-amber-50/40 dark:from-[#11191D] dark:to-amber-950/20 border-amber-200/70 dark:border-slate-800">
          <Metric 
            label="Consumos en Tarjetas" 
            value={fmt.format(entityBreakdown.totalAmex + entityBreakdown.totalBbva + entityBreakdown.totalRipley)} 
            subValue="Compras del mes en crédito"
            icon={<CreditCard className="text-amber-700 dark:text-amber-400" size={20} />}
            color="text-amber-950 dark:text-amber-300"
          />
        </Card>

        <Card className="bg-gradient-to-br from-emerald-900 to-[#0F2A1D] text-white border-emerald-950 shadow-md">
          <div className="flex flex-col justify-between h-full">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">
                Saldo Final Proyectado
              </span>
              <div className="p-2 rounded-xl bg-white/10 text-emerald-200">
                <Wallet size={20} />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {fmt.format(entityBreakdown.saldoFinalProyectado)}
              </div>
              <p className="text-xs font-medium text-emerald-300/80 mt-1.5">
                Liquidez estimada fin de mes
              </p>
            </div>
          </div>
        </Card>

      </div>

      {/* ── CUADRÍCULA PRINCIPAL: TABLA DE PROYECCIÓN (IZQUIERDA) + RESUMEN POR ENTIDAD (DERECHA) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ══════════════════════════════════════════════════════════════════════════
            COLUMNA IZQUIERDA (7 cols): TABLA PRINCIPAL DE PROYECCIÓN MENSUAL
        ══════════════════════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="p-0 overflow-hidden">
            
            {/* Header de la Tabla */}
            <div className="p-5 bg-slate-50/70 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <CalendarRange size={18} className="text-emerald-700 dark:text-emerald-400" />
                  <span>Presupuesto Fijo & Proyección — {activeMonthLabel}</span>
                </h2>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                  Lista cronológica de entradas y salidas proyectadas para este periodo.
                </p>
              </div>
              <Badge variant="default">{projectedRows.length} partidas</Badge>
            </div>

            {/* Tabla de Movimientos */}
            <div className="overflow-x-auto max-h-[640px] overflow-y-auto">
              <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-100 dark:bg-slate-800/90 text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-4 py-3">Tipo</th>
                    <th className="px-4 py-3">Fecha</th>
                    <th className="px-4 py-3">Categoría</th>
                    <th className="px-4 py-3">Concepto</th>
                    <th className="px-4 py-3 text-right">Monto</th>
                    <th className="px-4 py-3">Entidad</th>
                    <th className="px-4 py-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                  {projectedRows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-slate-400 dark:text-slate-500">
                        No hay partidas proyectadas para este mes. Haz clic en "Agregar Partida".
                      </td>
                    </tr>
                  ) : (
                    projectedRows.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition group">
                        
                        {/* Tipo */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Badge variant={r.tipo === 'Ingreso' ? 'success' : r.categoria === 'Deuda' ? 'warning' : 'default'}>
                            {r.tipo}
                          </Badge>
                        </td>

                        {/* Fecha */}
                        <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          {r.fecha.slice(8, 10)}/{r.fecha.slice(5, 7)}/{r.fecha.slice(0, 4)}
                        </td>

                        {/* Categoría */}
                        <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          {r.categoria}
                        </td>

                        {/* Concepto */}
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-slate-900 dark:text-white">
                                {r.concepto}
                              </span>
                              {r.esModificado && (
                                <span className="text-[10px] bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-md font-bold" title="Monto modificado solo en este mes">
                                  Ajustado
                                </span>
                              )}
                              {r.esTemporal && (
                                <span className="text-[10px] bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-md font-bold" title="Gasto temporal por cuotas">
                                  Temporal
                                </span>
                              )}
                            </div>

                            {/* Detalle de ciclo de tarjeta de crédito */}
                            {r.esTarjetaCredito && r.fechaPagoTarjeta && (
                              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 text-[10px] font-bold text-indigo-700 dark:text-indigo-300">
                                <CreditCard size={11} className="shrink-0" />
                                <span>
                                  Facturación: Pago el {r.fechaPagoTarjeta.slice(8, 10)}/{r.fechaPagoTarjeta.slice(5, 7)} ({MESES_ES[parseInt(r.fechaPagoTarjeta.slice(5, 7), 10) - 1]})
                                </span>
                              </div>
                            )}

                            {/* Indicador de liquidación de tarjeta de crédito autocalculada */}
                            {r.esPagoLiquidacionTarjeta && r.tarjetaLiquidada && (
                              <button
                                type="button"
                                onClick={() => {
                                  const detail = getCardDueDetailsForMonth(r.tarjetaLiquidada!, activeMonthStr, items);
                                  setSelectedCardAudit(detail);
                                }}
                                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 text-[10px] font-bold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900 transition cursor-pointer"
                                title="Ver desglose de consumos del ciclo de tarjeta"
                              >
                                <Sparkles size={11} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                                <span>
                                  Auto-calculado: {r.detalleConsumosCiclo?.length || 0} consumos en ciclo (Ver desglose)
                                </span>
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Monto */}
                        <td className="px-4 py-3 text-right font-black text-slate-900 dark:text-white tabular-nums whitespace-nowrap">
                          {fmt.format(r.monto)}
                        </td>

                        {/* Entidad */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-block px-3 py-1 rounded-xl text-xs font-bold ${
                            r.entidad === 'Interbank'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                              : r.entidad === 'BBVA Bfree'
                              ? 'bg-sky-50 text-sky-800 border border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800'
                              : r.entidad === 'Interbank Amex'
                              ? 'bg-blue-50 text-blue-800 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800'
                              : r.entidad === 'Ripley'
                              ? 'bg-purple-50 text-purple-800 border border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800'
                              : 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                          }`}>
                            {r.entidad}
                          </span>
                        </td>

                        {/* Acciones */}
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                            
                            {/* Editar partida completa */}
                            <button
                              onClick={() => handleOpenEditModal(r)}
                              className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition"
                              title="Editar configuración de esta partida"
                            >
                              <Edit2 size={14} />
                            </button>

                            {/* Modificar monto en este mes */}
                            <button
                              onClick={() => handleOpenModifyAmount(r)}
                              className="p-1.5 text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition"
                              title="Cambiar monto solo para este mes"
                            >
                              <Sparkles size={14} />
                            </button>

                            {/* Si está modificado, botón para restaurar */}
                            {r.esModificado && (
                              <button
                                onClick={() => handleRestoreOriginal(r)}
                                className="p-1.5 text-amber-500 hover:text-amber-700 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition"
                                title="Restaurar al monto original"
                              >
                                <RotateCcw size={14} />
                              </button>
                            )}

                            {/* Suprimir en este mes */}
                            <button
                              onClick={() => handleSuppressInMonth(r)}
                              className="p-1.5 text-slate-400 hover:text-amber-700 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition"
                              title="Suprimir/anular solo en este mes"
                            >
                              <EyeOff size={14} />
                            </button>

                            {/* Eliminar regla */}
                            <button
                              onClick={() => handleDeleteItem(r)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                              title="Eliminar de todas las proyecciones"
                            >
                              <Trash2 size={14} />
                            </button>

                          </div>
                        </td>

                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Total Footer de la Tabla */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <div className="flex items-center gap-4">
                <span>Ingresos: <strong className="text-emerald-800 dark:text-emerald-400 font-black">{fmt.format(totalIngresos)}</strong></span>
                <span>Egresos: <strong className="text-rose-700 dark:text-rose-400 font-black">{fmt.format(totalEgresos)}</strong></span>
              </div>
              <div>
                <span>Balance Mensual: </span>
                <strong className={`font-black text-sm ${totalIngresos - totalEgresos >= 0 ? 'text-emerald-800 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {fmt.format(totalIngresos - totalEgresos)}
                </strong>
              </div>
            </div>

          </Card>
        </div>

        {/* ══════════════════════════════════════════════════════════════════════════
            COLUMNA DERECHA (5 cols): RESUMEN POR ENTIDAD & TARJETAS (ESTILO EXCEL)
        ══════════════════════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* 1. CUADRO INTERBANK (DÉBITO) */}
          <div className="bg-white dark:bg-[#11191D] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
            <div className="bg-[#0F2A1D] dark:bg-[#07130D] text-white px-4 py-2.5 flex items-center justify-between text-xs font-bold">
              <div className="flex items-center gap-2">
                <Building2 size={15} className="text-emerald-400" />
                <span>Interbank (Débito / Cuenta Corriente)</span>
              </div>
              <span className={`text-xs font-black ${entityBreakdown.saldoNetoInterbank >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                Neto: {fmt.format(entityBreakdown.saldoNetoInterbank)}
              </span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-56 overflow-y-auto">
              {entityBreakdown.interbankDebitTxs.map(tx => (
                <div key={tx.id} className="px-4 py-2 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 truncate pr-2">{tx.concepto}</span>
                  <span className="font-bold text-slate-900 dark:text-white tabular-nums shrink-0">{fmt.format(tx.monto)}</span>
                </div>
              ))}
            </div>

            <div className="px-4 py-2 bg-slate-100/90 dark:bg-slate-800/90 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
              <span>Total Débito Interbank</span>
              <span className="font-black text-rose-900 dark:text-rose-400">{fmt.format(entityBreakdown.totalInterbankDebit)}</span>
            </div>
          </div>

          {/* 2. TARJETAS DE CRÉDITO Y CICLOS DE FACTURACIÓN */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            
            {/* Interbank Amex */}
            <div className="bg-white dark:bg-[#11191D] rounded-2xl border border-blue-200 dark:border-blue-900/60 shadow-sm overflow-hidden flex flex-col justify-between transition-colors">
              <div className="bg-blue-900 dark:bg-blue-950 text-white px-3 py-2 text-xs font-bold flex items-center justify-between">
                <div>
                  <div className="text-white font-black">Interbank Amex</div>
                  <div className="text-[10px] text-blue-200/80 font-normal">Corte día 21 · Pago día 15</div>
                </div>
                <span className="text-[10px] bg-blue-800 text-blue-200 px-1.5 py-0.5 rounded font-bold">Corte 21</span>
              </div>
              <div className="p-3 divide-y divide-slate-100 dark:divide-slate-800 flex-1 max-h-40 overflow-y-auto">
                {entityBreakdown.amexTxs.length === 0 ? (
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 italic">Sin compras este mes</p>
                ) : (
                  entityBreakdown.amexTxs.map(tx => (
                    <div key={tx.id} className="py-1 flex justify-between items-center text-xs">
                      <div className="min-w-0 pr-1">
                        <p className="text-slate-700 dark:text-slate-300 font-semibold truncate">{tx.concepto}</p>
                        <p className="text-[10px] text-slate-400">Día {tx.fecha.slice(8, 10)} · {parseInt(tx.fecha.slice(8, 10), 10) < 21 ? 'Paga mes sgte' : 'Paga en 2 meses'}</p>
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white tabular-nums shrink-0">{fmt.format(tx.monto)}</span>
                    </div>
                  ))
                )}
              </div>
              <div className="p-2.5 bg-blue-50/90 dark:bg-blue-950/60 border-t border-blue-100 dark:border-blue-900/50 space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold text-blue-950 dark:text-blue-200">
                  <span className="text-[11px]">Consumo Mes:</span>
                  <span className="font-black">{fmt.format(entityBreakdown.totalAmex)}</span>
                </div>
                <div className="pt-1 border-t border-blue-200/60 dark:border-blue-800/60 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-blue-800 dark:text-blue-300 block">Liquidación en Débito</span>
                    <span className="font-black text-rose-600 dark:text-rose-400">{fmt.format(entityBreakdown.amexDueDetail.totalAPagar)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedCardAudit(entityBreakdown.amexDueDetail)}
                    className="px-2 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold shadow-xs transition"
                  >
                    Ver Ciclo ({entityBreakdown.amexDueDetail.consumos.length})
                  </button>
                </div>
              </div>
            </div>

            {/* BBVA Bfree */}
            <div className="bg-white dark:bg-[#11191D] rounded-2xl border border-sky-200 dark:border-sky-900/60 shadow-sm overflow-hidden flex flex-col justify-between transition-colors">
              <div className="bg-sky-900 dark:bg-sky-950 text-white px-3 py-2 text-xs font-bold flex items-center justify-between">
                <div>
                  <div className="text-white font-black">BBVA Bfree</div>
                  <div className="text-[10px] text-sky-200/80 font-normal">Corte día 11 · Pago día 05</div>
                </div>
                <span className="text-[10px] bg-sky-800 text-sky-200 px-1.5 py-0.5 rounded font-bold">Corte 11</span>
              </div>
              <div className="p-3 divide-y divide-slate-100 dark:divide-slate-800 flex-1 max-h-40 overflow-y-auto">
                {entityBreakdown.bbvaTxs.length === 0 ? (
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 italic">Sin compras este mes</p>
                ) : (
                  entityBreakdown.bbvaTxs.map(tx => (
                    <div key={tx.id} className="py-1 flex justify-between items-center text-xs">
                      <div className="min-w-0 pr-1">
                        <p className="text-slate-700 dark:text-slate-300 font-semibold truncate">{tx.concepto}</p>
                        <p className="text-[10px] text-slate-400">Día {tx.fecha.slice(8, 10)} · {parseInt(tx.fecha.slice(8, 10), 10) < 11 ? 'Paga mes sgte' : 'Paga en 2 meses'}</p>
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white tabular-nums shrink-0">{fmt.format(tx.monto)}</span>
                    </div>
                  ))
                )}
              </div>
              <div className="p-2.5 bg-sky-50/90 dark:bg-sky-950/60 border-t border-sky-100 dark:border-sky-900/50 space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold text-sky-950 dark:text-sky-200">
                  <span className="text-[11px]">Consumo Mes:</span>
                  <span className="font-black">{fmt.format(entityBreakdown.totalBbva)}</span>
                </div>
                <div className="pt-1 border-t border-sky-200/60 dark:border-sky-800/60 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-sky-800 dark:text-sky-300 block">Liquidación en Débito</span>
                    <span className="font-black text-rose-600 dark:text-rose-400">{fmt.format(entityBreakdown.bbvaDueDetail.totalAPagar)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedCardAudit(entityBreakdown.bbvaDueDetail)}
                    className="px-2 py-1 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-[10px] font-bold shadow-xs transition"
                  >
                    Ver Ciclo ({entityBreakdown.bbvaDueDetail.consumos.length})
                  </button>
                </div>
              </div>
            </div>

            {/* Ripley */}
            <div className="bg-white dark:bg-[#11191D] rounded-2xl border border-purple-200 dark:border-purple-900/60 shadow-sm overflow-hidden flex flex-col justify-between transition-colors">
              <div className="bg-purple-900 dark:bg-purple-950 text-white px-3 py-2 text-xs font-bold flex items-center justify-between">
                <div>
                  <div className="text-white font-black">Ripley</div>
                  <div className="text-[10px] text-purple-200/80 font-normal">Corte día 04 · Pago día 01</div>
                </div>
                <span className="text-[10px] bg-purple-800 text-purple-200 px-1.5 py-0.5 rounded font-bold">Corte 4</span>
              </div>
              <div className="p-3 divide-y divide-slate-100 dark:divide-slate-800 flex-1 max-h-40 overflow-y-auto">
                {entityBreakdown.ripleyTxs.length === 0 ? (
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 italic">Sin compras este mes</p>
                ) : (
                  entityBreakdown.ripleyTxs.map(tx => (
                    <div key={tx.id} className="py-1 flex justify-between items-center text-xs">
                      <div className="min-w-0 pr-1">
                        <p className="text-slate-700 dark:text-slate-300 font-semibold truncate">{tx.concepto}</p>
                        <p className="text-[10px] text-slate-400">Día {tx.fecha.slice(8, 10)} · {parseInt(tx.fecha.slice(8, 10), 10) < 4 ? 'Paga mes sgte' : 'Paga en 2 meses'}</p>
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white tabular-nums shrink-0">{fmt.format(tx.monto)}</span>
                    </div>
                  ))
                )}
              </div>
              <div className="p-2.5 bg-purple-50/90 dark:bg-purple-950/60 border-t border-purple-100 dark:border-purple-900/50 space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold text-purple-950 dark:text-purple-200">
                  <span className="text-[11px]">Consumo Mes:</span>
                  <span className="font-black">{fmt.format(entityBreakdown.totalRipley)}</span>
                </div>
                <div className="pt-1 border-t border-purple-200/60 dark:border-purple-800/60 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-purple-800 dark:text-purple-300 block">Liquidación en Débito</span>
                    <span className="font-black text-rose-600 dark:text-rose-400">{fmt.format(entityBreakdown.ripleyDueDetail.totalAPagar)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedCardAudit(entityBreakdown.ripleyDueDetail)}
                    className="px-2 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-bold shadow-xs transition"
                  >
                    Ver Ciclo ({entityBreakdown.ripleyDueDetail.consumos.length})
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* 3. ESCENARIO DE PROBABILIDAD DE SUELDO & SALDO FINAL DISPONIBLE */}
          <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/20 dark:to-slate-900 rounded-2xl border border-amber-200 dark:border-amber-900/50 p-5 shadow-sm space-y-3 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300">
                  Escenario de Probabilidad / Sueldo
                </p>
                <p className="text-xs text-amber-700/80 dark:text-amber-400/70 mt-0.5">
                  Ajusta la proyección de sueldo o ingresos adicionales para simular el saldo final.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-amber-950 dark:text-amber-200">Sueldo Estimado:</span>
              <div className="flex items-center bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700/60 rounded-xl px-3 py-1.5 shadow-inner">
                <span className="text-xs font-bold text-slate-400 mr-1.5">S/</span>
                <input
                  type="number"
                  step="0.01"
                  value={entityBreakdown.sueldoProbable}
                  onChange={(e) => setProbabilidadSueldo(activeMonthStr, parseFloat(e.target.value) || 0)}
                  className="w-28 text-sm font-black text-amber-950 dark:text-amber-200 bg-transparent focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-amber-200/80 dark:border-amber-900/40 flex items-center justify-between">
              <span className="text-xs font-black uppercase text-amber-950 dark:text-amber-200">Saldo Final Proyectado:</span>
              <span className="text-xl font-black text-amber-950 dark:text-amber-300 tabular-nums">
                {fmt.format(entityBreakdown.saldoFinalProyectado)}
              </span>
            </div>
          </div>

        </div>

      </div>

      {/* ── MODAL AGREGAR / EDITAR PARTIDA ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setIsModalOpen(false)}>
          <div className="bg-white dark:bg-[#11191D] text-slate-900 dark:text-slate-100 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150" onClick={e => e.stopPropagation()}>
            
            <div className="px-6 py-4 bg-[#0F2A1D] dark:bg-[#07130D] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <PlusCircle className="text-emerald-400" size={20} />
                <h3 className="text-base font-bold text-white">
                  {editingItem ? 'Editar Partida de Proyección' : 'Nueva Partida Proyectada'}
                </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-emerald-300 hover:text-white p-1 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="p-6 space-y-4 text-xs">
              
              {/* Tipo */}
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setFormTipo('Ingreso')}
                  className={`flex-1 py-2 rounded-lg font-bold transition ${formTipo === 'Ingreso' ? 'bg-emerald-700 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                >
                  📈 Ingreso
                </button>
                <button
                  type="button"
                  onClick={() => setFormTipo('Egreso')}
                  className={`flex-1 py-2 rounded-lg font-bold transition ${formTipo === 'Egreso' ? 'bg-slate-800 dark:bg-slate-700 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                >
                  📉 Egreso
                </button>
              </div>

              {/* Concepto */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Concepto / Descripción</label>
                <input
                  type="text"
                  placeholder="Ej. Spotify, Luz, Sueldo, Préstamo..."
                  value={formConcepto}
                  onChange={e => setFormConcepto(e.target.value)}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Monto y Día */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Monto (S/)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formMonto || ''}
                    onChange={e => setFormMonto(parseFloat(e.target.value) || 0)}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Día del Mes (1-31)</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={formDia}
                    onChange={e => setFormDia(parseInt(e.target.value, 10) || 1)}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Categoría y Entidad */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Categoría</label>
                  <select
                    value={formCategoria}
                    onChange={e => setFormCategoria(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    {CATEGORIAS_DISPONIBLES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Entidad / Cuenta</label>
                  <select
                    value={formEntidad}
                    onChange={e => setFormEntidad(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    {ENTIDADES_DISPONIBLES.map(e => (
                      <option key={e} value={e}>{e}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Frecuencia / Recurrencia */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Frecuencia / Tipo de Asignación</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormRecurrencia('fijo')}
                    className={`p-2.5 rounded-xl border text-center font-bold transition ${
                      formRecurrencia === 'fijo'
                        ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    🔄 Fijo Mensual
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormRecurrencia('temporal')}
                    className={`p-2.5 rounded-xl border text-center font-bold transition ${
                      formRecurrencia === 'temporal'
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-300 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    ⏳ Por Cuotas
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormRecurrencia('unico')}
                    className={`p-2.5 rounded-xl border text-center font-bold transition ${
                      formRecurrencia === 'unico'
                        ? 'border-slate-700 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white ring-2 ring-slate-400/20'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    📌 Solo este mes
                  </button>
                </div>
              </div>

              {/* Duración si es temporal */}
              {formRecurrencia === 'temporal' && (
                <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 rounded-2xl p-3.5 animate-in fade-in">
                  <label className="block font-bold text-indigo-900 dark:text-indigo-300 mb-1">
                    Duración en Meses (Cuotas)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={formMesesDuracion}
                    onChange={e => setFormMesesDuracion(parseInt(e.target.value, 10) || 1)}
                    className="w-full bg-white dark:bg-slate-800 border border-indigo-300 dark:border-indigo-700 rounded-xl px-3 py-1.5 font-bold text-indigo-950 dark:text-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-[11px] text-indigo-700/80 dark:text-indigo-300/80 mt-1">
                    Se colocará automáticamente a partir de {activeMonthLabel} durante {formMesesDuracion} meses.
                  </p>
                </div>
              )}

              {/* Botones del Modal */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-semibold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-[#0F2A1D] dark:bg-emerald-700 hover:bg-black dark:hover:bg-emerald-600 text-white font-bold px-5 py-2 rounded-xl shadow-md transition"
                >
                  {editingItem ? 'Guardar Cambios' : 'Crear Partida'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ── MODAL MODIFICAR MONTO SOLO EN ESTE MES ── */}
      {modifyModalData && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setModifyModalData(null)}>
          <div className="bg-white dark:bg-[#11191D] text-slate-900 dark:text-slate-100 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 bg-[#0F2A1D] dark:bg-[#07130D] text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Ajustar Monto para {activeMonthLabel}</h3>
              <button onClick={() => setModifyModalData(null)} className="text-emerald-300 hover:text-white">
                <X size={16} />
              </button>
            </div>
            <div className="p-5 space-y-3 text-xs">
              <p className="text-slate-600 dark:text-slate-400">
                Concepto: <strong className="text-slate-900 dark:text-white">{modifyModalData.concepto}</strong>
              </p>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nuevo Monto solo para este mes (S/)</label>
                <input
                  type="number"
                  step="0.01"
                  value={tempAmount}
                  onChange={e => setTempAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                Este cambio no afectará los demás meses de la proyección.
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setModifyModalData(null)} className="px-3 py-1.5 text-slate-500 dark:text-slate-400">
                  Cancelar
                </button>
                <button
                  onClick={handleSaveModifiedAmount}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-4 py-1.5 rounded-xl"
                >
                  Guardar Ajuste
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL AUDITORÍA DE LIQUIDACIÓN DE TARJETA ── */}
      {selectedCardAudit && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedCardAudit(null)}>
          <div className="bg-white dark:bg-[#11191D] text-slate-900 dark:text-slate-100 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 bg-[#0F2A1D] dark:bg-[#07130D] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CreditCard size={20} className="text-emerald-400" />
                <div>
                  <h3 className="font-bold text-sm">Liquidación de Ciclo: {selectedCardAudit.entity}</h3>
                  <p className="text-[11px] text-emerald-300/80">
                    Ciclo: {selectedCardAudit.periodoFacturado} · Pago en Débito: {selectedCardAudit.fechaPago.slice(8, 10)}/{selectedCardAudit.fechaPago.slice(5, 7)}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedCardAudit(null)} className="text-emerald-300 hover:text-white p-1">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60">
                <div>
                  <p className="text-emerald-900 dark:text-emerald-300 font-bold uppercase tracking-wider text-[10px]">
                    Total a Desembolsar en Débito (Interbank)
                  </p>
                  <p className="text-2xl font-black text-emerald-950 dark:text-emerald-100 mt-0.5">
                    {fmt.format(selectedCardAudit.totalAPagar)}
                  </p>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300">
                  {selectedCardAudit.consumos.length} Movimientos
                </span>
              </div>

              <div className="space-y-2">
                <p className="font-bold text-slate-700 dark:text-slate-300 text-xs flex items-center gap-1.5">
                  <FileSpreadsheet size={14} className="text-slate-500" />
                  <span>Consumos Incluidos en este Ciclo:</span>
                </p>

                <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl">
                  {selectedCardAudit.consumos.length === 0 ? (
                    <p className="p-4 text-slate-400 dark:text-slate-500 italic text-center">
                      No se registraron compras ni consumos en el ciclo de este mes.
                    </p>
                  ) : (
                    selectedCardAudit.consumos.map((c, i) => (
                      <div key={c.id || i} className="p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-white">{c.concepto}</span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              c.origen === 'Histórico Maestro' 
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' 
                                : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                            }`}>
                              {c.origen}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Fecha consumo: {c.fecha.slice(8, 10)}/{c.fecha.slice(5, 7)}/{c.fecha.slice(0, 4)} · Categoría: {c.categoria}
                          </p>
                        </div>
                        <span className="font-black text-slate-900 dark:text-white tabular-nums text-sm">
                          {fmt.format(c.monto)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setSelectedCardAudit(null)}
                  className="bg-[#0F2A1D] dark:bg-emerald-700 hover:bg-black dark:hover:bg-emerald-600 text-white font-bold px-5 py-2 rounded-xl transition"
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
