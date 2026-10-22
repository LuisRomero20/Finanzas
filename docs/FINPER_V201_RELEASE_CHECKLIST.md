# FINPER 2.0.1 — LISTA DE VERIFICACIÓN Y DESPLIEGUE (PC & iPhone)

**Versión:** FINPER 2.0.1  
**Rama de Entrega:** `feature/finper-v201-sync`  
**Objetivo:** Guía operativa paso a paso para que el usuario valide la sincronización bidireccional entre su PC con Windows y su iPhone (Safari/PWA) antes de fusionar a producción.

---

## 1. Requisitos Previos

- [ ] Dispositivos disponibles:
  - **PC Windows:** Navegador Chrome o Edge actualizado.
  - **iPhone:** Safari o acceso directo PWA ("Añadir a pantalla de inicio").
- [ ] Conexión a internet estable en ambos dispositivos.
- [ ] Credenciales de acceso válidas (`luis_jesusrc@hotmail.com`).
- [ ] No ejecutar acciones destructivas en la base de datos (las 2,246 transacciones históricas deben permanecer intactas).

---

## 2. Protocolo de Pruebas Cruzadas (PC ↔ iPhone)

### Paso 1: Validación de Sesión y Diagnóstico
1. Iniciar sesión en la PC y en el iPhone con las credenciales del usuario.
2. Navegar a **Configuración** o abrir el panel lateral de sincronización (**Estado de Sincronización**).
3. **Criterio de Aceptación:**
   - La etiqueta de sesión debe indicar **«Sesión Activa»** (en verde) en ambos dispositivos.
   - El contador de cola de pendientes (**Outbox**) debe reportar `0` operaciones retenidas.
   - La información de usuario debe reflejar el UUID correspondiente: `0fdea8f0-da9c...`.

### Paso 2: Sincronización de los 4 Ajustes Personales
1. En el panel de sincronización de la PC, hacer clic en el botón **«Sincronizar Todo»**.
2. Observar el estado de cada uno de los cuatro módulos:
   - *Presupuestos*
   - *Proyecciones*
   - *Deudas regularizadas de tarjetas*
   - *Clasificación de movimientos*
3. **Criterio de Aceptación:**
   - Los módulos deben transicionar de «Pendiente de reintento» a **«Sincronizado»** (en verde) con fecha y hora reciente.
   - Al abrir la misma sección en el iPhone y pulsar «Sincronizar Todo», los cuatro módulos deben reflejar la misma fecha y estado sincronizado sin errores.

### Paso 3: Prueba de Resiliencia en Pagos Pendientes (PC → iPhone)
1. En la **PC**, ir a la sección de **Proyecciones / Pagos Pendientes**.
2. Crear un nuevo pago pendiente de prueba (ejemplo: `Partida Prueba Sync`, Monto: `S/ 10.00`, Entidad: `BCP`).
3. Comprobar que aparece de inmediato en la lista de la PC.
4. En el **iPhone**, recargar la página o pulsar el botón de actualizar datos.
5. **Criterio de Aceptación:**
   - La partida `Partida Prueba Sync` debe figurar de manera idéntica en el iPhone.
   - El conteo de partidas pendientes entre PC e iPhone debe ser exactamente el mismo (eliminando la discrepancia histórica como la ocurrida con `Salida`).

### Paso 4: Prueba Inversa (iPhone → PC)
1. En el **iPhone**, marcar la partida `Partida Prueba Sync` como pagada o eliminarla.
2. En la **PC**, refrescar la pantalla.
3. **Criterio de Aceptación:**
   - La partida debe desaparecer en ambos dispositivos de forma consistente e idempotente.
   - El outbox de ambos dispositivos debe permanecer en `0`.

---

## 3. Guía de Ejecución de la Migración SQL Aditiva (Opcional en Supabase)

Para completar el desacoplamiento definitivo y evitar fragmentos en la tabla contable:

1. Abrir el panel de Supabase: [https://supabase.com/dashboard/project/njgzhjwfcxdxiibkuuqg](https://supabase.com/dashboard/project/njgzhjwfcxdxiibkuuqg).
2. Ir a **SQL Editor**.
3. Copiar y pegar el contenido de:
   [`supabase/migrations/20261022170000_create_personal_settings.sql`](file:///c:/Users/Luis%20Romero/Documents/Proyectos/FinanzasPersonales/supabase/migrations/20261022170000_create_personal_settings.sql).
4. Hacer clic en **Run**.
5. *Nota:* La aplicación ya cuenta con compatibilidad dual: continuará funcionando perfectamente incluso si la tabla aún no se ha creado, pero su ejecución optimizará de inmediato la velocidad de carga.

---

## 4. Procedimiento de Fusión y Despliegue a Producción

Una vez que el usuario otorgue su aprobación explícita:

1. Fusión de rama:
   ```bash
   git checkout feature/finanzas-v2
   git merge feature/finper-v201-sync
   git push origin feature/finanzas-v2
   ```
2. Fusión final hacia `main` (despliegue automático en Vercel):
   ```bash
   git checkout main
   git merge feature/finanzas-v2
   git push origin main
   ```
3. Verificación de versión en Vercel: consultar `https://finanzas-tau-three.vercel.app/` y confirmar funcionamiento en vivo.
