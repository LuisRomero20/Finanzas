import { create } from 'zustand';
import { supabase } from './lib/supabase';
import { masterTransactions } from './utils/masterData';

export interface Deuda {
  id: string;
  acreedor: string;
  monto: number;
  tasa_anual: number;
  plazo_meses: number;
  meses_pagados: number;
  fecha_inicio: string;
  pagos?: string[];
  pagos_este_ano?: number;
  tipo_tasa: 'nominal' | 'efectiva';
  moneda: string;
  estado: 'activa' | 'pagada' | 'proximo_vencer';
}

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  autenticado: boolean;
}

interface AppStore {
  usuario: Usuario | null;
  deudas: Deuda[];
  notificaciones: Array<{ id: string; mensaje: string; tipo: 'info' | 'success' | 'warning' | 'error'; timestamp: number }>;
  cargando: boolean;

  // Auth
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  registrar: (nombre: string, email: string, password: string) => Promise<void>;

  // Deudas
  agregarDeuda: (deuda: Omit<Deuda, 'id' | 'estado' | 'meses_pagados'>) => Promise<void>;
  editarDeuda: (id: string, deuda: Partial<Deuda>) => Promise<void>;
  eliminarDeuda: (id: string) => Promise<void>;
  marcarCuotaPagada: (id: string) => Promise<void>;
  obtenerDeudas: () => Deuda[];
  obtenerDeuda: (id: string) => Deuda | undefined;
  cargarDeudas: () => Promise<void>;

  // Notificaciones
  agregarNotificacion: (mensaje: string, tipo: 'info' | 'success' | 'warning' | 'error') => void;
  eliminarNotificacion: (id: string) => void;

  // Analytics
  getTotalDeudado: () => number;
  getTotalMensual: () => number;
  getProximosVencimientos: () => Deuda[];

  // Import desde histórico (Excel -> masterData)
  importarDeudasDesdeHistorico: () => Promise<void>;

  // Dev helper
  resetDemoDeudas?: () => void;
}

const initialDemoDeudas: Deuda[] = [
  {
    id: '1',
    acreedor: 'Yape Crédito',
    monto: 724.32,
    tasa_anual: 0.0,
    plazo_meses: 12,
    meses_pagados: 11,
    fecha_inicio: '2025-10-15',
    tipo_tasa: 'efectiva',
    moneda: 'PEN',
    estado: 'activa'
  },
  {
    id: '2',
    acreedor: 'iPhone 16',
    monto: 2949,
    tasa_anual: 0.0,
    plazo_meses: 12,
    meses_pagados: 0,
    fecha_inicio: '2026-03-01',
    tipo_tasa: 'efectiva',
    moneda: 'PEN',
    estado: 'activa'
  },
  {
    id: '3',
    acreedor: 'Prestamo Yape',
    monto: 701.05,
    tasa_anual: 0.0,
    plazo_meses: 6,
    meses_pagados: 6,
    fecha_inicio: '2026-01-07',
    tipo_tasa: 'efectiva',
    moneda: 'PEN',
    estado: 'pagada'
  },
  {
    id: '4',
    acreedor: 'Prestamo BCP',
    monto: 1717.92,
    tasa_anual: 0.0,
    plazo_meses: 12,
    meses_pagados: 0,
    fecha_inicio: '2026-01-15',
    tipo_tasa: 'efectiva',
    moneda: 'PEN',
    estado: 'activa'
  },
  {
    id: '5',
    acreedor: 'Aaron',
    monto: 92.42,
    tasa_anual: 0.0,
    plazo_meses: 1,
    meses_pagados: 1,
    fecha_inicio: '2026-05-01',
    tipo_tasa: 'efectiva',
    moneda: 'PEN',
    estado: 'pagada'
  },
  {
    id: '6',
    acreedor: 'Jacko',
    monto: 100,
    tasa_anual: 0.0,
    plazo_meses: 1,
    meses_pagados: 1,
    fecha_inicio: '2026-05-01',
    tipo_tasa: 'efectiva',
    moneda: 'PEN',
    estado: 'pagada'
  },
  {
    id: '7',
    acreedor: 'Padre',
    monto: 60,
    tasa_anual: 0.0,
    plazo_meses: 1,
    meses_pagados: 1,
    fecha_inicio: '2026-05-01',
    tipo_tasa: 'efectiva',
    moneda: 'PEN',
    estado: 'pagada'
  }
];

