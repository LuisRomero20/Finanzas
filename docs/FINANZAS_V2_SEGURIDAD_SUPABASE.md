# FINANZAS 2.0 — Auditoría y Plan de Remediación de Seguridad en Supabase

> **Estado del Incidente:** CRÍTICO — Confirmado el 22 de Octubre de 2026.  
> **Sistema Afectado:** Supabase Project ID `njgzhjwfcxdxiibkuuqg` (`public.transacciones`).  
> **Impacto Potencial:** Exposición pública y riesgo de alteración de 2,246 transacciones financieras sin autenticación previa.

---

## 1. Resumen Ejecutivo de Vulnerabilidades Confirmadas

Durante la auditoría técnica y verificación de conectividad efectuada en el proyecto, se confirmaron fehacientemente los siguientes hallazgos:

| # | Vulnerabilidad / Hallazgo | Nivel de Riesgo | Estado de Verificación |
|---|---------------------------|-----------------|-------------------------|
| 1 | **Tabla `public.transacciones` expuesta con 2,246 registros** | **CRÍTICO** | **Confirmado al 100%** mediante consulta `select count` usando clave `anon`. Se verificó la existencia exacta de 2,246 registros contables accesibles sin sesión iniciada. |
| 2 | **Política RLS permisiva (`ALL` con `USING (true)`)** | **CRÍTICO** | Cualquier cliente que posea la `anon key` (disponible públicamente en el cliente web React) tiene capacidad de realizar consultas de lectura (`SELECT`), escrituras (`INSERT`), modificaciones (`UPDATE`) y borrados (`DELETE`). |
| 3 | **Permisos excesivos para el rol `anon` en Postgres** | **CRÍTICO** | Posibilidad de ejecutar operaciones DDL o DML masivas (`TRUNCATE` / `DELETE` sin condición) al no haberse revocado los privilegios por defecto en el esquema `public`. |
| 4 | **Ausencia de `user_id` / `owner_id` en `public.transacciones`** | **ALTO** | Las columnas verificadas en la tabla son: `id, Tipo, Fecha, Concepto, Categoria, Entidad, Monto, Mes, estado, createdAt, cuotas, esCuotas, montoTotal, montoCuota`. No existe ninguna columna de titularidad que permita discernir el usuario propietario. |
| 5 | **Claves sensibles versionadas previamente en Git** | **ALTO** | Los archivos `.env` y `.env.local` contenían secretos expuestos en revisiones previas. Codex procedió a eliminarlos del índice (`git rm --cached`) y añadirlos al `.gitignore`. |
| 6 | **Ejecución previa de pruebas con escrituras remotas** | **ALTO** | El archivo anterior `src/utils/__tests__/testSupabase.test.ts` invocaba `syncTransactionsToSupabase` y `deleteTransactionFromSupabase` en cada ejecución de `npm test`, amenazando la integridad de datos en producción. |

---

## 2. Detalle Técnico de la Exposición

### 2.1 Vector de Ataque
1. El usuario final o un tercero ingresa a la aplicación web en producción `https://finanzas-tau-three.vercel.app/`.
2. El bundle compilado de Vite contiene la URL `https://njgzhjwfcxdxiibkuuqg.supabase.co` y la clave anónima (`anon key`).
3. Dado que PostgreSQL tiene RLS habilitado pero con regla `CREATE POLICY ... FOR ALL TO public USING (true)`, el motor de Supabase PostgREST entrega la totalidad de los datos de `transacciones` a cualquier petición HTTP no autenticada:
   ```bash
   curl 'https://njgzhjwfcxdxiibkuuqg.supabase.co/rest/v1/transacciones?select=*' \
     -H "apikey: <ANON_KEY>" \
     -H "Authorization: Bearer <ANON_KEY>"
   ```
4. El resultado entrega las 2,246 filas con montos, fechas, categorías y conceptos privados del usuario.

---

## 3. Estrategia de Contención Inmediata y Mitigación

Para proteger de inmediato la información sin causar una interrupción catastrófica (denial of service para el propietario legítimo), se establece el siguiente protocolo de tres fases:

```
[FASE A: Aislamiento Local] ---> [FASE B: Creación de Propietario Auth] ---> [FASE C: Migración y Cutover RLS]
(Completada en local)           (Requiere aprobación del usuario)        (Cierre definitivo de anon)
```

### Fase A: Acciones Locales de Contención Ya Completadas
1. **Eliminación de pruebas destructivas:** Se suprimió `testSupabase.test.ts`. Las pruebas locales unitarias (`npm test`) se encuentran 100% mockeadas vía `setupOfflineSync.ts` y no tocan Supabase.
2. **Aislamiento de integración:** La conectividad remota se trasladó a `testSupabase.integration.test.ts` con bandera obligatoria `RUN_SUPABASE_INTEGRATION=true` y comportamiento estrictamente de sólo lectura.
3. **Variables de entorno protegidas:** Se configuró `.gitignore` para bloquear `.env`, `.env.local`, `.env.*` (salvo `.env.example`).
4. **Build determinista y sin mutación de fuentes:** Se modificó `vite.config.ts` para emitir `version.json` en memoria mediante `generateBundle` sin escribir en `public/version.json`.
5. **Preparación de Esquema Aditivo V2:** Se redactó la migración `supabase/migrations/20261022151306_finanzas_v2_secure_schema.sql` que crea tablas seguras con RLS cerrado por defecto.

