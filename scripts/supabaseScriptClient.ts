import { createClient } from '@supabase/supabase-js';

const AUTHORIZED_SUPABASE_URL = 'https://njgzhjwfcxdxiibkuuqg.supabase.co';
const configuredUrl = (process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? '').replace(/\/+$/, '');
const configuredPublicKey = process.env.SUPABASE_PUBLISHABLE_KEY
  ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY
  ?? process.env.SUPABASE_ANON_KEY
  ?? process.env.VITE_SUPABASE_ANON_KEY
  ?? '';

if (configuredUrl !== AUTHORIZED_SUPABASE_URL) {
  throw new Error(`Configura SUPABASE_URL con el proyecto autorizado ${AUTHORIZED_SUPABASE_URL}.`);
}
if (!configuredPublicKey || configuredPublicKey.startsWith('sb_secret_')) {
  throw new Error('Configura una clave pública de Supabase en el entorno; no se admiten claves secretas.');
}

export const supabase = createClient(configuredUrl, configuredPublicKey);
