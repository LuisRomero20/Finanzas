# FINPER 2.1 — SPRINT 01: AUDITORÍA DE TARJETAS, CRONOGRAMAS Y PROYECCIONES

**Fecha de ejecución:** 22 de octubre de 2026  
**Rama:** `feature/finper-v21-smart-cards-sprint01`  
**Autor:** Principal Software Architect & FinTech Domain Engineer  
**Objetivo:** Diagnóstico integral de componentes de tarjetas, flujos de cuotas, conciliaciones y proyecciones para diseñar el Motor de Tarjetas Inteligentes FINPER 2.1 sin duplicidades ni mutaciones no autorizadas.

---

## 1. Inventario de Tarjetas de Crédito del Usuario

De acuerdo con el análisis de `creditCardStore.ts`, `projectionStore.ts`, `masterData.ts` y el reporte de la central de riesgos del 30/09/2026, el ecosistema de crédito del usuario consta de 3 tarjetas principales:

| Entidad / Código | Emisor Contractual | Denominación Comercial | Red | Moneda | Línea de Crédito (Ref. 30/09/2026) | Deuda Usada Ref. | Día Corte | Día Pago | Estado Contractual |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`Ripley`** (`card-ripley`) | Banco Ripley | Ripley Mastercard | Mastercard | PEN | S/ 1,000.00 | S/ 358.66 | Día 3 | Día 1 | Pendiente verificar TEA/desgravamen |
| **`Interbank Amex`** (`card-ibk-amex`) | Interbank | American Express Benefit | American Express | PEN | S/ 1,000.00 | S/ 182.38 | Día 21 | Día 15 | Pendiente verificar TEA/desgravamen |
| **`BBVA Bfree`** (`card-bbva-bfree`) | BBVA Perú | BBVA Bfree | Visa / Amex (a confirmar) | PEN | S/ 700.00 | S/ 436.21 | Día 10 | Día 5 | Pendiente verificar TEA/desgravamen |

> [!IMPORTANT]
> **Políticas de Integridad Financiera:**
> 1. Los saldos y líneas de la central de riesgos (30/09/2026) son **referencias informativas no contractuales**. No se deben escribir en Supabase como saldos vivos bancarios sin confirmación del usuario.
> 2. Las tasas TEA, TCEA, comisiones fijas y porcentajes de seguro de desgravamen **nunca se deben inventar**. Si no están confirmadas por estado de cuenta o contrato del usuario, el motor debe indicar explícitamente:  
>    `"Estimación incompleta: faltan datos contractuales"`.

---

## 2. Diagnóstico de Componentes y Almacenamiento

### 2.1 `src/store/creditCardStore.ts`
- **Estado Actual:** Almacena `CardConfig[]` con persistencia en `localStorage` (`finper_credit_cards_v2`) y sincronización opcional con Supabase (`settings`).
- **Campos Existentes:** `id`, `entity`, `name`, `issuer`, `productVariant`, `network`, `currency`, `cycleStartDay`, `paymentDay`, `billingRulesStatus`, `creditLine`, `lineaCredito`, `annualEffectiveRate`, `tcea`, `membershipFee`, `debtInsurance`.
- **Brechas Identificadas:**
  - No expone formalmente los estados calculados vs bancarios de saldo deudor (`usedCredit`, `availableCredit`, `billedDebt`, `unbilledDebt`).
  - No modela la verificación contractual independiente por campo (corte verificado vs tasas verificadas).
- **Acción:** Enriquecer `CardConfig` manteniendo compatibilidad 100% retrocompatible con código existente y agregando cálculo dinámico de métricas financieras.

### 2.2 `src/domain/cards/` (`types.ts`, `billingCycles.ts`)
- **Estado Actual:**
  - `billingCycles.ts` cuenta con funciones puras para calcular fechas de corte, días de vencimiento y ajuste de fines de semana.
  - `types.ts` contiene tipos como `CreditCard`, `CardPurchase`, `InstallmentScheduleRow`, `InstallmentSchedule`, `buildCardInstallmentSchedule` y `calculateMinimumPayment`.
- **Brechas Identificadas:**
  - Falta un motor unificado (`smartCardEngine.ts`) que integre el análisis de ciclo, amortización francesa con redondeo al centavo exacto, detección de promociones sin interés (0% TEA), conciliación frente a estados de cuenta y simulador desacoplado.
- **Acción:** Implementar `src/domain/cards/smartCardEngine.ts` como biblioteca de funciones puras, inmutables y 100% testeables.

### 2.3 `src/store/cardStatementStore.ts`
- **Estado Actual:** Permite almacenar `VerifiedStatement` en `finper_verified_card_statements` (clave `cycleKey`, `finalDebt`, `fileName`, etc.).
- **Brechas Identificadas:**
  - No desglosa compras faltantes ni partidas en disputa.
  - Solo permite regularizaciones globales o reseteos.
