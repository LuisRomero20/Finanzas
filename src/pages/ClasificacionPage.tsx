import React, { useState, useMemo } from 'react';
import { useFinanceStore } from '../store/financeStore';
import type { Transaction } from '../store/financeStore';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import {
  Layers,
  Sparkles,
  LayoutGrid,
  Table as TableIcon,
  Search,
  CheckCircle2,
  ChevronDown,
  Filter,
} from 'lucide-react';

interface Categoria {
  id: string;
  nombre: string;
  emoji: string;
  color: string;
  bg: string;
  keywords: string[];
}

const CATEGORIAS_PERSONALES: Categoria[] = [
  {
    id: 'comida',
    nombre: 'Comida & Restaurantes',
    emoji: '🍔',
    color: 'text-amber-800',
    bg: 'bg-amber-50 border-amber-200',
    keywords: ['broaster', 'cafe', 'café', 'ceviche', 'chicharron', 'chifa', 'empanada', 'maki', 'pollo', 'shawarma', 'taco', 'hamburguesa', 'dulce', 'bebida', 'comida', 'almuerzo', 'desayuno', 'cena', 'pizza', 'sushi', 'pollo', 'brasa', 'anticucho', 'lomo'],
  },
  {
    id: 'supermercado',
    nombre: 'Supermercado & Alimentos',
    emoji: '🛒',
    color: 'text-emerald-800',
    bg: 'bg-emerald-50 border-emerald-200',
    keywords: ['mercado', 'yogurt', 'mayonesa', 'agua mineral', 'supermercado', 'vivanda', 'metro', 'plaza vea', 'wong', 'tottus', 'alimento', 'despensa'],
  },
  {
    id: 'hogar',
    nombre: 'Hogar & Mantenimiento',
    emoji: '🏠',
    color: 'text-yellow-800',
    bg: 'bg-yellow-50 border-yellow-200',
    keywords: ['candado', 'limpieza', 'utencilio', 'utensilio', 'hogar', 'casa', 'mueble', 'cocina', 'baño', 'detergente', 'escoba', 'trapeador'],
  },
  {
    id: 'ropa',
    nombre: 'Ropa & Calzado',
    emoji: '👗',
    color: 'text-rose-800',
    bg: 'bg-rose-50 border-rose-200',
    keywords: ['gorra', 'zapatilla', 'polo', 'camisa', 'abrigo', 'pantalon', 'short', 'ropa', 'zapato', 'casaca', 'jean', 'medias', 'calzado'],
  },
  {
    id: 'entretenimiento',
    nombre: 'Entretenimiento & Streaming',
    emoji: '🎮',
    color: 'text-indigo-800',
    bg: 'bg-indigo-50 border-indigo-200',
    keywords: ['futbol', 'cine', 'bowling', 'estadio', 'videojuego', 'netflix', 'spotify', 'disney', 'hbo', 'prime', 'juego', 'arcade', 'billar', 'paintball'],
  },
  {
    id: 'conciertos',
    nombre: 'Conciertos & Eventos',
    emoji: '🎤',
    color: 'text-purple-800',
    bg: 'bg-purple-50 border-purple-200',
    keywords: ['concierto', 'bad bunny', 'milo j', 'paulo londra', 'rawayana', 'soda stereo', 'trueno', 'entrada', 'show', 'festival', 'musica'],
  },
  {
    id: 'regalos',
    nombre: 'Regalos & Celebraciones',
    emoji: '🎁',
    color: 'text-red-800',
    bg: 'bg-red-50 border-red-200',
    keywords: ['regalo', 'cumpleaños', 'dia de la madre', 'dia del trabajador', 'celebracion', 'torta', 'fiesta', 'navidad', 'aniversario'],
  },
  {
    id: 'viajes',
    nombre: 'Viajes & Hospedaje',
    emoji: '✈️',
    color: 'text-sky-800',
    bg: 'bg-sky-50 border-sky-200',
    keywords: ['laraos', 'piura', 'raura', 'brasil', 'hotel', 'viaje', 'vuelo', 'pasaje', 'hospedaje', 'turismo', 'excursion', 'tour', 'bus'],
  },
  {
    id: 'salud',
    nombre: 'Salud & Farmacia',
    emoji: '🏥',
    color: 'text-teal-800',
    bg: 'bg-teal-50 border-teal-200',
    keywords: ['psicologo', 'medicina', 'farmacia', 'doctor', 'clinica', 'salud', 'consulta', 'medicamento', 'pastilla', 'hospital', 'analisis'],
  },
  {
    id: 'cuidado_personal',
    nombre: 'Cuidado Personal & Aseo',
    emoji: '🧴',
    color: 'text-pink-800',
    bg: 'bg-pink-50 border-pink-200',
    keywords: ['perfume', 'tatuaje', 'aseo', 'peluqueria', 'corte de cabello', 'barberia', 'desodorante', 'shampoo', 'crema', 'maquillaje', 'higiene'],
  },
  {
    id: 'transporte',
    nombre: 'Transporte & Movilidad',
    emoji: '🚌',
    color: 'text-cyan-800',
    bg: 'bg-cyan-50 border-cyan-200',
    keywords: ['transporte', 'taxi', 'uber', 'bus', 'metro', 'combustible', 'gasolina', 'pasaje', 'indriver', 'cabify'],
  },
  {
    id: 'compras',
    nombre: 'Compras Generales',
    emoji: '🛍️',
    color: 'text-violet-800',
    bg: 'bg-violet-50 border-violet-200',
    keywords: ['temu', 'dollarcity', 'figurita', 'poster', 'amazon', 'ebay', 'aliexpress', 'compra', 'mercadolibre', 'sodimac', 'promart'],
  },
  {
    id: 'vicios',
    nombre: 'Gustos & Ocio',
    emoji: '🚬',
    color: 'text-slate-800',
    bg: 'bg-slate-100 border-slate-300',
    keywords: ['cigarro', 'alcohol', 'apuesta', 'vicio', 'cerveza', 'trago', 'ron', 'whisky', 'tabaco', 'casino'],
  },
  {
    id: 'salidas',
    nombre: 'Salidas & Sociales',
    emoji: '🎉',
    color: 'text-amber-900',
    bg: 'bg-amber-100 border-amber-300',
    keywords: ['salida', 'familiar', 'propina', 'outing', 'paseo', 'discoteca', 'bar', 'karaoke', 'chupe'],
  },
];

