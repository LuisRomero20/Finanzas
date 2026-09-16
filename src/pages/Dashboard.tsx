import React, { useEffect, useState, useMemo } from 'react';
import { useFinanceStore, MESES, ENTIDADES, getMonthNameFromDate } from '../store/financeStore';
import { usePendingPaymentsStore, type PendingPaymentItem } from '../store/pendingPaymentsStore';
import { useAppStore } from '../store';
import type { Transaction } from '../utils/masterData';
import {
  CATEGORIAS_PERSONALES,
  getEffectiveCategory,
  getAdaptedCategoryLabel,
  getCategoryByIdOrLabel,
  getStoredClasificaciones,
  saveStoredClasificaciones,
  isDebtTransaction,
  isCreditCardPayment,
  isCreditCardLine,
} from '../utils/categoryClassification';
import { Card } from '../components/ui/Card';
import { Metric } from '../components/ui/Metric';
import { Badge } from '../components/ui/Badge';
import { BudgetOverviewWidget } from '../components/BudgetOverviewWidget';
import { SmartInsightsWidget } from '../components/SmartInsightsWidget';
import { FinancialCalendarWidget } from '../components/FinancialCalendarWidget';
import { SavingsGoalsWidget } from '../components/SavingsGoalsWidget';
import { generateFinancialInsights } from '../utils/financialInsights';
import { openExecutiveReportPrintWindow } from '../utils/executiveReportPdf';
import { useBudgetStore } from '../store/budgetStore';
import { useCreditLineStore } from '../store/creditLineStore';
import { usePrevMonthBridgeStore } from '../store/prevMonthBridgeStore';
import { useCardStatementStore } from '../store/cardStatementStore';
import { useCreditCardStore } from '../store/creditCardStore';
import { calculateCardLivePosition, getCycles } from '../utils/creditCardCycles';
import { CreditLineConfigModal } from '../components/CreditLineConfigModal';
import { PrevMonthDaysConfigModal } from '../components/PrevMonthDaysConfigModal';
import { AddCardModal } from '../components/AddCardModal';
import { calculateCardInstallmentSchedule } from '../store/projectionStore';
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
  FileText,
  Sliders,
  Calculator,
  CalendarDays,
  Lock,
} from 'lucide-react';
import { LaborBenefitsModal } from '../components/LaborBenefitsCalculatorWidget';
import { TodayProjectedExpensesWidget } from '../components/TodayProjectedExpensesWidget';
import { CasualProjectionsModal } from '../components/CasualProjectionsModal';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts';

const MONTH_ORDER = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Setiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const sortedMeses = [...MESES].sort((a, b) => MONTH_ORDER.indexOf(a) - MONTH_ORDER.indexOf(b));

