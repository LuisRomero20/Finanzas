# FINPER 2.0.4 — Arquitectura Técnica Consolidada

**Versión:** FINPER 2.0.4  
**Fecha:** 22 de Octubre de 2026  
**Rama:** `feature/finper-v204-consolidation`  
**Autor:** Equipo de Arquitectura e Ingeniería de FINPER  

---

## 1. Visión y Filosofía Arquitectural

FINPER 2.0.4 implementa un modelo de **Arquitectura Hexagonal / Clean Architecture adaptada a React y TypeScript**, con un enfoque estricto en:
1. **Local-First:** La interfaz de usuario nunca se bloquea por latencia de red. La verdad local se conserva en `localStorage` y en la memoria reactiva de Zustand.
2. **Dominio Puro Desacoplado:** Toda lógica de cálculo financiero (intereses, cronogramas de pago, fechas de corte, redondeos monetarios y triple impacto contable) reside en funciones puras sin dependencias del DOM, de React o de la nube.
3. **Resiliencia Extrema en Móviles:** Diseñado específicamente para evitar pérdida de estado en suspensiones de Safari en iOS (iPhone) y Microsoft Edge en Windows.
4. **Cero Impacto Destructivo:** Garantía incondicional sobre los 2,246 registros históricos de `public.transacciones`.

---

## 2. Diagrama de Capas y Dependencias Unidireccionales

Las capas del sistema mantienen una regla de dependencia estricta: las capas externas dependen de las internas, pero el dominio central nunca conoce detalles de React, Supabase o el almacenamiento.

```
+---------------------------------------------------------------------------------------------------+
|                                     ARQUITECTURA POR CAPAS (FINPER)                               |
+---------------------------------------------------------------------------------------------------+
|                                                                                                   |
|  CAPA 4: PRESENTACIÓN (React 18 + Vite + TailwindCSS + Lucide)                                    |
|  [ src/pages/*.tsx ]              [ src/components/*.tsx ]                                        |
|  Dashboard, Registro,             Widgets, Modales, Tablas, Formularios                           |
|  Proyecciones, Tarjetas,          (Sin acceso directo a Supabase ni cálculos contables en UI)     |
|  Deudas, Clasificación,                                                                           |
|  Dashboards                                                                                       |
|         |                                                                                         |
|         v                                                                                         |
|  CAPA 3: GESTIÓN DE ESTADO REACTIVO (Zustand)                                                     |
|  [ src/store/financeStore.ts ]    [ src/store/projectionStore.ts ]                                |
|  [ src/store/creditCardStore.ts ] [ src/store/pendingPaymentsStore.ts ]                           |
|  [ src/store/budgetStore.ts ]     [ src/store.ts (AppStore: Auth, Deudas) ]                       |
|         |                                                                                         |
|         v                                                                                         |
|  CAPA 2: SERVICIOS E INFRAESTRUCTURA (I/O, Red, Persistencia)                                     |
|  [ src/services/authService.ts ]        -> Supabase Auth GoTrue con dedup y token seguro          |
|  [ src/services/transactionOutbox.ts ]  -> Cola offline atómica con backoff y reintentos          |
|  [ src/services/settingsSnapshot.ts ]   -> Dual-store snapshot con fallback y baseline 3-way     |
|  [ src/services/personalSettingsSync.ts]-> Sincronizador de presupuestos y proyecciones          |
|  [ src/lib/supabase.ts ]                -> Cliente Supabase blindado al proyecto njgzhjwfcxdxi... |
|         |                                                                                         |
|         v                                                                                         |
|  CAPA 1: DOMINIO FINANCIERO PURO (Deterministic Business Logic)                                   |
|  [ src/domain/finance/money.ts ]        -> Aritmética minor units (centavos exactos)              |
|  [ src/domain/finance/rates.ts ]        -> TEA, TEM, Francés, amortizaciones                      |
|  [ src/domain/finance/accounting.ts ]   -> Triple impacto contable (económico, caja, pasivo)      |
|  [ src/domain/cards/billingCycles.ts ]  -> Fechas de corte, pago, bisiestos y reglas bancarias    |
|  [ src/domain/cards/types.ts ]          -> Contratos FINPER 2.1 (Cards, Purchases, Schedules)     |
|  [ src/domain/projections/multiHorizon.ts]-> Horizontes 3/6/12/24 meses y trazabilidad            |
|                                                                                                   |
+---------------------------------------------------------------------------------------------------+
```

---

## 3. Estructura de Directorios Consolidada

