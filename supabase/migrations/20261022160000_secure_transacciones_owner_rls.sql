-- ==============================================================================
-- FINANZAS 2.0 - MIGRACIÓN CONTROLADA DE REMEDIACIÓN Y ASIGNACIÓN DE PROPIETARIO
-- ARCHIVO: 20261022160000_secure_transacciones_owner_rls.sql
-- PROPIETARIO DESIGNADO: 0fdea8f0-da9c-458b-a78c-4810a0685f2b
-- ==============================================================================

BEGIN;

-- 1. Agregar columna user_id vinculada a auth.users si no existe
ALTER TABLE public.transacciones
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Asignar los 2,246 registros históricos al usuario propietario legítimo
UPDATE public.transacciones
SET user_id = '0fdea8f0-da9c-458b-a78c-4810a0685f2b'::UUID
WHERE user_id IS NULL;

-- 3. Establecer user_id como NOT NULL y con valor por defecto auth.uid()
ALTER TABLE public.transacciones
ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE public.transacciones
ALTER COLUMN user_id SET DEFAULT auth.uid();

-- 4. Crear índice optimizado para consultas por propietario y fecha
CREATE INDEX IF NOT EXISTS transacciones_user_owner_idx
ON public.transacciones(user_id, fecha DESC);

-- 5. Habilitar y forzar Row Level Security (RLS)
ALTER TABLE public.transacciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transacciones FORCE ROW LEVEL SECURITY;

-- 6. Revocar privilegios inseguros a roles anónimos y públicos
REVOKE ALL ON TABLE public.transacciones FROM anon, public;
REVOKE TRUNCATE ON TABLE public.transacciones FROM anon, authenticated, public;

-- 7. Otorgar permisos CRUD estándar únicamente al rol autenticado
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.transacciones TO authenticated;

-- 8. Limpiar cualquier política residual anterior
DROP POLICY IF EXISTS "Permitir todo" ON public.transacciones;
DROP POLICY IF EXISTS "Enable all access" ON public.transacciones;
DROP POLICY IF EXISTS "Allow all" ON public.transacciones;
DROP POLICY IF EXISTS "Public access" ON public.transacciones;
DROP POLICY IF EXISTS "Permitir todo acceso a transacciones" ON public.transacciones;
DROP POLICY IF EXISTS "transacciones_select_owner" ON public.transacciones;
DROP POLICY IF EXISTS "transacciones_insert_owner" ON public.transacciones;
DROP POLICY IF EXISTS "transacciones_update_owner" ON public.transacciones;
DROP POLICY IF EXISTS "transacciones_delete_owner" ON public.transacciones;

-- 9. Establecer las 4 políticas RLS definitivas basadas en el UID del usuario autenticado
CREATE POLICY "transacciones_select_owner"
    ON public.transacciones
    FOR SELECT
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "transacciones_insert_owner"
    ON public.transacciones
    FOR INSERT
    TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "transacciones_update_owner"
    ON public.transacciones
    FOR UPDATE
    TO authenticated
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "transacciones_delete_owner"
    ON public.transacciones
    FOR DELETE
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

COMMIT;
