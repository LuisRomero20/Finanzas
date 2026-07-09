import { create } from 'zustand';
import { supabase } from './lib/supabase';

export interface Deuda {
  id: string;
  acreedor: string;
  monto: number;
  tasa_anual: number;
  plazo_meses: number;
  meses_pagados: number;
  fecha_inicio: string;
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
}

export const useAppStore = create<AppStore>((set, get) => {
  return {
    usuario: null,
    deudas: [],
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
          set({ deudas });
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
          const cuota = d.monto * (tasaMensual * Math.pow(1 + tasaMensual, d.plazo_meses)) / (Math.pow(1 + tasaMensual, d.plazo_meses) - 1);
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
  };
});
