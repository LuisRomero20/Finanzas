# FINPER 2.0.1 — LISTA DE VERIFICACIÓN Y PROTOCOLO DE DESPLIEGUE CONTROLADO (PC & iPhone)

**Versión:** FINPER 2.0.1  
**Rama de Entrega:** `feature/finper-v201-sync`  
**Rama Destino:** `main` (directa, sin ramas intermedias)  
**Objetivo:** Guía operativa de verificación rigurosa para validar la sincronización bidireccional entre la PC con Windows y el iPhone (Safari/PWA) antes y después de fusionar a producción.

---

## 1. Requisitos Previos y Estado de Validación Automatizada

- [x] **136 de 136 pruebas automatizadas aprobadas (100% éxito)** en Vitest.
  - 4 pruebas de diagnóstico de autenticación y caducidad de JWT.
  - 4 pruebas de cola Outbox y persistencia offline.
  - 6 pruebas de integración de sincronización bidireccional (interrupciones de red, cancelaciones locales, conflictos concurrentes, fallos parciales).
  - 6 pruebas de validación aislada de la migración `personal_settings` con evaluación de políticas RLS.
  - 116 pruebas existentes de modelo contable, ciclo de facturación, simulador de deuda, cuotas y parseo de estados de cuenta.
- [x] **Comprobación de Tipos TypeScript (`npx tsc --noEmit`):** 0 errores.
- [x] **Compilación de Producción (`npm run build`):** Exitosa en 9.30s.
- [x] **Integridad de Base de Datos en Supabase:** 2,246 registros históricos contables intactos con titularidad asignada y RLS forzado.

---

## 2. Validación Aislada de Migración SQL (`personal_settings`)

- [x] La migración `supabase/migrations/20261022170000_create_personal_settings.sql` ha sido auditada y validada en entorno de pruebas unitarias (`personalSettingsMigration.test.ts`).
- [ ] **IMPORTANTE:** La migración **NO se ha ejecutado en producción** todavía.
- [x] La aplicación en `feature/finper-v201-sync` cuenta con **compatibilidad transicional garantizada**:
  - `readSnapshot` compara marcas de tiempo y lee de la fuente autoritativa más reciente (`transacciones`).
  - `writeSnapshot` escribe primero en `transacciones` con verificación optimista de concurrencia y no declara éxito si esta falla. Si la tabla `personal_settings` aún no existe, el sistema continúa operando sin interrupción.

---

## 3. Protocolo de Pruebas Cruzadas en Dispositivos (PC ↔ iPhone)

### Paso 1: Validación de Sesión y Diagnóstico
1. Iniciar sesión en la PC y en el iPhone con las credenciales del usuario (`luis_jesusrc@hotmail.com`).
2. Abrir el panel lateral **Ajustes financieros · Nube**.
3. **Criterio de Aceptación:**
   - Indicador en verde: **«Sesión Activa»**.
   - Contador de cola Outbox: `0` operaciones retenidas.

### Paso 2: Sincronización de los 4 Módulos de Ajustes
1. En el panel de sincronización de la PC, hacer clic en **«Sincronizar Todo»**.
2. Observar los 4 módulos:
   - *Presupuestos*
   - *Proyecciones*
   - *Deudas regularizadas de tarjetas*
   - *Clasificación de movimientos*
3. **Criterio de Aceptación:**
   - Los módulos pasan a **«Sincronizado»** con fecha y hora reciente.
   - En el iPhone, al pulsar «Sincronizar Todo», los 4 módulos quedan igualmente en verde sin inconsistencias.

### Paso 3: Prueba de Movimientos Pendientes (PC → iPhone)
1. En la **PC**, ir a **Proyecciones / Pagos Pendientes** y registrar una partida de prueba (`Partida Prueba Sync`, `S/ 15.00`, `BCP`).
2. Comprobar que en la PC aparece en la lista y el Outbox se vacía tras el despacho.
3. En el **iPhone**, refrescar la pantalla.
4. **Criterio de Aceptación:**
   - La partida aparece en el iPhone con el mismo monto y detalle. Ambas listas tienen exactamente el mismo número de partidas.

### Paso 4: Prueba Inversa y Borrado Seguro (iPhone → PC)
1. En el **iPhone**, marcar la partida como pagada o eliminarla.
2. En la **PC**, actualizar la vista.
3. **Criterio de Aceptación:**
   - La partida desaparece de ambos dispositivos sin duplicarse ni resucitar como partida fantasma.

---

## 4. Procedimiento de Fusión Directa a Producción (`main`)

Una vez revisado el Pull Request en borrador y contando con la autorización explícita:

```bash
# 1. Asegurar rama local limpia y actualizada
git checkout main
git pull origin main

# 2. Fusión directa de la rama de sincronización hacia main
git merge feature/finper-v201-sync --no-ff -m "merge: release FINPER 2.0.1 multi-device sync and resilience"

# 3. Publicación hacia GitHub (dispara despliegue automático en Vercel)
git push origin main
```

---

## 5. Protocolo de Reversión (Rollback)

Si se detectara alguna anomalía en producción tras la publicación:

1. **Reversión instantánea en Git:**
   ```bash
   git checkout main
   git revert -m 1 HEAD
   git push origin main
   ```
2. **Reversión en Vercel:**  
   Ingresar al dashboard de Vercel y pulsar **«Instant Rollback»** al despliegue anterior inmediatamente precedente.
3. **Seguridad en Supabase:**  
   Dado que la migración a `personal_settings` es aditiva y las transacciones históricas no son modificadas, ninguna reversión compromete los 2,246 registros históricos contables.
