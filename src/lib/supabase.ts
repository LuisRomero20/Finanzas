import { createClient } from '@supabase/supabase-js';

export const TARGET_PROJECT_REF = 'njgzhjwfcxdxiibkuuqg';
export const FINPER_VERSION = '2.1.1';
export const AUTHORIZED_SUPABASE_URL = `https://${TARGET_PROJECT_REF}.supabase.co`;

// Permite que la interfaz cargue y explique una configuración ausente sin incorporar
// una credencial alternativa. El API gateway rechazará este valor y toda escritura
// permanece bloqueada mientras la configuración no esté verificada.
const MISSING_PUBLIC_KEY_SENTINEL = 'finper_missing_public_api_key';
const MODERN_PUBLISHABLE_KEY_PATTERN = /^sb_publishable_[A-Za-z0-9_-]{22}_[A-Za-z0-9_-]{8}$/;

/**
 * Extrae el project ref de una URL de Supabase (ej: 'https://njgzhjwfcxdxiibkuuqg.supabase.co' -> 'njgzhjwfcxdxiibkuuqg').
 */
export function extractProjectRefFromUrl(url?: string): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url.trim());
    const match = parsed.hostname.match(/^([a-z0-9_-]+)\.supabase\.co$/i);
    return match ? match[1].toLowerCase() : null;
  } catch {
    return null;
  }
}

/**
 * Extrae el project ref únicamente de claves anon JWT heredadas.
 * Las claves modernas sb_publishable_* son opacas por diseño y retornan null.
 */