// Paleta vibrante de alto contraste para modo oscuro y claro
const CHART_COLORS = [
  '#10B981', // Emerald Mint
  '#06B6D4', // Cyan Azure
  '#8B5CF6', // Purple Violet
  '#F59E0B', // Amber Gold
  '#F43F5E', // Rose Coral
  '#3B82F6', // Royal Blue
  '#EC4899', // Hot Pink
  '#14B8A6', // Teal
];

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
    updateTransaction,
    confirmTransaction,
  } = useFinanceStore();

  const rawTransactions = useFinanceStore((s) => s.transactions) || [];
  const baseFiltered = getFilteredTransactions();

  const { getConfig, getBridgedTransactions, getPreviousMonthName } = usePrevMonthBridgeStore();
  const activeMonth = selectedMonth === 'Todos' ? 'Setiembre' : selectedMonth;
  const bridgeConfig = getConfig(activeMonth);
  const prevMonthName = getPreviousMonthName(activeMonth);

  const bridgedTxs = useMemo(() => {
    if (!bridgeConfig.enabled || !bridgeConfig.includeInDashboardTotals) return [];
    return getBridgedTransactions(activeMonth, rawTransactions);
  }, [bridgeConfig, activeMonth, rawTransactions]);

  const bridgedIngresos = useMemo(() => {
    return bridgedTxs.filter(t => t.Tipo === 'Ingreso' && !isCreditCardLine(t)).reduce((a, b) => a + b.Monto, 0);
  }, [bridgedTxs]);

  const bridgedEgresos = useMemo(() => {
    return bridgedTxs.filter(t => t.Tipo === 'Egreso' && !isCreditCardLine(t)).reduce((a, b) => a + b.Monto, 0);
  }, [bridgedTxs]);

  const filtered = useMemo(() => {
    if (bridgedTxs.length === 0) return baseFiltered;
    const baseIds = new Set(baseFiltered.map(t => t.id));
    const toAdd = bridgedTxs.filter(t => !baseIds.has(t.id));
    return [...baseFiltered, ...toAdd];
  }, [baseFiltered, bridgedTxs]);

  // 1. Ingresos Totales: Entradas netas del periodo (sueldo, bonos, extras).
  // Excluye líneas/cupos de crédito de tarjetas (que no representan dinero recibido).
  const totalIngresos = filtered
    .filter(t => t.Tipo === 'Ingreso' && !isCreditCardLine(t))
    .reduce((acc, t) => acc + t.Monto, 0);

  // 2. Obligaciones & Deudas: Suma EXCLUSIVA de las deudas reales activas (BCP, Yape, iPhone 16 y nuevas).
  // No incluye tarjetas de crédito como deuda ni pasivo.
  const deudasDelPeriodo = filtered.filter(t => t.Tipo === 'Egreso' && isDebtTransaction(t));
  const totalDeudas = deudasDelPeriodo.reduce((acc, t) => acc + t.Monto, 0);
  const uniqueDebtConcepts = Array.from(new Set(deudasDelPeriodo.map(t => (t.Concepto || '').trim()))).filter(Boolean);
  const deudasSubValue = uniqueDebtConcepts.length > 0
    ? `${uniqueDebtConcepts.length} deuda${uniqueDebtConcepts.length > 1 ? 's' : ''}: ${uniqueDebtConcepts.join(', ')}`
    : 'Sin deudas en este periodo';

  // 3. Egresos Operativos: Gastos y consumos del día a día (alimentación, servicios, transporte, ocio, etc.).
  // Excluye las deudas. En 'Todas' no duplica los abonos de pago de tarjeta sobre los consumos individuales ya registrados.
  const totalEgresos = filtered
    .filter(t => t.Tipo === 'Egreso' && !isDebtTransaction(t) && (selectedEntity !== 'Todas' || !isCreditCardPayment(t)))
    .reduce((acc, t) => acc + t.Monto, 0);

  const entityList = ENTIDADES && ENTIDADES.length ? ENTIDADES : Array.from(new Set(filtered.map(t => t.Entidad).filter(Boolean)));
  const entityBalances: Record<string, number> = {};
  entityList.forEach(ent => {
    const ingresosEnt = filtered.filter(t => t.Entidad === ent && t.Tipo === 'Ingreso' && !isCreditCardLine(t)).reduce((a, t) => a + t.Monto, 0);
    const egresosEnt = filtered.filter(t => t.Entidad === ent && t.Tipo === 'Egreso' && !isDebtTransaction(t) && !isCreditCardLine(t)).reduce((a, t) => a + t.Monto, 0);
    const deudasEnt = filtered.filter(t => t.Entidad === ent && isDebtTransaction(t)).reduce((a, t) => a + t.Monto, 0);
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

  // ── POSICIÓN VIVA Y EN TIEMPO REAL (INDEPENDIENTE DEL FILTRO DE MES) ──
  // Conectado con la hoja de tarjetas y ciclos de facturación reales
  const { cards, deleteCard } = useCreditCardStore();
  const { getVerifiedStatement } = useCardStatementStore();
  const liveRefDate = useMemo(() => {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    return d;
  }, []);

  const liveCardPositions = useMemo(() => {
    const map: Record<string, ReturnType<typeof calculateCardLivePosition>> = {};
    cards.forEach(card => {
      const { prev } = getCycles(liveRefDate, card);
      const verified = getVerifiedStatement(card.entity, prev.payDate, prev.end);
      map[card.entity] = calculateCardLivePosition(
        card,
        rawTransactions,
        liveRefDate,
        verified?.finalDebt
      );
    });
    return map;
  }, [cards, rawTransactions, liveRefDate, getVerifiedStatement]);

  const liveAccountPositions = useMemo(() => {
    const opMonth = selectedMonth === 'Todos' ? 'Setiembre' : selectedMonth;
    const monthTxs = rawTransactions.filter(t => t.Mes === opMonth);

    const ibkIngresos = monthTxs
      .filter(t => /^Interbank$/i.test(t.Entidad) && t.Tipo === 'Ingreso' && !isCreditCardLine(t))
      .reduce((a, t) => a + t.Monto, 0);
    const ibkEgresos = monthTxs
      .filter(t => /^Interbank$/i.test(t.Entidad) && t.Tipo === 'Egreso')
      .reduce((a, t) => a + t.Monto, 0);

    const bcpIngresos = monthTxs
      .filter(t => /^BCP$/i.test(t.Entidad) && t.Tipo === 'Ingreso' && !isCreditCardLine(t))
      .reduce((a, t) => a + t.Monto, 0);
    const bcpEgresos = monthTxs
      .filter(t => /^BCP$/i.test(t.Entidad) && t.Tipo === 'Egreso')
      .reduce((a, t) => a + t.Monto, 0);

    return {
      Interbank: {
        ingresos: ibkIngresos,
        egresos: ibkEgresos,
        balance: ibkIngresos - ibkEgresos,
      },
      BCP: {
        ingresos: bcpIngresos,
        egresos: bcpEgresos,
        balance: bcpIngresos - bcpEgresos,
      },
    };
  }, [rawTransactions, selectedMonth]);

  const interbankKey = entityList.find(e => /^Interbank$/i.test(e)) || 'Interbank';
  const interbankBalance = entityBalances[interbankKey] ?? 0;

  const budgetLimits = useBudgetStore((s) => s.budgets);

  const diagnostic = useMemo(() => {
    return generateFinancialInsights(
      rawTransactions,
      selectedMonth,
      sortedMeses,
      budgetLimits,
      interbankBalance
    );
  }, [rawTransactions, selectedMonth, budgetLimits, interbankBalance]);

  const handleExportPDF = () => {
    const activeMonth = selectedMonth === 'Todos' ? 'Setiembre' : selectedMonth;
    openExecutiveReportPrintWindow({
      selectedMonth: activeMonth,
      transactions: rawTransactions,
      totalIncome: totalIngresos,
      totalExpense: totalEgresos,
      totalDebts: totalDeudas,
      liquidBalance: interbankBalance,
      accountingSurplus: totalIngresos - totalEgresos - totalDeudas,
      accountBalances: entityBalances,
      selectedEntity,
    });
  };

  const categoryMap: Record<string, { value: number; emoji: string; nombre: string; shortName: string }> = {};
  filtered.filter(t => t.Tipo === 'Egreso').forEach(t => {
    const cat = getEffectiveCategory(t);
    const emoji = cat?.emoji || '🏷️';
    const nombre = cat?.nombre || (t.Categoria || 'Otros');
    const shortName = getAdaptedCategoryLabel(t);

    const key = `${emoji} ${nombre}`;
    if (!categoryMap[key]) {
      categoryMap[key] = { value: 0, emoji, nombre, shortName };
    }
    categoryMap[key].value += t.Monto;
  });
  
  const chartData = Object.entries(categoryMap)
    .map(([key, data]) => ({
      name: key,
      displayName: data.shortName,
      fullName: key,
      value: Math.round(data.value * 100) / 100,
    }))
    .sort((a, b) => b.value - a.value);

  const formatterPEN = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' });

  const { lines: creditLines, labels: accountLabels } = useCreditLineStore();
  const [isCreditLineModalOpen, setIsCreditLineModalOpen] = useState(false);
  const [selectedCardForConfig, setSelectedCardForConfig] = useState<string | undefined>(undefined);
  const [isLaborBenefitsModalOpen, setIsLaborBenefitsModalOpen] = useState(false);
  const [isCasualModalOpen, setIsCasualModalOpen] = useState(false);
  const [isPrevMonthConfigModalOpen, setIsPrevMonthConfigModalOpen] = useState(false);
  const [isAddCardModalOpen, setIsAddCardModalOpen] = useState(false);

  const { agregarNotificacion } = useAppStore();

  const activeAccountLabels = accountLabels;

  Object.keys(entityLineaTotals).forEach(ent => {
    if (creditLines.hasOwnProperty(ent)) entityLineaTotals[ent] = creditLines[ent];
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
  const [pendFormCategoria, setPendFormCategoria] = useState(CATEGORIAS_PERSONALES[0].nombre);
  const [pendFormEntidad, setPendFormEntidad] = useState('Interbank');
  const [pendFormFecha, setPendFormFecha] = useState(new Date().toISOString().slice(0, 10));

  // Modal para agregar nueva fila / proyección en la tabla de transacciones
  const [isNewRowModalOpen, setIsNewRowModalOpen] = useState(false);
  const [newRowTipo, setNewRowTipo] = useState<'Ingreso' | 'Egreso'>('Egreso');
  const [newRowConcepto, setNewRowConcepto] = useState('');
  const [newRowMonto, setNewRowMonto] = useState<number>(0);
  const [newRowCategoria, setNewRowCategoria] = useState(CATEGORIAS_PERSONALES[0].nombre);
  const [newRowEntidad, setNewRowEntidad] = useState('Interbank');
  const [newRowFecha, setNewRowFecha] = useState(() => getDefaultDateForMonth(selectedMonth));
  const [newRowEsProyeccion, setNewRowEsProyeccion] = useState(true);
  const [newRowEsCuotas, setNewRowEsCuotas] = useState(false);
  const [newRowCuotas, setNewRowCuotas] = useState<number>(3);

  // Actualizar fecha por defecto cuando cambia el mes seleccionado
  useEffect(() => {
    setNewRowFecha(getDefaultDateForMonth(selectedMonth));
  }, [selectedMonth]);

  const handleOpenNewRowModal = () => {
    setNewRowTipo('Egreso');
    setNewRowConcepto('');
    setNewRowMonto(0);
    setNewRowCategoria(CATEGORIAS_PERSONALES[0].nombre);
    setNewRowEntidad(selectedEntity !== 'Todas' ? selectedEntity : 'Interbank');
    setNewRowFecha(getDefaultDateForMonth(selectedMonth));
    setNewRowEsProyeccion(true);
    setNewRowEsCuotas(false);
    setNewRowCuotas(3);
    setIsNewRowModalOpen(true);
  };

  const handleSaveNewRowModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRowConcepto.trim()) return;

    const mesName = selectedMonth === 'Todos' ? getMonthNameFromDate(newRowFecha) : selectedMonth;
    const cleanConcepto = newRowConcepto.trim().replace(/\s*\[\d+\s*cuotas?\]|\(\d+\s*cuotas?\)/gi, '').trim();
    const finalConcepto = (newRowEsCuotas && newRowCuotas > 1)
      ? `${cleanConcepto} [${newRowCuotas} cuotas]`
      : cleanConcepto;

    addTransaction({
      Tipo: newRowTipo,
      Fecha: newRowFecha,
      Concepto: finalConcepto,
      Categoria: newRowCategoria,
      Entidad: newRowEntidad,
      Monto: Number(newRowMonto),
      Mes: mesName,
      estado: newRowEsProyeccion ? 'provisional' : 'confirmado',
      cuotas: (newRowEsCuotas && newRowCuotas > 1) ? newRowCuotas : undefined,
      esCuotas: Boolean(newRowEsCuotas && newRowCuotas > 1),
      montoTotal: Number(newRowMonto),
      montoCuota: (newRowEsCuotas && newRowCuotas > 1) ? Math.round((Number(newRowMonto) / newRowCuotas) * 100) / 100 : undefined,
    });

    if (newRowEsCuotas && newRowCuotas > 1) {
      const schedule = calculateCardInstallmentSchedule(newRowEntidad, newRowFecha, Number(newRowMonto), newRowCuotas);
      const primerMes = schedule[0]?.mesLabel || 'el próximo ciclo';
      agregarNotificacion(
        `💳 Compra con ${newRowEntidad} registrada por ${formatterPEN.format(Number(newRowMonto))}. Se dividirá en ${newRowCuotas} cuotas de ${formatterPEN.format(Number(newRowMonto) / newRowCuotas)} facturadas a partir de ${primerMes}.`,
        'success'
      );
    } else {
      agregarNotificacion(
        newRowEsProyeccion
          ? `✨ Fila proyectada "${newRowConcepto}" agregada en amarillo (pendiente de confirmación).`
          : `✅ Transacción "${newRowConcepto}" registrada correctamente.`,
        'success'
      );
    }

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
    const cleanConcept = t.Concepto.replace(/\s*[-_]?\s*(?:\[proy\]|\(proy\)|\bproy\b\.?)/gi, '').trim() || t.Concepto;
    agregarNotificacion(`✅ Movimiento "${cleanConcept}" aprobado y consolidado.`, 'success');
  };

  const handleSendToPending = (t: Transaction) => {
    const isProy = t.estado !== 'confirmado' && (t.estado === 'provisional' || t.Concepto.toLowerCase().includes('proy') || t.id.startsWith('proy-'));
    addPendingItem({
      tipo: t.Tipo,
      concepto: t.Concepto.replace(/\s*[-_]?\s*(?:\[proy\]|\(proy\)|\bproy\b\.?)/gi, '').trim() || t.Concepto,
      monto: t.Monto,
      categoria: t.Categoria,
      entidad: t.Entidad,
      fecha: t.Fecha,
      origen: isProy ? 'Proyección' : 'Manual',
      mes: t.Mes,
      mesStr: t.Fecha.slice(0, 7),
    });
    deleteTransaction(t.id);
    agregarNotificacion(`⏳ Movimiento "${t.Concepto}" devuelto a la bandeja de Pagos Pendientes.`, 'info');
  };

  const handleReturnAllProjections = () => {
    const proyTxs = filtered.filter(
      (t) => t.estado !== 'confirmado' && (t.estado === 'provisional' || t.Concepto.toLowerCase().includes('proy') || t.id.startsWith('proy-'))
    );
    if (proyTxs.length === 0) {
      agregarNotificacion('ℹ️ No hay transacciones marcadas como proyección en este periodo.', 'info');
      return;
    }
    proyTxs.forEach((t) => {
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
    });
    agregarNotificacion(`↩️ Se retornaron ${proyTxs.length} proyecciones a Pagos & Movimientos Pendientes.`, 'success');
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-[#11191D] rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Resumen Financiero Ejecutivo
            </h1>
            <Badge variant="primary">Periodo Activo</Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Balance general, liquidez disponible en cuentas y métricas operativas.
          </p>
        </div>

        {/* Action Controls */}
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
          {/* Selector de Mes */}
          <div className="relative">
            <select 
              value={selectedMonth}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full appearance-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold py-2 pl-3 pr-7 rounded-xl shadow-inner focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="Todos">📅 Todos</option>
              {sortedMeses.map(m => (
                <option key={m} value={m}>📅 {m}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={13} />
          </div>

          {/* Selector de Entidad */}
          <div className="relative">
            <select 
              value={selectedEntity}
              onChange={(e) => setEntity(e.target.value)}
              className="w-full appearance-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold py-2 pl-3 pr-7 rounded-xl shadow-inner focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="Todas">🏦 Todas</option>
              {ENTIDADES.map(e => (
                <option key={e} value={e}>🏦 {e}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={13} />
          </div>

          {/* Export & Tools Buttons */}
          <div className="flex items-center gap-1.5 col-span-2 sm:col-span-1 flex-wrap">
            <button
              onClick={() => setIsPrevMonthConfigModalOpen(true)}
              className={`flex items-center justify-center gap-1 text-xs font-bold px-2.5 py-2 rounded-xl shadow-sm transition cursor-pointer ${
                bridgeConfig.enabled && bridgeConfig.includedDays.length > 0
                  ? 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
              }`}
              title={`Considerar días de ${prevMonthName} con ingresos o egresos de ${activeMonth}`}
            >
              <CalendarDays size={13} />
              <span className="hidden sm:inline">Días {prevMonthName}</span>
              <span className="sm:hidden">Días ant.</span>
              {bridgeConfig.enabled && bridgeConfig.includedDays.length > 0 && (
                <span className="px-1.5 py-0.2 text-[10px] bg-black/25 text-white font-black rounded-full">
                  {bridgeConfig.includedDays.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setIsLaborBenefitsModalOpen(true)}
              className="flex items-center justify-center gap-1 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-sm transition cursor-pointer"
              title="Calculadora y simulador de Gratificación, CTS y Sueldo"
            >
              <Calculator size={13} />
              <span>Grati & CTS</span>
            </button>
            <button
              onClick={handleExportPDF}
              className="flex items-center justify-center gap-1 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-sm transition cursor-pointer"
              title="Generar e imprimir informe ejecutivo en PDF"
            >
              <FileText size={13} />
              <span>Informe PDF</span>
            </button>
            <button
              onClick={handleExport}
              className="flex items-center justify-center gap-1 bg-slate-900 dark:bg-slate-800 hover:bg-black dark:hover:bg-slate-700 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-sm transition cursor-pointer"
              title="Exportar datos a CSV"
            >
              <Download size={13} />
              <span>CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── ⚡ PANTALLA INICIAL: PROYECCIÓN DE GASTOS DE HOY DÍA ── */}
      <TodayProjectedExpensesWidget onOpenCasualModal={() => setIsCasualModalOpen(true)} />

      {/* ── 🗓️ BANNER INFORMATIVO: DÍAS DEL MES ANTERIOR CONSIDERADOS ── */}
      {bridgeConfig.enabled && bridgeConfig.includedDays.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-950/30 dark:via-amber-900/10 border border-amber-300/80 dark:border-amber-800/60 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5">
              <CalendarDays size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm text-slate-900 dark:text-white">
                  Días de {prevMonthName} considerados en {activeMonth}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                  {bridgeConfig.movementType === 'Ambos' ? '🟢 Ambos (Ing. y Egr.)' : bridgeConfig.movementType === 'Ingresos' ? '💰 Solo Ingresos' : '🛒 Solo Egresos'}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                  (Día{bridgeConfig.includedDays.length > 1 ? 's' : ''}: {bridgeConfig.includedDays.slice().sort((a, b) => a - b).join(', ')})
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                {bridgedTxs.length > 0 ? (
                  <>
                    Impacto en este mes: <span className="font-bold text-emerald-600 dark:text-emerald-400">+{formatterPEN.format(bridgedIngresos)}</span> en ingresos y <span className="font-bold text-rose-600 dark:text-rose-400">-{formatterPEN.format(bridgedEgresos)}</span> en egresos ({bridgedTxs.length} movimiento{bridgedTxs.length > 1 ? 's' : ''} contabilizado{bridgedTxs.length > 1 ? 's' : ''}).
                  </>
                ) : (
                  <>Sin movimientos registrados en los días seleccionados ({bridgeConfig.includedDays.slice().sort((a, b) => a - b).join(', ')}) de {prevMonthName}.</>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
            <button
              onClick={() => setIsPrevMonthConfigModalOpen(true)}
              className="text-xs font-bold px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white transition flex items-center gap-1 cursor-pointer shadow-xs"
            >
              <Sliders size={13} />
              <span>Configurar días</span>
            </button>
          </div>
        </div>
      )}

      {/* ── KPI METRICS GRID ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* 1. Ingresos Totales */}
        <Card className="bg-gradient-to-br from-white to-emerald-50/40 dark:from-[#11191D] dark:to-emerald-950/20 border-emerald-100 dark:border-slate-800">
          <Metric 
            label="Ingresos Totales" 
            value={formatterPEN.format(totalIngresos)} 
            subValue="Entradas netas reales (sin cupos de tarjeta)"
            icon={<TrendingUp className="text-emerald-700 dark:text-emerald-400" size={20} />}
            color="text-emerald-950 dark:text-emerald-300"
          />
        </Card>

        {/* 2. Egresos Operativos */}
        <Card className="bg-gradient-to-br from-white to-slate-50 dark:from-[#11191D] dark:to-slate-800/30 border-slate-200 dark:border-slate-800">
          <Metric 
            label="Egresos Operativos" 
            value={formatterPEN.format(totalEgresos)} 
            subValue="Consumos corrientes de vida (sin deudas)"
            icon={<TrendingDown className="text-slate-600 dark:text-slate-400" size={20} />}
            color="text-slate-900 dark:text-slate-100"
          />
        </Card>

        {/* 3. Obligaciones y Deudas */}
        <Card className="bg-gradient-to-br from-white to-amber-50/40 dark:from-[#11191D] dark:to-amber-950/20 border-amber-200/70 dark:border-slate-800">
          <Metric 
            label="Obligaciones & Deudas" 
            value={formatterPEN.format(totalDeudas)} 
            subValue={deudasSubValue}
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

      {/* ── POSICIÓN POR ENTIDAD BANCARIA (INDEPENDIENTE DEL FILTRO DE MES) ── */}
      <div>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h2 className="text-lg font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2 flex-wrap">
              <Building2 size={18} className="text-emerald-700 dark:text-emerald-400" />
              <span>Posición por Cuenta Bancaria y Tarjeta</span>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full">
                {selectedMonth === 'Todos' ? 'Todos los meses' : selectedMonth}
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Saldos disponibles, flujo de ingresos/egresos y límites de crédito asignados.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAddCardModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition cursor-pointer shrink-0"
              title="Agregar una nueva tarjeta de crédito"
            >
              <Plus size={13} />
              <span className="hidden sm:inline">Nueva Tarjeta</span>
              <span className="sm:hidden">Tarjeta</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedCardForConfig(undefined);
                setIsCreditLineModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-800 text-xs font-bold shadow-sm transition cursor-pointer shrink-0"
              title="Configurar líneas de crédito de las tarjetas"
            >
              <Sliders size={13} className="text-emerald-500" />
              <span className="hidden sm:inline">Ajustar Líneas</span>
              <span className="sm:hidden">Líneas</span>
            </button>
          </div>
        </div>

        {(() => {
          const CARD_ORDER = ['Interbank', 'BCP', ...cards.map(c => c.entity)];

          return (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
              {CARD_ORDER.map(ent => {
                // Cuenta Interbank (Saldo Líquido disponible)
                if (/^Interbank$/i.test(ent)) {
                  const { ingresos, egresos, balance } = liveAccountPositions.Interbank;
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
                        <p className={`text-xl font-black mt-0.5 tracking-tight ${balance >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          {formatterPEN.format(balance)}
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

                // Cuenta BCP
                if (/^BCP$/i.test(ent)) {
                  const { ingresos, egresos, balance } = liveAccountPositions.BCP;
                  return (
                    <div key={ent} className="bg-white dark:bg-[#11191D] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:shadow-md transition flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="font-bold text-sm text-slate-900 dark:text-white truncate">{ent}</span>
                          <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full">Cuenta</span>
                        </div>
                        {activeAccountLabels[ent] && (
                          <p className="text-xs text-slate-400 font-medium truncate">{activeAccountLabels[ent]}</p>
                        )}
                        <p className="text-[11px] uppercase font-bold text-slate-400 dark:text-slate-500 mt-2">Neto del Mes</p>
                        <p className="text-xl font-black mt-0.5 tracking-tight text-emerald-700 dark:text-emerald-400">
                          {formatterPEN.format(balance)}
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
                      </div>
                    </div>
                  );
                }

                // Tarjetas de crédito: Ingresos - Egresos de la entidad, filtrado por mes
                const matchingCard = cards.find(c => c.entity === ent);
                const totalLine = entityLineaTotals[ent] || 0;
                const cardIngresos = entityIngresos[ent] || 0;
                const cardEgresos = entityEgresos[ent] || 0;
                const cardNeto = cardIngresos - cardEgresos;

                if (matchingCard || cardIngresos > 0 || cardEgresos > 0) {
                  return (
                    <div key={ent} className="bg-white dark:bg-[#11191D] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:shadow-md transition flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="font-bold text-sm text-slate-900 dark:text-white truncate">{ent}</span>
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded-full">
                              Tarjeta
                            </span>
                            {matchingCard && (
                              cardNeto >= 0 ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (confirm(`¿Eliminar definitivamente la tarjeta "${matchingCard.name}"? Su saldo en el mes está saldado.`)) {
                                      deleteCard(matchingCard.id);
                                      agregarNotificacion(`Tarjeta "${matchingCard.name}" eliminada.`);
                                    }
                                  }}
                                  className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition"
                                  title="Eliminar tarjeta"
                                >
                                  <Trash2 size={12} />
                                </button>
                              ) : (
                                <span
                                  className="p-1 text-slate-300 dark:text-slate-600 cursor-not-allowed"
                                  title={`No se puede eliminar: Hay egresos activos de ${formatterPEN.format(cardEgresos)} en este mes.`}
                                >
                                  <Lock size={12} />
                                </span>
                              )
                            )}
                          </div>
                        </div>
                        {activeAccountLabels[ent] && (
                          <p className="text-xs text-slate-400 font-medium truncate">{activeAccountLabels[ent]}</p>
                        )}
                        <p className="text-[11px] uppercase font-bold text-slate-400 dark:text-slate-500 mt-2">Neto del Mes</p>
                        <p className={`text-xl font-black mt-0.5 tracking-tight ${cardNeto >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                          {formatterPEN.format(cardNeto)}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1 text-xs">
                        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1"><Plus className="text-emerald-600 dark:text-emerald-400" size={12}/> Ingresos:</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-200">{formatterPEN.format(cardIngresos)}</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1"><Minus className="text-rose-500 dark:text-rose-400" size={12}/> Egresos:</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-200">{formatterPEN.format(cardEgresos)}</span>
                        </div>
                        {totalLine > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCardForConfig(ent);
                              setIsCreditLineModalOpen(true);
                            }}
                            className="w-full flex items-center justify-between pt-1 border-t border-slate-100/60 dark:border-slate-800 font-semibold text-blue-900 dark:text-blue-300 hover:text-emerald-600 dark:hover:text-emerald-400 text-[11px] transition group cursor-pointer"
                            title="Clic para modificar la línea de crédito de esta tarjeta"
                          >
                            <span className="flex items-center gap-1">
                              <span>Línea:</span>
                              <Edit3 size={11} className="opacity-60 group-hover:opacity-100 transition-opacity text-emerald-600 dark:text-emerald-400" />
                            </span>
                            <span className="group-hover:underline underline-offset-2">{formatterPEN.format(totalLine)}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                }

                // Fallback si no es tarjeta conocida
                const fallbackIngresos = entityIngresos[ent] || 0;
                const fallbackEgresos = entityEgresos[ent] || 0;
                const fallbackDisp = fallbackIngresos - fallbackEgresos;
                return (
                  <div key={ent} className="bg-white dark:bg-[#11191D] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:shadow-md transition flex flex-col justify-between">
                    <div>
                      <span className="font-bold text-sm text-slate-900 dark:text-white truncate">{ent}</span>
                      <p className="text-[11px] uppercase font-bold text-slate-400 dark:text-slate-500 mt-2">Neto</p>
                      <p className="text-xl font-black mt-0.5 tracking-tight text-slate-900 dark:text-white">{formatterPEN.format(fallbackDisp)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* ── 🤖 MOTOR DE INSIGHTS INTELIGENTES ── */}
      <SmartInsightsWidget
        diagnostic={diagnostic}
        selectedMonth={selectedMonth}
      />

      {/* ── 🚦 CONTROL DE PRESUPUESTOS SEMAFÓRICOS ── */}
      <BudgetOverviewWidget />

      {/* ── 📅 CALENDARIO FINANCIERO INTERACTIVO ── */}
      <FinancialCalendarWidget
        transactions={rawTransactions}
        selectedMonth={selectedMonth === 'Todos' ? 'Setiembre' : selectedMonth}
      />

      {/* ── 🎯 METAS DE AHORRO & FONDOS DE RESERVA ── */}
      <SavingsGoalsWidget monthlySavingsCapacity={diagnostic.totalSavings > 0 ? diagnostic.totalSavings : 0} />

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
              onClick={() => setIsCasualModalOpen(true)}
              className="flex items-center gap-1.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 active:scale-95 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm hover:shadow-md transition border border-amber-400/40 cursor-pointer"
              title="Proyectar gastos casuales para el mes actual (Fútbol, Bus, Taxi, Comida, etc.)"
            >
              <Sparkles size={15} className="text-amber-200" />
              <span>+ Proyectar Gastos Casuales</span>
            </button>

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
                        <span className="font-bold text-slate-900 dark:text-white">
                          {p.concepto.replace(/\s*-\s*proy/gi, '').trim()}
                        </span>
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
                
                {/* Botón Retornar Todas las Proyecciones */}
                <button
                  onClick={handleReturnAllProjections}
                  className={`flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs transition border cursor-pointer ${
                    filtered.some(t => t.estado !== 'confirmado' && (t.estado === 'provisional' || t.Concepto.toLowerCase().includes('proy') || t.id.startsWith('proy-')))
                      ? 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white border-amber-400/60 shadow-amber-900/30'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-700 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                  title="Devolver todas las transacciones proyectadas en este periodo a la bandeja de Pagos Pendientes"
                >
                  <RotateCcw size={14} className={filtered.some(t => t.estado !== 'confirmado' && (t.estado === 'provisional' || t.Concepto.toLowerCase().includes('proy') || t.id.startsWith('proy-'))) ? 'text-white' : 'text-slate-400'} />
                  <span>
                    Retornar todas las proyecciones
                    {filtered.filter(t => t.estado !== 'confirmado' && (t.estado === 'provisional' || t.Concepto.toLowerCase().includes('proy') || t.id.startsWith('proy-'))).length > 0 &&
                      ` (${filtered.filter(t => t.estado !== 'confirmado' && (t.estado === 'provisional' || t.Concepto.toLowerCase().includes('proy') || t.id.startsWith('proy-'))).length})`}
                  </span>
                </button>

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
                <thead className="bg-slate-100 dark:bg-slate-800/90 text-slate-500 dark:text-slate-400 uppercase font-bold text-[11px] tracking-wider sticky top-0 border-b border-slate-200 dark:border-slate-700 z-10">
                  <tr>
                    <th className="px-2.5 py-2.5">Tipo</th>
                    <th className="px-2.5 py-2.5">Fecha</th>
                    <th className="px-2.5 py-2.5">Concepto</th>
                    <th className="px-2.5 py-2.5">Categoría</th>
                    <th className="px-2.5 py-2.5">Entidad</th>
                    <th className="px-2.5 py-2.5 text-right">Monto</th>
                    <th className="px-2.5 py-2.5 text-center">Estado</th>
                    <th className="px-2.5 py-2.5 text-center">Acción</th>
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
                      const isProvisional = t.estado === 'confirmado'
                        ? false
                        : (t.estado === 'provisional' || t.estado === 'pendiente' || t.id.startsWith('proy-') || (t.Concepto ? /\[proy\]|\(proy\)|\bproy\b/i.test(t.Concepto) : false));

                      return (
                        <tr
                          key={t.id}
                          className={`transition ${
                            isProvisional
                              ? 'bg-amber-50/90 dark:bg-amber-950/40 border-l-4 border-amber-400 hover:bg-amber-100/90 dark:hover:bg-amber-900/50 text-amber-950 dark:text-amber-100 font-medium'
                              : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/40'
                          }`}
                        >
                          <td className="px-2.5 py-2 whitespace-nowrap">
                            <Badge variant={t.Tipo === 'Ingreso' ? 'success' : t.Categoria === 'Deuda' ? 'warning' : 'default'} className="text-[10px] px-2 py-0.5 font-bold">
                              {t.Tipo}
                            </Badge>
                          </td>
                          <td className="px-2.5 py-2 font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap text-[11px]">{t.Fecha}</td>
                          <td className="px-2.5 py-2 font-semibold text-slate-900 dark:text-white max-w-[130px] xl:max-w-[170px] truncate" title={t.Concepto}>
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="truncate">{t.Concepto.replace(/\s*-\s*proy/gi, '').trim()}</span>
                              {isProvisional && (
                                <span className="text-[9px] bg-amber-200 dark:bg-amber-900/80 text-amber-900 dark:text-amber-200 px-1.5 py-0.2 rounded font-bold shrink-0">
                                  Proy.
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-2.5 py-2">
                            {(() => {
                              const cat = getEffectiveCategory(t);
                              return (
                                <div className="relative group/cat inline-block max-w-full">
                                  <select
                                    value={cat?.id || ''}
                                    onChange={(e) => {
                                      const newCatId = e.target.value;
                                      const catInfo = getCategoryByIdOrLabel(newCatId);
                                      const catName = catInfo ? catInfo.nombre : newCatId;
                                      const stored = getStoredClasificaciones();
                                      stored[t.id] = newCatId;
                                      saveStoredClasificaciones(stored);
                                      updateTransaction(t.id, { Categoria: catName });
                                      agregarNotificacion(`Categoría asignada: ${catInfo?.nombre || newCatId}`, 'success');
                                    }}
                                    className={`appearance-none text-[11px] font-bold px-2.5 py-1 rounded-xl border transition cursor-pointer pr-5 max-w-[155px] xl:max-w-[180px] truncate focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                                      cat
                                        ? `${cat.bg} ${cat.color} ${cat.border}`
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                                    }`}
                                    title={cat ? `${cat.emoji} ${cat.nombre}` : 'Haz clic para reclasificar'}
                                  >
                                    <option value="" className="bg-white dark:bg-[#11191D] text-slate-800 dark:text-slate-100 font-semibold">
                                      — Sin clasificar —
                                    </option>
                                    {CATEGORIAS_PERSONALES.map((c) => (
                                      <option key={c.id} value={c.id} className="bg-white dark:bg-[#11191D] text-slate-900 dark:text-slate-100 font-semibold py-1">
                                        {c.emoji} {c.nombre}
                                      </option>
                                    ))}
                                  </select>
                                  <ChevronDown
                                    size={10}
                                    className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-60 text-slate-400"
                                  />
                                </div>
                              );
                            })()}
                          </td>
                          <td className="px-2.5 py-2 font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap text-[11px] max-w-[105px] xl:max-w-[130px] truncate" title={t.Entidad}>
                            {t.Entidad}
                          </td>
                          <td className="px-2.5 py-2 text-right font-bold text-slate-900 dark:text-white tabular-nums whitespace-nowrap text-xs">
                            {formatterPEN.format(t.Monto)}
                          </td>
                          <td className="px-2.5 py-2 text-center whitespace-nowrap">
                            {isProvisional ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 dark:bg-amber-900/80 text-amber-900 dark:text-amber-200">
                                <Clock size={10} /> Proyección
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300">
                                <CheckCircle2 size={10} /> Consolidado
                              </span>
                            )}
                          </td>
                          <td className="px-2.5 py-2 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1">
                              {/* Si está en proyección / amarillo: Mostrar Check de Aprobación */}
                              {isProvisional && (
                                <button
                                  onClick={() => handleApproveTransaction(t)}
                                  className="p-1 text-emerald-700 hover:text-emerald-950 dark:text-emerald-400 dark:hover:text-emerald-200 bg-emerald-100 dark:bg-emerald-950/80 hover:bg-emerald-200 dark:hover:bg-emerald-900/80 rounded-lg transition shadow-xs"
                                  title="Aprobar registro (Consolidar y quitar color amarillo)"
                                >
                                  <CheckCircle2 size={14} />
                                </button>
                              )}

                              {/* Botón de Devolver / Mover a Pago Pendiente */}
                              <button
                                onClick={() => handleSendToPending(t)}
                                className={`p-1 rounded-lg transition ${
                                  isProvisional
                                    ? 'text-amber-800 hover:text-amber-950 dark:text-amber-300 bg-amber-200/80 hover:bg-amber-300 dark:bg-amber-900/80 dark:hover:bg-amber-800 shadow-xs'
                                    : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                                }`}
                                title="Devolver a bandeja de Pagos Pendientes"
                              >
                                <RotateCcw size={14} />
                              </button>

                              {/* Botón de Eliminar permanente de la Base */}
                              <button
                                onClick={() => handleDeleteTransaction(t)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                                title="Eliminar fila de la tabla y de la base de datos permanentemente"
                              >
                                <Trash2 size={14} />
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
                <div className="h-64 flex items-center justify-center text-slate-400 text-xs">
                  Sin egresos en el periodo
                </div>
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData.slice(0, 6)}
                      layout="vertical"
                      margin={{ left: 0, right: 65, top: 4, bottom: 4 }}
                    >
                      <defs>
                        <linearGradient id="dash-bar-0" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#10B981" />
                          <stop offset="100%" stopColor="#34D399" />
                        </linearGradient>
                        <linearGradient id="dash-bar-1" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#06B6D4" />
                          <stop offset="100%" stopColor="#38BDF8" />
                        </linearGradient>
                        <linearGradient id="dash-bar-2" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#8B5CF6" />
                          <stop offset="100%" stopColor="#A78BFA" />
                        </linearGradient>
                        <linearGradient id="dash-bar-3" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#F59E0B" />
                          <stop offset="100%" stopColor="#FBBF24" />
                        </linearGradient>
                        <linearGradient id="dash-bar-4" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#F43F5E" />
                          <stop offset="100%" stopColor="#FB7185" />
                        </linearGradient>
                        <linearGradient id="dash-bar-5" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#3B82F6" />
                          <stop offset="100%" stopColor="#60A5FA" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255, 255, 255, 0.08)" />
                      <XAxis type="number" hide />
                      <YAxis
                        dataKey="displayName"
                        type="category"
                        width={125}
                        tickLine={false}
                        axisLine={false}
                        tick={({ x, y, payload }) => (
                          <text
                            x={x}
                            y={y}
                            dy={4}
                            textAnchor="end"
                            fill="#FFFFFF"
                            style={{ fill: '#FFFFFF', fontWeight: 700, fontSize: '11px' }}
                          >
                            {payload.value}
                          </text>
                        )}
                      />
                      <Tooltip 
                        formatter={(val: any) => [formatterPEN.format(Number(val) || 0), 'Total']}
                        contentStyle={{
                          backgroundColor: 'rgba(15, 23, 42, 0.95)',
                          backdropFilter: 'blur(8px)',
                          borderRadius: '12px',
                          color: '#fff',
                          fontSize: '12px',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          boxShadow: '0 8px 20px -4px rgba(0, 0, 0, 0.4)',
                        }}
                      />
                      <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={18}>
                        {chartData.slice(0, 6).map((_, index) => (
                          <Cell key={`cell-${index}`} fill={`url(#dash-bar-${index % 6})`} />
                        ))}
                        <LabelList
                          dataKey="value"
                          position="right"
                          formatter={(val: any) => formatterPEN.format(Number(val) || 0)}
                          fill="#FFFFFF"
                          style={{ fill: '#FFFFFF', fontWeight: 900, fontSize: '10px' }}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Resumen Top Categorías con Letras Blancas de Alto Contraste */}
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
              {chartData.slice(0, 4).map((c, i) => (
                <div key={c.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                    <span className="text-slate-900 dark:text-white font-bold truncate">{c.fullName}</span>
                  </div>
                  <span className="font-black text-slate-900 dark:text-white shrink-0 ml-2">{formatterPEN.format(c.value)}</span>
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
                    {CATEGORIAS_PERSONALES.map(c => (
                      <option key={c.id} value={c.nombre}>{c.emoji} {c.nombre}</option>
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
                    {CATEGORIAS_PERSONALES.map(c => (
                      <option key={c.id} value={c.nombre}>{c.emoji} {c.nombre}</option>
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

              {/* 💳 Opción de Compra en Cuotas con Tarjeta */}
              {newRowTipo === 'Egreso' && (isCreditCardLine(newRowEntidad) || Boolean(useCreditCardStore.getState().getCardByEntity(newRowEntidad))) && (
                <div className="p-3.5 bg-gradient-to-br from-indigo-50/90 to-blue-50/70 dark:from-indigo-950/40 dark:to-blue-950/30 border border-indigo-200/80 dark:border-indigo-900/60 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newRowEsCuotas}
                        onChange={e => setNewRowEsCuotas(e.target.checked)}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 accent-indigo-600 cursor-pointer"
                      />
                      <span className="font-black text-indigo-950 dark:text-indigo-200 text-xs flex items-center gap-1.5">
                        <CreditCard size={14} className="text-indigo-600 dark:text-indigo-400" />
                        ¿Deseas pagar esta compra en cuotas?
                      </span>
                    </label>
                    {newRowEsCuotas && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300">
                        {newRowCuotas} cuotas
                      </span>
                    )}
                  </div>

                  {newRowEsCuotas && (
                    <div className="space-y-3 pt-1 border-t border-indigo-100 dark:border-indigo-900/50">
                      {/* Botones rápidos de cuotas */}
                      <div>
                        <span className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                          Número de Cuotas:
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {[2, 3, 4, 6, 12, 18, 24].map(n => (
                            <button
                              key={n}
                              type="button"
                              onClick={() => setNewRowCuotas(n)}
                              className={`px-3 py-1.5 rounded-xl font-black text-xs transition ${
                                newRowCuotas === n
                                  ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-400/40'
                                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              {n}c
                            </button>
                          ))}
                          <input
                            type="number"
                            min="2"
                            max="48"
                            value={newRowCuotas || ''}
                            onChange={e => setNewRowCuotas(Math.max(2, parseInt(e.target.value) || 2))}
                            className="w-16 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-1 text-center font-bold text-slate-900 dark:text-white text-xs"
                            placeholder="Otro"
                          />
                        </div>
                      </div>

                      {/* Desglose dinámico del cronograma de facturación */}
                      {Number(newRowMonto) > 0 && newRowFecha && (() => {
                        const sched = calculateCardInstallmentSchedule(newRowEntidad, newRowFecha, Number(newRowMonto), newRowCuotas);
                        if (sched.length === 0) return null;
                        const primeraCuota = sched[0];
                        return (
                          <div className="p-3 bg-white/80 dark:bg-slate-900/70 border border-indigo-100 dark:border-indigo-900/40 rounded-xl space-y-2 text-[11px]">
                            <div className="flex items-center justify-between text-indigo-950 dark:text-indigo-200 font-black">
                              <span>Monto por cuota:</span>
                              <span className="text-sm text-emerald-700 dark:text-emerald-400 font-black">
                                {newRowCuotas} cuotas de {formatterPEN.format(primeraCuota.montoCuota)}
                              </span>
                            </div>

                            <div className="text-slate-600 dark:text-slate-300">
                              <span className="font-semibold">Facturación: </span>
                              Primera cuota se factura en <strong className="text-indigo-600 dark:text-indigo-400">{primeraCuota.mesLabel}</strong> (pago el {primeraCuota.fechaPago.slice(8, 10)}/{primeraCuota.fechaPago.slice(5, 7)}).
                            </div>

                            <div>
                              <span className="block font-semibold text-slate-500 dark:text-slate-400 mb-1">
                                Meses que afecta en proyecciones:
                              </span>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {sched.map(s => (
                                  <span
                                    key={s.mesPago}
                                    className="px-2 py-0.5 rounded-lg bg-indigo-100/80 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-300 font-bold text-[10px]"
                                  >
                                    {s.mesLabel} ({s.cuotaNumber}/{s.totalCuotas})
                                  </span>
                                ))}
                              </div>
                            </div>

                            <p className="text-[10px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800 leading-relaxed">
                              💡 El monto completo ({formatterPEN.format(Number(newRowMonto))}) se descontará en la tarjeta {newRowEntidad} hoy afectando tu línea disponible, y la deuda será dividida en las proyecciones de los meses posteriores de manera temporal.
                            </p>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}

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

      {/* ── ⚙️ MODAL DE CONFIGURACIÓN DE LÍNEAS DE CRÉDITO ── */}
      <CreditLineConfigModal
        isOpen={isCreditLineModalOpen}
        onClose={() => setIsCreditLineModalOpen(false)}
        initialEntity={selectedCardForConfig}
      />

      {/* ── 💰 MODAL DE BENEFICIOS LABORALES (GRATIFICACIÓN & CTS) ── */}
      <LaborBenefitsModal
        isOpen={isLaborBenefitsModalOpen}
        onClose={() => setIsLaborBenefitsModalOpen(false)}
      />

      {/* ── ✨ MODAL DE PROYECCIONES CASUALES DEL MES ── */}
      <CasualProjectionsModal
        isOpen={isCasualModalOpen}
        onClose={() => setIsCasualModalOpen(false)}
      />

      {/* ── 🗓️ MODAL DE DÍAS PUENTE DEL MES ANTERIOR ── */}
      <PrevMonthDaysConfigModal
        isOpen={isPrevMonthConfigModalOpen}
        onClose={() => setIsPrevMonthConfigModalOpen(false)}
        targetMonth={activeMonth}
      />

      {/* ── 💳 MODAL PARA REGISTRAR NUEVA TARJETA ── */}
      <AddCardModal
        isOpen={isAddCardModalOpen}
        onClose={() => setIsAddCardModalOpen(false)}
      />

    </div>
  );
};

