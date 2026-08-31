import React, { useEffect, useState, useMemo } from 'react';
import { useFinanceStore, MESES, ENTIDADES, CATEGORIAS, getMonthNameFromDate } from '../store/financeStore';
import { usePendingPaymentsStore, type PendingPaymentItem } from '../store/pendingPaymentsStore';
import { useAppStore } from '../store';
import { LINE_OVERRIDES, ACCOUNT_LABELS, type Transaction } from '../utils/masterData';
import { Card } from '../components/ui/Card';
import { Metric } from '../components/ui/Metric';
import { Badge } from '../components/ui/Badge';
import {
  ChevronDown,
  Download,
  Plus,
  Minus,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Wallet,
  Building2,
  PieChart as PieIcon,
  CheckCircle2,
  Clock,
  Trash2,
  RotateCcw,
  Sparkles,
  X,
  Edit3,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

const MONTH_ORDER = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Setiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const sortedMeses = [...MESES].sort((a, b) => MONTH_ORDER.indexOf(a) - MONTH_ORDER.indexOf(b));

const CHART_COLORS = ['#0F2A1D', '#047857', '#0284C7', '#6366F1', '#D97706', '#E11D48', '#0D9488'];

const getDefaultDateForMonth = (monthName: string) => {
  const monthMap: Record<string, string> = {
    Enero: '01', Febrero: '02', Marzo: '03', Abril: '04', Mayo: '05', Junio: '06',
    Julio: '07', Agosto: '08', Setiembre: '09', Octubre: '10', Noviembre: '11', Diciembre: '12'
  };
  const m = monthMap[monthName] || '10';
  const now = new Date();
  const year = now.getFullYear();
  const curM = String(now.getMonth() + 1).padStart(2, '0');
  if (curM === m) {
    return now.toISOString().slice(0, 10);
  }
  return `${year}-${m}-01`;
};

export const Dashboard: React.FC = () => {
  const {
    selectedMonth,
    selectedEntity,
    setMonth,
    setEntity,
    getFilteredTransactions,
    deleteTransaction,
    addTransaction,
    confirmTransaction,
  } = useFinanceStore();
  const filtered = getFilteredTransactions();

  const isLineaTarjeta = (t: any) => typeof t.Concepto === 'string' && /linea\s*tarjeta/i.test(t.Concepto);

  const totalIngresos = filtered.filter(t => t.Tipo === 'Ingreso').reduce((acc, t) => acc + t.Monto, 0);
  const totalEgresos = filtered.filter(t => t.Tipo === 'Egreso' && t.Categoria !== 'Deuda').reduce((acc, t) => acc + t.Monto, 0);
  const totalDeudas = filtered.filter(t => t.Categoria === 'Deuda').reduce((acc, t) => acc + t.Monto, 0);

  const entityList = ENTIDADES && ENTIDADES.length ? ENTIDADES : Array.from(new Set(filtered.map(t => t.Entidad).filter(Boolean)));
  const entityBalances: Record<string, number> = {};
  entityList.forEach(ent => {
    const ingresosEnt = filtered.filter(t => t.Entidad === ent && t.Tipo === 'Ingreso' && !isLineaTarjeta(t)).reduce((a, t) => a + t.Monto, 0);
    const egresosEnt = filtered.filter(t => t.Entidad === ent && t.Tipo === 'Egreso' && t.Categoria !== 'Deuda' && !isLineaTarjeta(t)).reduce((a, t) => a + t.Monto, 0);
    const deudasEnt = filtered.filter(t => t.Entidad === ent && t.Categoria === 'Deuda').reduce((a, t) => a + t.Monto, 0);
    entityBalances[ent] = ingresosEnt - egresosEnt - deudasEnt;
  });

  const entityLineaTotals: Record<string, number> = {};
  entityList.forEach(ent => {
    const lineaSum = filtered
      .filter(t => t.Entidad === ent && typeof t.Concepto === 'string' && /linea\s*tarjeta/i.test(t.Concepto))
      .reduce((a, t) => a + t.Monto, 0);
    entityLineaTotals[ent] = lineaSum;
  });

  const entityIngresos: Record<string, number> = {};
  const entityEgresos: Record<string, number> = {};
  entityList.forEach(ent => {
    const ingresos = filtered.filter(t => t.Entidad === ent && t.Tipo === 'Ingreso').reduce((a, t) => a + t.Monto, 0);
    const egresos = filtered.filter(t => t.Entidad === ent && t.Tipo === 'Egreso').reduce((a, t) => a + t.Monto, 0);
    entityIngresos[ent] = ingresos;
    entityEgresos[ent] = egresos;
  });

  const interbankKey = entityList.find(e => /^Interbank$/i.test(e)) || 'Interbank';
  const interbankBalance = entityBalances[interbankKey] ?? 0;

  const categoryMap: Record<string, number> = {};
  filtered.filter(t => t.Tipo === 'Egreso').forEach(t => {
    categoryMap[t.Categoria] = (categoryMap[t.Categoria] || 0) + t.Monto;
  });
  
  const chartData = Object.keys(categoryMap)
    .map(key => ({ name: key, value: Math.round(categoryMap[key] * 100) / 100 }))
    .sort((a, b) => b.value - a.value);

  const formatterPEN = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' });

  const [localLineOverrides] = useState<Record<string, number> | null>(() => {
    try {
      const lo = localStorage.getItem('finper_line_overrides');
      return lo ? JSON.parse(lo) : null;
    } catch {
      return null;
    }
  });

  const [localAccountLabels] = useState<Record<string, string> | null>(() => {
    try {
      const al = localStorage.getItem('finper_account_labels');
      return al ? JSON.parse(al) : null;
    } catch {
      return null;
    }
  });

  const { agregarNotificacion } = useAppStore();

  const activeLineOverrides = localLineOverrides ?? LINE_OVERRIDES;
  const activeAccountLabels = localAccountLabels ?? ACCOUNT_LABELS;

  Object.keys(entityLineaTotals).forEach(ent => {
    if (activeLineOverrides.hasOwnProperty(ent)) entityLineaTotals[ent] = activeLineOverrides[ent];
  });

  const handleExport = () => {
    const headers = ['Tipo', 'Fecha', 'Categoria', 'Concepto', 'Monto', 'Entidad', 'Mes'];
    const rows = filtered.map(t => [t.Tipo, t.Fecha, t.Categoria, t.Concepto, t.Monto, t.Entidad, t.Mes].join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FinPer_${selectedMonth}_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const {
    items: allPendingItems,
    getItemsByMonth,
    getTotalsByMonth,
    executePendingPayment,
    deletePendingItem,
    addPendingItem,
    updatePendingItem,
  } = usePendingPaymentsStore();

  const monthPendingItems = useMemo(() => {
    return getItemsByMonth(selectedMonth);
  }, [allPendingItems, selectedMonth, getItemsByMonth]);

  const pendingTotals = useMemo(() => {
    return getTotalsByMonth(selectedMonth);
  }, [allPendingItems, selectedMonth, getTotalsByMonth]);

  // Modal para agregar o editar pago pendiente
  const [isPendingModalOpen, setIsPendingModalOpen] = useState(false);
  const [editingPending, setEditingPending] = useState<PendingPaymentItem | null>(null);
  const [pendFormTipo, setPendFormTipo] = useState<'Ingreso' | 'Egreso'>('Egreso');
  const [pendFormConcepto, setPendFormConcepto] = useState('');
  const [pendFormMonto, setPendFormMonto] = useState<number>(0);
  const [pendFormCategoria, setPendFormCategoria] = useState('Servicio');
  const [pendFormEntidad, setPendFormEntidad] = useState('Interbank');
  const [pendFormFecha, setPendFormFecha] = useState(new Date().toISOString().slice(0, 10));

  // Modal para agregar nueva fila / proyección en la tabla de transacciones
  const [isNewRowModalOpen, setIsNewRowModalOpen] = useState(false);
  const [newRowTipo, setNewRowTipo] = useState<'Ingreso' | 'Egreso'>('Egreso');
  const [newRowConcepto, setNewRowConcepto] = useState('');
  const [newRowMonto, setNewRowMonto] = useState<number>(0);
  const [newRowCategoria, setNewRowCategoria] = useState('Gasto');
  const [newRowEntidad, setNewRowEntidad] = useState('Interbank');
  const [newRowFecha, setNewRowFecha] = useState(() => getDefaultDateForMonth(selectedMonth));
  const [newRowEsProyeccion, setNewRowEsProyeccion] = useState(true);

  // Actualizar fecha por defecto cuando cambia el mes seleccionado
  useEffect(() => {
    setNewRowFecha(getDefaultDateForMonth(selectedMonth));
  }, [selectedMonth]);

  const handleOpenNewRowModal = () => {
    setNewRowTipo('Egreso');
    setNewRowConcepto('');
    setNewRowMonto(0);
    setNewRowCategoria('Gasto');
    setNewRowEntidad(selectedEntity !== 'Todas' ? selectedEntity : 'Interbank');
    setNewRowFecha(getDefaultDateForMonth(selectedMonth));
    setNewRowEsProyeccion(true);
    setIsNewRowModalOpen(true);
  };

  const handleSaveNewRowModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRowConcepto.trim()) return;

    const mesName = selectedMonth === 'Todos' ? getMonthNameFromDate(newRowFecha) : selectedMonth;
    addTransaction({
      Tipo: newRowTipo,
      Fecha: newRowFecha,
      Concepto: newRowConcepto.trim(),
      Categoria: newRowCategoria,
      Entidad: newRowEntidad,
      Monto: Number(newRowMonto),
      Mes: mesName,
      estado: newRowEsProyeccion ? 'provisional' : 'confirmado',
    });

    agregarNotificacion(
      newRowEsProyeccion
        ? `✨ Fila proyectada "${newRowConcepto}" agregada en amarillo (pendiente de confirmación).`
        : `✅ Transacción "${newRowConcepto}" registrada correctamente.`,
      'success'
    );

    setIsNewRowModalOpen(false);
  };

  const handleDeleteTransaction = (t: Transaction) => {
    if (confirm(`¿Eliminar definitivamente "${t.Concepto}" (${formatterPEN.format(t.Monto)})? Esta acción la borrará permanentemente de la base de datos de Supabase.`)) {
      deleteTransaction(t.id);
      agregarNotificacion(`🗑️ Transacción "${t.Concepto}" eliminada de la base de datos.`, 'info');
    }
  };

  const handleApproveTransaction = (t: Transaction) => {
    confirmTransaction(t.id);
    agregarNotificacion(`✅ Movimiento "${t.Concepto}" aprobado y consolidado.`, 'success');
  };

  const handleSendToPending = (t: Transaction) => {
    addPendingItem({
      tipo: t.Tipo,
      concepto: t.Concepto,
      monto: t.Monto,
      categoria: t.Categoria,
      entidad: t.Entidad,
      fecha: t.Fecha,
      origen: 'Manual',
      mes: t.Mes,
      mesStr: t.Fecha.slice(0, 7),
    });
    deleteTransaction(t.id);
    agregarNotificacion(`⏳ Movimiento "${t.Concepto}" devuelto a la bandeja de Pagos Pendientes.`, 'info');
  };

  const handleOpenNewPendingModal = () => {
    setEditingPending(null);
    setPendFormTipo('Egreso');
    setPendFormConcepto('');
    setPendFormMonto(0);
    setPendFormCategoria('Servicio');
    setPendFormEntidad('Interbank');
    setPendFormFecha(new Date().toISOString().slice(0, 10));
    setIsPendingModalOpen(true);
  };

  const handleOpenEditPending = (p: PendingPaymentItem) => {
    setEditingPending(p);
    setPendFormTipo(p.tipo);
    setPendFormConcepto(p.concepto);
    setPendFormMonto(p.monto);
    setPendFormCategoria(p.categoria);
    setPendFormEntidad(p.entidad);
    setPendFormFecha(p.fecha);
    setIsPendingModalOpen(true);
  };

  const handleSavePendingModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendFormConcepto.trim()) return;

    if (editingPending) {
      updatePendingItem(editingPending.id, {
        tipo: pendFormTipo,
        concepto: pendFormConcepto.trim(),
        monto: Number(pendFormMonto),
        categoria: pendFormCategoria,
        entidad: pendFormEntidad,
        fecha: pendFormFecha,
      });
      agregarNotificacion(`Pago pendiente "${pendFormConcepto}" actualizado.`, 'success');
    } else {
      addPendingItem({
        tipo: pendFormTipo,
        concepto: pendFormConcepto.trim(),
        monto: Number(pendFormMonto),
        categoria: pendFormCategoria,
        entidad: pendFormEntidad,
        fecha: pendFormFecha,
        origen: 'Manual',
        mes: selectedMonth === 'Todos' ? 'Octubre' : selectedMonth,
        mesStr: pendFormFecha.slice(0, 7),
      });
      agregarNotificacion(`Pago pendiente "${pendFormConcepto}" registrado.`, 'success');
    }

    setIsPendingModalOpen(false);
  };

  const handleExecutePending = (p: PendingPaymentItem) => {
    const res = executePendingPayment(p.id);
    if (res.success) {
      agregarNotificacion(`✅ "${p.concepto}" (${formatterPEN.format(p.monto)}) registrado en la lista maestra y removido de pendientes.`, 'success');
    }
  };

  const handleDeletePending = (p: PendingPaymentItem) => {
    if (confirm(`¿Eliminar el pago pendiente "${p.concepto}"?`)) {
      deletePendingItem(p.id);
      agregarNotificacion(`🗑️ Pago pendiente "${p.concepto}" eliminado.`, 'info');
    }
  };

  return (
    <div className="space-y-8">
      
      {/* ── HEADER EJECUTIVO ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-[#11191D] rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              Resumen Financiero Ejecutivo
            </h1>
            <Badge variant="primary">Periodo Activo</Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Balance general, liquidez disponible en cuentas y métricas operativas.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Selector de Mes */}
          <div className="relative">
            <select 
              value={selectedMonth}
              onChange={(e) => setMonth(e.target.value)}
              className="appearance-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold py-2.5 pl-3.5 pr-8 rounded-xl shadow-inner focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="Todos">📅 Todos los meses</option>
              {sortedMeses.map(m => (
                <option key={m} value={m}>📅 {m}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
          </div>

          {/* Selector de Entidad */}
          <div className="relative">
            <select 
              value={selectedEntity}
              onChange={(e) => setEntity(e.target.value)}
              className="appearance-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold py-2.5 pl-3.5 pr-8 rounded-xl shadow-inner focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="Todas">🏦 Todas las entidades</option>
              {ENTIDADES.map(e => (
                <option key={e} value={e}>🏦 {e}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
          </div>

          {/* Export Button */}
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 bg-slate-900 dark:bg-emerald-700 hover:bg-black dark:hover:bg-emerald-600 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl shadow-sm transition"
            title="Exportar datos a CSV"
          >
            <Download size={14} />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* ── KPI METRICS GRID ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* 1. Ingresos Totales */}
        <Card className="bg-gradient-to-br from-white to-emerald-50/40 dark:from-[#11191D] dark:to-emerald-950/20 border-emerald-100 dark:border-slate-800">
          <Metric 
            label="Ingresos Totales" 
            value={formatterPEN.format(totalIngresos)} 
            subValue="Entradas netas del periodo"
            icon={<TrendingUp className="text-emerald-700 dark:text-emerald-400" size={20} />}
            color="text-emerald-950 dark:text-emerald-300"
          />
        </Card>

        {/* 2. Egresos Operativos */}
        <Card className="bg-gradient-to-br from-white to-slate-50 dark:from-[#11191D] dark:to-slate-800/30 border-slate-200 dark:border-slate-800">
          <Metric 
            label="Egresos Operativos" 
            value={formatterPEN.format(totalEgresos)} 
            subValue="Consumos y servicios corrientes"
            icon={<TrendingDown className="text-slate-600 dark:text-slate-400" size={20} />}
            color="text-slate-900 dark:text-slate-100"
          />
        </Card>

        {/* 3. Obligaciones y Deudas */}
        <Card className="bg-gradient-to-br from-white to-amber-50/40 dark:from-[#11191D] dark:to-amber-950/20 border-amber-200/70 dark:border-slate-800">
          <Metric 
            label="Obligaciones & Deudas" 
            value={formatterPEN.format(totalDeudas)} 
            subValue="Cuotas y pasivos programados"
            icon={<CreditCard className="text-amber-700 dark:text-amber-400" size={20} />}
            color="text-amber-950 dark:text-amber-300"
          />
        </Card>

        {/* 4. Saldo Líquido Disponible */}
        <Card className="bg-gradient-to-br from-emerald-900 to-[#0F2A1D] text-white border-emerald-950 shadow-md">
          <div className="flex flex-col justify-between h-full">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">
                Saldo Líquido (Interbank)
              </span>
              <div className="p-2 rounded-xl bg-white/10 text-emerald-200">
                <Wallet size={20} />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {formatterPEN.format(interbankBalance)}
              </div>
              <p className="text-xs font-medium text-emerald-300/80 mt-1.5">
                Disponibilidad real en cuenta digital
              </p>
            </div>
          </div>
        </Card>

      </div>

      {/* ── POSICIÓN POR ENTIDAD BANCARIA ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
              <Building2 size={18} className="text-emerald-700 dark:text-emerald-400" />
              <span>Posición por Cuenta Bancaria y Tarjeta</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Saldos disponibles, flujo de ingresos/egresos y límites de crédito asignados.
            </p>
          </div>
        </div>

        {(() => {
          const CARD_ORDER = ['Interbank', 'BCP', 'BBVA Bfree', 'Interbank Amex', 'Ripley'];

          return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
              {CARD_ORDER.map(ent => {
                const ingresos = entityIngresos[ent] || 0;
                const egresos = entityEgresos[ent] || 0;

                // Interbank: Saldo líquido
                if (/^Interbank$/i.test(ent)) {
                  return (
                    <div key={ent} className="bg-white dark:bg-[#11191D] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:shadow-md transition flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="font-bold text-sm text-slate-900 dark:text-white truncate">{ent}</span>
                          <span className="text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full">Cuenta</span>
                        </div>
                        {activeAccountLabels[ent] && (
                          <p className="text-xs text-slate-400 font-medium truncate">{activeAccountLabels[ent]}</p>
                        )}
                        <p className="text-[11px] uppercase font-bold text-slate-400 dark:text-slate-500 mt-2">Saldo Líquido</p>
                        <p className={`text-xl font-black mt-0.5 tracking-tight ${interbankBalance >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          {formatterPEN.format(interbankBalance)}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1 text-xs">
                        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1"><Plus className="text-emerald-600 dark:text-emerald-400" size={12}/> Ingresos:</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-200">{formatterPEN.format(ingresos)}</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1"><Minus className="text-rose-500 dark:text-rose-400" size={12}/> Egresos:</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-200">{formatterPEN.format(egresos)}</span>
                        </div>
                      </div>
                    </div>
                  );
                }

                // Tarjetas de crédito
                const disponible = ingresos - egresos;
                const colorClass = disponible >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-200';
                const totalLine = entityLineaTotals[ent] || 0;

                return (
                  <div key={ent} className="bg-white dark:bg-[#11191D] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:shadow-md transition flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-bold text-sm text-slate-900 dark:text-white truncate">{ent}</span>
                        <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full">
                          {totalLine > 0 ? 'Tarjeta' : 'Cuenta'}
                        </span>
                      </div>
                      {activeAccountLabels[ent] && (
                        <p className="text-xs text-slate-400 font-medium truncate">{activeAccountLabels[ent]}</p>
                      )}
                      <p className="text-[11px] uppercase font-bold text-slate-400 dark:text-slate-500 mt-2">Neto del Mes</p>
                      <p className={`text-xl font-black mt-0.5 tracking-tight ${colorClass}`}>
                        {formatterPEN.format(disponible)}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1 text-xs">
                      <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1"><Plus className="text-emerald-600 dark:text-emerald-400" size={12}/> Cargos:</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-200">{formatterPEN.format(ingresos)}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1"><Minus className="text-rose-500 dark:text-rose-400" size={12}/> Abonos:</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-200">{formatterPEN.format(egresos)}</span>
                      </div>
                      {totalLine > 0 && (
                        <div className="flex items-center justify-between pt-1 border-t border-slate-100/60 dark:border-slate-800 font-semibold text-blue-900 dark:text-blue-300 text-[11px]">
                          <span>Línea:</span>
                          <span>{formatterPEN.format(totalLine)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* ── BANDEJA DE PAGOS & MOVIMIENTOS PENDIENTES ── */}
      <div className="bg-white dark:bg-[#11191D] rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <Clock size={20} className="text-amber-500" />
                <span>Pagos & Movimientos Pendientes</span>
              </h2>
              <Badge variant={pendingTotals.countPendientes > 0 ? 'warning' : 'success'}>
                {pendingTotals.countPendientes} pendientes
              </Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Partidas sincronizadas desde Proyecciones o registradas manualmente pendientes de ejecutarse y cargarse a la lista maestra.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleOpenNewPendingModal}
              className="flex items-center gap-1.5 bg-[#0F2A1D] dark:bg-emerald-700 hover:bg-black dark:hover:bg-emerald-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm hover:shadow-md transition"
            >
              <Plus size={15} />
              <span>Ingresar nuevo pago pendiente</span>
            </button>
          </div>
        </div>

        {/* Mini KPI Cards de Pendientes */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/50">
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">Total por Pagar (Egresos)</p>
            <p className="text-xl font-black text-rose-600 dark:text-rose-400 mt-0.5 tabular-nums">{formatterPEN.format(pendingTotals.totalPendienteEgresos)}</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/50">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">Total por Cobrar (Ingresos)</p>
            <p className="text-xl font-black text-emerald-700 dark:text-emerald-300 mt-0.5 tabular-nums">{formatterPEN.format(pendingTotals.totalPendienteIngresos)}</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Pendientes por Ejecutar</p>
            <p className="text-xl font-black text-slate-800 dark:text-slate-100 mt-0.5 tabular-nums">{pendingTotals.countPendientes} partidas</p>
          </div>
        </div>

        {/* Tabla de Pendientes */}
        <div className="overflow-x-auto max-h-72 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider sticky top-0 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-2.5">Tipo</th>
                <th className="px-4 py-2.5">Fecha Prog.</th>
                <th className="px-4 py-2.5">Concepto</th>
                <th className="px-4 py-2.5">Categoría</th>
                <th className="px-4 py-2.5">Entidad</th>
                <th className="px-4 py-2.5 text-right">Monto</th>
                <th className="px-4 py-2.5 text-center">Estado</th>
                <th className="px-4 py-2.5 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {monthPendingItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-slate-400 dark:text-slate-500">
                    No hay pagos pendientes para este periodo. Puedes enviar las partidas desde la pestaña <strong>Proyecciones & Cashflow</strong> con el botón <em>"Enviar a Pagos Pendientes"</em> o crear uno manualmente con el botón superior.
                  </td>
                </tr>
              ) : (
                monthPendingItems.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                    <td className="px-4 py-2">
                      <Badge variant={p.tipo === 'Ingreso' ? 'success' : 'default'}>
                        {p.tipo}
                      </Badge>
                    </td>
                    <td className="px-4 py-2 font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">{p.fecha}</td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-slate-900 dark:text-white">{p.concepto}</span>
                        {p.origen === 'Proyección' && (
                          <span className="text-[10px] bg-indigo-50 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 px-1.5 py-0.5 rounded font-bold">Proyección</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2 italic text-slate-500 dark:text-slate-400">{p.categoria}</td>
                    <td className="px-4 py-2 font-semibold text-slate-700 dark:text-slate-300">{p.entidad}</td>
                    <td className="px-4 py-2 text-right font-black text-slate-900 dark:text-white tabular-nums">
                      {formatterPEN.format(p.monto)}
                    </td>
                    <td className="px-4 py-2 text-center whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300">
                        <Clock size={10} /> Pendiente
                      </span>
                    </td>
                    <td className="px-4 py-2 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleExecutePending(p)}
                          className="inline-flex items-center gap-1 bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-xs transition"
                          title="Registrar en lista maestra y retirar de pendientes"
                        >
                          <CheckCircle2 size={12} />
                          <span>Registrar en Maestro</span>
                        </button>
                        <button
                          onClick={() => handleOpenEditPending(p)}
                          className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded transition"
                          title="Modificar monto o fecha"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          onClick={() => handleDeletePending(p)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                          title="Eliminar de pendientes si ya no es necesario"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── GRAFICO Y TABLA DE MOVIMIENTOS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Tabla de Transacciones */}
        <div className="lg:col-span-2">
          <Card className="p-0 overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/40">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Registro de Transacciones del Periodo</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500">Movimientos consolidados filtrados por mes y entidad</p>
              </div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <Badge variant="default">{filtered.length} registros</Badge>
                <button
                  onClick={handleOpenNewRowModal}
                  className="flex items-center gap-1.5 bg-[#0F2A1D] dark:bg-emerald-700 hover:bg-black dark:hover:bg-emerald-600 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs hover:shadow transition"
                  title="Agregar una nueva fila o gasto proyectado para el periodo"
                >
                  <Plus size={14} />
                  <span>+ Nueva Fila / Proyección</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto max-h-[440px] overflow-y-auto">
              <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider sticky top-0 border-b border-slate-200 dark:border-slate-700 z-10">
                  <tr>
                    <th className="px-4 py-3">Tipo</th>
                    <th className="px-4 py-3">Fecha</th>
                    <th className="px-4 py-3">Concepto</th>
                    <th className="px-4 py-3">Categoría</th>
                    <th className="px-4 py-3">Entidad</th>
                    <th className="px-4 py-3 text-right">Monto</th>
                    <th className="px-4 py-3 text-center">Estado</th>
                    <th className="px-4 py-3 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-slate-400 dark:text-slate-500">
                        No hay movimientos registrados para el filtro seleccionado.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((t) => {
                      const isProvisional = t.estado === 'provisional' || t.estado === 'pendiente';

                      return (
                        <tr
                          key={t.id}
                          className={`transition ${
                            isProvisional
                              ? 'bg-amber-50/90 dark:bg-amber-950/40 border-l-4 border-amber-400 hover:bg-amber-100/90 dark:hover:bg-amber-900/50 text-amber-950 dark:text-amber-100 font-medium'
                              : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/40'
                          }`}
                        >
                          <td className="px-4 py-2.5">
                            <Badge variant={t.Tipo === 'Ingreso' ? 'success' : t.Categoria === 'Deuda' ? 'warning' : 'default'}>
                              {t.Tipo}
                            </Badge>
                          </td>
                          <td className="px-4 py-2.5 font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">{t.Fecha}</td>
                          <td className="px-4 py-2.5 font-semibold text-slate-900 dark:text-white max-w-xs truncate">
                            <div className="flex items-center gap-1.5">
                              <span>{t.Concepto}</span>
                              {isProvisional && (
                                <span className="text-[10px] bg-amber-200 dark:bg-amber-900/80 text-amber-900 dark:text-amber-200 px-1.5 py-0.5 rounded font-bold">
                                  Proyección
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-2.5 italic text-slate-500 dark:text-slate-400">{t.Categoria}</td>
                          <td className="px-4 py-2.5 font-medium text-slate-700 dark:text-slate-300">{t.Entidad}</td>
                          <td className="px-4 py-2.5 text-right font-bold text-slate-900 dark:text-white tabular-nums">
                            {formatterPEN.format(t.Monto)}
                          </td>
                          <td className="px-4 py-2.5 text-center whitespace-nowrap">
                            {isProvisional ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 dark:bg-amber-900/80 text-amber-900 dark:text-amber-200">
                                <Clock size={10} /> Proyección
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300">
                                <CheckCircle2 size={10} /> Consolidado
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Si está en proyección / amarillo: Mostrar Check de Aprobación */}
                              {isProvisional && (
                                <button
                                  onClick={() => handleApproveTransaction(t)}
                                  className="p-1.5 text-emerald-700 hover:text-emerald-950 dark:text-emerald-400 dark:hover:text-emerald-200 bg-emerald-100 dark:bg-emerald-950/80 hover:bg-emerald-200 dark:hover:bg-emerald-900/80 rounded-lg transition shadow-xs"
                                  title="Aprobar registro (Consolidar y quitar color amarillo)"
                                >
                                  <CheckCircle2 size={15} />
                                </button>
                              )}

                              {/* Botón de Devolver / Mover a Pago Pendiente */}
                              <button
                                onClick={() => handleSendToPending(t)}
                                className={`p-1.5 rounded-lg transition ${
                                  isProvisional
                                    ? 'text-amber-800 hover:text-amber-950 dark:text-amber-300 bg-amber-200/80 hover:bg-amber-300 dark:bg-amber-900/80 dark:hover:bg-amber-800 shadow-xs'
                                    : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                                }`}
                                title="Devolver a bandeja de Pagos Pendientes"
                              >
                                <RotateCcw size={15} />
                              </button>

                              {/* Botón de Eliminar permanente de la Base */}
                              <button
                                onClick={() => handleDeleteTransaction(t)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                                title="Eliminar fila de la tabla y de la base de datos permanentemente"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Gráfico de Distribución de Gastos */}
        <div className="lg:col-span-1">
          <Card className="flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                    <PieIcon size={16} className="text-emerald-700 dark:text-emerald-400" />
                    <span>Estructura de Gastos</span>
                  </h3>
                  <p className="text-xs text-slate-400">Distribución por categoría en el mes</p>
                </div>
              </div>

              {chartData.length === 0 ? (
                <div className="h-56 flex items-center justify-center text-slate-400 text-xs">
                  Sin egresos en el periodo
                </div>
              ) : (
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData.slice(0, 6)} layout="vertical" margin={{ left: 10, right: 10, top: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 11, fill: '#475569' }} />
                      <Tooltip 
                        formatter={(val: any) => [formatterPEN.format(Number(val) || 0), 'Total']}
                        contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '12px', border: 'none' }}
                      />
                      <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                        {chartData.slice(0, 6).map((_, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Resumen Top Categorías */}
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
              {chartData.slice(0, 4).map((c, i) => (
                <div key={c.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i] }} />
                    <span className="text-slate-600 dark:text-slate-400 font-medium truncate">{c.name}</span>
                  </div>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{formatterPEN.format(c.value)}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

      </div>

      {/* ── MODAL AGREGAR / EDITAR PAGO PENDIENTE ── */}
      {isPendingModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setIsPendingModalOpen(false)}>
          <div className="bg-white dark:bg-[#11191D] text-slate-900 dark:text-slate-100 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150" onClick={e => e.stopPropagation()}>
            
            <div className="px-6 py-4 bg-[#0F2A1D] dark:bg-[#07130D] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-amber-400" />
                <h3 className="font-bold text-sm">
                  {editingPending ? 'Modificar Pago Pendiente' : 'Ingresar Nuevo Pago Pendiente'}
                </h3>
              </div>
              <button onClick={() => setIsPendingModalOpen(false)} className="text-emerald-300 hover:text-white p-1">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSavePendingModal} className="p-6 space-y-4 text-xs">
              {/* Tipo: Ingreso / Egreso */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Tipo de Flujo</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPendFormTipo('Egreso')}
                    className={`p-2.5 rounded-xl border text-center font-bold transition ${
                      pendFormTipo === 'Egreso'
                        ? 'border-rose-600 bg-rose-50 dark:bg-rose-950/60 text-rose-900 dark:text-rose-300 ring-2 ring-rose-500/20'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    🔴 Egreso / Pago
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendFormTipo('Ingreso')}
                    className={`p-2.5 rounded-xl border text-center font-bold transition ${
                      pendFormTipo === 'Ingreso'
                        ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    🟢 Ingreso / Cobro
                  </button>
                </div>
              </div>

              {/* Concepto */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Concepto / Detalle</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Pago de Luz, Alquiler, etc."
                  value={pendFormConcepto}
                  onChange={e => setPendFormConcepto(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Monto y Fecha */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Monto (S/)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={pendFormMonto || ''}
                    onChange={e => setPendFormMonto(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-black focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Fecha Programada</label>
                  <input
                    type="date"
                    required
                    value={pendFormFecha}
                    onChange={e => setPendFormFecha(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Categoría y Entidad */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Categoría</label>
                  <select
                    value={pendFormCategoria}
                    onChange={e => setPendFormCategoria(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    {CATEGORIAS.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Entidad Bancaria</label>
                  <select
                    value={pendFormEntidad}
                    onChange={e => setPendFormEntidad(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    {['Interbank', 'BBVA Bfree', 'Interbank Amex', 'Ripley', 'BCP', 'Scotiabank', 'Efectivo', 'Yape', 'Plin'].map(e => (
                      <option key={e} value={e}>{e}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPendingModalOpen(false)}
                  className="px-4 py-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-[#0F2A1D] dark:bg-emerald-700 hover:bg-black dark:hover:bg-emerald-600 text-white font-bold px-5 py-2 rounded-xl shadow-md transition"
                >
                  {editingPending ? 'Guardar Cambios' : 'Registrar Pendiente'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ── MODAL AGREGAR NUEVA FILA / PROYECCIÓN EN TABLA ── */}
      {isNewRowModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setIsNewRowModalOpen(false)}>
          <div className="bg-white dark:bg-[#11191D] text-slate-900 dark:text-slate-100 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150" onClick={e => e.stopPropagation()}>
            
            <div className="px-6 py-4 bg-[#0F2A1D] dark:bg-[#07130D] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-amber-400" />
                <h3 className="font-bold text-sm">
                  Agregar Nueva Fila / Proyección
                </h3>
              </div>
              <button onClick={() => setIsNewRowModalOpen(false)} className="text-emerald-300 hover:text-white p-1">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveNewRowModal} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/50 rounded-2xl text-amber-900 dark:text-amber-200 flex items-start gap-2">
                <Clock size={16} className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                <p className="text-[11px] leading-relaxed">
                  Las partidas agregadas como <strong>Proyección</strong> aparecerán pintadas de <strong>amarillo</strong> en la tabla, permitiéndote simular gastos futuros en el mes con opción de aprobarlas o devolverlas a pagos pendientes.
                </p>
              </div>

              {/* Tipo: Ingreso / Egreso */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Tipo de Movimiento</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewRowTipo('Egreso')}
                    className={`p-2.5 rounded-xl border text-center font-bold transition ${
                      newRowTipo === 'Egreso'
                        ? 'border-rose-600 bg-rose-50 dark:bg-rose-950/60 text-rose-900 dark:text-rose-300 ring-2 ring-rose-500/20'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    🔴 Egreso / Gasto
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewRowTipo('Ingreso')}
                    className={`p-2.5 rounded-xl border text-center font-bold transition ${
                      newRowTipo === 'Ingreso'
                        ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    🟢 Ingreso / Entrada
                  </button>
                </div>
              </div>

              {/* Concepto */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Concepto / Detalle</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Salida a cenar, Servicio de luz, etc."
                  value={newRowConcepto}
                  onChange={e => setNewRowConcepto(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Monto y Fecha */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Monto (S/)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newRowMonto || ''}
                    onChange={e => setNewRowMonto(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-black focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Fecha</label>
                  <input
                    type="date"
                    required
                    value={newRowFecha}
                    onChange={e => setNewRowFecha(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Categoría y Entidad */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Categoría</label>
                  <select
                    value={newRowCategoria}
                    onChange={e => setNewRowCategoria(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    {CATEGORIAS.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Entidad Bancaria</label>
                  <select
                    value={newRowEntidad}
                    onChange={e => setNewRowEntidad(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    {['Interbank', 'BBVA Bfree', 'Interbank Amex', 'Ripley', 'BCP', 'Scotiabank', 'Efectivo', 'Yape', 'Plin'].map(e => (
                      <option key={e} value={e}>{e}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Modo de Registro */}
              <div className="pt-1">
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">Estado Inicial</label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                    <input
                      type="radio"
                      name="rowMode"
                      checked={newRowEsProyeccion}
                      onChange={() => setNewRowEsProyeccion(true)}
                      className="accent-amber-500"
                    />
                    <span className="font-semibold">🟡 Proyección (Pintada de amarillo)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                    <input
                      type="radio"
                      name="rowMode"
                      checked={!newRowEsProyeccion}
                      onChange={() => setNewRowEsProyeccion(false)}
                      className="accent-emerald-600"
                    />
                    <span className="font-semibold">🟢 Consolidada</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewRowModalOpen(false)}
                  className="px-4 py-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-[#0F2A1D] dark:bg-emerald-700 hover:bg-black dark:hover:bg-emerald-600 text-white font-bold px-5 py-2 rounded-xl shadow-md transition"
                >
                  Agregar a la Tabla
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};