---

## 4. Plan de Remediación Definitiva en Producción

> [!IMPORTANT]
> **REGLA DE ORO:** No se ejecutarán scripts destructivos ni migraciones remotas en la base de datos de producción sin la aprobación explícita y confirmación del usuario.

### Paso 1: Respaldo Íntegro de Datos
Antes de cualquier modificación en Supabase:
1. Generar un dump lógico completo vía `supabase db dump` o exportación JSON/CSV de `public.transacciones`.
2. Validar que el conteo en el respaldo sea exactamente igual a **2,246 filas**.
3. Almacenar el archivo de respaldo cifrado fuera del repositorio público.

### Paso 2: Creación del Usuario Propietario Legítimo en `auth.users`
1. No inferir ni crear usuarios ficticios o genéricos.
2. El usuario debe crear su cuenta mediante Supabase Auth (correo/contraseña o Magic Link seguro) desde el panel de control de Supabase o a través de la interfaz de login de la aplicación.
3. Obtener el `UUID` real del usuario autenticado (`auth.uid()`).

### Paso 3: Asignación de Titularidad y Migración de Datos
1. Añadir la columna de propietario a `public.transacciones`:
   ```sql
   ALTER TABLE public.transacciones ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE RESTRICT;
   ```
2. Asignar los 2,246 registros existentes exclusivamente al `UUID` del usuario verificado:
   ```sql
   UPDATE public.transacciones SET user_id = '<USER_UUID>' WHERE user_id IS NULL;
   ALTER TABLE public.transacciones ALTER COLUMN user_id SET NOT NULL;
   ```
3. Crear índice de rendimiento por propietario:
   ```sql
   CREATE INDEX IF NOT EXISTS transacciones_user_id_idx ON public.transacciones(user_id, fecha DESC);
   ```

### Paso 4: Revocación de Privilegios Excesivos y Políticas RLS Restrictivas
1. Revocar permisos de modificación masiva al rol `anon`:
   ```sql
   REVOKE ALL ON TABLE public.transacciones FROM anon, public;
   REVOKE TRUNCATE ON TABLE public.transacciones FROM anon, authenticated, public;
   GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.transacciones TO authenticated;
   ```
2. Eliminar la política insegura `ALL USING (true)`:
   ```sql
   DROP POLICY IF EXISTS "Permitir todo" ON public.transacciones;
   DROP POLICY IF EXISTS "Enable all access" ON public.transacciones;
   ```
3. Crear políticas RLS estrictas vinculadas al token JWT del usuario (`auth.uid()`):
   ```sql
   -- SELECT
   CREATE POLICY "transacciones_select_owner" ON public.transacciones
     FOR SELECT TO authenticated
     USING ((select auth.uid()) = user_id);

   -- INSERT
   CREATE POLICY "transacciones_insert_owner" ON public.transacciones
     FOR INSERT TO authenticated
     WITH CHECK ((select auth.uid()) = user_id);

   -- UPDATE
   CREATE POLICY "transacciones_update_owner" ON public.transacciones
     FOR UPDATE TO authenticated
     USING ((select auth.uid()) = user_id)
     WITH CHECK ((select auth.uid()) = user_id);

   -- DELETE
   CREATE POLICY "transacciones_delete_owner" ON public.transacciones
     FOR DELETE TO authenticated
     USING ((select auth.uid()) = user_id);
   ```

---

## 5. Protocolo de Verificación y Pruebas Negativas

Una vez ejecutada la remediación con autorización del usuario, se aplicarán las siguientes pruebas:

1. **Prueba Negativa (Cliente Anónimo):**
   - Una solicitud GET con la `anon key` a `public.transacciones` debe retornar HTTP 200 con un array vacío `[]` (cero filas visibles) o HTTP 401/403.
   - Una solicitud POST/DELETE anónima debe fallar inmediatamente con error de denegación de RLS.
2. **Prueba Positiva (Propietario Autenticado):**
   - El cliente con sesión iniciada y JWT válido del propietario debe consultar y recibir sus 2,246 registros íntegros.
   - Operaciones de inserción, actualización y borrado de prueba deben tener éxito únicamente sobre sus propios registros.

---

## 6. Plan de Contingencia y Reversión (Rollback)

En caso de que tras la aplicación de las políticas RLS se observe algún problema de visualización o bloqueo:
1. Revertir temporalmente la política RLS a lectura autenticada general mientras se depura el JWT:
   ```sql
   -- Procedimiento de contingencia temporal (solo para authenticated)
   CREATE POLICY "temp_auth_read" ON public.transacciones FOR SELECT TO authenticated USING (true);
   ```
2. Si fuera indispensable una restauración total, restaurar la copia de seguridad tomada en el Paso 1.
