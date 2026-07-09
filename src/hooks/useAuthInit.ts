import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store';

export const useAuthInit = () => {
  const { login, logout, usuario, cargarDeudas } = useAppStore();

  useEffect(() => {
    // Verificar sesión actual
    const checkSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        
        if (data.session?.user) {
          const usuarioData = {
            id: data.session.user.id,
            nombre: data.session.user.user_metadata?.nombre || data.session.user.email?.split('@')[0] || 'Usuario',
            email: data.session.user.email || '',
            autenticado: true,
          };
          
          useAppStore.setState({ usuario: usuarioData });
          await cargarDeudas();
        }
      } catch (error) {
        console.error('Error al verificar sesión:', error);
      }
    };

    checkSession();

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const usuarioData = {
          id: session.user.id,
          nombre: session.user.user_metadata?.nombre || session.user.email?.split('@')[0] || 'Usuario',
          email: session.user.email || '',
          autenticado: true,
        };
        useAppStore.setState({ usuario: usuarioData });
        await cargarDeudas();
      } else if (event === 'SIGNED_OUT') {
        useAppStore.setState({ usuario: null, deudas: [] });
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  return { usuario };
};
