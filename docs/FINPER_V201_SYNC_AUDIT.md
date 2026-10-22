# FINPER 2.0.1 — AUDITORÍA TÉCNICA DE SINCRONIZACIÓN MULTIDISPOSITIVO (PC vs iPhone)

**Fecha:** 22 de Octubre de 2026  
**Versión de Evaluación:** FINPER 2.0.0 → 2.0.1  
**Dispositivos Analizados:** Windows PC (Google Chrome/Edge) vs iPhone (Mobile Safari/PWA)  
**Ambiente:** Producción Vercel (`https://finanzas-tau-three.vercel.app/`)  
**Base de Datos:** Supabase PostgreSQL (`njgzhjwfcxdxiibkuuqg`) — 2,246 registros históricos verificados con RLS activo y titularidad `user_id`.

---

## 1. Análisis Forense de Capturas de Pantalla

A partir de las cuatro evidencias visuales aportadas durante el uso real de la aplicación, se determinó el comportamiento asincrónico entre dispositivos:

### Evidencia 1: Panel de Sincronización en iPhone
- **Comportamiento Observado:** Los 4 módulos clave de personalización:
  1. *Presupuestos*
  2. *Proyecciones*
  3. *Deudas regularizadas de tarjetas*
  4. *Clasificación de movimientos*
  figuraban con la etiqueta en ámbar: **«Pendiente de reintento»**.
- **Diagnóstico:** El dispositivo móvil conservaba los datos en su `localStorage` local pero no lograba confirmar la escritura en Supabase. El usuario recibía un mensaje genérico sin código de error ni detalle de causa (expiración de JWT vs. error de red).

### Evidencia 2: Panel de Sincronización en PC
- **Comportamiento Observado:** En el navegador de escritorio se observaban módulos en estado «Sincronizando...» permanente o alternando a «Pendiente de reintento».
- **Diagnóstico:** Demuestra que la falla no era un defecto exclusivo del motor WebKit de Safari móvil, sino un problema arquitectónico transversal en el ciclo de vida de la sesión Supabase y la serialización de configuraciones.

### Evidencias 3 y 4: Discrepancia en Movimientos Pendientes (PC vs iPhone)
- **Comportamiento Observado:**
  - **PC:** Mostraba 4 partidas pendientes: `GYM`, `iCloud`, `Fútbol` y `Salida`.
  - **iPhone:** Mostraba únicamente 3 partidas: `GYM`, `iCloud` y `Fútbol`.
- **Análisis de Causa Raíz de la partida "Salida":**
  1. **Ignición de errores silenciosa:** En `src/store/pendingPaymentsStore.ts`, la operación de guardado utilizaba el patrón:
     ```typescript
     savePendingPaymentToSupabase(it).catch(() => {})
     ```
     Al crearse la partida `Salida` en la PC, se guardó inmediatamente en el `localStorage` local de la PC. Sin embargo, la llamada remota a Supabase falló (o fue bloqueada por falta de cabecera de autenticación), y el `.catch(() => {})` descartó silenciosamente el error. La PC mostró el ítem porque leía de su propio caché local, pero la fila nunca llegó a Supabase. Al abrir el iPhone, este consultó la nube y lógicamente jamás descargó `Salida`.
  2. **Ausencia de cola Outbox:** No existía una cola persistente de reintentos fuera de línea para pagos pendientes. Si la conexión fallaba en el milisegundo exacto del guardado, la operación se perdía de forma irrecuperable.

---

## 2. Matriz de Hallazgos y Causas Raíz

| ID | Hallazgo Crítico | Severidad | Impacto | Archivos Involucrados | Causa Raíz |
|:---|:---|:---:|:---|:---|:---|
| **H-01** | Sesión fantasma / Token no persistido | **Crítica** | Las llamadas a Supabase eran rechazadas silenciosamente por RLS (falta de token o token expirado), dejando el estado en reintento permanente. | `api/login.ts`<br>`src/services/authService.ts` | El proxy `/api/login` no devolvía `expires_at` numérico calculado; GoTrue SDK no podía validar el tiempo de vida y descartaba la sesión en memoria tras recargar página. |
| **H-02** | Guardado de pagos pendientes sin garantía | **Alta** | Pérdida de sincronización de ítems pendientes (caso "Salida" en PC vs iPhone). | `src/store/pendingPaymentsStore.ts` | Empleo de `.catch(() => {})` sin cola de reintento transaccional (`Outbox pattern`). |
| **H-03** | Configuraciones fragmentadas en `transacciones` | **Alta** | Lentitud extrema, condición de carrera con UUIDs desfasados y saturación con 1,343 chunks en la tabla contable. | `src/services/settingsSnapshot.ts` | Las configuraciones se serializaban dividiéndose en trozos de 240 caracteres insertados como falsas transacciones contables. |
| **H-04** | Falta de titularidad explícita (`user_id`) | **Media** | Rechazo por políticas RLS en operaciones de inserción directa desde clientes. | `src/services/supabaseService.ts` | Las funciones de guardado (`saveCardsConfigToSupabase`, `saveBridgeConfigToSupabase`, etc.) no inyectaban `user_id` del usuario validado en el payload. |
| **H-05** | Diagnóstico visual opaco | **Baja** | El usuario no sabía si el fallo era de red, sesión vencida o conflicto de versión. | `src/components/SettingsSyncPanel.tsx` | La UI solo renderizaba "Pendiente de reintento" sin inspección del estado de sesión ni cola outbox. |

---

## 3. Estado de la Base de Datos Supabase

- **Verificación de Seguridad RLS:**
  - `public.transacciones`: RLS forzado (`FORCE ROW LEVEL SECURITY`).
  - Total de registros: **2,246 registros contables íntegros**.
  - Todos los registros asociados a `user_id: 0fdea8f0-da9c-458b-a78c-4810a0685f2b`.
  - Roles anónimos (`anon`) revocados al 100%.
- **Respaldo previo:**
  - Respaldo completo verificado con hash SHA-256 intacto.

---

## 4. Conclusiones y Plan de Acción Ejecutado

1. **Reparación del ciclo de vida de la sesión:** Implementación de `expires_at` en `api/login.ts` y diagnóstico activo en `authService.ts`.
2. **Creación del Motor Outbox:** Implementación de `pendingPaymentsOutbox.ts` con almacenamiento local persistente, reintentos con respaldo exponencial y procesamiento atómico antes de sincronizar.
3. **Inyección de titularidad:** Asociación automática de `session.user.id` en todas las operaciones hacia Supabase.
4. **Desacoplamiento progresivo:** Creación de la migración aditiva para `personal_settings` y soporte de lectura dual en `settingsSnapshot.ts`.
5. **Observabilidad UX:** Rediseño del componente `SettingsSyncPanel.tsx` mostrando salud de sesión, conteo de outbox pendiente y botón de sincronización total.