```text
src/
├── domain/                          # CAPA 1: Núcleo de lógica financiera pura (100% testeable)
│   ├── cards/
│   │   ├── billingCycles.ts         # Reglas de ciclos de corte, vencimiento y calendario bancario
│   │   └── types.ts                 # Contratos FINPER 2.1 (CreditCard, CardPurchase, InstallmentSchedule)
│   ├── finance/
│   │   ├── accounting.ts            # Triple impacto contable y clasificación de eventos financieros
│   │   ├── money.ts                 # Redondeo exacto a centavos, suma segura y distribución equitativa
│   │   └── rates.ts                 # Conversión TEA/TEM, sistema francés y amortización
│   ├── projections/
│   │   └── multiHorizon.ts          # Proyecciones multiescenario a 3, 6, 12 y 24 meses
│   └── __tests__/                   # Suites de prueba unitaria de dominio
├── services/                        # CAPA 2: Servicios de integración e infraestructura
│   ├── authService.ts               # Autenticación GoTrue, deduplicación de hidratación y diagnóstico
│   ├── personalSettingsSync.ts      # Coordinación y sincronización de configuraciones
│   ├── settingsSnapshot.ts          # Almacenamiento dual (transacciones / personal_settings)
│   ├── supabaseService.ts           # Consultas y mutaciones a PostgREST
│   └── transactionOutbox.ts         # Cola transaccional offline con reintentos y tokens idempotentes
├── store/                           # CAPA 3: Estado reactivo y persistencia local
│   ├── budgetStore.ts               # Presupuestos mensuales y modos (manual / sugerido)
│   ├── cardStatementStore.ts        # Estados de cuenta verificados
│   ├── creditCardStore.ts           # Catálogo de tarjetas de crédito y parámetros
│   ├── creditLineStore.ts           # Líneas de crédito globales
│   ├── financeStore.ts              # Transacciones maestras, filtros y sincronización
│   ├── pendingPaymentsStore.ts      # Cola de pagos pendientes del mes
│   ├── prevMonthBridgeStore.ts      # Puente de arrastre de saldos entre meses
│   ├── projectionStore.ts           # Partidas proyectadas y amortización
│   └── savingsGoalsStore.ts         # Metas de ahorro
├── components/                      # CAPA 4: Componentes de interfaz de usuario
│   ├── ui/                          # Componentes base (Card, Badge, Modal, Input, Button)
│   └── *.tsx                        # Widgets especializados y calculadoras
├── pages/                           # CAPA 4: Los 7 apartados del sistema
│   ├── Dashboard.tsx                # Apartado 1: Resumen y métricas globales
│   ├── RegistroMovimientoPage.tsx   # Apartado 2: Registro rápido de ingresos/gastos
│   ├── ProyeccionPage.tsx           # Apartado 3: Planificación y proyección financiera
│   ├── CronogramaPagos.tsx          # Apartado 4: Tarjetas de crédito y cronograma
│   ├── HojaDeudas.tsx               # Apartado 5: Deudas personales y préstamos
│   ├── ClasificacionPage.tsx        # Apartado 6: Reglas de categorización
│   └── DashboardsPage.tsx           # Apartado 7: Análisis visual y métricas
├── lib/
│   └── supabase.ts                  # Instancia cliente Supabase con token managed por SDK
├── utils/                           # Utilidades auxiliares y datos maestros
└── store.ts                         # useAppStore (auth de sesión y deudas heredadas)
```

---

## 4. Inventario de Deuda Técnica: Resuelta en 2.0.4 vs. Preparada para 2.1

### Deuda Técnica Resuelta en FINPER 2.0.4:
1. **Condición de Carrera en Hidratación de Sesión:**  
   Resuelta mediante `inFlightValidationPromise` en `authService.ts`. Múltiples componentes montándose a la vez comparten la misma promesa de verificación GoTrue, eliminando parpadeos y deslogueos fortuitos.
2. **Eliminación de Sesiones Sintéticas Falsas:**  
   En modo online, el sistema ya no valida tokens arbitrarios de `localStorage` sin que el SDK GoTrue los reconozca formalmente mediante `supabase.auth.setSession()`.
3. **Blindaje de Dominio y Llave Supabase:**  
   Eliminada cualquier referencia residual a proyectos antiguos (`elsjuyjjkrkyhlylmaip`). El interceptor valida criptográficamente que la petición se dirija a `njgzhjwfcxdxiibkuuqg.supabase.co`.
4. **Outbox Transaccional con Backoff Exponencial y Remoción Atómica:**  
   Las transacciones fallidas no se descartan ni se reintentan en bucle infinito. Cada registro cuenta con timestamp, contador de intentos, token idempotente y persistencia en `finper_transaction_outbox_v1`.
5. **Contratos Formales de Tarjetas Inteligentes:**  
   Creación de `src/domain/cards/types.ts` con tipado estricto para compras directas vs cuotas, tasa 0%, TEA bancaria, seguro de desgravamen y cálculo normativo de pago mínimo SBS.

### Deuda Técnica Programada para FINPER 2.1 (Tarjetas Inteligentes):
1. **Modelado Especializado por Entidad:**  
   Consolidar las reglas particulares de Ripley Mastercard (corte día 3, pago día 1), Interbank Amex Benefit (corte día 21, pago día 15) y BBVA Bfree (corte día 10, pago día 5).
2. **Automatización de Desgravamen y Membresía Anual:**  
   Inclusión en los estados de cuenta mensuales simulados y reales de las exoneraciones por consumo mínimo mensual.
3. **Simulador Interactivo de Cuotas en Modal:**  
   Conectar el motor `buildCardInstallmentSchedule` directamente en el formulario de registro de compras de `RegistroMovimientoPage.tsx`.

---

## 5. Garantía de No Regresión en UI

Los 7 apartados (`pages/*.tsx`) conservan su JSX y TailwindCSS al 100%. Las pruebas de renderizado en `src/utils/__tests__/pagesRender.test.tsx` validan que todos los componentes montan y pintan la información correctamente sin generar errores en consola ni romper el diseño responsive.
