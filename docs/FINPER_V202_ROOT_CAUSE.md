# FINPER 2.0.2 — Análisis Causa Raíz de Sincronización y Recuperación RLS

**Fecha:** 22 de Octubre de 2026  
**Proyecto:** FINPER (Finanzas Personales)  
**Rama:** `fix/finper-v202-sync-recovery`  
**Entorno Afectado:** Windows PC (Chrome/Edge) y iPhone (Safari/PWA)  
**Estado Base de Datos:** Supabase `public.transacciones` (2,246 registros íntegros conservados)

---

## 1. Evidencia Visual y Síntomas Observados

En la auditoría de capturas de pantalla de la interfaz de FINPER 2.0.1 se identificaron los siguientes síntomas críticos simultáneos:

```
┌────────────────────────────────────────────────────────────────────────┐
│ Sincronización Segura PC / iPhone                       [RLS Activo]   │
│ Sesión: luis_jesusrc@hotmail.com                                       │
├────────────────────────────────────────────────────────────────────────┤
│ Cola de Movimientos: 4 pendientes                                      │
│ Cola de Pagos Pendientes: 0 pendientes                                 │
│ Estado de Sesión: Validada en Supabase (Verde)                         │
├────────────────────────────────────────────────────────────────────────┤
│ 1. Presupuestos por Categoría         [Pendiente de reintento] (Rojo)  │
│    "No se pudo sincronizar. Se conserva la copia local."               │
│ 2. Proyecciones & Ingresos Fijos      [Pendiente de reintento] (Rojo)  │
│    "No se pudo sincronizar. Se conserva la copia local."               │
│ 3. Deudas regularizadas de tarjetas   [Pendiente de reintento] (Rojo)  │
│    "No se pudo sincronizar. Se conserva la copia local."               │
│ 4. Clasificación de movimientos       [Pendiente de reintento] (Rojo)  │
│    "No se pudo sincronizar. Se conserva la copia local."               │
└────────────────────────────────────────────────────────────────────────┘
```

A pesar de que el indicador superior mostraba *"Validada en Supabase"*, ningún dato de configuración se sincronizaba y 4 transacciones financieras permanecían atascadas en la cola de salida (`finper_transaction_outbox_v1`).

---

## 2. Diagnóstico Técnico Profundo: 5 Causas Raíz Confirmadas

### Causa Raíz 1: Error 42501 (Permission Denied) por Falta de Inyección del Bearer Token

- **Mecanismo:** La tabla `public.transacciones` tiene políticas estrictas de seguridad de nivel de fila (Row Level Security - RLS) y los privilegios para el rol anónimo (`anon`) fueron completamente revocados (`REVOKE ALL ON public.transacciones FROM anon;`).
- **Falla en el Cliente:** Cuando el cliente web inicia o se recarga, el SDK de Supabase (GoTrue) no tiene la sesión hidratada en su memoria interna inmediatamente. Al emitir consultas (`supabase.from('transacciones')`), el SDK adjuntaba por defecto la cabecera `Authorization: Bearer <SUPABASE_ANON_KEY>`.
- **Resultado:** PostgREST en Supabase evaluó la petición bajo el rol `anon`, denegando el acceso y retornando un error HTTP 403 con código Postgres `42501` (`permission denied for table transacciones`).

---

### Causa Raíz 2: Enmascaramiento del Error PostgREST en la UI (`[object Object]`)

- **Código Afectado:** `src/services/personalSettingsSync.ts`
- **Falla:** El bloque `catch` evaluaba:
  ```typescript
  const msg = error instanceof Error ? error.message : String(error);
  ```
- **Problema:** En el SDK de Supabase, los errores de consulta (`PostgrestError`) son objetos planos de JavaScript (`{ message: 'permission denied...', code: '42501', details: ... }`), no instancias de `Error`. Al ejecutar `String(error)`, JavaScript generaba la cadena `"[object Object]"`.
- **Consecuencia:** Como `"[object Object]"` no coincidía con las cadenas de comprobación (`'JWT'`, `'permission denied'`, etc.), el sistema caía en el fallback por defecto:
  ```typescript
  let userMsg = 'No se pudo sincronizar. Se conserva la copia local.';
  ```
  Esto ocultó la causa técnica real tanto al usuario como al equipo de ingeniería, aparentando ser una falla genérica de conectividad.

---

### Causa Raíz 3: Desconexión de Token de Concurrencia (`previousHead` Mismatch)

