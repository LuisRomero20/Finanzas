-- ==============================================================================
-- FINPER 2.0.1 - MIGRACIÓN ADITIVA: TABLA DEDICADA PARA CONFIGURACIONES PERSONALES
-- ARCHIVO: 20261022170000_create_personal_settings.sql
--
-- OBJETIVO:
--   Crear la tabla dedicada 'public.personal_settings' para desacoplar las configuraciones
--   (Presupuestos, Proyecciones, Deudas regularizadas, Clasificación) de la tabla 'transacciones',
--   evitando la fragmentación en trozos de 240 caracteres y mejorando la confiabilidad
--   multidispositivo (PC <-> iPhone).
--
-- CARACTERÍSTICAS:
--   1. ESTRICTAMENTE ADITIVA: No modifica, trunca ni elimina filas de 'transacciones'.
--   2. RLS FORZADO: Aislamiento por usuario autenticado (auth.uid() = user_id).
--   3. CERO ACCESO ANÓNIMO: Revocación total de permisos a 'anon' y 'public'.
--   4. COMPATIBILIDAD TRANSICIONAL: El frontend soporta lectura dual (dual-read) y
--      escritura dual (dual-write) sin requerir downtime ni migraciones destructivas.
-- ==============================================================================

BEGIN;

-- 1. Crear tabla personal_settings si no existe
CREATE TABLE IF NOT EXISTS public.personal_settings (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Índices de optimización
CREATE INDEX IF NOT EXISTS idx_personal_settings_user_name 
    ON public.personal_settings (user_id, name);

-- 3. Habilitar y forzar Row Level Security (RLS)
ALTER TABLE public.personal_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_settings FORCE ROW LEVEL SECURITY;

-- 4. Revocar todos los privilegios a roles anónimos y públicos
REVOKE ALL PRIVILEGES ON TABLE public.personal_settings FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.personal_settings FROM public;
REVOKE TRUNCATE ON TABLE public.personal_settings FROM anon, authenticated, public;

-- 5. Otorgar permisos a service_role y authenticated
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.personal_settings TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.personal_settings TO authenticated;

-- 6. Políticas de Seguridad RLS
DROP POLICY IF EXISTS "personal_settings_select_own" ON public.personal_settings;
CREATE POLICY "personal_settings_select_own"
    ON public.personal_settings
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "personal_settings_insert_own" ON public.personal_settings;
CREATE POLICY "personal_settings_insert_own"
    ON public.personal_settings
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "personal_settings_update_own" ON public.personal_settings;
CREATE POLICY "personal_settings_update_own"
    ON public.personal_settings
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "personal_settings_delete_own" ON public.personal_settings;
CREATE POLICY "personal_settings_delete_own"
    ON public.personal_settings
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

COMMIT;
