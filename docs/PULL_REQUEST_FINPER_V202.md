# Pull Request (Borrador): FINPER 2.0.2 — Recuperación Crítica de Sincronización y Concurrencia RLS

**Rama Origen:** `fix/finper-v202-sync-recovery`  
**Rama Destino:** `main`  
**URL de Creación:** [https://github.com/LuisRomero20/Finanzas/pull/new/fix/finper-v202-sync-recovery](https://github.com/LuisRomero20/Finanzas/pull/new/fix/finper-v202-sync-recovery)  
**Estado:** BORRADOR (Draft) — En espera de aprobación final del usuario  

---

## 1. Resumen de Cambios

Este PR resuelve de manera integral y matemáticamente demostrable las fallas de sincronización entre Windows PC y iPhone (Safari/PWA):

1. **Eliminación Total de UPDATEs Ciegos en Colisiones 23505:**
   - Si un dispositivo intenta crear un ajuste con `previousHead === null` pero la fila ya existe en Supabase, el sistema rechaza la operación lanzando una excepción de concurrencia optimista (`throw new Error('Otro dispositivo actualizó los datos. Reintenta para comparar las versiones.')`).
   - Ningún dispositivo puede sobreescribir los datos de otro sin verificar la versión preexistente.

2. **Interceptor HTTP Acotado Exclusivamente a `/rest/v1/` (`customFetch`):**
   - El interceptor ya no lee directamente el almacenamiento de forma indiscriminada.
   - Solo interviene solicitudes dirigidas estrictamente a PostgREST (`/rest/v1/`).
   - Rutas de autenticación (`/auth/v1/`), almacenamiento y APIs externas pasan directamente sin ser alteradas.
   - El token se sincroniza automáticamente con el evento oficial `supabase.auth.onAuthStateChange`.

3. **Definición Formal de la Fuente Autoritativa Única (`public.transacciones`):**
   - `public.transacciones` es la única fuente de verdad (Single Source of Truth) para FINPER.
   - Todas las lecturas canónicas provienen de `transacciones`.
   - La tabla secundaria `personal_settings` opera como mirror de contingencia con estado verificable (`getMirrorSyncStatus()`, `repairMirrorSync()`).

4. **Desagregación del Diagnóstico de Sesión:**
   - La interfaz solo declara *"Validada en Supabase"* si el servidor confirmó en vivo el token vía `supabase.auth.getUser()`. Si está desconectado, reporta honestamente *"Offline (Caché local)"*.

5. **Protección del Outbox de Movimientos:**
   - Las 4 transacciones pendientes se conservan en cola local y se despachan hacia Supabase garantizando el `user_id` del usuario autenticado.

---

## 2. Resultados de Validación

- **Pruebas Automatizadas:** 147 de 147 pruebas pasadas en 28 suites (100% éxito).
- **TypeScript (`tsc --noEmit`):** 0 errores de compilación.
- **ESLint (`eslint .`):** 0 errores (12 advertencias heredadas en páginas legacy documentadas).
- **Compilación de Producción (`vite build`):** Exitosa en 9.5s.
- **Base de Datos de Producción:** 2,246 registros históricos contables intactos en `public.transacciones`. RLS protege el acceso exclusivo al propietario.

---

## 3. Protocolo de Despliegue y Rollback

- **Despliegue:** Merge de `fix/finper-v202-sync-recovery` a `main` cuando el usuario lo autorice.
- **Rollback:** `git revert HEAD -m 1` restaurable de forma instantánea sin pérdida de datos contables.