- **Acción:** Ampliar para registrar estados de cuenta con fecha de corte, fecha de vencimiento, saldo total facturado, pago mínimo y discrepancias encontradas frente a las transacciones de FINPER.

### 2.4 `src/store/projectionStore.ts`
- **Estado Actual:**
  - Maneja `CARD_RULES` con corte y pago para las 3 tarjetas.
  - `calculateCardPaymentDate`: Calcula la fecha de pago según si el consumo ocurrió antes o después del corte.
  - `calculateCardInstallmentSchedule`: Divide el monto en cuotas con `allocateMoney`.
  - `getCardDueDetailsForMonth`: Consolida los pagos de tarjetas por mes.
- **Brechas Identificadas:**
  - Falta un conector directo que distinga con total claridad:
    * **Gasto Económico:** Registrado en la fecha en que se realiza la compra con tarjeta.
    * **Desembolso de Caja / Cancelación de Pasivo:** Registrado en la fecha en que se paga la tarjeta con cargo a una cuenta bancaria.
  - Evitar a toda costa que las proyecciones a 3, 6, 12 y 24 meses dupliquen el gasto cuando se computan simultáneamente los egresos con tarjeta y el pago del estado de cuenta.

### 2.5 `src/pages/CronogramaPagos.tsx` (Módulo `Tarjetas`)
- **Estado Actual:**
  - Presenta un panel resumen ("Total por Pagar Ahora", "Acumulando en Curso", "Próximos Vencimientos").
  - Muestra tarjetas individuales con consumos del ciclo anterior y ciclo actual.
  - Modal `RegularizarDeudaModal` para cancelar o ajustar deuda.
  - Modal `AddCardModal` para crear tarjetas.
- **Brechas Identificadas:**
  - No cuenta con pestaña o sección para el **Simulador Financiero Puro**.
  - No muestra la ficha contractual completa de las tarjetas (línea total, línea disponible, TEA, TCEA, desgravamen, advertencia de datos contractuales faltantes).
  - La conciliación bancaria manual es básica (no permite ingresar el estado de cuenta y compararlo lado a lado con el cálculo de FINPER).
- **Acción:** Refactorizar y potenciar la página `Tarjetas` (`CronogramaPagos.tsx`) con un diseño modular en pestañas:
  1. **Dashboard & Ciclos:** Resumen de tarjetas con líneas, saldos usados/disponibles y ciclos en curso.
  2. **Detalle Contractual y Cuotas:** Desglose de compras en cuotas activas, tasas y advertencias contractuales.
  3. **Conciliación Bancaria Manual:** Comparador visual entre Estado de Cuenta (banco) y Consumos Calculados (FINPER).
  4. **Simulador de Cuotas Puro:** Herramienta interactiva no persistente con cronograma francés y cálculo de impacto en flujo de caja.

---

## 3. Matriz de Componentes: Reutilizables vs. Nuevos

| Componente / Módulo | Estado Actual | Estrategia Sprint 01 |
| :--- | :--- | :--- |
| `src/domain/cards/billingCycles.ts` | Robusto y probado | **Reutilizar 100%**: aprovechar cálculo de ciclos, saltos de mes y manejo de fechas sin zona horaria. |
| `src/domain/cards/types.ts` | Definiciones v2.0.4 | **Reutilizar y extender**: alinear con tipos del motor inteligente. |
| `src/domain/cards/smartCardEngine.ts` | Inexistente | **Crear nuevo**: motor financiero centralizado puro (amortización, validación contractual, conciliación, simulación). |
| `src/store/creditCardStore.ts` | Básico | **Extender**: añadir cálculo de métricas financieras, compatibilidad retrocompatible y referencias informativas. |
| `src/store/cardStatementStore.ts` | Básico | **Extender**: permitir registro y conciliación asistida de estados de cuenta. |
| `src/components/cards/SmartCardSimulator.tsx` | Inexistente | **Crear nuevo**: interfaz de simulación financiera pura con visualización de cronograma y advertencias. |
| `src/components/cards/SmartCardReconciliationModal.tsx` | Inexistente | **Crear nuevo**: modal de conciliación asistida estado de cuenta vs FINPER. |
| `src/components/cards/CardContractualSheetModal.tsx` | Inexistente | **Crear nuevo**: ficha para ver y editar condiciones contractuales (línea, TEA, desgravamen). |
| `src/pages/CronogramaPagos.tsx` | Funcional pero incompleto | **Actualizar**: integrar pestañas, modales nuevos y métricas de tarjetas inteligentes. |

---

## 4. Conclusión del Diagnóstico
El proyecto cuenta con bases matemáticas sólidas en `src/domain/cards/billingCycles.ts` y `src/domain/finance/money.ts`. La implementación de FINPER 2.1 Sprint 01 unificará estas piezas bajo una arquitectura de dominio estricta, protegiendo los datos existentes en Supabase y brindando al usuario una herramienta completa para el control de sus 3 tarjetas de crédito.
