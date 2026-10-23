# Pull Request: FINPER 2.1 — Sprint 01: Motor de Tarjetas Inteligentes, Conciliación Bancaria y Proyecciones Integradas

**Rama base:** `main`  
**Rama de origen:** `feature/finper-v21-smart-cards-sprint01`  
**Tipo:** Feature / FinTech Domain Engine / Core Architecture  
**Estado:** Listo para revisión de usuario (Merge bloqueado hasta confirmación explícita)

---

## 📌 Resumen de Cambios

Este Pull Request implementa el **Sprint 01 de FINPER 2.1**, dotando a la aplicación de un motor financiero centralizado y puro para la gestión integral de tarjetas de crédito, conciliación con estados de cuenta y simulador interactivo sin mutaciones no autorizadas.

### 1. Parameterización Completa de las 3 Tarjetas del Usuario
- **Ripley Mastercard (Banco Ripley):** Corte día 3, vencimiento día 1, línea autorizada S/ 1,000.00, referencia central riesgos S/ 358.66.
- **American Express Benefit (Interbank):** Corte día 21, vencimiento día 15, línea autorizada S/ 1,000.00, referencia central riesgos S/ 182.38.
- **BBVA Bfree (BBVA Perú):** Corte día 10, vencimiento día 5, línea autorizada S/ 700.00, referencia central riesgos S/ 436.21.

### 2. Motor Financiero Centralizado Puro (`src/domain/cards/smartCardEngine.ts`)
- **Amortización Francesa:** Cálculo de cuotas niveladas con intereses decrecientes, seguro de desgravamen y cent rounding exacto con cierre en S/ 0.00.
- **Promociones 0% Interés:** Reparto equitativo de centavos con `allocateMoney` (ej. 3 cuotas sin intereses Ripley / BBVA).
- **Transparencia Total:** Si faltan datos de tasas o seguros, emite la advertencia `"Estimación incompleta: faltan datos contractuales"`. NUNCA inventa tasas.
- **4 Estados Financieros:** `confirmed` (bancario), `calculated` (FINPER), `estimated` (proyectado) e `hypothetical` (simulación en memoria).

### 3. Simulador Financiero Puro (`SmartCardSimulatorModal.tsx`)
- Calculadora interactiva desacoplada de los saldos reales.
- Permite simular compras al contado, promociones a 0% de interés y compras financiadas en hasta 36 cuotas.
- Proyecta el cronograma cuota por cuota y el impacto en el flujo de caja futuro sin generar transacciones ni escribir en bases de datos.

### 4. Conciliación Asistida y Trazabilidad Documental (`SmartCardReconciliationModal.tsx`)
- Entradas vacías por defecto: FINPER no asume deudas ni pagos mínimos inventados (como S/ 30.00).
- Confirmación consciente para saldo S/ 0.00: exige marcar obligatoriamente una casilla certificando la revisión del estado de cuenta bancario.
- 4 Estados explícitos de verificación: `draft`, `user_declared`, `statement_verified` y `disputed`.
- Sin invención de evidencias ni archivos ficticios: distingue con claridad una declaración manual en app de una contrastación con PDF oficial identificado.
- Validación numérica unificada entre el botón y el envío del formulario.

### 5. Integridad de Pagos y Regularización de Deuda (`RegularizarDeudaModal.tsx`)
- Distinción rigurosa de pagos: pago parcial (mantiene saldo pendiente y estado no cancelado), pago total (cancela al 100%) y pago con excedente (requiere confirmación obligatoria de saldo a favor / pago adelantado).
- Desglose previo a la confirmación: muestra deuda antes del pago, monto a abonar y saldo restante proyectado.
- Control de idempotencia y prevención de dobles pagos con identificador financiero estable y bloqueo `isSubmitting`.
- Opción B (Cancelar Directa sin Egreso): no inventa egresos contables ni comprobantes falsos; registra cancelación externa transparente.
- Ficha Contractual (`CardContractualSheetModal.tsx`): eliminados fallbacks arbitrarios (`?? 1` y `1000`). Confirmación consciente obligatoria ante modificaciones en días de ciclo de facturación.
- Distinción de Modalidades (`smartCardEngine.ts`): separación explícita entre compras directas (`direct`), promociones a 0% (`zero_interest_promo`) y compras financiadas (`revolving_financed`).

### 6. Proyecciones Multi-Horizonte Integradas
- Separación clara entre gasto económico (devengado en fecha de compra) y salida de efectivo (cancelación de pasivo en fecha límite de pago), garantizando cero doble conteo a 3, 6, 12 y 24 meses.

---

## 🧪 Verificación y Pruebas Automatizadas

- **Vitest:** 36 suites, 224 pruebas aprobadas al 100%.
- **TypeScript:** 0 errores (`npx tsc --noEmit`).
- **ESLint:** 0 errores en código fuente (`npm run lint`).
- **Vite Build:** Compilación limpia para producción (8.82s).
- **Base de Datos:** 0 mutaciones en la base de producción Supabase (`njgzhjwfcxdxiibkuuqg`).

---

## 📖 Documentación Entregada

- [x] `docs/FINPER_V21_S01_AUDIT.md` (Auditoría previa e inventario)
- [x] `docs/FINPER_V21_S01_ARCHITECTURE.md` (Arquitectura del motor y capas)
- [x] `docs/FINPER_V21_S01_FINANCIAL_RULES.md` (Reglas matemáticas de corte, amortización y SBS)
- [x] `docs/FINPER_V21_S01_TEST_RESULTS.md` (Reporte de pruebas y suites aprobadas)
- [x] `docs/FINPER_V21_S01_RELEASE_CHECKLIST.md` (Lista de verificación de release)
- [x] `docs/FINPER_V21_S01_COMO_PROBAR.md` (Tutorial paso a paso para PC y iPhone)
- [x] `docs/PULL_REQUEST_FINPER_V21_S01.md` (Este documento)

---

## ⚠️ Estado de Publicación

**NO FUSIONADO A MAIN.** Queda pendiente la revisión local del usuario siguiendo el tutorial `docs/FINPER_V21_S01_COMO_PROBAR.md` y su autorización explícita antes de cualquier merge.


---

## Cierre de sincronización de conciliaciones (auditoría sobre `19109de`)

- **Problema:** `syncStatementsToCloud()` silenciaba errores y se invocaba con `void`; guardar no garantizaba confirmación remota.
- **Corrección:** resultado estructurado `remote_confirmed | local_pending | sync_failed | conflict`; `remote_confirmed` exige escritura **y relectura idéntica** en la ruta autoritativa (`transacciones`); `personal_settings` queda como espejo opcional.
- **Persistencia:** guardado local releído, ID/clave estables por ciclo, marcador de pendientes que sobrevive a recargas, sin sobrescribir versiones remotas modificadas por otro dispositivo.
- **UI:** `StatementSyncBadge` con estados comprensibles y *Reintentar*, separado de la verificación bancaria.
- **Pruebas:** 254/254 (16 nuevas, **simuladas** con doble remoto en memoria); lint 0 errores; `tsc` 0; build OK.
- **Pendiente:** validación con dispositivos reales en un Supabase de pruebas (ver tutorial, Parte 3). Detalle en `docs/FINPER_V21_S01_SYNC_CLOSURE.md`.
- **Sin merge a `main`** hasta aprobación explícita.
