import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store';
import DebtCard from '../components/ui/DebtCard';
import { Card } from '../components/ui/Card';
import { Metric } from '../components/ui/Metric';
import { Badge } from '../components/ui/Badge';
import { calcularCuota as calcUtil, addMonthsKeepingDay } from '../utils/debtUtils';
import {
  Landmark,
  PlusCircle,
  FolderInput,
  DollarSign,
  Calendar,
  CheckCircle2,
  HelpCircle,
  Clock,
  ArrowRight,
  TrendingDown,
  Layers,
} from 'lucide-react';

function fmtMoney(moneda: string, v: number | null | undefined) {
  try {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: moneda }).format(v || 0);
  } catch {
    return `${moneda} ${Number(v || 0).toFixed(2)}`;
  }
}

function calcularCuota(deuda: any) {
  return calcUtil(deuda);
}

export const HojaDeudas: React.FC = () => {
  const { deudas, agregarDeuda } = useAppStore();
  const [showForm, setShowForm] = useState(false);
  const [input, setInput] = useState({
    acreedor: '',
    moneda: 'PEN',
    monto: 0,
    tasa_anual: 0.085,
    plazo_meses: 12,
    tipo_tasa: 'efectiva',
    fecha_inicio: new Date().toISOString().slice(0, 10),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await agregarDeuda({
        acreedor: input.acreedor,
        monto: Number(input.monto),
        tasa_anual: Number(input.tasa_anual),
        plazo_meses: Number(input.plazo_meses),
        tipo_tasa: input.tipo_tasa as 'efectiva' | 'nominal',
        moneda: input.moneda,
        fecha_inicio: input.fecha_inicio,
      });
      setShowForm(false);
      setInput({ acreedor: '', moneda: 'PEN', monto: 0, tasa_anual: 0.085, plazo_meses: 12, tipo_tasa: 'efectiva', fecha_inicio: new Date().toISOString().slice(0, 10) });
    } catch (err) {
      // Error handled in store
    }
  };

  const stats = useMemo(() => {
    const totalPEN = deudas.filter(d => d.moneda === 'PEN' && d.estado !== 'pagada').reduce((s, d) => s + d.monto, 0);
    const totalUSD = deudas.filter(d => d.moneda === 'USD' && d.estado !== 'pagada').reduce((s, d) => s + d.monto, 0);
    const pendienteMes = deudas.filter(d => d.estado === 'activa').reduce((s, d) => {
      const i_m = d.tipo_tasa === 'efectiva' ? Math.pow(1 + d.tasa_anual, 1/12) - 1 : d.tasa_anual / 12;
      const n = Math.max(0, d.plazo_meses - d.meses_pagados);
      if (i_m <= 0 || n <= 0) return s;
      const cuota = (d.monto * i_m) / (1 - Math.pow(1 + i_m, -n));
      return s + cuota;
    }, 0);
    const cuotasPendientes = deudas.filter(d => d.estado === 'activa').reduce((c, d) => c + Math.max(0, d.plazo_meses - d.meses_pagados), 0);
    return { totalPEN, totalUSD, pendienteMes, cuotasPendientes };
  }, [deudas]);

  const deudasActivas = deudas.filter(d => d.estado !== 'pagada');
  const deudasPagadas = deudas.filter(d => d.estado === 'pagada');

  return (
    <div className="space-y-8">
      
      {/* ── HEADER EJECUTIVO ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-[#11191D] rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Gestión de Pasivos & Obligaciones
            </h1>
            <span className="text-[10px] font-bold uppercase tracking-widest bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 px-2.5 py-0.5 rounded-full">
              Amortización
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Seguimiento de préstamos, cronograma de amortización y compromisos mensuales.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setShowForm(s => !s)}
            className="flex items-center gap-1.5 bg-[#0F2A1D] dark:bg-emerald-700 hover:bg-black dark:hover:bg-emerald-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm hover:shadow-md transition"
          >
            <PlusCircle size={15} />
            <span>{showForm ? 'Cerrar Formulario' : 'Registrar Nueva Deuda'}</span>
          </button>
          <button
            onClick={() => { try { useAppStore.getState().importarDeudasDesdeHistorico(); } catch {} }}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3.5 py-2.5 rounded-xl border border-slate-200 transition"
          >
            <FolderInput size={15} />
            <span>Importar de Histórico</span>
          </button>
        </div>
      </div>

      {/* ── KPI METRICS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-white to-amber-50/30 dark:from-[#11191D] dark:to-amber-950/20 border-amber-200/80 dark:border-slate-800">
          <Metric 
            label="Pasivo Total en Soles" 
            value={`S/ ${stats.totalPEN.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            subValue="Capital total pendiente"
            icon={<Landmark className="text-amber-700 dark:text-amber-400" size={20} />}
            color="text-amber-950 dark:text-amber-300"
          />
        </Card>
        <Card className="bg-gradient-to-br from-white to-slate-50 dark:from-[#11191D] dark:to-slate-800/30 border-slate-200 dark:border-slate-800">
          <Metric 
            label="Pasivo Total en Dólares" 
            value={`$ ${stats.totalUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            subValue="Compromisos en moneda extranjera"
            icon={<DollarSign className="text-slate-600 dark:text-slate-400" size={20} />}
            color="text-slate-900 dark:text-slate-100"
          />
        </Card>
        <Card className="bg-gradient-to-br from-white to-emerald-50/40 dark:from-[#11191D] dark:to-emerald-950/20 border-emerald-200/70 dark:border-slate-800">
          <Metric 
            label="Compromiso Mensual Estimado" 
            value={`S/ ${stats.pendienteMes.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            subValue="Suma de cuotas del mes"
            icon={<Calendar className="text-emerald-700 dark:text-emerald-400" size={20} />}
            color="text-emerald-950 dark:text-emerald-300"
          />
        </Card>
        <Card className="bg-gradient-to-br from-white to-slate-50 dark:from-[#11191D] dark:to-slate-800/30 border-slate-200 dark:border-slate-800">
          <Metric 
            label="Cuotas Pendientes" 
            value={String(stats.cuotasPendientes)}
            subValue="Total cuotas por amortizar"
            icon={<Clock className="text-slate-500 dark:text-slate-400" size={20} />}
            color="text-slate-900 dark:text-slate-100"
          />
        </Card>
      </div>

      {/* ── FORMULARIO NUEVA DEUDA ── */}
      {showForm && (
        <div className="bg-white border border-emerald-200 rounded-3xl p-6 shadow-md animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">Registrar Nueva Obligación Financiera</h2>
              <p className="text-xs text-slate-500">Ingresa los datos del crédito, tasa y cuotas para calcular el cronograma.</p>
            </div>
            <button onClick={() => setShowForm(false)} className="text-xs text-slate-400 hover:text-slate-700">✕ Cerrar</button>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-600 mb-1">Acreedor / Producto Financiero</label>
              <input
                placeholder="Ej. Préstamo BCP, Yape Crédito, Amortización Personal"
                value={input.acreedor}
                onChange={(e) => setInput({ ...input, acreedor: e.target.value })}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Moneda</label>
              <select
                value={input.moneda}
                onChange={(e) => setInput({ ...input, moneda: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="PEN">Soles (PEN)</option>
                <option value="USD">Dólares (USD)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Monto Inicial del Capital</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={input.monto || ''}
                onChange={(e) => setInput({ ...input, monto: Number(e.target.value) })}
                required
                placeholder="0.00"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Tipo de Tasa</label>
              <select
                value={input.tipo_tasa}
                onChange={(e) => setInput({ ...input, tipo_tasa: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="efectiva">Efectiva Anual (TEA)</option>
                <option value="nominal">Nominal Anual (TNA)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Tasa Anual (ej. 0.085 = 8.5%)</label>
              <input
                type="number"
                step="0.0001"
                min="0"
                value={input.tasa_anual}
                onChange={(e) => setInput({ ...input, tasa_anual: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Número de Cuotas (Plazo Meses)</label>
              <input
                type="number"
                min="1"
                value={input.plazo_meses}
                onChange={(e) => setInput({ ...input, plazo_meses: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Fecha de Inicio / Primer Pago</label>
              <input
                type="date"
                value={input.fecha_inicio}
                onChange={(e) => setInput({ ...input, fecha_inicio: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-4 flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-5 py-2 rounded-xl text-xs shadow transition"
              >
                Guardar Obligación
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── DEUDAS ACTIVAS ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Obligaciones Activas</h2>
            <Badge variant="warning">{deudasActivas.length} activas</Badge>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span> Cuota Pagada
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span> Cuota Pendiente
            </span>
          </div>
        </div>

        {deudasActivas.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-sm">
            <CheckCircle2 size={40} className="text-emerald-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">¡No tienes deudas activas registradas!</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Puedes agregar nuevos compromisos financieros usando el botón superior "Registrar Nueva Deuda".
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {deudasActivas.map((d) => (
              <DebtCard key={d.id} deuda={d} />
            ))}
          </div>
        )}
      </div>

      {/* ── HISTÓRICO DE DEUDAS FINALIZADAS ── */}
      {deudasPagadas.length > 0 && (
        <div className="pt-4 border-t border-slate-200">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-base font-bold text-slate-700">Obligaciones Canceladas & Finalizadas</h2>
            <Badge variant="success">{deudasPagadas.length} saldadas</Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {deudasPagadas.map((d) => (
              <div key={d.id} className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm opacity-80 hover:opacity-100 transition">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm text-slate-800 truncate">{d.acreedor}</span>
                  <Badge variant="success">Cancelada</Badge>
                </div>
                <p className="text-xs text-slate-400">Total: {fmtMoney(d.moneda, d.monto)} · {d.meses_pagados}/{d.plazo_meses} cuotas pagadas</p>
                <p className="text-[11px] text-slate-400 mt-2">Inicio: {new Date(d.fecha_inicio).toLocaleDateString('es-PE')}</p>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
