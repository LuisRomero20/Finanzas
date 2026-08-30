import React, { useState, useEffect, useMemo } from 'react';
import { useFinanceStore } from '../store/financeStore';
import { useAppStore } from '../store';
import {
  checkSupabaseHealth,
  migrateMasterTransactionsToSupabase,
  type CloudMigrationStatus,
  type SupabaseHealth,
} from '../services/supabaseService';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import {
  Smartphone,
  Send,
  Sparkles,
  Cloud,
  CloudCheck,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  CreditCard,
  Building2,
  Calendar,
  Tag,
  CheckCircle2,
  AlertCircle,
  Database,
  ArrowRight,
  Plus,
  Trash2,
  Clock,
  History,
  ShoppingBag,
  Coffee,
  Car,
  Home,
  HeartPulse,
  DollarSign,
  Zap,
  Briefcase,
  PiggyBank,
  Wallet,
} from 'lucide-react';

const ENTIDADES_LIST = [
  { id: 'Interbank', label: 'Interbank', desc: 'Débito Principal', icon: Building2, color: 'bg-emerald-600' },
  { id: 'BBVA Bfree', label: 'BBVA Bfree', desc: 'Tarjeta Crédito', icon: CreditCard, color: 'bg-blue-600' },
  { id: 'Interbank Amex', label: 'Interbank Amex', desc: 'Tarjeta Crédito', icon: CreditCard, color: 'bg-indigo-600' },
  { id: 'Ripley', label: 'Ripley', desc: 'Tarjeta Crédito', icon: CreditCard, color: 'bg-purple-600' },
  { id: 'BCP', label: 'BCP', desc: 'Cuenta Ahorro', icon: Building2, color: 'bg-orange-600' },
  { id: 'Efectivo', label: 'Efectivo', desc: 'Billetera física', icon: DollarSign, color: 'bg-slate-600' },
];

