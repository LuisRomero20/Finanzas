# FINPER 2.0.4 — Mapa de Flujo de Datos y Unificación de Estado

**Versión:** FINPER 2.0.4  
**Fecha:** 22 de Octubre de 2026  
**Rama:** `feature/finper-v204-consolidation`  
**Autor:** Equipo de Arquitectura e Ingeniería de FINPER  

---

## 1. Visión General de la Arquitectura de Datos

FINPER opera bajo una arquitectura **Local-First con Sincronización Nube Resiliente (Cloud-Assisted)**. Esta arquitectura garantiza que la aplicación sea 100% funcional sin conexión a internet (offline), responda instantáneamente a las interacciones del usuario en dispositivos móviles (iPhone con Safari/PWA) y de escritorio (PC Windows con Edge), y sincronice bidireccionalmente los datos con Supabase cuando la conexión está activa.

### Principios Rectores del Flujo de Datos

1. **Única Fuente Autorizada en la Nube:**  
   La tabla `public.transacciones` en el proyecto Supabase `njgzhjwfcxdxiibkuuqg` es la única fuente autoritativa en la nube para el usuario. Contiene los 2,246 registros históricos de movimientos financieros y almacena las configuraciones serializadas bajo claves del sistema (`config-credit-cards-v2`, `config-deuda-*`, `config-sync-*`).
2. **Persistencia Local Inmediata (Local-First):**  
   Cualquier mutación de datos (crear, editar, confirmar o eliminar movimientos, ajustar presupuestos o proyecciones) se escribe sincrónicamente en `localStorage` antes o en paralelo con cualquier comunicación de red.
3. **Desacoplamiento Operacional con Outbox Atómico:**  
   Las mutaciones remotas se delegan a un Outbox (`finper_transaction_outbox_v1`) dotado de deduplicación de tokens, cola de reintentos exponencial y remoción atómica exclusiva tras confirmación HTTP 201/200 del servidor.
4. **Overlay de Pendientes durante la Sincronización:**  
   Al descargar la verdad de la nube (`syncFromSupabase`), el cliente aplica un *overlay* en memoria con las operaciones aún no confirmadas en el Outbox para evitar que una lectura remota sobrescriba transacciones locales recién creadas.
5. **Detección de Conflictos Tripartita (Three-Way Merge):**  
   Para configuraciones (presupuestos, proyecciones, regularizaciones y clasificaciones), el sistema compara el valor local (`localValue`), el remoto (`remoteSnapshot`) y la línea base de la última sincronización (`baseline`). Si ambos han mutado de forma divergente, se detiene la sobreescritura y se solicita resolución explícita sin pérdida de información.

---

## 2. Mapa Detallado de los 7 Apartados del Sistema

A continuación se detalla el ciclo de vida de los datos para cada una de las 7 vistas principales de FINPER:

```
+---------------------------------------------------------------------------------------------------+
|                                      FINPER DATA FLOW ARCHITECTURE                                |
+---------------------------------------------------------------------------------------------------+
|                                                                                                   |
|  [ Vistas de Usuario / React UI ]                                                                 |
|         |                     |                 |                   |                 |           |
|         v                     v                 v                   v                 v           |
|  1. General (Dashboard)  2. Registro     3. Proyecciones     4. Tarjetas / Deudas  5. Dashboards  |
|         |                     |                 |                   |                 |           |
|         +----------+----------+                 |                   |                 |           |
|                    |                            |                   |                 |           |
|                    v                            v                   v                 v           |
|          [ useFinanceStore ]          [ useProjectionStore ] [ useCreditCardStore ] [ useBudget ] |
|                    |                            |            [ useAppStore (Deuda)]   |           |
|                    v                            v                   v                 v           |
|         +---------------------+        +-----------------------------------------------+          |
|         | Local Persistence   |        | Three-Way Merge Baseline System               |          |
|         | (finper_master_tx)  |        | (finper_sync_baseline_*_v2)                   |          |
|         +---------------------+        +-----------------------------------------------+          |
|                    |                                            |                                 |
|                    v                                            v                                 |
|         [ transactionOutbox ]                           [ settingsSnapshot ]                      |
|         (Cola atómica offline)                         (Validación & Fallback)                    |
|                    |                                            |                                 |
|                    +--------------------+-----------------------+                                 |
|                                         |                                                         |
|                                         v                                                         |
|                             [ GoTrue Auth Interceptor ]                                           |
|                             (njgzhjwfcxdxiibkuuqg.supabase.co)                                    |
|                                         |                                                         |
|                                         v                                                         |
|                            [ public.transacciones (PostgREST) ]                                   |
+---------------------------------------------------------------------------------------------------+
```

### Tabla Resumen de Apartados

