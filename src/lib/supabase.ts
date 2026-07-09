import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://elsjuyjjkrkyhlylmaip.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_hvgD4QA4kOCxTTqEMlFLLg_OjNAeLhu';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Tipos para Supabase
export interface SupabaseUsuario {
  id: string;
  nombre: string;
  email: string;
  created_at: string;
}

export interface SupabaseDeuda {
  id: string;
  usuario_id: string;
  acreedor: string;
  monto: number;
  tasa_anual: number;
  plazo_meses: number;
  meses_pagados: number;
  fecha_inicio: string;
  tipo_tasa: 'nominal' | 'efectiva';
  moneda: string;
  estado: 'activa' | 'pagada' | 'proximo_vencer';
  created_at: string;
  updated_at: string;
}
