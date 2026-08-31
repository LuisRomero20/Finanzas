import React, { useState, useMemo } from 'react';
import { useFinanceStore, type Transaction } from '../store/financeStore';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  LineChart, Line
} from 'recharts';
import {
  Search,
  X,
  LineChart as ChartIcon,
  TrendingUp,
  TrendingDown,
  Wallet,
  ChevronDown,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Info,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Metric } from '../components/ui/Metric';
import { Badge } from '../components/ui/Badge';
import { autoClassify, getCategoryByIdOrLabel } from '../utils/categoryClassification';

const formatterPEN = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' });
const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Setiembre", "Octubre", "Noviembre", "Diciembre"];

// Paletas con alto contraste y distinción visual
const INGRESOS_COLORS = ['#047857', '#0284C7', '#6366F1', '#D97706', '#0D9488', '#8B5CF6', '#10B981', '#3B82F6'];
const EGRESOS_COLORS = [
  '#E11D48', '#D97706', '#059669', '#4F46E5', '#0284C7', '#9333EA', '#475569', '#0D9488',
  '#F43F5E', '#EA580C', '#16A34A', '#2563EB', '#7C3AED', '#DB2777', '#ca8a04', '#0891b2',
  '#4338ca', '#be123c', '#b45309', '#15803d', '#1d4ed8', '#6d28d9', '#a21caf', '#854d0e'
];