const getStoredDeudas = (): Deuda[] => {
  try {
    const stored = localStorage.getItem('demo_deudas');
    if (stored) {
      const parsed: Deuda[] = JSON.parse(stored);
      // limpiar registro accidental 'Madre' creado en histórico de pruebas
      const cleaned = parsed.filter(d => (d.acreedor || '').toLowerCase() !== 'madre');
      if (cleaned.length !== parsed.length) {
        localStorage.setItem('demo_deudas', JSON.stringify(cleaned));
      }
      return cleaned;
    }
  } catch {}
  return initialDemoDeudas;
};

export const useAppStore = create<AppStore>((set, get) => {
  return {
    usuario: {
      id: '550e8400-e29b-41d4-a716-446655440000',
      nombre: 'Usuario FinPer',
      email: 'usuario@finper.app',
      autenticado: true,
    },
    deudas: typeof window !== 'undefined' ? getStoredDeudas() : initialDemoDeudas,
    notificaciones: [],
    cargando: false,

    login: async (email: string, password: string) => {
      try {
        set({ cargando: true });
        
        // Modo desarrollo: permitir login con demo@test.com / 123456
        if (email === 'demo@test.com' && password === '123456') {
          const usuario: Usuario = {
            id: '550e8400-e29b-41d4-a716-446655440000',
            nombre: 'Demo User',
            email: 'demo@test.com',
            autenticado: true,
          };
          set({ usuario });
          await get().cargarDeudas();
          get().agregarNotificacion('¡Bienvenido (Modo Demo)!', 'success');
          return;
        }
        
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        
        if (error) throw error;
        
        if (data.user) {
          const usuario: Usuario = {
            id: data.user.id,
            nombre: data.user.user_metadata?.nombre || email.split('@')[0],
            email: data.user.email || '',
            autenticado: true,
          };
          set({ usuario });
          await get().cargarDeudas();
          get().agregarNotificacion('¡Bienvenido!', 'success');
        }
      } catch (error: any) {
        get().agregarNotificacion(error.message || 'Error al iniciar sesión', 'error');
        throw error;
      } finally {
        set({ cargando: false });
      }
    },

    logout: async () => {
      try {
        await supabase.auth.signOut();
        set({ usuario: null, deudas: [] });
        get().agregarNotificacion('Sesión cerrada', 'info');
      } catch (error: any) {
        get().agregarNotificacion(error.message || 'Error al cerrar sesión', 'error');
      }
    },

    registrar: async (nombre: string, email: string, password: string) => {
      try {
        set({ cargando: true });
        const { data, error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: { nombre }
          }
        });

        if (error) throw error;
        
        if (data.user) {
          // Crear registro en tabla usuarios
          await supabase.from('usuarios').insert([
            { id: data.user.id, nombre, email }
          ]);

          const usuario: Usuario = {
            id: data.user.id,
            nombre,
            email,
            autenticado: true,
          };
          set({ usuario });
          get().agregarNotificacion(`¡Bienvenido ${nombre}!`, 'success');
        }
      } catch (error: any) {
        get().agregarNotificacion(error.message || 'Error al registrarse', 'error');
        throw error;
      } finally {
        set({ cargando: false });
      }
    },

    agregarDeuda: async (deuda) => {
      try {
        const usuario = get().usuario;
        if (!usuario) throw new Error('No hay usuario autenticado');

        // Modo demo: guardar en localStorage
        if (usuario.id === '550e8400-e29b-41d4-a716-446655440000') {
          const deudas = JSON.parse(localStorage.getItem('demo_deudas') || '[]');
          const id = Date.now().toString();
          const nuevaDeuda = {
            id,
            ...deuda,
            estado: 'activa' as const,
            meses_pagados: 0,
          };
          deudas.push(nuevaDeuda);
          localStorage.setItem('demo_deudas', JSON.stringify(deudas));
          set({ deudas: get().deudas.concat(nuevaDeuda) });
          get().agregarNotificacion(`Deuda con ${deuda.acreedor} agregada`, 'success');
          return;
        }

        const { error } = await supabase
          .from('deudas')
          .insert([
            {
              usuario_id: usuario.id,
              ...deuda,
              estado: 'activa',
              meses_pagados: 0,
            }
          ]);

        if (error) throw error;
        
        await get().cargarDeudas();
        get().agregarNotificacion(`Deuda con ${deuda.acreedor} agregada`, 'success');
      } catch (error: any) {
        get().agregarNotificacion(error.message || 'Error al agregar deuda', 'error');
        throw error;
      }
    },

    editarDeuda: async (id, deudaActualizada) => {
      try {
        const usuario = get().usuario;
        if (!usuario) throw new Error('No hay usuario autenticado');

        // Modo demo: actualizar en localStorage
        if (usuario.id === '550e8400-e29b-41d4-a716-446655440000') {
          let deudas = JSON.parse(localStorage.getItem('demo_deudas') || '[]');
          deudas = deudas.map((d: any) => d.id === id ? { ...d, ...deudaActualizada } : d);
          localStorage.setItem('demo_deudas', JSON.stringify(deudas));
          set({ deudas });
          get().agregarNotificacion('Deuda actualizada', 'success');
          return;
        }

        const { error } = await supabase
          .from('deudas')
          .update(deudaActualizada)
          .eq('id', id);

        if (error) throw error;

        await get().cargarDeudas();
        get().agregarNotificacion('Deuda actualizada', 'success');
      } catch (error: any) {
        get().agregarNotificacion(error.message || 'Error al actualizar deuda', 'error');
        throw error;
      }
    },

    eliminarDeuda: async (id) => {
      try {
        const usuario = get().usuario;
        if (!usuario) throw new Error('No hay usuario autenticado');

        // Modo demo: eliminar de localStorage
        if (usuario.id === '550e8400-e29b-41d4-a716-446655440000') {
          let deudas = JSON.parse(localStorage.getItem('demo_deudas') || '[]');
          deudas = deudas.filter((d: any) => d.id !== id);
          localStorage.setItem('demo_deudas', JSON.stringify(deudas));
          set({ deudas });
          get().agregarNotificacion('Deuda eliminada', 'success');
          return;
        }

        const { error } = await supabase.from('deudas').delete().eq('id', id);
        if (error) throw error;

        await get().cargarDeudas();
        get().agregarNotificacion('Deuda eliminada', 'success');
      } catch (error: any) {
        get().agregarNotificacion(error.message || 'Error al eliminar deuda', 'error');
        throw error;
      }
    },

    marcarCuotaPagada: async (id) => {
      try {
        const usuario = get().usuario;
        if (!usuario) throw new Error('No hay usuario autenticado');

        const deuda = get().obtenerDeuda(id);
        if (!deuda) throw new Error('Deuda no encontrada');

        const nuevosMesesPagados = deuda.meses_pagados + 1;
        const nuevoEstado = nuevosMesesPagados >= deuda.plazo_meses ? 'pagada' : 'activa';

        // Modo demo: actualizar en localStorage
        if (usuario.id === '550e8400-e29b-41d4-a716-446655440000') {
          let deudas = JSON.parse(localStorage.getItem('demo_deudas') || '[]');
          deudas = deudas.map((d: any) => 
            d.id === id ? { ...d, meses_pagados: nuevosMesesPagados, estado: nuevoEstado } : d
          );
          localStorage.setItem('demo_deudas', JSON.stringify(deudas));
          set({ deudas });
          get().agregarNotificacion('Cuota marcada como pagada', 'success');
          return;
        }

        const { error } = await supabase
          .from('deudas')
          .update({ 
            meses_pagados: nuevosMesesPagados,
            estado: nuevoEstado 
          })
          .eq('id', id);

        if (error) throw error;

        await get().cargarDeudas();
        get().agregarNotificacion('Cuota marcada como pagada', 'success');
      } catch (error: any) {
        get().agregarNotificacion(error.message || 'Error al marcar cuota', 'error');
        throw error;
      }
    },

    cargarDeudas: async () => {
      try {
        const usuario = get().usuario;
        if (!usuario) return;

        // Modo demo: cargar desde localStorage
        if (usuario.id === '550e8400-e29b-41d4-a716-446655440000') {
          const deudas = JSON.parse(localStorage.getItem('demo_deudas') || '[]');
          // if no stored demo, initialize with built-in demo set
          if (!deudas || deudas.length === 0) {
            localStorage.setItem('demo_deudas', JSON.stringify(initialDemoDeudas));
            set({ deudas: initialDemoDeudas });
          } else {
            set({ deudas });
          }
          return;
        }

        const { data, error } = await supabase
          .from('deudas')
          .select('*')
          .eq('usuario_id', usuario.id);

        if (error) throw error;
        
        set({ deudas: data || [] });
      } catch (error: any) {
        console.error('Error al cargar deudas:', error.message);
      }
    },

    obtenerDeudas: () => get().deudas,
    
    obtenerDeuda: (id) => get().deudas.find(d => d.id === id),

    agregarNotificacion: (mensaje: string, tipo: 'info' | 'success' | 'warning' | 'error') => {
      const id = Date.now().toString();
      set(state => ({
        notificaciones: [...state.notificaciones, { id, mensaje, tipo, timestamp: Date.now() }]
      }));
      
      setTimeout(() => get().eliminarNotificacion(id), 5000);
    },

    eliminarNotificacion: (id: string) => {
      set(state => ({
        notificaciones: state.notificaciones.filter(n => n.id !== id)
      }));
    },

    getTotalDeudado: () => {
      return get().deudas
        .filter(d => d.estado !== 'pagada')
        .reduce((sum, d) => sum + d.monto, 0);
    },

    getTotalMensual: () => {
      return get().deudas
        .filter(d => d.estado !== 'pagada')
        .reduce((sum, d) => {
          const tasaMensual = d.tipo_tasa === 'efectiva'
            ? Math.pow(1 + d.tasa_anual, 1/12) - 1
            : d.tasa_anual / 12;
          const n = Math.max(0, d.plazo_meses - d.meses_pagados);
          if (n <= 0) return sum;
          if (tasaMensual === 0) {
            return sum + d.monto / n;
          }
          const cuota = d.monto * (tasaMensual * Math.pow(1 + tasaMensual, n)) / (Math.pow(1 + tasaMensual, n) - 1);
          return sum + cuota;
        }, 0);
    },

    getProximosVencimientos: () => {
      return get().deudas
        .filter(d => d.estado === 'activa')
        .sort((a, b) => {
          const fechaA = new Date(a.fecha_inicio);
          const fechaB = new Date(b.fecha_inicio);
          return fechaA.getTime() - fechaB.getTime();
        })
        .slice(0, 5);
    },
    // Dev helper: restore initial demo data to localStorage and store
    resetDemoDeudas: () => {
      try {
        localStorage.setItem('demo_deudas', JSON.stringify(initialDemoDeudas));
        set({ deudas: initialDemoDeudas });
      } catch (e) {
        console.error('Error restoring demo deudas', e);
      }
    },
    importarDeudasDesdeHistorico: async () => {
      try {
        const usuario = get().usuario;
        if (!usuario) throw new Error('No hay usuario autenticado');

        // Filtrar transacciones categorizadas como 'Deuda'
        const txs = masterTransactions.filter(t => t.Categoria === 'Deuda');

        // Definiciones: coincidencias de concepto -> plazo y día de pago
        // Se pueden añadir overrides como inicio de pagos conocido
        const defs: Array<any> = [
          { acreedor: 'iPhone 16', matches: ['iPhone 16', 'CELULAR'], plazo: 12, dia: 30, inicioOverride: '2026-03-30' },
          // Para Yape Crédito preferimos contar solo las transacciones de S/ 60.36
          { acreedor: 'Yape Crédito', matches: ['Yape Crédito', 'Yape credito', 'Yape'], plazo: 6, dia: 28, filterMonto: 60.36 },
          { acreedor: 'Prestamo Yape', matches: ['Prestamo Yape'], plazo: 6, dia: 28 },
          { acreedor: 'Prestamo BCP', matches: ['Prestamo BCP', 'BCP'], plazo: 12, dia: 15, inicioOverride: '2026-07-15' },
          { acreedor: 'Aaron', matches: ['Aaron'], plazo: 1, dia: 1 },
          { acreedor: 'Jacko', matches: ['Jacko'], plazo: 1, dia: 1 },
          { acreedor: 'Padre', matches: ['Padre'], plazo: 1, dia: 1 },
        ];

        const nuevas: Deuda[] = [];

        for (const def of defs) {
          const encontrados = txs.filter(t => {
            const concepto = (t.Concepto || '').toString().toLowerCase();
            const matched = def.matches.some((m: string) => concepto.includes(m.toLowerCase()));
            if (!matched) return false;
            if (def.filterMonto != null) {
              const montoNum = Number(t.Monto || 0);
              return Math.abs(montoNum - def.filterMonto) < 0.01;
            }
            return true;
          });
          if (!encontrados || encontrados.length === 0) continue;

          // Agrupar por año-mes para evitar contar pagos duplicados en el mismo mes
          const pagosPorMes: Record<string, string> = {};
          encontrados.forEach((e) => {
            try {
              const d = new Date(e.Fecha);
              const key = `${d.getFullYear()}-${d.getMonth()+1}`;
              if (!pagosPorMes[key]) pagosPorMes[key] = e.Fecha;
            } catch { /* ignore invalid dates */ }
          });

          const meses_pagados = Object.keys(pagosPorMes).length;
          const pagos = Object.values(pagosPorMes).sort();

          // conteo de pagos en el año actual (útil para mostrar cuántos se pagaron este año vs año anterior)
          const currentYear = new Date().getFullYear();
          const pagosEsteAno = Object.values(pagosPorMes).filter(dstr => {
            try { const d = new Date(dstr); return d.getFullYear() === currentYear; } catch { return false; }
          }).length;

          // sumar montos por mes (usar primera transacción del mes)
          const suma = Object.values(pagosPorMes).reduce((s, keyDate) => {
            const d = new Date(keyDate);
            const match = encontrados.find(en => {
              const dd = new Date(en.Fecha);
              return dd.getFullYear() === d.getFullYear() && dd.getMonth() === d.getMonth();
            });
            return s + (match ? Number(match.Monto || 0) : 0);
          }, 0);

          // Si definimos filterMonto, preferimos usar ese valor exacto como cuota
          const cuotaPromedio = def.filterMonto != null
            ? Number(def.filterMonto.toFixed(2))
            : (meses_pagados > 0 ? Number((suma / meses_pagados).toFixed(2)) : 0);
          const plazo = def.plazo;
          // monto total calculado a partir de la cuota mensual conocida
          const montoTotal = Number((cuotaPromedio * plazo).toFixed(2));

          // fecha_inicio: preferir override cuando exista en la definición (por ejemplo iPhone Marzo)
          const fecha_inicio = def.inicioOverride ? def.inicioOverride : (pagos.length > 0 ? pagos[0].slice(0,10) : new Date().toISOString().slice(0,10));
          const estado = meses_pagados >= plazo ? 'pagada' : 'activa';

          // Ajuste especial para Yape Crédito: mostrar solo pagos de este año (ene-mar) en el listado,
          // pero ajustar `meses_pagados` para reflejar únicamente los pagos de este año (opción B del usuario).
          let pagosListado = pagos;
          let pagosAnioAnterior = 0;
          if (def.acreedor === 'Yape Crédito') {
            const currentYear = new Date().getFullYear();
            const pagosEsteAnoList = pagos.filter(p => {
              try { const d = new Date(p); return d.getFullYear() === currentYear && (d.getMonth()+1) <= 3; } catch { return false; }
            });
            pagosAnioAnterior = pagos.length - pagosEsteAnoList.length;
            pagosListado = pagosEsteAnoList; // keep only Jan-Feb-Mar of current year
          }

          // totalPagos encontrados (incluye años anteriores)
          const totalPagos = pagos.length;
          // decidir meses_pagados final y pagos_este_ano finales
          // Guardamos `meses_pagados` como el total real (incluye pagos previos) para poder marcar la deuda como pagada.
          const meses_pagados_final = totalPagos;
          const pagos_este_ano_final = pagosListado.length;

          const estado_final = meses_pagados_final >= plazo ? 'pagada' : 'activa';

          nuevas.push({
            id: Date.now().toString() + Math.random().toString(36).slice(2,6),
            acreedor: def.acreedor,
            monto: montoTotal,
            tasa_anual: 0.0,
            plazo_meses: plazo,
            meses_pagados: meses_pagados_final,
            pagos_este_ano: pagos_este_ano_final,
            pagos_anio_anterior: pagosAnioAnterior,
            fecha_inicio,
            pagos: pagosListado,
            tipo_tasa: 'efectiva',
            moneda: 'PEN',
            estado: estado_final,
          });
        }

        if (nuevas.length === 0) {
          get().agregarNotificacion('No se encontraron deudas en el histórico', 'info');
          return;
        }

        // Modo demo: persistir en localStorage
        if (usuario.id === '550e8400-e29b-41d4-a716-446655440000') {
          const stored = JSON.parse(localStorage.getItem('demo_deudas') || '[]');
          // Evitar duplicados por `acreedor` (case-insensitive, includes) — reemplazar similares
          let merged = stored.filter((d: any) => !nuevas.some((nd: any) => {
            const a = (d.acreedor || '').toString().toLowerCase();
            const b = (nd.acreedor || '').toString().toLowerCase();
            return a.includes(b) || b.includes(a);
          })).concat(nuevas);
          // For demo: ensure Yape Crédito appears as finalized if matched
          merged = merged.map((d: any) => {
            if ((d.acreedor || '').toString().toLowerCase().includes('yape crédito')) {
              return { ...d, estado: 'pagada', meses_pagados: d.plazo_meses };
            }
            return d;
          });
          localStorage.setItem('demo_deudas', JSON.stringify(merged));
          set({ deudas: merged });
          get().agregarNotificacion('Deudas importadas desde histórico', 'success');
          return;
        }

        // Si existe backend, insertar en supabase
        const payload = nuevas.map(n => ({ usuario_id: usuario.id, ...n }));
        const { error } = await supabase.from('deudas').insert(payload);
        if (error) throw error;
        await get().cargarDeudas();
        get().agregarNotificacion('Deudas importadas desde histórico', 'success');
      } catch (error: any) {
        console.error('Error importando deudas:', error);
        get().agregarNotificacion(error.message || 'Error importando deudas', 'error');
      }
    },
  };
});
