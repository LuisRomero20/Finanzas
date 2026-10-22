# [DRAFT PR] FINPER 2.0.1: Sincronización Multidispositivo, Motor Outbox y Resiliencia de Sesión

**Rama Base:** `main`  
**Rama Comparada:** `feature/finper-v201-sync`  
**Estado:** Borrador de Revisión (Draft) — Pendiente de Autorización para Fusión  
**Enlace para creación en 1 clic:** [Crear Pull Request en GitHub](https://github.com/LuisRomero20/Finanzas/compare/main...feature/finper-v201-sync?expand=1)

---

## 1. Resumen de Cambios

Esta versión estabiliza de forma definitiva la sincronización entre PC Windows y iPhone (Safari/PWA), solucionando los bloqueos por «Pendiente de reintento» y las discrepancias en partidas pendientes (como la partida «Salida»).

### Componentes Clave Implementados:
1. **Motor Outbox Offline con Reintentos Idempotentes (`pendingPaymentsOutbox.ts`):**
   - Cola persistente en `localStorage` (`finper_pending_payments_outbox_v1`).
   - Reintentos con respaldo exponencial a partir del 3.er intento.
   - Cancelación limpia en cola de partidas creadas y eliminadas localmente antes de sincronizar a la nube.
   - Aislamiento de operaciones por titular de sesión (`userId`).
   - Drenaje secuencial antes de lecturas remotas para evitar sobrescrituras.

2. **Gestión Robusta del Ciclo de Vida de Autenticación (`authService.ts`):**
   - El proxy `/api/login` computa explícitamente `expires_at = now + expires_in`.
   - `getValidatedSession()` evalúa expiración matemática estricta y renovación automática por `refresh_token`.
   - Soporte desacoplado para navegadores con extensiones de bloqueo/privacidad que restringen llamadas directas del SDK GoTrue.

3. **Mecanismo de Transición con Control de Versiones (`settingsSnapshot.ts`):**
   - **Lectura Dual con Comparación de Versiones:** Compara marcas de tiempo (`updated_at`) entre la tabla dedicada `personal_settings` y el manifiesto tradicional de `transacciones`. Si la fuente tradicional es más reciente, prioriza sus fragmentos y no sufre de lectura obsoleta.
   - **Escritura Dual Verificada:** Inserta y valida los fragmentos en `transacciones`, confirma el manifiesto con bloqueo optimista contra `previousHead` (rechazando sobrescrituras obsoletas), y ejecuta un `upsert` verificado en `personal_settings` reportando cualquier anomalía de esquema.
   - No declara sincronización exitosa si la fuente autoritativa no fue confirmada por el servidor.

4. **Experiencia de Usuario y Observabilidad (`SettingsSyncPanel.tsx`):**
   - Diagnóstico en tiempo real de sesión activa, expiración y conteo de la cola Outbox.
   - Botón unificado de un clic **«Sincronizar Todo»**.
   - Mensajes de diagnóstico claros que diferencian problemas de red de caducidad de credenciales.

5. **Migración SQL Aislada (`supabase/migrations/20261022170000_create_personal_settings.sql`):**
   - Estrictamente aditiva, no destructiva, con RLS forzado (`auth.uid() = user_id`) y revocación total a roles anónimos.
   - **No ejecutada en producción**; validada mediante suite de pruebas automatizadas.

---

## 2. Resultados de Validación Automatizada

- **Vitest:** **136 de 136 pruebas aprobadas (100%)** en 27 suites.
- **Tipado:** `npx tsc --noEmit` completado con `0` errores.
- **Build:** `npm run build` completado exitosamente en `9.30s`.
- **Integridad de Datos:** 2,246 registros históricos contables intactos en Supabase.

---

## 3. Matriz de Riesgos y Mitigaciones

| Riesgo Identificado | Severidad | Mitigación Implementada |
|:---|:---:|:---|
| Falla en dual-write de `personal_settings` | Baja | La fuente autoritativa durante la fase de transición sigue siendo `transacciones`. Si `personal_settings` no existe o falla, el sistema lee de `transacciones` sin pérdida de datos. |
| Condición de carrera por escrituras simultáneas PC/iPhone | Media | Verificación optimista contra `previousHead`. Si otro dispositivo actualizó primero, el intento se aborta con error explicativo para refrescar y no pisar datos. |
| Caída prolongada de red móvil | Media | La cola Outbox retiene las operaciones con respaldo exponencial sin degradar la batería ni perder partidas. |
| Inconsistencia de tokens por extensiones | Baja | Hidratación local desde `localStorage` con validación estricta de tiempo restante de vigencia. |

---

## 4. Protocolo de Rollback

En caso de requerirse reversión en producción:
1. Revertir el commit de fusión en `main`:
   ```bash
   git revert -m 1 HEAD
   git push origin main
   ```
2. O activar **Instant Rollback** en el panel de Vercel al despliegue inmediatamente anterior.
3. Ninguna tabla contable histórica es modificada ni truncada.