export const DashboardsPage: React.FC = () => {
  const { transactions } = useFinanceStore();
  const [view, setView] = useState<'Mensual' | 'Anual'>('Mensual');
  const [granularity, setGranularity] = useState<'micro' | 'macro'>('micro');
  const [selectedMonth, setSelectedMonth] = useState<string>(MESES[new Date().getMonth()]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConcept, setSelectedConcept] = useState<string | null>(null);

  const years = useMemo(() => {
    const y = new Set<number>();
    transactions.forEach(t => {
      const parts = t.Fecha.split('-');
      if (parts[0]) y.add(parseInt(parts[0], 10));
    });
    return Array.from(y).sort((a, b) => b - a);
  }, [transactions]);

  const filteredTxs = useMemo(() => {
    return transactions.filter(t => {
      const year = parseInt(t.Fecha.split('-')[0], 10);
      if (year !== selectedYear) return false;
      if (view === 'Mensual' && t.Mes !== selectedMonth) return false;
      return true;
    });
  }, [transactions, selectedYear, selectedMonth, view]);

  const getResolvedCategory = (t: Transaction): string => {
    if (granularity === 'macro') return t.Categoria;
    const catId = autoClassify(t);
    const catInfo = catId ? getCategoryByIdOrLabel(catId) : null;
    return catInfo ? catInfo.fullLabel : t.Categoria;
  };

  const ingresosTxs = filteredTxs.filter(t => t.Tipo === 'Ingreso');
  const egresosTxs = filteredTxs.filter(t => t.Tipo === 'Egreso');
  
  const totalIngresos = ingresosTxs.reduce((s, t) => s + t.Monto, 0);
  const totalEgresos = egresosTxs.reduce((s, t) => s + t.Monto, 0);
  const balance = totalIngresos - totalEgresos;

  // Resumen por Categoría (Macro o Micro según granularidad seleccionada)
  const catIngresos = useMemo(() => {
    const map = new Map<string, number>();
    ingresosTxs.forEach(t => {
      const cat = getResolvedCategory(t);
      map.set(cat, (map.get(cat) || 0) + t.Monto);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [ingresosTxs, granularity]);

  const catEgresos = useMemo(() => {
    const map = new Map<string, number>();
    egresosTxs.forEach(t => {
      const cat = getResolvedCategory(t);
      map.set(cat, (map.get(cat) || 0) + t.Monto);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [egresosTxs, granularity]);

  // Evolución anual
  const annualData = useMemo(() => {
    if (view !== 'Anual') return [];
    return MESES.map(mes => {
      const txsMes = transactions.filter(t => t.Mes === mes && t.Fecha.startsWith(selectedYear.toString()));
      const i = txsMes.filter(t => t.Tipo === 'Ingreso').reduce((s, t) => s + t.Monto, 0);
      const e = txsMes.filter(t => t.Tipo === 'Egreso').reduce((s, t) => s + t.Monto, 0);
      return { name: mes.substring(0, 3), Ingresos: i, Egresos: e };
    });
  }, [transactions, view, selectedYear]);

  // Top 5 Gastos
  const top5Gastos = useMemo(() => {
    const map = new Map<string, number>();
    egresosTxs
      .forEach(t => map.set(t.Concepto, (map.get(t.Concepto) || 0) + t.Monto));
    return Array.from(map.entries())
      .map(([name, Monto]) => ({ name, Monto, value: Monto }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [egresosTxs]);

  // Tendencia de Sueldo
  const sueldoTrendData = useMemo(() => {
    return MESES.map(mes => {
      const txs = transactions.filter(t => t.Mes === mes && t.Fecha.startsWith(selectedYear.toString()) && t.Concepto.toLowerCase() === 'sueldo');
      const total = txs.reduce((s, t) => s + t.Monto, 0);
      return { name: mes.substring(0, 3), Monto: total, value: total };
    });
  }, [transactions, selectedYear]);

  // Tendencia de Concepto Seleccionado
  const conceptTrendStats = useMemo(() => {
    if (!selectedConcept) return null;
    const monthlyData = MESES.map(mes => {
      const txs = transactions.filter(t => t.Mes === mes && t.Fecha.startsWith(selectedYear.toString()) && t.Concepto === selectedConcept);
      const total = txs.reduce((s, t) => s + t.Monto, 0);
      return { name: mes.substring(0, 3), mesCompleto: mes, Monto: total, count: txs.length };
    });

    const totalAnual = monthlyData.reduce((s, d) => s + d.Monto, 0);
    const activeMonths = monthlyData.filter(d => d.Monto > 0);
    const avgMonthly = activeMonths.length > 0 ? totalAnual / activeMonths.length : 0;
    const maxMonth = [...monthlyData].sort((a, b) => b.Monto - a.Monto)[0];

    return {
      monthlyData,
      totalAnual,
      avgMonthly,
      activeMonthsCount: activeMonths.length,
      maxMonthName: maxMonth?.mesCompleto || '-',
      maxMonthAmount: maxMonth?.Monto || 0,
    };
  }, [selectedConcept, selectedYear, transactions]);

  return (
    <div className="space-y-8">
      {/* ── HEADER ANALÍTICO ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-[#11191D] rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Análisis Financiero & Tendencias
            </h1>
            <Badge variant="primary">Inteligencia</Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Visualización estadística de flujos, estructura de costos y ratios de ahorro.
          </p>
        </div>

        {/* Controles de Vista */}
        <div className="flex items-center gap-2.5 flex-wrap">
          
          {/* Toggle Granularidad Macro (8) vs Micro (21) */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setGranularity('macro')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                granularity === 'macro'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Agrupar por los 8 rubros generales del sistema"
            >
              Macro (8)
            </button>
            <button
              onClick={() => setGranularity('micro')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                granularity === 'micro'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Agrupar por las 21 categorías granulares con emojis"
            >
              <Sparkles size={12} />
              <span>Detallado (21)</span>
            </button>
          </div>

          {/* Toggle Mensual / Anual */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setView('Mensual')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                view === 'Mensual'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Mensual
            </button>
            <button
              onClick={() => setView('Anual')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                view === 'Anual'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Anual
            </button>
          </div>

          {/* Selector de Mes */}
          {view === 'Mensual' && (
            <div className="relative">
              <select 
                className="appearance-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold py-2 pl-3 pr-8 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              >
                {MESES.map(m => <option key={m} value={m}>📅 {m}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={13} />
            </div>
          )}

          {/* Selector de Año */}
          <div className="relative">
            <select 
              className="appearance-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold py-2 pl-3 pr-8 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
            >
              {years.map(y => <option key={y} value={y}>Año {y}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={13} />
          </div>
        </div>
      </div>

      {/* ── KPI CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-white to-emerald-50/40 dark:from-[#11191D] dark:to-emerald-950/20 border-emerald-100 dark:border-slate-800">
          <Metric 
            label="Ingresos Totales" 
            value={formatterPEN.format(totalIngresos)} 
            subValue={view === 'Mensual' ? `Periodo ${selectedMonth}` : `Consolidado ${selectedYear}`}
            icon={<TrendingUp className="text-emerald-700 dark:text-emerald-400" size={20} />}
            color="text-emerald-950 dark:text-emerald-300"
          />
        </Card>
        <Card className="bg-gradient-to-br from-white to-slate-50 dark:from-[#11191D] dark:to-slate-800/30 border-slate-200 dark:border-slate-800">
          <Metric 
            label="Egresos Totales" 
            value={formatterPEN.format(totalEgresos)} 
            subValue="Consumos y servicios"
            icon={<TrendingDown className="text-slate-600 dark:text-slate-400" size={20} />}
            color="text-slate-900 dark:text-slate-100"
          />
        </Card>
        <Card className="bg-gradient-to-br from-white to-emerald-900/10 dark:from-[#11191D] dark:to-emerald-950/30 border-emerald-300 dark:border-emerald-800">
          <Metric 
            label="Balance Neto (Ahorro)" 
            value={formatterPEN.format(balance)} 
            subValue={balance >= 0 ? 'Flujo neto superavitario' : 'Flujo neto deficitario'}
            icon={<Wallet className="text-emerald-800 dark:text-emerald-400" size={20} />}
            color={balance >= 0 ? 'text-emerald-800 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}
          />
        </Card>
      </div>

      {/* ── VISTA ANUAL: EVOLUCIÓN ── */}
      {view === 'Anual' && (
        <Card className="h-96">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ChartIcon size={18} className="text-emerald-700 dark:text-emerald-400" />
                <span>Evolución Mensual de Ingresos vs Egresos ({selectedYear})</span>
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">Comparativa histórica mes a mes</p>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={annualData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={8} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(v) => `S/ ${v/1000}k`} />
                <RechartsTooltip cursor={{ fill: '#f1f5f9' }} formatter={(value: any) => formatterPEN.format(Number(value) || 0)} />
                <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
                <Bar dataKey="Ingresos" fill="#1B4332" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Egresos" fill="#E11D48" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* ── GRÁFICOS SECUNDARIOS (DONUTS) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Distribución de Egresos */}
        <Card className="h-96 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Distribución de Egresos {granularity === 'micro' ? '(21 Categorías)' : '(8 Rubros)'}
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">Participación porcentual en el gasto</p>
            </div>
            <Badge variant="default">{catEgresos.length} rubros</Badge>
          </div>
          <div className="flex-1 relative mt-2">
            {catEgresos.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={catEgresos} cx="40%" cy="50%" innerRadius={48} outerRadius={78} paddingAngle={3} dataKey="value" stroke="none">
                    {catEgresos.map((_, index) => (
                      <Cell key={`cell-egr-${index}`} fill={EGRESOS_COLORS[index % EGRESOS_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    formatter={(value: any) => [formatterPEN.format(Number(value) || 0), 'Total']}
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '12px', border: 'none' }}
                  />
                  <Legend 
                    verticalAlign="middle" 
                    align="right" 
                    layout="vertical" 
                    iconType="circle" 
                    wrapperStyle={{ fontSize: '11px', paddingLeft: '8px', maxHeight: '240px', overflowY: 'auto' }}
                    formatter={(value) => <span className="text-slate-800 dark:text-slate-200 font-bold text-[11px] truncate max-w-[140px] inline-block">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-xs">Sin egresos registrados</div>
            )}
          </div>
        </Card>

        {/* Distribución de Ingresos */}
        <Card className="h-96 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Fuentes de Ingreso {granularity === 'micro' ? '(21 Categorías)' : '(8 Rubros)'}
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">Origen de los flujos del periodo</p>
            </div>
            <Badge variant="default">{catIngresos.length} fuentes</Badge>
          </div>
          <div className="flex-1 relative mt-2">
            {catIngresos.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={catIngresos} cx="40%" cy="50%" innerRadius={48} outerRadius={78} paddingAngle={3} dataKey="value" stroke="none">
                    {catIngresos.map((_, index) => (
                      <Cell key={`cell-ing-${index}`} fill={INGRESOS_COLORS[index % INGRESOS_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    formatter={(value: any) => [formatterPEN.format(Number(value) || 0), 'Total']}
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '12px', border: 'none' }}
                  />
                  <Legend 
                    verticalAlign="middle" 
                    align="right" 
                    layout="vertical" 
                    iconType="circle" 
                    wrapperStyle={{ fontSize: '11px', paddingLeft: '8px', maxHeight: '240px', overflowY: 'auto' }}
                    formatter={(value) => <span className="text-slate-800 dark:text-slate-200 font-bold text-[11px] truncate max-w-[140px] inline-block">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-xs">Sin ingresos registrados</div>
            )}
          </div>
        </Card>
      </div>

      {/* ── TOP 5 GASTOS Y SUELDO TREND ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Top 5 Gastos */}
        <Card className="h-80 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Top 5 Gastos Más Significativos</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500">Conceptos con mayor volumen de desembolso</p>
          </div>
          <div className="flex-1 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={top5Gastos} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 11, fill: '#475569' }} />
                <RechartsTooltip 
                  formatter={(value: any) => [formatterPEN.format(Number(value) || 0), 'Total']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '12px', border: 'none' }}
                />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {top5Gastos.map((_, index) => (
                    <Cell key={`cell-bar-${index}`} fill={EGRESOS_COLORS[index % EGRESOS_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Evolución de Sueldo */}
        <Card className="h-80 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Evolución Histórica de Sueldo</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500">Percepción salarial registrada por mes</p>
          </div>
          <div className="flex-1 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sueldoTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={8} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(v) => `S/ ${v/1000}k`} />
                <RechartsTooltip 
                  formatter={(value: any) => [formatterPEN.format(Number(value) || 0), 'Sueldo']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '12px', border: 'none' }}
                />
                <Line type="monotone" dataKey="value" stroke="#047857" strokeWidth={3} dot={{ r: 4, fill: '#047857', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* ── SECCIÓN ANALÍTICA: CUADROS DETALLADOS POR CATEGORÍA ── */}
      <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
        
        {/* Header de la Sección y Buscador */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Layers size={20} className="text-emerald-700 dark:text-emerald-400" />
              <span>Desglose Detallado por Categorías & Comportamiento</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Haz clic en cualquier concepto para analizar su comportamiento y tendencia a lo largo del año.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input
              type="text"
              placeholder="Buscar concepto o partida..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-8 py-2 text-xs font-medium text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Cuadrícula de 2 Columnas perfectamente agrupada sin huecos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          
          {/* ═════════ COLUMNA 1: INGRESOS ═════════ */}
          <div className="space-y-4">
            
            {/* Encabezado Ingresos Totales */}
            <div className="bg-gradient-to-r from-[#0F2A1D] to-[#1B4332] dark:from-[#07130D] dark:to-[#0F2A1D] text-white rounded-2xl px-5 py-3.5 shadow-md flex items-center justify-between border border-emerald-950">
              <div className="flex items-center gap-2">
                <ArrowUpRight size={18} className="text-emerald-400" />
                <span className="font-bold text-sm tracking-wide uppercase">Ingresos Totales</span>
              </div>
              <span className="text-base font-black tracking-tight text-emerald-300">
                {formatterPEN.format(totalIngresos)}
              </span>
            </div>

            {/* Resumen de Ingresos */}
            <div className="bg-white dark:bg-[#11191D] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
              <div className="bg-[#0F2A1D] dark:bg-[#07130D] text-white px-4 py-2.5 flex items-center justify-between text-xs font-bold">
                <span>Resumen de Ingresos por Rubro</span>
                <span className="text-[10px] bg-emerald-800 dark:bg-emerald-950 text-emerald-200 px-2 py-0.5 rounded-full font-semibold">
                  {catIngresos.length} {catIngresos.length === 1 ? 'rubro' : 'rubros'}
                </span>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {catIngresos.map(cat => (
                  <div key={cat.name} className="px-4 py-2 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[240px]">{cat.name}</span>
                    <span className="font-bold text-slate-900 dark:text-white tabular-nums">{formatterPEN.format(cat.value)}</span>
                  </div>
                ))}
              </div>
              <div className="px-4 py-2.5 bg-slate-100/90 dark:bg-slate-800/90 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
                <span>Total General Ingresos</span>
                <span className="font-black text-emerald-950 dark:text-emerald-300">{formatterPEN.format(totalIngresos)}</span>
              </div>
            </div>

            {catIngresos.map(cat => {
              const txsCat = ingresosTxs.filter(t => getResolvedCategory(t) === cat.name);
              return <CategoryBox key={cat.name} title={cat.name} type="Ingreso" txs={txsCat} searchTerm={searchTerm} onSelectConcept={setSelectedConcept} />;
            })}
          </div>

          {/* ═════════ COLUMNA 2: EGRESOS ═════════ */}
          <div className="space-y-4">
            
            {/* Encabezado Egresos Totales */}
            <div className="bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] dark:from-[#0F2A1D] dark:to-[#1B4332] text-white rounded-2xl px-5 py-3.5 shadow-md flex items-center justify-between border border-emerald-950">
              <div className="flex items-center gap-2">
                <ArrowDownRight size={18} className="text-rose-400" />
                <span className="font-bold text-sm tracking-wide uppercase">Egresos Totales</span>
              </div>
              <span className="text-base font-black tracking-tight text-white">
                {formatterPEN.format(totalEgresos)}
              </span>
            </div>

            {/* Resumen de Egresos */}
            <div className="bg-white dark:bg-[#11191D] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
              <div className="bg-[#1B4332] dark:bg-[#07130D] text-white px-4 py-2.5 flex items-center justify-between text-xs font-bold">
                <span>Resumen de Egresos por Rubro</span>
                <span className="text-[10px] bg-emerald-900 dark:bg-emerald-950 text-emerald-200 px-2 py-0.5 rounded-full font-semibold">
                  {catEgresos.length} {catEgresos.length === 1 ? 'rubro' : 'rubros'}
                </span>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {catEgresos.map(cat => (
                  <div key={cat.name} className="px-4 py-2 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[240px]">{cat.name}</span>
                    <span className="font-bold text-slate-900 dark:text-white tabular-nums">{formatterPEN.format(cat.value)}</span>
                  </div>
                ))}
              </div>
              <div className="px-4 py-2.5 bg-slate-100/90 dark:bg-slate-800/90 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
                <span>Total General Egresos</span>
                <span className="font-black text-rose-900 dark:text-rose-400">{formatterPEN.format(totalEgresos)}</span>
              </div>
            </div>

            {catEgresos.map(cat => {
              const txsCat = egresosTxs.filter(t => getResolvedCategory(t) === cat.name);
              return <CategoryBox key={cat.name} title={cat.name} type="Egreso" txs={txsCat} searchTerm={searchTerm} onSelectConcept={setSelectedConcept} />;
            })}
          </div>
        </div>
      </div>

      {/* ── MODAL DE COMPORTAMIENTO & TENDENCIA HISTÓRICA ── */}
      {selectedConcept && conceptTrendStats && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedConcept(null)}>
          <div className="bg-white dark:bg-[#11191D] text-slate-900 dark:text-slate-100 rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150" onClick={e => e.stopPropagation()}>
            
            {/* Header Modal */}
            <div className="bg-[#0F2A1D] dark:bg-[#07130D] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/20 rounded-xl">
                  <Sparkles className="text-emerald-400" size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold tracking-tight text-white">
                    Comportamiento: <span className="text-emerald-300">{selectedConcept}</span>
                  </h3>
                  <p className="text-xs text-emerald-200/70">
                    Historial y evolución mes a mes durante el año {selectedYear}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedConcept(null)}
                className="p-1.5 text-emerald-300 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* KPIs del Concepto */}
            <div className="grid grid-cols-3 gap-3 p-5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-xs">
              <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-xs">
                <p className="text-[11px] font-bold uppercase text-slate-400 dark:text-slate-500">Total Anual</p>
                <p className="text-lg font-black text-slate-900 dark:text-white mt-0.5 tabular-nums">
                  {formatterPEN.format(conceptTrendStats.totalAnual)}
                </p>
              </div>
              <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-xs">
                <p className="text-[11px] font-bold uppercase text-slate-400 dark:text-slate-500">Promedio Mensual</p>
                <p className="text-lg font-black text-emerald-800 dark:text-emerald-400 mt-0.5 tabular-nums">
                  {formatterPEN.format(conceptTrendStats.avgMonthly)}
                </p>
              </div>
              <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-xs">
                <p className="text-[11px] font-bold uppercase text-slate-400 dark:text-slate-500">Mes Pico</p>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1 truncate">
                  {conceptTrendStats.maxMonthName} ({formatterPEN.format(conceptTrendStats.maxMonthAmount)})
                </p>
              </div>
            </div>

            {/* Gráfico de Línea */}
            <div className="p-6 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={conceptTrendStats.monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={8} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(v) => `S/ ${v/1000}k`} />
                  <RechartsTooltip 
                    cursor={{ stroke: '#94a3b8', strokeWidth: 1 }} 
                    formatter={(value: any) => [formatterPEN.format(Number(value) || 0), 'Monto']}
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '12px', border: 'none' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="Monto" 
                    stroke="#10B981" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: '#10B981', strokeWidth: 2, stroke: '#fff' }} 
                    activeDot={{ r: 6, fill: '#0F2A1D' }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Footer Modal */}
            <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <Info size={13} className="text-slate-400" />
                Registrado en {conceptTrendStats.activeMonthsCount} meses del año.
              </span>
              <button
                onClick={() => setSelectedConcept(null)}
                className="bg-slate-800 dark:bg-slate-700 hover:bg-black dark:hover:bg-slate-600 text-white font-bold px-4 py-1.5 rounded-xl transition text-xs shadow-xs cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const CategoryBox: React.FC<{
  title: string;
  type: 'Ingreso' | 'Egreso';
  txs: Transaction[];
  searchTerm: string;
  onSelectConcept: (concept: string) => void;
}> = ({ title, type, txs, searchTerm, onSelectConcept }) => {
  const grouped = useMemo(() => {
    const map = new Map<string, number>();
    txs.forEach(t => {
      map.set(t.Concepto, (map.get(t.Concepto) || 0) + t.Monto);
    });
    return Array.from(map.entries())
      .filter(([concepto]) => !searchTerm || concepto.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => b[1] - a[1]);
  }, [txs, searchTerm]);

  const total = grouped.reduce((sum, [, monto]) => sum + monto, 0);

  if (grouped.length === 0) return null;

  return (
    <div className="bg-white dark:bg-[#11191D] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden transition-all hover:shadow-md">
      
      {/* Header Categoría */}
      <div className={`px-4 py-2.5 flex items-center justify-between text-white font-bold text-xs ${
        type === 'Ingreso' ? 'bg-[#0F2A1D] dark:bg-[#07130D]' : 'bg-[#1B4332] dark:bg-[#0c1f17]'
      }`}>
        <div className="flex items-center gap-1.5 truncate">
          <span className="truncate">{title}</span>
        </div>
        <span className="text-[10px] font-semibold bg-white/20 px-2 py-0.5 rounded-full">
          {grouped.length} {grouped.length === 1 ? 'ítem' : 'ítems'}
        </span>
      </div>

      {/* Subheader Columnas */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
        <span>Concepto</span>
        <span>Monto</span>
      </div>

      {/* Rows */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-56 overflow-y-auto">
        {grouped.map(([concepto, monto]) => (
          <div
            key={concepto}
            onClick={() => onSelectConcept(concepto)}
            className="px-4 py-2 flex items-center justify-between text-xs hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 cursor-pointer group transition-colors"
            title="Haz clic para ver el comportamiento histórico"
          >
            <div className="flex items-center gap-1.5 min-w-0 pr-2">
              <span className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-emerald-800 dark:group-hover:text-emerald-400 truncate">
                {concepto}
              </span>
              <TrendingUp size={12} className="text-slate-300 dark:text-slate-600 group-hover:text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </div>
            <span className="font-bold text-slate-900 dark:text-white tabular-nums shrink-0">
              {formatterPEN.format(monto)}
            </span>
          </div>
        ))}
      </div>

      {/* Total Footer */}
      <div className="px-4 py-2 bg-slate-100/90 dark:bg-slate-800/90 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
        <span>Total {title}</span>
        <span className="text-slate-950 dark:text-white font-black tabular-nums">{formatterPEN.format(total)}</span>
      </div>

    </div>
  );
};