export function extractProjectRefFromKey(key?: string): string | null {
  if (!key) return null;
  const trimmed = key.trim().replace(/^["']|["']$/g, '');
  if (!trimmed.startsWith('eyJ')) return null;
  const parts = trimmed.split('.');
  if (parts.length < 2) return null;
  try {
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const jsonStr = atob(padded);
    const payload = JSON.parse(jsonStr);
    return payload.ref ? String(payload.ref).toLowerCase() : null;
  } catch {
    return null;
  }
}

export type SupabasePublicKeyFormat =
  | 'modern_publishable'
  | 'legacy_anon_jwt'
  | 'legacy_service_role_jwt'
  | 'secret'
  | 'unknown'
  | 'missing';

export interface SupabasePublicKeyInspection {
  format: SupabasePublicKeyFormat;
  projectRef: string | null;
  role: string | null;
}

export function inspectSupabasePublicKey(key?: string): SupabasePublicKeyInspection {
  const cleaned = key?.trim().replace(/^["']|["']$/g, '') ?? '';
  if (!cleaned) return { format: 'missing', projectRef: null, role: null };
  if (cleaned.startsWith('sb_secret_')) return { format: 'secret', projectRef: null, role: null };
  if (MODERN_PUBLISHABLE_KEY_PATTERN.test(cleaned)) {
    return { format: 'modern_publishable', projectRef: null, role: 'anon' };
  }

  const parts = cleaned.split('.');
  if (parts.length === 3 && cleaned.startsWith('eyJ')) {
    try {
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')));
      const role = typeof payload.role === 'string' ? payload.role : null;
      const projectRef = typeof payload.ref === 'string' ? payload.ref.toLowerCase() : null;
      if (role === 'anon') return { format: 'legacy_anon_jwt', projectRef, role };
      if (role === 'service_role') return { format: 'legacy_service_role_jwt', projectRef, role };
    } catch {
      return { format: 'unknown', projectRef: null, role: null };
    }
  }

  return { format: 'unknown', projectRef: null, role: null };
}

export interface SupabaseConfigHealth {
  targetProjectRef: string;
  activeProjectRef: string;
  activeUrl: string;
  configuredProjectRef: string | null;
  urlStatus: 'valid' | 'missing' | 'mismatched';
  keyStatus: 'verified' | 'unverified' | 'missing' | 'mismatched' | 'invalid';
  keyFormat: SupabasePublicKeyFormat;
  configurationState: 'verified' | 'unverified' | 'missing' | 'mismatched' | 'invalid';
  severity: 'ok' | 'warning' | 'critical';
  isHealthy: boolean;
  appVersion: string;
  errorMessage: string | null;
}

export interface SupabaseConfigInput {
  url?: string;
  publishableKey?: string;
  legacyAnonKey?: string;
}

export interface ResolvedSupabaseConfig {
  url: string;
  key: string;
  health: SupabaseConfigHealth;
}

function runtimeConfigInput(): SupabaseConfigInput {
  if (typeof import.meta === 'undefined' || !import.meta.env) return {};
  return {
    url: import.meta.env.VITE_SUPABASE_URL,
    publishableKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    legacyAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  };
}

/**
 * Resuelve la configuración sin sustituir silenciosamente credenciales. La URL se valida
 * localmente; la pertenencia de claves opacas se confirma después contra el API gateway.
 */
export function resolveSupabaseConfig(input?: SupabaseConfigInput): ResolvedSupabaseConfig {
  const source = input ?? runtimeConfigInput();
  const rawUrl = source.url?.trim().replace(/^["']|["']$/g, '').replace(/\/+$/, '') ?? '';
  const configuredRef = extractProjectRefFromUrl(rawUrl);
  const urlStatus: SupabaseConfigHealth['urlStatus'] = !rawUrl
    ? 'missing'
    : configuredRef === TARGET_PROJECT_REF && rawUrl === AUTHORIZED_SUPABASE_URL
      ? 'valid'
      : 'mismatched';

  // Una variable moderna presente pero inválida nunca cae silenciosamente a la heredada.
  const rawKey = source.publishableKey?.trim()
    ? source.publishableKey
    : source.legacyAnonKey;
  const cleanedKey = rawKey?.trim().replace(/^["']|["']$/g, '') ?? '';
  const keyInspection = inspectSupabasePublicKey(cleanedKey);

  let keyStatus: SupabaseConfigHealth['keyStatus'] = 'unverified';
  let configurationState: SupabaseConfigHealth['configurationState'] = 'unverified';
  let severity: SupabaseConfigHealth['severity'] = 'warning';
  let errorMessage: string | null = 'Clave pública presente; falta verificarla contra el API gateway del proyecto autorizado. Las escrituras continúan protegidas.';

  if (urlStatus === 'missing' || keyInspection.format === 'missing') {
    keyStatus = keyInspection.format === 'missing' ? 'missing' : 'unverified';
    configurationState = 'missing';
    severity = 'critical';
    errorMessage = 'Configuración incompleta: define VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY (o la clave anon heredada) en el entorno.';
  } else if (urlStatus === 'mismatched') {
    keyStatus = keyInspection.format === 'missing' ? 'missing' : 'unverified';
    configurationState = 'mismatched';
    severity = 'critical';
    errorMessage = `Discrepancia confirmada: VITE_SUPABASE_URL no corresponde al proyecto autorizado '${TARGET_PROJECT_REF}'.`;
  } else if (keyInspection.format === 'secret' || keyInspection.format === 'legacy_service_role_jwt') {
    keyStatus = 'invalid';
    configurationState = 'invalid';
    severity = 'critical';
    errorMessage = 'Configuración insegura: se proporcionó una clave de servidor en el cliente web. Usa únicamente una clave publicable o anon.';
  } else if (keyInspection.format === 'unknown') {
    keyStatus = 'invalid';
    configurationState = 'invalid';
    severity = 'critical';
    errorMessage = 'Configuración inválida: la clave pública no coincide con un formato oficial admitido por Supabase.';
  } else if (
    keyInspection.format === 'legacy_anon_jwt' &&
    keyInspection.projectRef !== TARGET_PROJECT_REF
  ) {
    keyStatus = 'mismatched';
    configurationState = 'mismatched';
    severity = 'critical';
    errorMessage = `Discrepancia confirmada: la clave anon heredada declara un proyecto distinto de '${TARGET_PROJECT_REF}'.`;
  }

  const url = urlStatus === 'valid' ? rawUrl : AUTHORIZED_SUPABASE_URL;
  const key = cleanedKey || MISSING_PUBLIC_KEY_SENTINEL;

  const health: SupabaseConfigHealth = {
    targetProjectRef: TARGET_PROJECT_REF,
    activeProjectRef: extractProjectRefFromUrl(url) ?? TARGET_PROJECT_REF,
    activeUrl: url,
    configuredProjectRef: configuredRef,
    urlStatus,
    keyStatus,
    keyFormat: keyInspection.format,
    configurationState,
    severity,
    isHealthy: false,
    appVersion: FINPER_VERSION,
    errorMessage,
  };

  return { url, key, health };
}

const resolvedConfig = resolveSupabaseConfig();
export const SUPABASE_URL = resolvedConfig.url;
export const SUPABASE_PUBLISHABLE_KEY = resolvedConfig.key;
let configHealth = resolvedConfig.health;
let verificationPromise: Promise<SupabaseConfigHealth> | null = null;
const configHealthListeners = new Set<(health: SupabaseConfigHealth) => void>();

function publishConfigHealth(health: SupabaseConfigHealth): SupabaseConfigHealth {
  configHealth = health;
  configHealthListeners.forEach(listener => listener(health));
  return health;
}

/**
 * Comprueba una clave contra el API gateway del mismo URL mediante un endpoint Auth
 * de solo lectura. No lee movimientos, no modifica sesiones y no sincroniza datos.
 */
export async function verifyResolvedSupabaseConfig(
  config: ResolvedSupabaseConfig,
  fetcher: typeof fetch = fetch,
): Promise<SupabaseConfigHealth> {
  if (config.health.configurationState !== 'unverified') return config.health;

  try {
    const response = await fetcher(`${config.url}/auth/v1/settings`, {
      method: 'GET',
      headers: { apikey: config.key },
      cache: 'no-store',
    });

    if (response.ok) {
      return {
        ...config.health,
        keyStatus: 'verified',
        configurationState: 'verified',
        severity: 'ok',
        isHealthy: true,
        errorMessage: null,
      };
    }

    if (response.status === 401 || response.status === 403) {
      return {
        ...config.health,
        keyStatus: 'mismatched',
        configurationState: 'mismatched',
        severity: 'critical',
        isHealthy: false,
        errorMessage: `Discrepancia confirmada: el API gateway del proyecto '${TARGET_PROJECT_REF}' rechazó la clave pública configurada.`,
      };
    }

    return {
      ...config.health,
      keyStatus: 'unverified',
      configurationState: 'unverified',
      severity: 'warning',
      isHealthy: false,
      errorMessage: `No fue posible verificar la clave pública (respuesta HTTP ${response.status}). Las escrituras continúan protegidas.`,
    };
  } catch {
    return {
      ...config.health,
      keyStatus: 'unverified',
      configurationState: 'unverified',
      severity: 'warning',
      isHealthy: false,
      errorMessage: 'Clave pública no verificable en este momento por falta de conectividad. No se confirmó una discrepancia; las escrituras continúan protegidas.',
    };
  }
}

export async function verifySupabaseConfiguration(fetcher: typeof fetch = fetch): Promise<SupabaseConfigHealth> {
  if (configHealth.configurationState === 'verified') return configHealth;
  if (configHealth.configurationState === 'mismatched' || configHealth.configurationState === 'invalid') return configHealth;
  if (resolvedConfig.health.configurationState !== 'unverified') return configHealth;
  if (verificationPromise) return verificationPromise;

  verificationPromise = verifyResolvedSupabaseConfig(resolvedConfig, fetcher)
    .then(publishConfigHealth)
    .finally(() => {
      verificationPromise = null;
    });
  return verificationPromise;
}

export function subscribeSupabaseConfigHealth(listener: (health: SupabaseConfigHealth) => void): () => void {
  configHealthListeners.add(listener);
  return () => configHealthListeners.delete(listener);
}

export function getSupabaseConfigHealth(): SupabaseConfigHealth {
  return configHealth;
}

export function isSupabaseConfigHealthy(): boolean {
  return configHealth.isHealthy;
}

export function assertSupabaseWritesAllowed(health: SupabaseConfigHealth = configHealth): void {
  if (!health.isHealthy) {
    throw new Error(`[FINPER Seguridad] Escrituras detenidas: ${health.errorMessage ?? 'la configuración de Supabase no está verificada.'}`);
  }
}

// Token en memoria administrado exclusivamente en sincronía con el SDK GoTrue de Supabase
let currentSdkToken: string | null = null;

export function updateManagedSdkToken(token: string | null): void {
  currentSdkToken = token;
}

export function getManagedSdkToken(): string | null {
  return currentSdkToken;
}

/**
 * Interceptor HTTP estrictamente acotado para solicitudes de datos a Supabase (/rest/v1/).
 * 
 * Reglas de seguridad:
 * 1. Bloquea de inmediato cualquier petición que mencione dominios obsoletos (ej. elsjuyjjkrkyhlylmaip).
 * 2. Restringe modificaciones exclusivamente al origen exacto del proyecto (SUPABASE_URL) y a rutas /rest/v1/.
 * 3. Detiene operaciones de escritura si existe una discrepancia no resuelta de configuración.
 * 4. NUNCA intercepta rutas de autenticación (/auth/v1/), storage, ni peticiones a otros dominios.
 * 5. NUNCA lee directamente de localStorage (la gestión de sesión y renovación corresponde al SDK).
 * 6. Si la cabecera Authorization ya contiene un Bearer token legítimo del usuario, no se modifica.
 * 7. Solo suministra el token administrado por el SDK si la cabecera es idéntica a la clave pública anónima o está ausente.
 */
const customFetch: typeof fetch = async (input, init) => {
  const urlStr = typeof input === 'string' ? input : (input instanceof Request ? input.url : '');

  // Regla 0: Bloqueo explícito de dominios obsoletos detectados en auditoría
  if (urlStr.includes('elsjuyjjkrkyhlylmaip')) {
    console.error('[FINPER Seguridad] Petición interceptada y abortada al dominio obsoleto.');
    throw new Error(`Dominio obsoleto bloqueado (elsjuyjjkrkyhlylmaip). El proyecto activo es ${TARGET_PROJECT_REF}.`);
  }

  // Regla 1: Restringir estrictamente al origen del proyecto y al endpoint PostgREST (/rest/v1/)
  let parsedRequestUrl: URL | null = null;
  try {
    parsedRequestUrl = new URL(urlStr);
  } catch {
    // Las URLs relativas o no HTTP no forman parte del transporte PostgREST de Supabase.
  }
  const authorizedOrigin = new URL(SUPABASE_URL).origin;
  if (parsedRequestUrl?.origin !== authorizedOrigin || !parsedRequestUrl.pathname.startsWith('/rest/v1/')) {
    return fetch(input, init);
  }

  // Regla 2: Detener escrituras si la configuración está en estado de error
  const method = (init?.method || (input instanceof Request ? input.method : 'GET')).toUpperCase();
  const isWrite = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
  if (isWrite) {
    const verifiedHealth = await verifySupabaseConfiguration();
    assertSupabaseWritesAllowed(verifiedHealth);
  }

  const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
  const currentAuth = headers.get('Authorization');

  // Regla 3: Solo intervenir si la petición carece de Authorization o lleva exactamente la clave pública anónima
  const isAnonymousKey = currentAuth === `Bearer ${SUPABASE_PUBLISHABLE_KEY}`;
  const isMissingAuth = !currentAuth;

  if (isMissingAuth || isAnonymousKey) {
    const token = getManagedSdkToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
      return fetch(input, { ...init, headers });
    }
  }

  return fetch(input, init);
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    fetch: customFetch,
  },
});

// Sincronizar automáticamente el token administrado con los eventos oficiales del SDK de Supabase
if (supabase?.auth?.onAuthStateChange) {
  try {
    supabase.auth.onAuthStateChange((_event, session) => {
      updateManagedSdkToken(session?.access_token ?? null);
    });
  } catch {}
}

// Inicializar el token en memoria si el SDK ya cuenta con sesión al arrancar
if (supabase?.auth?.getSession) {
  try {
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session?.access_token) {
        updateManagedSdkToken(data.session.access_token);
      }
    }).catch(() => {});
  } catch {}
}

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