| # | Apartado / Vista | Store(s) Involucrados | Clave de Persistencia Local (`localStorage`) | Entidad / Fila en Supabase (`public.transacciones`) | Resolución de Conflictos | Comportamiento Offline |
| :-: | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | **General (Dashboard)** | `useFinanceStore`<br>`useProjectionStore`<br>`useCreditCardStore`<br>`usePendingPaymentsStore`<br>`useAppStore` | `finper_master_transactions_v1`<br>`finper_projections_v1`<br>`finper_credit_cards_v2`<br>`finper_pending_payments_v2` | Consulta agregada sobre `public.transacciones` | Agregación reactiva de stores locales. Al sincronizar con nube, superpone cola Outbox sobre datos remotos. | Carga instantánea desde estado Zustand hidratado de `localStorage`. Cálculos de balance y métricas 100% locales. |
| **2** | **Registrar Movimiento** | `useFinanceStore`<br>`useCreditCardStore`<br>`useAppStore` (notif.) | `finper_master_transactions_v1`<br>`finper_transaction_outbox_v1` | `public.transacciones`<br>(INSERT / UPDATE por ID `custom-*` o `proy-*`) | Last-Write-Wins con cola Outbox local priorizada (`merged.set(op.id, op.tx)`). | Guarda de inmediato en `localStorage` y encola en `finper_transaction_outbox_v1` con reintentos programados. Cero pérdida de datos. |
| **3** | **Proyecciones** | `useProjectionStore`<br>`useSettingsSync`<br>`useCardStatementStore` | `finper_projections_v1`<br>`finper_projection_prob_v1`<br>`finper_casual_projections_v1`<br>`finper_sync_baseline_projections_v2` | Fila `config-sync-projections`<br>(Espejo optativo en `personal_settings`) | Detección tripartita (`decideSync`). Si difieren local y remoto contra el baseline, levanta estado `conflict` con opción de resolución explícita. | Modificaciones de partidas o escenarios se conservan íntegramente en `localStorage`. Al reconectar, evalúa baseline antes de sobrescribir. |
| **4** | **Tarjetas de Crédito** | `useCreditCardStore`<br>`useCardStatementStore`<br>`useFinanceStore`<br>`usePendingPaymentsStore` | `finper_credit_cards_v2`<br>`finper_verified_card_statements` | Fila `config-credit-cards-v2`<br>Fila `config-sync-statements` | Configuración de tarjetas: upsert por ID de configuración. Regularizaciones: 3-way merge por mes/tarjeta. | Permite consultar ciclos de corte, fechas de pago y amortizaciones calculadas a partir de las transacciones cacheadas. |
| **5** | **Deudas** | `useAppStore`<br>`useProjectionStore` | `demo_deudas` | Filas `config-deuda-${id}` (una por deuda activa) | Carga remota en montaje si existe; si la nube no tiene registros, persiste la copia local saneada. | Alta, baja y abonos se registran en `demo_deudas`. Sincronización diferida a Supabase al restaurar conexión. |
| **6** | **Clasificación** | `useFinanceStore`<br>`useSettingsSync` | `finper_category_overrides_v1`<br>`finper_sync_baseline_classifications_v2` | Fila `config-sync-classifications` | Three-Way Merge (`personalSettingsSync`). Mapeo canónico ordenado alfanuméricamente para evitar falsos positivos de conflicto. | Reglas de reclasificación de comercios/categorías operan en memoria y persisten en storage local. |
| **7** | **Dashboards (Métricas)** | `useFinanceStore`<br>`useBudgetStore` | `finper_master_transactions_v1`<br>`finper_budgets_v1`<br>`finper_budget_modes_v1` | Consulta en `transacciones`<br>Fila `config-sync-budgets` | Presupuestos usan 3-way merge con respaldo previo automático (`finper_sync_backup_budgets_*`). | Renders y comparativas presupuestarias se computan al 100% sobre el historial local. |

---

## 3. Inventario y Responsabilidad Unificada de Stores

Para evitar solapamientos e inconsistencias de estado, se ratifica la siguiente separación estricta de responsabilidades:

### 1. `useFinanceStore` (`src/store/financeStore.ts`)
- **Dominio Exclusivo:** Movimientos financieros reales e históricos (ingresos, gastos fijos, gastos variables, pagos de cuotas confirmados).
- **Lectura:** Carga inicial desde `finper_master_transactions_v1` o `masterTransactions` como fallback base.
- **Escritura:** `addTransaction`, `updateTransaction`, `confirmTransaction`, `deleteTransaction`.
- **Interacción con Outbox:** Cada mutación invoca `enqueueTransaction()`, disparando el flush asíncrono hacia `public.transacciones`.