function autoClassify(t: Transaction): string | null {
  const texto = (t.Concepto + ' ' + t.Categoria).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  for (const cat of CATEGORIAS_PERSONALES) {
    for (const kw of cat.keywords) {
      const kwNorm = kw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (texto.includes(kwNorm)) {
        return cat.id;
      }
    }
  }
  return null;
}

const LS_KEY = 'finper_clasificaciones';

function loadClasificaciones(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveClasificaciones(data: Record<string, string>) {
  localStorage.setItem(LS_KEY, JSON.stringify(data));
}

const MESES_ORDER = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Setiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export const ClasificacionPage: React.FC = () => {
  const { transactions } = useFinanceStore();
  const [clasificaciones, setClasificaciones] = useState<Record<string, string>>(loadClasificaciones);
  const [filtroMes, setFiltroMes] = useState('Todos');
  const [filtroCategoria, setFiltroCategoria] = useState('todas');
  const [busqueda, setBusqueda] = useState('');
  const [soloSinClasificar, setSoloSinClasificar] = useState(false);
  const [vista, setVista] = useState<'tabla' | 'resumen'>('tabla');

  const egresosBase = useMemo(
    () => transactions.filter(t => t.Tipo === 'Egreso'),
    [transactions]
  );

  const meses = useMemo(() => {
    const set = new Set(egresosBase.map(t => t.Mes));
    return MESES_ORDER.filter(m => set.has(m));
  }, [egresosBase]);

  const filtered = useMemo(() => {
    return egresosBase
      .filter(t => {
        if (filtroMes !== 'Todos' && t.Mes !== filtroMes) return false;
        if (busqueda && !t.Concepto.toLowerCase().includes(busqueda.toLowerCase())) return false;
        const clsId = clasificaciones[t.id] ?? autoClassify(t);
        if (filtroCategoria !== 'todas' && clsId !== filtroCategoria) return false;
        if (soloSinClasificar && (clasificaciones[t.id] || autoClassify(t))) return false;
        return true;
      })
      .sort((a, b) => a.Fecha.localeCompare(b.Fecha));
  }, [egresosBase, filtroMes, busqueda, filtroCategoria, soloSinClasificar, clasificaciones]);

  const resumen = useMemo(() => {
    const map: Record<string, number> = {};
    egresosBase.forEach(t => {
      if (filtroMes !== 'Todos' && t.Mes !== filtroMes) return;
      const clsId = clasificaciones[t.id] ?? autoClassify(t) ?? 'sin_clasificar';
      map[clsId] = (map[clsId] || 0) + t.Monto;
    });
    return map;
  }, [egresosBase, filtroMes, clasificaciones]);

  const totalClasificado = useMemo(() => {
    return egresosBase.filter(t => clasificaciones[t.id] || autoClassify(t)).length;
  }, [egresosBase, clasificaciones]);

  const setClasificacion = (id: string, catId: string) => {
    setClasificaciones(prev => {
      const next = { ...prev, [id]: catId };
      saveClasificaciones(next);
      return next;
    });
  };

  const autoClasificarTodo = () => {
    const next = { ...clasificaciones };
    egresosBase.forEach(t => {
      if (!next[t.id]) {
        const auto = autoClassify(t);
        if (auto) next[t.id] = auto;
      }
    });
    setClasificaciones(next);
    saveClasificaciones(next);
  };

  const fmt = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' });

  const getCategoria = (t: Transaction) => {
    const id = clasificaciones[t.id] ?? autoClassify(t);
    return CATEGORIAS_PERSONALES.find(c => c.id === id) ?? null;
  };

  const pctProgreso = Math.round((totalClasificado / (egresosBase.length || 1)) * 100);

  return (
    <div className="space-y-8">
      
      {/* ── HEADER EJECUTIVO ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-[#11191D] rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Auditoría & Clasificación de Gastos
            </h1>
            <Badge variant="primary">{pctProgreso}% Clasificado</Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Asignación inteligente y granular de consumos por categoría para análisis de costos.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={autoClasificarTodo}
            className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition"
          >
            <Sparkles size={15} />
            <span>Auto-Clasificar Inteligente</span>
          </button>

          <button
            onClick={() => setVista(v => v === 'tabla' ? 'resumen' : 'tabla')}
            className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 transition"
          >
            {vista === 'tabla' ? <LayoutGrid size={15} /> : <TableIcon size={15} />}
            <span>{vista === 'tabla' ? 'Ver Cuadrícula de Resumen' : 'Ver Tabla Detallada'}</span>
          </button>
        </div>
      </div>

      {/* ── BARRA DE PROGRESO ── */}
      <div className="bg-white dark:bg-[#11191D] rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors">
        <div className="flex justify-between items-center text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" />
            Progreso de categorización de egresos
          </span>
          <span className="text-emerald-700 dark:text-emerald-400">{totalClasificado} de {egresosBase.length} movimientos ({pctProgreso}%)</span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-gradient-to-r from-emerald-500 to-emerald-700 h-full rounded-full transition-all duration-500"
            style={{ width: `${pctProgreso}%` }}
          />
        </div>
      </div>

      {vista === 'resumen' ? (
        // ── VISTA RESUMEN ──
        <div className="space-y-6">
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

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {CATEGORIAS_PERSONALES.map(cat => {
              const total = resumen[cat.id] || 0;
              if (total === 0) return null;
              return (
                <div key={cat.id} className={`rounded-2xl border p-4 ${cat.bg} dark:bg-slate-800/80 dark:border-slate-700 flex flex-col justify-between shadow-sm transition hover:shadow-md`}>
                  <div className="text-2xl mb-2">{cat.emoji}</div>
                  <div>
                    <p className={`text-xs font-bold ${cat.color} dark:text-slate-200 leading-tight truncate`}>{cat.nombre}</p>
                    <p className={`text-lg font-black ${cat.color} dark:text-white mt-1`}>{fmt.format(total)}</p>
                  </div>
                </div>
              );
            })}
            {(resumen['sin_clasificar'] || 0) > 0 && (
              <div className="rounded-2xl border p-4 bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 flex flex-col justify-between shadow-sm">
                <div className="text-2xl mb-2">❓</div>
                <div>
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-400 leading-tight">Sin clasificar</p>
                  <p className="text-lg font-black text-slate-800 dark:text-white mt-1">{fmt.format(resumen['sin_clasificar'])}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        // ── VISTA TABLA ──
        <div className="space-y-4">
          
          {/* Filtros Bar */}
          <div className="bg-white dark:bg-[#11191D] rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-wrap gap-3 items-center justify-between transition-colors">
            <div className="flex items-center gap-3 flex-1 min-w-[240px]">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                <input
                  type="text"
                  placeholder="Buscar concepto o comercio..."
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

              <div className="relative">
                <select
                  value={filtroCategoria}
                  onChange={e => setFiltroCategoria(e.target.value)}
                  className="appearance-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold py-2 pl-3 pr-8 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
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
                  className="accent-emerald-600 w-4 h-4 rounded"
                />
                <span>Solo sin clasificar</span>
              </label>
              <Badge variant="default">{filtered.length} registros</Badge>
            </div>
          </div>

          {/* Tabla de Movimientos */}
          <Card className="p-0 overflow-hidden">
            <div className="overflow-x-auto max-h-[560px] overflow-y-auto">
              <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-4 py-3">Mes</th>
                    <th className="px-4 py-3">Fecha</th>
                    <th className="px-4 py-3">Concepto</th>
                    <th className="px-4 py-3">Entidad</th>
                    <th className="px-4 py-3 text-right">Monto</th>
                    <th className="px-4 py-3 min-w-[240px]">Categoría Asignada</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-slate-400 dark:text-slate-500">
                        No hay registros que coincidan con los filtros seleccionados.
                      </td>
                    </tr>
                  ) : (
                    filtered.map(t => {
                      const cat = getCategoria(t);
                      const isAuto = !clasificaciones[t.id] && !!autoClassify(t);
                      return (
                        <tr key={t.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                          <td className="px-4 py-2.5 text-slate-400 font-medium">{t.Mes}</td>
                          <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">{t.Fecha}</td>
                          <td className="px-4 py-2.5 font-bold text-slate-900 dark:text-white max-w-xs truncate">{t.Concepto}</td>
                          <td className="px-4 py-2.5 font-medium text-slate-600 dark:text-slate-300">{t.Entidad}</td>
                          <td className="px-4 py-2.5 text-right font-black text-slate-900 dark:text-white tabular-nums">
                            {fmt.format(t.Monto)}
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex items-center gap-2">
                              <select
                                value={clasificaciones[t.id] ?? autoClassify(t) ?? ''}
                                onChange={e => setClasificacion(t.id, e.target.value)}
                                className={`border rounded-xl px-2.5 py-1.5 text-xs flex-1 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer ${
                                  cat ? `${cat.bg} ${cat.color} dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200` : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500'
                                }`}
                              >
                                <option value="">— Sin clasificar —</option>
                                {CATEGORIAS_PERSONALES.map(c => (
                                  <option key={c.id} value={c.id}>
                                    {c.emoji} {c.nombre}
                                  </option>
                                ))}
                              </select>
                              {isAuto && (
                                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold shrink-0" title="Auto-clasificado por inteligencia de patrones">
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
