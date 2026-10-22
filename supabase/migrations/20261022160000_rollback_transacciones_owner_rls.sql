-- ==============================================================================
-- FINANZAS 2.0 - PROCEDIMIENTO DE REVERSIÓN (ROLLBACK) DE EMERGENCIA
-- ARCHIVO: 20261022160000_rollback_transacciones_owner_rls.sql
--
-- USAR SOLO EN CASO DE EMERGENCIA SI SE PRESENTA BLOQUEO DE ACCESO
-- ==============================================================================

do $$
begin
  -- 1. Eliminar políticas estrictas
  drop policy if exists "transacciones_select_owner" on public.transacciones;
  drop policy if exists "transacciones_insert_owner" on public.transacciones;
  drop policy if exists "transacciones_update_owner" on public.transacciones;
  drop policy if exists "transacciones_delete_owner" on public.transacciones;

  -- 2. Restaurar permisos básicos controlados para authenticated
  grant select, insert, update, delete on table public.transacciones to authenticated;
  grant select on table public.transacciones to anon; -- Solo lectura de contingencia

  -- 3. Crear política de contingencia para authenticated
  create policy "transacciones_contingency_auth" on public.transacciones
    for all to authenticated
    using (true)
    with check (true);

  raise warning 'PROCEDIMIENTO DE REVERSIÓN COMPLETADO: La tabla transacciones está en modo contingencia.';
end;
$$;