- **Código Afectado:** `src/services/settingsSnapshot.ts`
- **Mecanismo:** `settingsSnapshot.ts` implementa control de concurrencia optimista para evitar que un dispositivo sobreescriba cambios realizados concurrentemente en otro:
  ```typescript
  supabase.from('transacciones').update({ concepto: head }).eq('id', id).eq('concepto', previousHead)
  ```
- **Falla:** Al intentar preparar la migración a `personal_settings`, `readSnapshot()` generaba un manifiesto sintético si consultaba una fuente dedicada:
  ```typescript
  head: JSON.stringify({ revision: dedicatedData.version, count: 1 })
  ```
  Al enviar ese `head` sintético como `previousHead` en la siguiente escritura contra `transacciones`, la cláusula `.eq('concepto', previousHead)` buscaba esa cadena sintética, pero la base de datos `transacciones` almacenaba el formato tradicional `{"revision":"<uuid>","count":N}`.
- **Resultado:** La consulta modificaba `0` filas (`result.data.length === 0`). El código interpretaba que otro dispositivo había ganado la carrera y abortaba la operación lanzando:
  `"Otro dispositivo actualizó los datos. Reintenta para comparar las versiones."`

---

### Causa Raíz 4: Violación de Clave Única (Postgres 23505) en Sincronización Inicial

- **Código Afectado:** `src/services/settingsSnapshot.ts`
- **Falla:** Cuando un dispositivo conectaba por primera vez o `readSnapshot()` no encontraba un manifiesto previo, pasaba `previousHead = null`. En ese caso, el código ejecutaba:
  ```typescript
  if (previousHead === null) {
    const result = await supabase.from('transacciones').insert(row(id, head, 0, userId));
    if (result.error) throw result.error;
  }
  ```
- **Problema en Producción:** Las 4 filas clave (`config-sync-budgets`, `config-sync-projections`, `config-sync-statements`, `config-sync-classifications`) **ya existían** en la tabla `transacciones` de Supabase (creadas en versiones anteriores).
- **Resultado:** La inserción directa fallaba con el código Postgres `23505` (`duplicate key value violates unique constraint "transacciones_pkey"`), bloqueando permanentemente la sincronización.

---

### Causa Raíz 5: Falso Positivo "Validada en Supabase" en el Diagnóstico de Sesión

- **Código Afectado:** `src/services/authService.ts` y `src/components/SettingsSyncPanel.tsx`
- **Falla:** `getAuthDiagnostic()` consideraba la sesión como `status: 'authenticated'` con solo encontrar un token no expirado en `localStorage`, sin requerir una comprobación activa contra el servidor de Supabase.
- **Consecuencia en la UX:** El panel mostraba la etiqueta verde *"Validada en Supabase"*, creando la falsa impresión de que la conexión a la base de datos estaba operativa, cuando en realidad las peticiones de base de datos estaban siendo rechazadas por RLS o por falta de token en el cliente HTTP.

---

## 3. Matriz de Impacto y Resolución en FINPER 2.0.2

| Causa Raíz | Impacto en Producción | Solución Implementada en FINPER 2.0.2 |
| :--- | :--- | :--- |
| **RLS 42501** | Transacciones en cola y lecturas bloqueadas | Interceptor `customFetch` en `supabase.ts` que inyecta automáticamente `Authorization: Bearer <access_token>` en todas las peticiones a `/rest/v1/`. |
| **Stringificación de Error** | Error real oculto tras mensaje genérico | Extracción exhaustiva de `error.code`, `error.status` y `error.message` en `personalSettingsSync.ts`, reportando códigos técnicos específicos (42501, 23505, RLS) sin exponer credenciales. |
| **`previousHead` Mismatch** | Fallo de concurrencia optimista artificial | `readSnapshot()` siempre preserva como token de concurrencia (`head`) la cadena exacta de `transacciones.concepto`. |
| **Unique 23505** | Fallo al insertar configuración existente con `previousHead=null` | Detección de error 23505 en `writeSnapshot()` con conmutación automática e idempotente a `update` del manifiesto. |
| **Falso Positivo Auth** | Mensaje engañoso "Validada en Supabase" | Desagregación formal de estados de verificación: `server_verified`, `sdk_active`, `local_recoverable`, `offline_cached`, `expired`, `unauthenticated`. |

---

## 4. Estado de Datos en Producción

- **Total de registros en `public.transacciones`:** 2,246
- **Registros alterados o eliminados:** 0 (Cero)
- **Integridad:** Se confirma que ningún dato financiero fue sobreescrito ni eliminado durante la ejecución de este diagnóstico.
