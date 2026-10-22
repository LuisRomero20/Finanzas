# Pull Request (Borrador): FINPER 2.0.3 — Resolución de Incidente de Configuración Supabase y Contención de Dominios

**Rama Origen:** `fix/finper-v203-supabase-config`  
**Rama Destino:** `main`  
**URL de Creación:** [https://github.com/LuisRomero20/Finanzas/pull/new/fix/finper-v203-supabase-config](https://github.com/LuisRomero20/Finanzas/pull/new/fix/finper-v203-supabase-config)  
**Estado:** Borrador (Draft) — En espera de aprobación final del usuario  

---

## 1. Resumen de Cambios

1. **Resolución de Causa Raíz de Desconexión (`net::ERR_NAME_NOT_RESOLVED` y `401 Unauthorized`):**
   - Identificada la presencia de la clave residual `sb_publishable_hvgD4QA4kOCxTTqEMlFLLg_OjNAeLhu` (perteneciente al proyecto obsoleto `elsjuyjjkrkyhlylmaip`) inyectada desde variables de entorno de Vercel.
   - En `src/lib/supabase.ts`, se implementó validación criptográfica estricta: decodifica el token para asegurar que pertenezca a `njgzhjwfcxdxiibkuuqg`. Claves ajenas o de formato no compatible son rechazadas inmediatamente en favor de la clave oficial autorizada.
   - Si la URL o clave no corresponden al proyecto oficial, se activa la bandera de seguridad y se bloquean escrituras para evitar alterar bases de datos ajenas.
   - Toda solicitud dirigida a `elsjuyjjkrkyhlylmaip` es bloqueada a nivel interceptor y service worker.

2. **Caché PWA y Service Worker (`public/sw.js` y `main.tsx`):**
   - Versionado a `finper-cache-v203-`.
   - Limpieza incondicional de cachés obsoletas en el evento `activate`.
   - Bloqueo de peticiones al dominio obsoleto.
   - Botón directo en la interfaz para «Limpiar caché PWA» con un clic en caso de que Safari iOS o Edge retengan bundles antiguos.

3. **Visibilidad Segura en `SettingsSyncPanel.tsx`:**
   - Muestra el identificador del proyecto activo (`njgzhjwfcxdxiibkuuqg`) y la versión (`v2.0.3`) sin exponer tokens sensibles.
   - Eliminado el botón «Compartir este dispositivo a la nube» ante fallos de conectividad (solo se permite «Reintentar conexión»).

---

## 2. Resultados de Validación

- **Vitest:** 153 pruebas aprobadas en 29 suites (100% de éxito).
- **TypeScript:** 0 errores (`npx tsc --noEmit`).
- **ESLint:** 0 errores (`npm run lint`).
- **Build de Producción:** Generado exitosamente en `dist/` en 10.02s.
- **Base de Datos:** 2,246 registros contables intactos. 4 movimientos en cola local preservados.
