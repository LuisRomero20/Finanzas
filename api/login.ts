// Vercel Serverless Function: Proxy de Autenticación para sortear bloqueos de navegadores y extensiones
const AUTHORIZED_SUPABASE_URL = 'https://njgzhjwfcxdxiibkuuqg.supabase.co';

function getServerSupabaseConfig(): { url: string; publicKey: string } | null {
  const runtime = globalThis as typeof globalThis & {
    process?: { env?: Record<string, string | undefined> };
  };
  const env = runtime.process?.env ?? {};
  const url = (env.SUPABASE_URL ?? env.VITE_SUPABASE_URL ?? '').replace(/\/+$/, '');
  const publicKey = env.SUPABASE_PUBLISHABLE_KEY
    ?? env.VITE_SUPABASE_PUBLISHABLE_KEY
    ?? env.SUPABASE_ANON_KEY
    ?? env.VITE_SUPABASE_ANON_KEY
    ?? '';

  if (url !== AUTHORIZED_SUPABASE_URL || !publicKey || publicKey.startsWith('sb_secret_')) {
    return null;
  }
  return { url, publicKey };
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, apikey');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña requeridos' });
  }

  const config = getServerSupabaseConfig();
  if (!config) {
    return res.status(503).json({
      error: 'Configuración pública de Supabase ausente o incompatible. Autenticación temporalmente protegida.',
    });
  }

  try {
    const response = await fetch(`${config.url}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        apikey: config.publicKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: String(email).trim(), password: String(password) }),
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({
        error: data.msg || data.error_description || data.message || 'Credenciales incorrectas.',
      });
    }

    if (!data.expires_at && data.expires_in) {
      data.expires_at = Math.floor(Date.now() / 1000) + data.expires_in;
    }

    return res.status(200).json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Error al conectar con Supabase desde el servidor.' });
  }
}
