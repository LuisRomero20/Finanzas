# FINPER 2.0.3 — Análisis Forense de Causa Raíz: Incidente de Configuración Supabase

**Fecha:** 22 de Octubre de 2026  
**Versión Afectada:** FINPER 2.0.2 y anteriores  
**Versión de Corrección:** FINPER 2.0.3  
**Severidad:** Crítica (Afecta conectividad de red, autenticación y resolución DNS en clientes)  

---

## 1. Síntomas Observados en Producción

1. **Error de Red en Navegador:** `net::ERR_NAME_NOT_RESOLVED` al intentar conectar con:
   ```
   https://elsjuyjjkrkyhlylmaip.supabase.co
   ```
2. **Error de Autorización en PostgREST:** Solicitudes enviadas a `https://njgzhjwfcxdxiibkuuqg.supabase.co` fallaban con:
   ```json
   {
     "status": 401,
     "error": {
       "message": "Invalid API key",
       "hint": "Double check the provided API key for typos. This API key might also be owned by another Supabase project."
     }
   }
   ```
3. **Fallas en Cascada en el Cliente:**
   - Fallaban peticiones de autenticación GoTrue (`/auth/v1/`).
   - Fallaba la conexión WebSocket de Realtime (`wss://.../realtime/v1`).
   - Los 4 módulos de configuración mostraban «Pendiente de reintento» o «Error de conexión».

---

## 2. Arqueología de Código y Trazabilidad Forense

A través de la inspección del historial de Git (`git log -S "elsjuyjjkrkyhlylmaip"`):

### Origen del Proyecto Obsoleto (`elsjuyjjkrkyhlylmaip`):
- **Commit `06a19c2` (9 de Julio de 2026):**
  FINPER incorporó su integración inicial con Supabase utilizando el project ref de pruebas:
  - `VITE_SUPABASE_URL=https://elsjuyjjkrkyhlylmaip.supabase.co`
  - `VITE_SUPABASE_ANON_KEY=sb_publishable_hvgD4QA4kOCxTTqEMlFLLg_OjNAeLhu`
  Estas variables fueron introducidas en la consola de Vercel en la configuración inicial del proyecto.

### Migración a la Base de Datos Oficial (`njgzhjwfcxdxiibkuuqg`):
- **Commit `3155e51` (29 de Agosto de 2026) y `4782667` (9 de Septiembre de 2026):**
  Se creó el proyecto oficial definitivo de Supabase con los 2,246 registros históricos:
  - `VITE_SUPABASE_URL=https://njgzhjwfcxdxiibkuuqg.supabase.co`
  - Clave JWT anon: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qZ3poandmY3hkeGlpYmt1dXFnIiwicm9sZSI6ImFub24i...`

### El Conflicto en Vercel:
En el Dashboard de Vercel (Project Settings -> Environment Variables):
- La variable `VITE_SUPABASE_ANON_KEY` (o `VITE_SUPABASE_PUBLISHABLE_KEY`) quedó configurada con la clave residual antigua: `sb_publishable_hvgD4QA4kOCxTTqEMlFLLg_OjNAeLhu`.
- Al compilar en producción, Vite inyectó dicha clave en el bundle desplegado:
  ```js
  const ap = Nh("https://njgzhjwfcxdxiibkuuqg.supabase.co"),
        tp = zh("sb_publishable_hvgD4QA4kOCxTTqEMlFLLg_OjNAeLhu");
  ```
- **El resultado fue un mismatch híbrido letal:**
  - URL: `njgzhjwfcxdxiibkuuqg` (Proyecto A)
  - Key: `sb_publishable_...` propiedad de `elsjuyjjkrkyhlylmaip` (Proyecto B)
- Supabase rechazó inmediatamente la clave con código 401: *"This API key might also be owned by another Supabase project."*

### Causa de `net::ERR_NAME_NOT_RESOLVED`:
- El proyecto gratuito original `elsjuyjjkrkyhlylmaip` fue pausado o eliminado por inactividad por la infraestructura de Supabase tras 90 días.
- Su registro DNS fue removido (`Resolve-DnsName : El nombre DNS no existe`).
- Los clientes PWA en iPhone o pestañas de PC con Service Workers de versiones previas seguían intentando contactar el dominio eliminado.

---

## 3. Acciones de Remediación Definitiva (FINPER 2.0.3)

1. **Validación Criptográfica en Tiempo de Inicialización (`src/lib/supabase.ts`):**
   - Se valida el subdominio de la URL contra `TARGET_PROJECT_REF = 'njgzhjwfcxdxiibkuuqg'`.
   - Se decodifica el payload JWT de la clave para verificar que el claim `ref` sea estrictamente `'njgzhjwfcxdxiibkuuqg'`.
   - Si una variable de entorno inyecta una clave o URL incompatible (como la clave residual de Vercel), se rechaza de inmediato, se registra la discrepancia y se utiliza la clave autorizada del proyecto destino.

2. **Cero Fallbacks Silenciosos entre Proyectos:**
   - Si la URL configurada no coincide con el proyecto oficial, `isHealthy` pasa a `false`.
   - El interceptor HTTP detiene inmediatamente cualquier operación de escritura (`POST`, `PUT`, `PATCH`, `DELETE`) impidiendo la alteración de bases de datos ajenas.

3. **Bloqueo Explícito del Dominio Obsoleto:**
   - Tanto `customFetch` como el Service Worker (`public/sw.js`) interceptan y abortan inmediatamente cualquier intento de acceso a `elsjuyjjkrkyhlylmaip`, previniendo errores de red no controlados.

4. **Invalidación Total de Caché PWA:**
   - El Service Worker fue versionado a `finper-cache-v203-`.
   - En su evento `activate`, purga todas las cachés anteriores sin excepción.
   - Se añadió un botón en `SettingsSyncPanel.tsx` para permitir que el usuario limpie la caché PWA con un solo clic en su iPhone o PC.

5. **Monitoreo Seguro en la Interfaz de Usuario:**
   - Se incorporó la visualización del identificador del proyecto activo (`njgzhjwfcxdxiibkuuqg`) y la versión (`v2.0.3`) sin comprometer tokens ni credenciales.
