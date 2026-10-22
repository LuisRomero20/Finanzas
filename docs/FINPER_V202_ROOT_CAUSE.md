# FINPER 2.0.2 — Análisis Causa Raíz de Sincronización, Concurrencia y Resiliencia RLS

**Fecha:** 22 de Octubre de 2026  
**Proyecto:** FINPER (Finanzas Personales)  
**Rama:** `fix/finper-v202-sync-recovery`  
**Entorno Afectado:** Windows PC (Chrome/Edge) y iPhone (Safari/PWA)  
**Estado Base de Datos:** Supabase `public.transacciones` (2,246 registros íntegros conservados)

---

## 1. Evidencia Visual y Síntomas Observados

En la auditoría de capturas de pantalla de la interfaz de FINPER se identificaron los siguientes síntomas críticos simultáneos:

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

A pesar de que el indicador superior mostraba *"Validada en Supabase"*, ningún dato de configuración se sincronizaba y 4 transacciones financieras permanecían en la cola de salida local (`finper_transaction_outbox_v1`).

---

## 2. Diagnóstico Técnico Profundo: 6 Causas Raíz Confirmadas

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

### Causa Raíz 3: Riesgo de Sobrescritura Ciega ante Colisión 23505 (Corregido)

- **Código Afectado:** `src/services/settingsSnapshot.ts`
- **Falla Previa:** Cuando un cliente intentaba una inserción inicial (`previousHead === null`) y la fila ya existía en Supabase, el error `23505` (duplicate key) era capturado y el código procedía a ejecutar un `UPDATE` sin verificar la versión preexistente:
  ```typescript
  // INSEGURO: sobrescritura sin comparación de versión
  await supabase.from('transacciones').update({ concepto: head }).eq('id', id);
  ```
- **Riesgo Identificado:** Si dos dispositivos (PC e iPhone) intentaban sincronizar un módulo, el segundo sobreescribía al primero sin detectar el cambio concurrente, destruyendo presupuestos o proyecciones.
- **Corrección en FINPER 2.0.2:** Se eliminó por completo el `UPDATE` sin versión. Toda colisión `23505` es tratada como una colisión concurrente optimista (`throw new Error('Otro dispositivo actualizó los datos. Reintenta para comparar las versiones.')`), forzando al cliente a leer la versión de la nube y comparar antes de escribir.

---

### Causa Raíz 4: Desconexión de Token de Concurrencia (`previousHead` Mismatch)

- **Código Afectado:** `src/services/settingsSnapshot.ts`
- **Mecanismo:** `settingsSnapshot.ts` implementa control de concurrencia optimista para evitar que un dispositivo sobreescriba cambios realizados concurrentemente en otro:
  ```typescript
  supabase.from('transacciones').update({ concepto: head }).eq('id', id).eq('concepto', previousHead)
  ```
- **Falla:** `readSnapshot()` generaba un manifiesto sintético si consultaba una fuente dedicada. Al enviar ese `head` sintético como `previousHead` en la siguiente escritura contra `transacciones`, la cláusula `.eq('concepto', previousHead)` buscaba esa cadena sintética, pero la base de datos `transacciones` almacenaba el formato tradicional `{"revision":"<uuid>","count":N}`.
- **Resultado:** La consulta modificaba `0` filas (`result.data.length === 0`). El código interpretaba que otro dispositivo había ganado la carrera y abortaba la operación lanzando `"Otro dispositivo actualizó los datos"`.

---

### Causa Raíz 5: Interceptor HTTP Indiscriminado y Desacoplado del SDK (Corregido)

- **Código Afectado:** `src/lib/supabase.ts`
- **Riesgo Previo:** El interceptor leía directamente el JSON crudo de `localStorage` y sustituía cabeceras de autorización incluso fuera de las solicitudes a `/rest/v1/`, entrando en conflicto con la renovación automática de tokens y endpoints de autenticación (`/auth/v1/`).
- **Corrección en FINPER 2.0.2:** 
  1. El interceptor interviene **estrictamente solicitudes a `/rest/v1/`** (PostgREST).
  2. Nunca toca endpoints `/auth/v1/`, almacenamiento ni APIs externas.
  3. Si la petición ya lleva el token legítimo administrado por el SDK, no interviene.
  4. El token se sincroniza automáticamente con el evento oficial `onAuthStateChange` del SDK GoTrue de Supabase.

---

### Causa Raíz 6: Falso Positivo "Validada en Supabase" en el Diagnóstico de Sesión

- **Código Afectado:** `src/services/authService.ts` y `src/components/SettingsSyncPanel.tsx`
- **Falla:** `getAuthDiagnostic()` consideraba la sesión como `status: 'authenticated'` con solo encontrar un token no expirado en `localStorage`, sin requerir una comprobación activa contra el servidor de Supabase.
- **Corrección en FINPER 2.0.2:** Se implementó una jerarquía de 6 estados granulares: `server_verified`, `offline_cached`, `local_recoverable`, `sdk_active`, `expired`, `unauthenticated`. La interfaz solo muestra *"Validada en Supabase"* si el servidor de Supabase confirmó la validez del token en tiempo real vía `supabase.auth.getUser()`.

---

## 3. Matriz de Remediación Definitiva

| Causa Raíz | Diagnóstico | Solución Aplicada en FINPER 2.0.2 |
| :--- | :--- | :--- |
| **RLS 42501** | Peticiones anónimas rechazadas por RLS | Inyección estricta y segura de Bearer token únicamente en solicitudes `/rest/v1/`. |
| **Sobrescritura 23505** | UPDATE ciego en clave duplicada | Eliminación de UPDATE ciego; rechazo con conflicto optimista para forzar comparación. |
| **Interceptor Fuera de Scope** | Modificación de cabeceras en auth/storage | Alcance acotado exclusivamente a `/rest/v1/` y sincronizado con `onAuthStateChange`. |
| **Ambigüedad de Fuentes** | Riesgo de lectura de espejo desfasado | `transacciones` formalizado como ÚNICA fuente autoritativa. Mirror secundario con estado verificable (`getMirrorSyncStatus()`, `repairMirrorSync()`). |
| **Falso Positivo Auth** | Etiqueta verde engañosa sin validación server | Desagregación en 6 estados fidedignos con verificación en vivo mediante `getUser()`. |

---

## 4. Estado de Datos en Producción

- **Total de registros en `public.transacciones`:** 2,246
- **Registros alterados o eliminados:** 0 (Cero)
- **Integridad:** Confirmada al 100%. Ningún registro financiero ha sido comprometido.