const CATEGORIAS_LIST = [
  { id: 'Sueldo', label: 'Sueldo', icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40' },
  { id: 'Servicio', label: 'Servicio', icon: Zap, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40' },
  { id: 'Gasto', label: 'Gasto', icon: ShoppingBag, color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/40' },
  { id: 'Ahorro', label: 'Ahorro', icon: PiggyBank, color: 'text-teal-500 bg-teal-50 dark:bg-teal-950/40' },
  { id: 'Deuda', label: 'Deuda', icon: CreditCard, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40' },
  { id: 'Negocio', label: 'Negocio', icon: Briefcase, color: 'text-violet-500 bg-violet-50 dark:bg-violet-950/40' },
  { id: 'Otro Ing', label: 'Otro Ing', icon: DollarSign, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/40' },
  { id: 'Otro Egre', label: 'Otro Egre', icon: TrendingDown, color: 'text-slate-500 bg-slate-100 dark:bg-slate-800' },
];

const QUICK_CONCEPTS = [
  'Almuerzo',
  'Uber / Taxi',
  'Supermercado',
  'Netflix',
  'Farmacia',
  'Gasolina',
  'Café / Snack',
  'Corte de Cabello',
  'iCloud',
  'Sueldo Quincena',
];

const fmt = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' });

export const RegistroMovimientoPage: React.FC = () => {
  const { transactions, addTransaction, deleteTransaction, syncFromSupabase, isSyncingCloud } = useFinanceStore();
  const { agregarNotificacion } = useAppStore();

  // Estados del Formulario
  const [tipo, setTipo] = useState<'Egreso' | 'Ingreso'>('Egreso');
  const [monto, setMonto] = useState<string>('');
  const [concepto, setConcepto] = useState<string>('');
  const [entidad, setEntidad] = useState<string>('Interbank');
  const [categoria, setCategoria] = useState<string>('Gasto');
  const [fecha, setFecha] = useState<string>(() => new Date().toLocaleDateString('en-CA'));

  // Estados de la nube y migración
  const [cloudHealth, setCloudHealth] = useState<SupabaseHealth | null>(null);
  const [migrationStatus, setMigrationStatus] = useState<CloudMigrationStatus | null>(null);
  const [showMigrationPanel, setShowMigrationPanel] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Verificar conexión de Supabase al montar
  useEffect(() => {
    checkSupabaseHealth().then(setCloudHealth);
  }, []);

  // Quick Amount additions
  const addQuickAmount = (val: number) => {
    const current = parseFloat(monto || '0');
    setMonto((current + val).toFixed(2));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numMonto = parseFloat(monto);
    if (isNaN(numMonto) || numMonto <= 0) {
      agregarNotificacion('Por favor ingresa un monto válido mayor a 0.', 'warning');
      return;
    }
    if (!concepto.trim()) {
      agregarNotificacion('Por favor escribe un concepto o descripción.', 'warning');
      return;
    }

    setIsSubmitting(true);

    const newTx = addTransaction({
      Tipo: tipo,
      Fecha: fecha,
      Categoria: categoria,
      Concepto: concepto.trim(),
      Monto: numMonto,
      Entidad: entidad,
    });

    agregarNotificacion(`✅ ${tipo} "${newTx.Concepto}" (${fmt.format(numMonto)}) guardado con éxito y sincronizado a la nube.`, 'success');

    // Resetear formulario para el siguiente gasto rápido
    setMonto('');
    setConcepto('');
    setIsSubmitting(false);
  };

  const handleStartMigration = async () => {
    if (confirm(`¿Iniciar la migración de ${transactions.length} registros a tu base de datos de Supabase?`)) {
      const result = await migrateMasterTransactionsToSupabase((status) => {
        setMigrationStatus(status);
      }, transactions);

      if (result.success) {
        agregarNotificacion('🚀 ¡Histórico maestro migrado a Supabase con éxito!', 'success');
        checkSupabaseHealth().then(setCloudHealth);
      } else {
        agregarNotificacion(`Error en migración: ${result.error}`, 'error');
      }
    }
  };

  const handleManualCloudSync = async () => {
    const count = await syncFromSupabase();
    if (count > 0) {
      agregarNotificacion(`☁️ Sincronizados ${count} registros desde Supabase.`, 'success');
      checkSupabaseHealth().then(setCloudHealth);
    } else {
      agregarNotificacion('No se encontraron nuevos registros en la nube o no hay conexión.', 'info');
    }
  };

  // Últimos 10 movimientos ordenados del más reciente al más antiguo
  const recentTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => b.Fecha.localeCompare(a.Fecha)).slice(0, 10);
  }, [transactions]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      
      {/* ── HEADER MOBILE-FIRST ── */}
      <div className="bg-white dark:bg-[#11191D] rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2.5 rounded-2xl bg-emerald-700 text-white shadow-sm">
              <Smartphone size={22} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                Registro Rápido
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Formulario optimizado para registrar tus ingresos y gastos al instante desde tu celular o desktop.
              </p>
            </div>
          </div>
        </div>

        {/* Cloud Status Pill & Sync Button */}
        <div className="flex items-center gap-2 flex-wrap">
          {cloudHealth?.connected ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold shadow-xs">
              <CloudCheck size={16} className="text-emerald-600 dark:text-emerald-400" />
              <span>Nube Supabase Conectada</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-bold shadow-xs">
              <Cloud size={16} className="text-amber-600" />
              <span>Modo Local / Offline</span>
            </div>
          )}

          <button
            onClick={handleManualCloudSync}
            disabled={isSyncingCloud}
            className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition cursor-pointer"
            title="Sincronizar con Supabase"
          >
            <RefreshCw size={16} className={isSyncingCloud ? 'animate-spin' : ''} />
          </button>

          <button
            onClick={() => setShowMigrationPanel(!showMigrationPanel)}
            className="flex items-center gap-1 text-xs font-bold px-3 py-2 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 rounded-xl transition"
          >
            <Database size={14} />
            <span>Migrar Maestro</span>
          </button>
        </div>
      </div>

      {/* ── PANEL DE MIGRACIÓN HISTÓRICA A SUPABASE (DESPLEGABLE) ── */}
      {showMigrationPanel && (
        <Card className="border-indigo-200 dark:border-indigo-900 bg-gradient-to-br from-indigo-50/50 to-white dark:from-indigo-950/30 dark:to-[#11191D] p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Database className="text-indigo-600 dark:text-indigo-400" size={20} />
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                  Migración de Base de Datos Maestra a Supabase
                </h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Sube todos tus <strong>{transactions.length} registros históricos</strong> a la tabla <code>transacciones</code> en Supabase para que queden centralizados en la nube y accesibles desde cualquier dispositivo.
              </p>
            </div>
            <button
              onClick={() => setShowMigrationPanel(false)}
              className="text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              Cerrar
            </button>
          </div>

          {/* Progress bar si está en curso */}
          {migrationStatus?.inProgress && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-700 dark:text-slate-300">{migrationStatus.statusText}</span>
                <span className="text-indigo-600 dark:text-indigo-400">{migrationStatus.percentage}%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${migrationStatus.percentage}%` }}
                />
              </div>
            </div>
          )}

          {migrationStatus?.success && (
            <div className="p-3 bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 rounded-xl text-emerald-900 dark:text-emerald-200 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 size={16} />
              <span>{migrationStatus.statusText}</span>
            </div>
          )}

          {migrationStatus?.error && (
            <div className="p-3 bg-rose-100 dark:bg-rose-950/80 border border-rose-300 rounded-xl text-rose-900 dark:text-rose-200 text-xs font-bold flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{migrationStatus.statusText}</span>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleStartMigration}
              disabled={migrationStatus?.inProgress}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md transition disabled:opacity-50"
            >
              <Database size={15} />
              <span>{migrationStatus?.inProgress ? 'Migrando en progreso...' : '🚀 Iniciar Migración a Supabase'}</span>
            </button>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Usa operaciones UPSERT (no duplica si ya existen IDs).
            </span>
          </div>
        </Card>
      )}

      {/* ── FORMULARIO PRINCIPAL MOBILE-FIRST ── */}
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* 1. Selector de Tipo (Egreso / Ingreso) */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setTipo('Egreso')}
            className={`py-3.5 px-4 rounded-2xl border flex items-center justify-center gap-2 font-black text-sm sm:text-base transition cursor-pointer ${
              tipo === 'Egreso'
                ? 'bg-rose-600 border-rose-600 text-white shadow-md shadow-rose-600/20 ring-2 ring-rose-600/30'
                : 'bg-white dark:bg-[#11191D] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
            }`}
          >
            <TrendingDown size={18} />
            <span>🔴 Gasto / Egreso</span>
          </button>
          
          <button
            type="button"
            onClick={() => setTipo('Ingreso')}
            className={`py-3.5 px-4 rounded-2xl border flex items-center justify-center gap-2 font-black text-sm sm:text-base transition cursor-pointer ${
              tipo === 'Ingreso'
                ? 'bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-600/20 ring-2 ring-emerald-600/30'
                : 'bg-white dark:bg-[#11191D] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
            }`}
          >
            <TrendingUp size={18} />
            <span>🟢 Ingreso / Cobro</span>
          </button>
        </div>

        {/* 2. Display Gigante de Monto */}
        <Card className="p-6 text-center space-y-3 bg-white dark:bg-[#11191D] border-slate-200/80 dark:border-slate-800 shadow-sm">
          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block">
            Monto del Movimiento
          </label>
          <div className="flex items-center justify-center">
            <span className="text-3xl sm:text-4xl font-black text-slate-400 dark:text-slate-600 mr-2">S/</span>
            <input
              type="number"
              step="0.01"
              required
              autoFocus
              placeholder="0.00"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white bg-transparent text-center focus:outline-none w-64 border-b-2 border-slate-200 dark:border-slate-700 focus:border-emerald-500 pb-1"
            />
          </div>

          {/* Botones de Montos Rápidos */}
          <div className="flex items-center justify-center gap-2 pt-2 flex-wrap">
            {[10, 20, 50, 100, 200].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => addQuickAmount(val)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 hover:text-emerald-700 dark:hover:text-emerald-300 text-slate-700 dark:text-slate-300 text-xs font-bold transition border border-slate-200 dark:border-slate-700"
              >
                +{val}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setMonto('')}
              className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-bold transition border border-rose-200 dark:border-rose-900/60"
            >
              Borrar
            </button>
          </div>
        </Card>

        {/* 3. Selector Visual de Banco / Entidad */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Building2 size={15} className="text-emerald-600" />
            <span>Cuenta o Tarjeta de Pago</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {ENTIDADES_LIST.map((ent) => {
              const IconComp = ent.icon;
              const isSelected = entidad === ent.id;
              return (
                <button
                  key={ent.id}
                  type="button"
                  onClick={() => setEntidad(ent.id)}
                  className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white dark:bg-emerald-700 dark:border-emerald-600 shadow-md ring-2 ring-emerald-500/30'
                      : 'bg-white dark:bg-[#11191D] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className={`p-2 rounded-xl text-white ${ent.color}`}>
                    <IconComp size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-xs truncate">{ent.label}</p>
                    <p className="text-[10px] opacity-75 truncate">{ent.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Selector de Categoría con Chips */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Tag size={15} className="text-indigo-600" />
            <span>Categoría</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {CATEGORIAS_LIST.map((cat) => {
              const IconComp = cat.icon;
              const isSelected = categoria === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoria(cat.id)}
                  className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition cursor-pointer text-xs font-bold ${
                    isSelected
                      ? 'bg-emerald-700 border-emerald-700 text-white shadow-sm ring-2 ring-emerald-500/20'
                      : 'bg-white dark:bg-[#11191D] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-white/20 text-white' : cat.color}`}>
                    <IconComp size={14} />
                  </div>
                  <span className="truncate">{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 5. Concepto y Sugerencias Rápidas */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Sparkles size={15} className="text-amber-500" />
            <span>Concepto / Detalle</span>
          </label>
          <input
            type="text"
            required
            placeholder="Ej: Almuerzo ejecutivo, Uber, Netflix, etc."
            value={concepto}
            onChange={(e) => setConcepto(e.target.value)}
            className="w-full bg-white dark:bg-[#11191D] border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-slate-900 dark:text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
          />

          {/* Sugerencias Rápidas de Conceptos */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 mr-1">Rápidos:</span>
            {QUICK_CONCEPTS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setConcepto(c)}
                className="text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg transition"
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* 6. Selector de Fecha */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Calendar size={15} className="text-slate-500" />
            <span>Fecha del Movimiento</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="date"
              required
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="bg-white dark:bg-[#11191D] border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-2.5 text-slate-900 dark:text-white font-bold text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
            />
            <button
              type="button"
              onClick={() => setFecha(new Date().toLocaleDateString('en-CA'))}
              className="text-xs font-bold px-3 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl transition"
            >
              Hoy
            </button>
          </div>
        </div>

        {/* 7. Botón Gigante de Guardar */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-[#0F2A1D] dark:bg-emerald-700 hover:bg-black dark:hover:bg-emerald-600 text-white font-black text-base py-4 rounded-2xl shadow-lg hover:shadow-xl transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <Zap size={20} className="text-amber-400" />
          <span>⚡ Guardar Movimiento al Instante</span>
        </button>

      </form>

      {/* ── HISTORIAL DE ÚLTIMOS REGISTROS INGRESADOS ── */}
      <div className="bg-white dark:bg-[#11191D] rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History size={18} className="text-slate-500" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Últimos Movimientos Registrados
            </h3>
          </div>
          <Badge variant="default">{recentTransactions.length} recientes</Badge>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {recentTransactions.map((t) => (
            <div key={t.id} className="py-3 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3 min-w-0">
                <Badge variant={t.Tipo === 'Ingreso' ? 'success' : 'default'}>
                  {t.Tipo}
                </Badge>
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 dark:text-white truncate">{t.Concepto}</p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                    {t.Fecha} • {t.Entidad} • {t.Categoria}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="font-black text-slate-900 dark:text-white tabular-nums text-sm">
                  {fmt.format(t.Monto)}
                </span>
                <button
                  onClick={() => {
                    if (confirm(`¿Eliminar "${t.Concepto}"?`)) {
                      deleteTransaction(t.id);
                      agregarNotificacion(`Transacción "${t.Concepto}" eliminada.`, 'info');
                    }
                  }}
                  className="p-1 text-slate-400 hover:text-rose-600 transition"
                  title="Eliminar"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
