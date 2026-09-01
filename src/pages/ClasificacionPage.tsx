import React, { useState, useMemo } from 'react';
import { useFinanceStore } from '../store/financeStore';
import type { Transaction } from '../store/financeStore';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import {
  Sparkles,
  LayoutGrid,
  Table as TableIcon,
  Search,
  CheckCircle2,
  ChevronDown,
  RotateCcw,
  TrendingDown,
  TrendingUp,
  Layers,
} from 'lucide-react';
import {
  CATEGORIAS_PERSONALES,
  CONCEPTO_A_CATEGORIA,
  autoClassify,
  getCategoryByIdOrLabel,
  getEffectiveCategory,
  getStoredClasificaciones,
  saveStoredClasificaciones,
  type CategoriaInfo,
} from '../utils/categoryClassification';

export { CONCEPTO_A_CATEGORIA, CATEGORIAS_PERSONALES };

const MESES_ORDER = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Setiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const ClasificacionPage: React.FC = () => {
  const { transactions, updateTransaction, setAllTransactions } = useFinanceStore();
  const [clasificaciones, setClasificaciones] = useState<Record<string, string>>(getStoredClasificaciones);
  const [filtroTipo, setFiltroTipo] = useState<'Todos' | 'Egreso' | 'Ingreso'>('Todos');
  const [filtroMes, setFiltroMes] = useState('Todos');
  const [filtroCategoria, setFiltroCategoria] = useState('todas');
  const [busqueda, setBusqueda] = useState('');
  const [soloSinClasificar, setSoloSinClasificar] = useState(false);
  const [vista, setVista] = useState<'tabla' | 'resumen'>('tabla');

  // Base de movimientos según filtro de Tipo
  const movimientosBase = useMemo(() => {
    return transactions.filter(t => {
      if (filtroTipo !== 'Todos' && t.Tipo !== filtroTipo) return false;
      return true;
    });
  }, [transactions, filtroTipo]);

  const meses = useMemo(() => {
    const set = new Set(movimientosBase.map(t => t.Mes));
    return MESES_ORDER.filter(m => set.has(m));
  }, [movimientosBase]);

  const filtered = useMemo(() => {
    return movimientosBase
      .filter(t => {
        if (filtroMes !== 'Todos' && t.Mes !== filtroMes) return false;
        if (busqueda) {
          const q = busqueda.toLowerCase().trim();
          const matchConcepto = t.Concepto.toLowerCase().includes(q);
          const matchEntidad = t.Entidad.toLowerCase().includes(q);
          if (!matchConcepto && !matchEntidad) return false;
        }
        const effective = getEffectiveCategory(t, clasificaciones);
        const clsId = effective?.id;
        if (filtroCategoria !== 'todas' && clsId !== filtroCategoria) return false;
        if (soloSinClasificar && clsId) return false;
        return true;
      })
      .sort((a, b) => a.Fecha.localeCompare(b.Fecha));
  }, [movimientosBase, filtroMes, busqueda, filtroCategoria, soloSinClasificar, clasificaciones]);

  const resumen = useMemo(() => {
    const map: Record<string, { total: number; count: number }> = {};
    movimientosBase.forEach(t => {
      if (filtroMes !== 'Todos' && t.Mes !== filtroMes) return;
      const effective = getEffectiveCategory(t, clasificaciones);
      const clsId = effective?.id ?? 'sin_clasificar';
      if (!map[clsId]) {
        map[clsId] = { total: 0, count: 0 };
      }
      map[clsId].total += t.Monto;
      map[clsId].count += 1;
    });
    return map;
  }, [movimientosBase, filtroMes, clasificaciones]);

  const totalClasificado = useMemo(() => {
    return movimientosBase.filter(t => !!getEffectiveCategory(t, clasificaciones)).length;
  }, [movimientosBase, clasificaciones]);

  const setClasificacion = (id: string, catId: string) => {
    setClasificaciones(prev => {
      const next = { ...prev, [id]: catId };
      saveStoredClasificaciones(next);
      return next;
    });
  };

  const autoClasificarTodo = () => {
    const next = { ...clasificaciones };
    movimientosBase.forEach(t => {
      const auto = autoClassify(t);
      if (auto) next[t.id] = auto;
    });
    setClasificaciones(next);
    saveStoredClasificaciones(next);
  };

  const restablecerClasificaciones = () => {
    const fresh: Record<string, string> = {};
    transactions.forEach(t => {
      const auto = autoClassify(t);
      if (auto) fresh[t.id] = auto;
    });
    setClasificaciones(fresh);
    saveStoredClasificaciones(fresh);
  };

  const fmt = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' });

  const getCategoria = (t: Transaction): CategoriaInfo | null => {
    return getEffectiveCategory(t, clasificaciones);
  };

  const pctProgreso = movimientosBase.length > 0 
    ? Math.round((totalClasificado / movimientosBase.length) * 100) 
    : 100;

  return (
    <div className="space-y-8">
      
      {/* ── HEADER EJECUTIVO ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-[#11191D] rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="p-2.5 rounded-2xl bg-emerald-700 text-white shadow-sm">
              <Layers size={22} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Auditoría & Clasificación de Gastos
            </h1>
            <Badge variant="primary">{pctProgreso}% Clasificado</Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Asignación inteligente y granular de consumos por categoría para análisis de costos y control financiero.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={autoClasificarTodo}
            className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition cursor-pointer"
            title="Aplica la regla de categorización inteligente a todos los registros"
          >
            <Sparkles size={15} />
            <span>Auto-Clasificar Inteligente</span>
          </button>

          <button
            onClick={restablecerClasificaciones}
            className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 transition cursor-pointer"
            title="Recalcular todas las clasificaciones con el diccionario maestro actualizado"
          >
            <RotateCcw size={14} />
            <span>Sincronizar Reglas</span>
          </button>

          <button
            onClick={() => setVista(v => v === 'tabla' ? 'resumen' : 'tabla')}
            className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 transition cursor-pointer"
          >
            {vista === 'tabla' ? <LayoutGrid size={15} /> : <TableIcon size={15} />}
            <span>{vista === 'tabla' ? 'Ver Cuadrícula de Resumen' : 'Ver Tabla Detallada'}</span>
          </button>
        </div>
      </div>

      {/* ── BARRA DE PROGRESO & SELECTOR DE TIPO ── */}
      <div className="bg-white dark:bg-[#11191D] rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">
              <CheckCircle2 size={15} className="text-emerald-600 dark:text-emerald-400" />
              Progreso de categorización:
            </span>
            <span className="text-xs font-black text-emerald-700 dark:text-emerald-400">
              {totalClasificado} de {movimientosBase.length} movimientos ({pctProgreso}%)
            </span>
          </div>

          {/* Segmented control: Todos / Egresos / Ingresos */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setFiltroTipo('Todos')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                filtroTipo === 'Todos'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              Todos ({transactions.length})
            </button>
            <button
              onClick={() => setFiltroTipo('Egreso')}
              className={`flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-lg transition ${
                filtroTipo === 'Egreso'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-rose-600'
              }`}
            >
              <TrendingDown size={13} />
              <span>Egresos</span>
            </button>
            <button
              onClick={() => setFiltroTipo('Ingreso')}
              className={`flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-lg transition ${
                filtroTipo === 'Ingreso'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-emerald-600'
              }`}
            >
              <TrendingUp size={13} />
              <span>Ingresos</span>
            </button>
          </div>
        </div>

        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-gradient-to-r from-emerald-500 to-emerald-700 h-full rounded-full transition-all duration-500"
            style={{ width: `${pctProgreso}%` }}
          />
        </div>
      </div>

      {vista === 'resumen' ? (
        // ── VISTA RESUMEN (GRID POR CATEGORÍA) ──
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Filtrar por Mes:</span>
              <div className="relative">
                <select
                  value={filtroMes}
                  onChange={e => setFiltroMes(e.target.value)}
                  className="appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold py-2 pl-3 pr-8 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="Todos">📅 Todos los meses</option>
                  {meses.map(m => <option key={m} value={m}>📅 {m}</option>)}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
              </div>
            </div>

            <Badge variant="default">
              Mostrando {CATEGORIAS_PERSONALES.filter(c => (resumen[c.id]?.count || 0) > 0).length} categorías activas
            </Badge>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {CATEGORIAS_PERSONALES.map(cat => {
              const data = resumen[cat.id];
              if (!data || data.count === 0) return null;
              return (
                <div
                  key={cat.id}
                  onClick={() => {
                    setFiltroCategoria(cat.id);
                    setVista('tabla');
                  }}
                  className={`rounded-2xl border p-4 ${cat.bg} flex flex-col justify-between shadow-sm transition hover:shadow-md hover:scale-[1.02] cursor-pointer group`}
                  title="Haz clic para ver los movimientos de esta categoría en la tabla"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{cat.emoji}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/10 dark:bg-white/10 text-slate-700 dark:text-slate-200">
                      {data.count} {data.count === 1 ? 'reg.' : 'regs.'}
                    </span>
                  </div>
                  <div>
                    <p className={`text-xs font-bold ${cat.color} leading-tight truncate`}>{cat.nombre}</p>
                    <p className={`text-lg font-black ${cat.color} mt-1 tabular-nums`}>{fmt.format(data.total)}</p>
                  </div>
                </div>
              );
            })}

            {(resumen['sin_clasificar']?.count || 0) > 0 && (
              <div
                onClick={() => {
                  setSoloSinClasificar(true);
                  setVista('tabla');
                }}
                className="rounded-2xl border p-4 bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 flex flex-col justify-between shadow-sm hover:shadow-md cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">❓</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                    {resumen['sin_clasificar'].count} regs.
                  </span>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-400 leading-tight">Sin clasificar</p>
                  <p className="text-lg font-black text-slate-800 dark:text-white mt-1 tabular-nums">{fmt.format(resumen['sin_clasificar'].total)}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        // ── VISTA TABLA DETALLADA ──
        <div className="space-y-4">
          
          {/* Filtros Bar */}
          <div className="bg-white dark:bg-[#11191D] rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-wrap gap-3 items-center justify-between transition-colors">
            <div className="flex items-center gap-3 flex-1 min-w-[240px] flex-wrap">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                <input
                  type="text"
                  placeholder="Buscar concepto o banco..."
                  value={busqueda}
                  onChange={e => setBusqueda(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs font-medium text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner"
                />
              </div>

              <div className="relative">
                <select
                  value={filtroMes}
                  onChange={e => setFiltroMes(e.target.value)}
                  className="appearance-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold py-2 pl-3 pr-8 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="Todos">Mes: Todos</option>
                  {meses.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={13} />
              </div>

              <div className="relative max-w-[220px]">
                <select
                  value={filtroCategoria}
                  onChange={e => setFiltroCategoria(e.target.value)}
                  className="appearance-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold py-2 pl-3 pr-8 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer truncate"
                >
                  <option value="todas">Categoría: Todas</option>
                  {CATEGORIAS_PERSONALES.map(c => (
                    <option key={c.id} value={c.id}>{c.emoji} {c.nombre}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={13} />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={soloSinClasificar}
                  onChange={e => setSoloSinClasificar(e.target.checked)}
                  className="accent-emerald-600 w-4 h-4 rounded cursor-pointer"
                />
                <span>Solo sin clasificar</span>
              </label>
              <Badge variant="default">{filtered.length} registros</Badge>
            </div>
          </div>

          {/* Tabla de Movimientos */}
          <Card className="p-0 overflow-hidden">
            <div className="overflow-x-auto max-h-[580px] overflow-y-auto">
              <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-4 py-3">Tipo</th>
                    <th className="px-4 py-3">Mes</th>
                    <th className="px-4 py-3">Fecha</th>
                    <th className="px-4 py-3">Concepto</th>
                    <th className="px-4 py-3">Entidad</th>
                    <th className="px-4 py-3 text-right">Monto</th>
                    <th className="px-4 py-3 min-w-[280px]">Categoría Asignada</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-slate-400 dark:text-slate-500">
                        No hay registros que coincidan con los filtros seleccionados.
                      </td>
                    </tr>
                  ) : (
                    filtered.map(t => {
                      const cat = getCategoria(t);
                      const isAuto = !clasificaciones[t.id] && !!autoClassify(t);
                      const currentVal = clasificaciones[t.id] ?? autoClassify(t) ?? '';

                      return (
                        <tr key={t.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                          <td className="px-4 py-2.5">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              t.Tipo === 'Ingreso'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            }`}>
                              {t.Tipo}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-slate-400 font-medium">{t.Mes}</td>
                          <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">{t.Fecha}</td>
                          <td className="px-4 py-2.5 font-bold text-slate-900 dark:text-white max-w-xs truncate">{t.Concepto}</td>
                          <td className="px-4 py-2.5 font-medium text-slate-600 dark:text-slate-300">{t.Entidad}</td>
                          <td className={`px-4 py-2.5 text-right font-black tabular-nums ${
                            t.Tipo === 'Ingreso' ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-900 dark:text-white'
                          }`}>
                            {fmt.format(t.Monto)}
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex items-center gap-2">
                              <select
                                value={currentVal}
                                onChange={e => setClasificacion(t.id, e.target.value)}
                                className={`border rounded-xl px-2.5 py-1.5 text-xs flex-1 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer ${
                                  cat 
                                    ? `${cat.bg} ${cat.color}` 
                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500'
                                }`}
                              >
                                <option value="" className="bg-white dark:bg-[#11191D] text-slate-800 dark:text-slate-100 font-semibold">
                                  — Sin clasificar —
                                </option>
                                {CATEGORIAS_PERSONALES.map(c => (
                                  <option key={c.id} value={c.id} className="bg-white dark:bg-[#11191D] text-slate-900 dark:text-slate-100 font-semibold py-1">
                                    {c.emoji} {c.nombre}
                                  </option>
                                ))}
                              </select>
                              {isAuto && (
                                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold shrink-0" title="Auto-clasificado por diccionario inteligente">
                                  ✨
                                </span>
                              )}
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
      )}

    </div>
  );
};
