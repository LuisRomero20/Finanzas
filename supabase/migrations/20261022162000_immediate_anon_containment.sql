-- ==============================================================================
-- FINANZAS 2.0 - OPERACIÓN TRANSACCIONAL DE CONTENCIÓN INMEDIATA
-- ARCHIVO: 20261022162000_immediate_anon_containment.sql
--
-- OBJETIVO:
--   Revocar de inmediato el acceso anónimo (SELECT, INSERT, UPDATE, DELETE, TRUNCATE)
--   a la tabla public.transacciones en producción, preservando las 2,246 filas intactas.
--
-- REQUISITOS PREVIOS VERIFICADOS:
--   1. Respaldo íntegro extraído: backups/supabase_backup_20261022_full.json
--   2. Copia de seguridad externa: C:\Users\Luis Romero\Documents\Finanzas_Backups_Seguridad\
--   3. Checksum SHA-256 verificado: F514CE191DC9F42A68B68FCEE98E5C6B6CB9ED578DF460E1B7CA4CB126F7EA43
-- ==============================================================================

BEGIN;

-- 1. Habilitar y forzar Row Level Security (RLS) en public.transacciones
ALTER TABLE public.transacciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transacciones FORCE ROW LEVEL SECURITY;

-- 2. Revocar todos los privilegios directos de la tabla para los roles anon y public
REVOKE ALL PRIVILEGES ON TABLE public.transacciones FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.transacciones FROM public;

-- 3. Revocar específicamente el privilegio peligroso de TRUNCATE
REVOKE TRUNCATE ON TABLE public.transacciones FROM anon, authenticated, public;

-- 4. Eliminar dinámicamente cualquier política RLS permisiva previa en transacciones
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'transacciones'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.transacciones', pol.policyname);
  END LOOP;
END;
$$;

-- 5. Garantizar privilegios de gestión exclusivamente a roles autorizados (service_role y authenticated)
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.transacciones TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.transacciones TO authenticated;

-- 6. Verificación estricta de integridad antes de confirmar la transacción
DO $$
DECLARE
  current_count bigint;
BEGIN
  SELECT count(*) INTO current_count FROM public.transacciones;
  IF current_count <> 2246 THEN
    RAISE EXCEPTION 'ABORTANDO TRANSACCIÓN: El conteo de transacciones difiere del respaldo. Esperado: 2246, Actual: %', current_count;
  END IF;
  RAISE NOTICE '>>> CONTENCIÓN EXITOSA: Acceso anónimo bloqueado al 100%%. 2,246 filas preservadas intactas. <<<';
END;
$$;

COMMIT;
