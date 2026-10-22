-- ==============================================================================
-- FINANZAS 2.0 - MIGRACIÓN CONTROLADA DE REMEDIACIÓN Y ASIGNACIÓN DE PROPIETARIO
-- ARCHIVO: 20261022160000_secure_transacciones_owner_rls.sql
--
-- INSTRUCCIONES DE EJECUCIÓN (REQUIERE APROBACIÓN EXPLÍCITA DEL USUARIO):
-- 1. Asegurarse de que el respaldo 'supabase_backup_20261022_full.json' (2,246 filas)
--    esté verificado localmente.
-- 2. El usuario debe crear su cuenta en Supabase Auth y copiar su UUID.
-- 3. Reemplazar '00000000-0000-0000-0000-000000000000' por el UUID real del usuario.
-- 4. Ejecutar este script en el Editor SQL de Supabase Dashboard.
-- ==============================================================================

do $$
declare
  -- REEMPLAZAR ESTE VALOR POR EL UUID REAL OBTENIDO DE auth.users
  target_owner_id uuid := '00000000-0000-0000-0000-000000000000'::uuid;
  total_legacy_rows bigint;
  assigned_rows bigint;
begin
  -- Validación de seguridad: no permitir UUID por defecto
  if target_owner_id = '00000000-0000-0000-0000-000000000000'::uuid then
    raise exception 'SEGURIDAD: Debes especificar el UUID real del usuario propietario antes de ejecutar la migración.';
  end if;

  -- Verificar que el usuario exista en auth.users
  if not exists (select 1 from auth.users where id = target_owner_id) then
    raise exception 'SEGURIDAD: El UUID proporcionado (%) no existe en auth.users.', target_owner_id;
  end if;

  -- 1. Añadir columna user_id si no existe
  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' and table_name = 'transacciones' and column_name = 'user_id'
  ) then
    alter table public.transacciones add column user_id uuid references auth.users(id) on delete restrict;
  end if;

  -- 2. Conteo previo
  select count(*) into total_legacy_rows from public.transacciones;

  -- 3. Asignar los registros existentes al propietario legítimo
  update public.transacciones
  set user_id = target_owner_id
  where user_id is null;

  get diagnostics assigned_rows = row_count;
  raise notice 'Registros vinculados al propietario %: % de un total de %', target_owner_id, assigned_rows, total_legacy_rows;

  -- 4. Exigir NOT NULL
  alter table public.transacciones alter column user_id set not null;

  -- 5. Crear índice para optimizar consultas por propietario y fecha
  create index if not exists transacciones_user_owner_idx on public.transacciones(user_id, fecha desc);

  -- 6. Habilitar RLS estricta
  alter table public.transacciones enable row level security;

  -- 7. Revocar permisos excesivos a roles no autenticados
  revoke all on table public.transacciones from anon, public;
  revoke truncate on table public.transacciones from anon, authenticated, public;
  grant select, insert, update, delete on table public.transacciones to authenticated;

  -- 8. Eliminar políticas permisivas existentes
  drop policy if exists "Permitir todo" on public.transacciones;
  drop policy if exists "Enable all access" on public.transacciones;
  drop policy if exists "Allow all" on public.transacciones;
  drop policy if exists "Public access" on public.transacciones;
  drop policy if exists "transacciones_select_owner" on public.transacciones;
  drop policy if exists "transacciones_insert_owner" on public.transacciones;
  drop policy if exists "transacciones_update_owner" on public.transacciones;
  drop policy if exists "transacciones_delete_owner" on public.transacciones;

  -- 9. Crear políticas RLS estrictas por propietario
  create policy "transacciones_select_owner" on public.transacciones
    for select to authenticated
    using ((select auth.uid()) = user_id);

  create policy "transacciones_insert_owner" on public.transacciones
    for insert to authenticated
    with check ((select auth.uid()) = user_id);

  create policy "transacciones_update_owner" on public.transacciones
    for update to authenticated
    using ((select auth.uid()) = user_id)
    with check ((select auth.uid()) = user_id);

  create policy "transacciones_delete_owner" on public.transacciones
    for delete to authenticated
    using ((select auth.uid()) = user_id);

  raise notice 'Migración de seguridad de transacciones completada exitosamente.';
end;
$$;
