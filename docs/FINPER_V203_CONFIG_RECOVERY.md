# FINPER 2.0.3 — Protocolo de Recuperación y Actualización de Configuración

**Versión:** 2.0.3  
**Fecha:** 22 de Octubre de 2026  
**Rama:** `fix/finper-v203-supabase-config`  
**Proyecto Autorizado:** `njgzhjwfcxdxiibkuuqg`  
**Dominio Oficial:** `https://njgzhjwfcxdxiibkuuqg.supabase.co`  

---

## 1. Actualización de Variables de Entorno en el Dashboard de Vercel

Para erradicar definitivamente la inyección de la clave residual en futuros despliegues:

1. Ingresa a tu panel de Vercel: [https://vercel.com/dashboard](https://vercel.com/dashboard).
2. Selecciona el proyecto **finanzas**.
3. Dirígete a **Settings** > **Environment Variables**.
4. Revisa las siguientes variables:
   - **`VITE_SUPABASE_URL`**:
     - Asegúrate de que su valor sea: `https://njgzhjwfcxdxiibkuuqg.supabase.co`
     - Aplica a: **Production**, **Preview**, **Development**.
   - **`VITE_SUPABASE_ANON_KEY`** o **`VITE_SUPABASE_PUBLISHABLE_KEY`**:
     - Si existe el valor antiguo `sb_publishable_hvgD4QA4kOCxTTqEMlFLLg_OjNAeLhu`, **elimínalo o edítalo**.
     - Configura el valor oficial anon JWT correspondiente a `njgzhjwfcxdxiibkuuqg`:
       ```
       eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qZ3poandmY3hkeGlpYmt1dXFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwMjg5MjksImV4cCI6MjEwMzYwNDkyOX0.VQSGP9NSUAI1M_BaOtqhxC4hl8o8jAx7HC0rlrnzMNA
       ```
     - Aplica a: **Production**, **Preview**, **Development**.
5. Guarda los cambios.

> [!NOTE]
> Gracias a las protecciones integradas en el código de FINPER 2.0.3 en `src/lib/supabase.ts`, la aplicación rechazará automáticamente la clave obsoleta y operará correctamente incluso antes de que guardes los cambios en Vercel.

---

## 2. Protocolo de Recuperación en Dispositivos (PC e iPhone)

### Paso 1: En tu PC (Dispositivo con las 4 operaciones en cola)

1. Abre tu navegador e ingresa a [https://finanzas-tau-three.vercel.app/](https://finanzas-tau-three.vercel.app/).
2. Si la interfaz aún mostraba errores de red, en la esquina inferior del panel pulsa **«Limpiar caché PWA»** o presiona `Ctrl + Shift + R` (`Cmd + Shift + R` en Mac) para forzar la recarga limpia.
3. Observa en la cabecera del panel:
   - Debe indicar **`njgzhjwfcxdxiibkuuqg`** junto a un indicador verde.
   - Debe indicar **`v2.0.3`**.
   - El estado de sesión debe reportar **«Validada en Supabase»** (verde).
4. Verifica que los **4 movimientos pendientes** continúan en cola intactos:
   - `GYM`
   - `iCloud`
   - `Fútbol`
   - `Salida`
5. Pulsa **«Sincronizar Todo»**:
   - La cola se despachará atómicamente a Supabase.
   - El contador pasará de `4 pendientes` a **`0 pendientes`**.
   - Los 4 módulos de configuración pasarán a **«Sincronizado»** (verde).
6. Pulsa **«Descargar copia de seguridad local (JSON)»** para resguardar el estado sincronizado.

---

### Paso 2: En tu iPhone (Safari / PWA)

1. Abre la aplicación o Safari en [https://finanzas-tau-three.vercel.app/](https://finanzas-tau-three.vercel.app/).
2. Si Safari muestra la vista anterior en caché, despliega el panel y pulsa **«Limpiar caché PWA»** (o cierra la PWA y recarga la pestaña en Safari).
3. Inicia sesión con `luis_jesusrc@hotmail.com` si no estaba iniciada.
4. En el panel superior, pulsa **«Sincronizar Todo»**:
   - Los módulos se sincronizarán con la nube.
   - Si alguno muestra *«Versiones distintas»*, pulsa **«Usar versión de la nube»** para adoptar las configuraciones emitidas desde tu PC.
5. Revisa la lista de transacciones:
   - Comprueba que ahora aparecen exactamente los mismos movimientos que en la PC, sin duplicaciones ni faltantes.

---

## 3. Integridad Contable Resguardada

- **Registros históricos:** Los 2,246 registros de `public.transacciones` en Supabase están 100% íntegros.
- **Operaciones locales:** Las 4 transacciones locales en cola no se limpian ni se alteran; se preservan hasta que Supabase confirme su inserción exitosa.
- **Cero migraciones destructivas:** No se ejecuta ningún cambio de esquema en esta actualización.