### 2. `useAppStore` (`src/store.ts`)
- **Dominio Exclusivo:** Sesión de usuario básica (`usuario`), catálogo de deudas financieras externas (`deudas`), notificaciones UI globales (`notificaciones`).
- **Garantía de No Invasión:** `useAppStore` **NO** administra transacciones directas; los componentes que antes importaban `useAppStore` para transacciones han sido desacoplados hacia `useFinanceStore`.

### 3. `useProjectionStore` (`src/store/projectionStore.ts`)
- **Dominio Exclusivo:** Proyecciones presupuestarias a futuro, partidas proyectadas, probabilidades mensuales de sueldo, gastos casuales y simulación de cronogramas de amortización de tarjetas.
- **Sincronización:** Delegada al subsistema `personalSettingsSync` (`Name = 'projections'`).

### 4. `useCreditCardStore` (`src/store/creditCardStore.ts`)
- **Dominio Exclusivo:** Catálogo de plásticos (Ripley Mastercard, Interbank Amex, BBVA Bfree), reglas de corte de ciclo, días de pago, límites de crédito y parámetros financieros (TEA, seguro de desgravamen).
- **Sincronización:** Fila `config-credit-cards-v2` en `public.transacciones`.

### 5. `useBudgetStore` (`src/store/budgetStore.ts`)
- **Dominio Exclusivo:** Techos y presupuestos por categoría (`budgets`), modo de cálculo (`manual` vs `sugerido`).
- **Sincronización:** Fila `config-sync-budgets` mediante `personalSettingsSync`.

### 6. `useCardStatementStore` (`src/store/cardStatementStore.ts`)
- **Dominio Exclusivo:** Estados de cuenta verificados por mes y tarjeta, saldos al corte (`finalDebt`), cierres de periodo.
- **Sincronización:** Fila `config-sync-statements` mediante `personalSettingsSync`.

### 7. `usePendingPaymentsStore` (`src/store/pendingPaymentsStore.ts`)
- **Dominio Exclusivo:** Cola de pagos pendientes del mes en curso, cuotas programadas de tarjetas y deudas listas para confirmación con un toque.

---

## 4. Matriz de Resolución de Conflictos y Concurrencia

```
+-------------------+--------------------+--------------------+-------------------------------------------+
| Estado Local      | Estado Remoto      | Línea Base (Sync)  | Acción Resultante                         |
+-------------------+--------------------+--------------------+-------------------------------------------+
| Sin cambio        | Sin cambio         | Coincide           | IDLE (No realiza tráfico)                 |
| Modificado        | Sin cambio         | Coincide remoto    | UPLOAD (Sube cambio local a Supabase)     |
| Sin cambio        | Modificado         | Coincide local     | DOWNLOAD (Aplica cambio remoto al cliente)|
| Modificado        | Modificado         | Coincide contenido | EQUAL (Actualiza baseline a nueva versión)|
| Modificado (A)    | Modificado (B)     | Difiere de ambos   | CONFLICT (Retiene local, emite aviso UI)  |
+-------------------+--------------------+--------------------+-------------------------------------------+
```

### Mecanismos de Seguridad contra Pérdida de Datos

1. **Backups Locales con Timestamp:**  
   Antes de aplicar cualquier descarga remota destructiva en configuraciones o transacciones, se genera una copia en `localStorage`:  
   `finper_sync_backup_${name}_${Date.now()}`.
2. **Overlay durante Fetch:**  
   Si el usuario añade transacciones en modo offline, y al recuperar conectividad se ejecuta un `fetchTransactionsFromSupabase()`, el método `syncFromSupabase()` inyecta todas las operaciones pendientes del outbox en el array antes de actualizar Zustand y `localStorage`.
3. **Idempotencia de Peticiones:**  
   Cada operación del outbox posee un token idempotente derivado del ID de la transacción y su timestamp. Reintentos repetidos tras microcortes de red no generan transacciones duplicadas en la base de datos.

---

## 5. Resiliencia de Hidratación en Dispositivos Móviles (iPhone/Safari)

Safari en iOS aplica políticas de suspensión agresivas para aplicaciones en segundo plano y PWAs guardadas en la pantalla de inicio:
- **Deduplicación de Promesas de Sesión:** El validador `getValidatedSession()` en `src/services/authService.ts` evita carreras de inicialización cuando múltiples widgets montan simultáneamente.
- **Persistencia No Volátil:** Se utiliza `localStorage` con sanitización de fechas y validación de tipos JSON antes de parsing, previniendo crashes en pantalla blanca ante datos corruptos.
- **Detección Automática de Retorno Online:** El servicio `liveUpdateService.ts` escucha eventos de ventana `online`, `focus` y cambios de visibilidad (`visibilitychange`), reactivando la sincronización de manera transparente.
