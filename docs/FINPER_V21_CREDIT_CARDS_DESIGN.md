# FINPER 2.1 — Diseño Técnico del Módulo de Tarjetas Inteligentes (Smart Cards)

**Documento:** Especificación de Diseño Técnico  
**Versión de Destino:** FINPER 2.1  
**Fecha de Creación:** 22 de Octubre de 2026  
**Autor:** Equipo de Ingeniería y Arquitectura FINPER  

---

## 1. Objetivos del Módulo en FINPER 2.1

El módulo **Tarjetas Inteligentes (FINPER 2.1)** convertirá el registro estático de tarjetas de crédito en un motor financiero activo capaz de:
1. Modelar con precisión bancaria real las 3 tarjetas del usuario (Ripley Mastercard, Interbank Amex Benefit y BBVA Bfree).
2. Simular cronogramas de compra en cuotas con el método francés y cálculo exacto de seguro de desgravamen.
3. Recomendar en tiempo real qué tarjeta utilizar según la fecha de compra para maximizar el financiamiento gratuito (hasta 54 días sin intereses).
4. Proyectar con exactitud el pago mensual exigible y el pago mínimo antes de que llegue el estado de cuenta bancario.
5. Garantizar 100% de compatibilidad hacia atrás con las 2,246 transacciones históricas existentes.

---

## 2. Modelado de las 3 Tarjetas Reales del Usuario

```
+---------------------------------------------------------------------------------------------------------+
|                                    PARAMETRIZACIÓN BANCARIA REAL                                        |
+--------------------------+-----------------------+-----------------------+------------------------------+
| Parámetro                | Ripley Mastercard     | Interbank Amex        | BBVA Bfree                   |
+--------------------------+-----------------------+-----------------------+------------------------------+
| Entidad Emisora          | Banco Ripley          | Interbank             | BBVA Perú                    |
| Denominación Comercial   | Ripley Mastercard     | Amex Benefit          | BBVA Bfree                   |
| Red de Pagos             | Mastercard            | American Express      | Visa / Mastercard            |
| Moneda Principal         | PEN (Soles)           | PEN (Soles)           | PEN (Soles)                  |
| Día de Corte (Factura)   | 03 de cada mes        | 21 de cada mes        | 10 de cada mes               |
| Día Límite de Pago       | 01 del mes siguiente  | 15 del mes siguiente  | 05 del mes siguiente         |
| Días de Gracia Máximos   | ~56 días              | ~54 días              | ~55 días                     |
| TEA Referencial Compras  | 54.90% - 89.90%       | 49.90% - 69.90%       | 39.90% - 59.90%              |
| Seguro Desgravamen       | 3.99% o máx S/ 14.90  | 0.39% del saldo deudor| 0.38% del saldo deudor       |
| Cuotas sin Intereses     | Comercios Ripley/Web  | Promociones Amex      | Pagos Sin Intereses (1 a 12) |
| Membresía Anual          | S/ 99 (exonerable)    | S/ 180 (exonerable)   | S/ 150 (exonerable)          |
| Regla de Exoneración     | 1 consumo mensual     | Consumo mensual mín   | Meta de consumo acumulado    |
+--------------------------+-----------------------+-----------------------+------------------------------+
```

### Reglas Específicas por Tarjeta:

#### A. Ripley Mastercard
- **Corte:** Día 03. Cualquier compra realizada el día 04 ingresa al ciclo que corta el mes subsiguiente, otorgando el periodo más largo de financiamiento.
- **Vencimiento:** Día 01 del mes siguiente al corte. Si el día 01 cae fin de semana, el vencimiento bancario se traslada al lunes hábil inmediato.
- **Promociones:** Permite 3, 6 o 12 cuotas sin intereses en Tiendas Ripley y comercios seleccionados mediante convenio.

#### B. Interbank Amex Benefit
- **Corte:** Día 21 de cada mes.
- **Vencimiento:** Día 15 del mes siguiente.
- **Seguro de Desgravamen:** 0.39% mensual sobre el saldo deudor promedio del ciclo. Si el saldo al corte es S/ 0, no se factura desgravamen.
- **Programa de Lealtad:** Acumulación de Millas Benefit por cada dólar o equivalente en soles gastado.

#### C. BBVA Bfree
- **Corte:** Día 10 de cada mes.
- **Vencimiento:** Día 05 del mes siguiente.
- **Programa 'Pagos Sin Intereses':** Reconocimiento automático de comercios afiliados donde se difiere el gasto en cuotas a TEA 0% sin recargo financiero.
- **Seguro de Desgravamen:** 0.38% mensual con tope normativo.

---

## 3. Arquitectura de Componentes UI para FINPER 2.1

```
src/components/cards/
├── SmartCardsDashboard.tsx         # Vista principal de tarjetas con medidores de línea y fechas clave
├── CardDetailView.tsx              # Modal o página de detalle por plástico
├── InstallmentCalculatorWidget.tsx # Simulador interactivo de cuotas y costo financiero total
├── PaymentOptimizerWidget.tsx      # Recomendador inteligente de uso según fecha de compra
├── StatementReconciliationModal.tsx# Conciliador de estados de cuenta reales vs calculados
└── CardPurchaseForm.tsx            # Formulario integrado para compras directas y en cuotas
```

### 1. `SmartCardsDashboard.tsx`
- **Widgets Visuales:** Renderiza tarjetas estilizadas con el degradado y logotipo de cada banco.
- **Indicadores Clave:**
  - Línea Total autorizada.
  - Saldo Utilizado acumulado (revolvente + cuotas vigentes).
  - Línea Disponible en tiempo real.
  - Días restantes para el próximo corte y días para la fecha de pago.
  - Alerta preventiva: "¿Qué tarjeta me conviene usar hoy?".

### 2. `InstallmentCalculatorWidget.tsx`
- Permite ingresar un monto de compra estimado y seleccionar la tarjeta.
- Muestra una tabla comparativa automática:
  - Compra directa (1 cuota a fin de mes).
  - 3 cuotas (simulación TEA 0% vs TEA estándar).
  - 6 cuotas.
  - 12 cuotas.
- Desglosa para cada opción: cuota mensual estimada, intereses totales pagados, costo del seguro de desgravamen y fecha de la última cuota.

### 3. `PaymentOptimizerWidget.tsx` (Recomendador de Compra Inteligente)
- Evalúa la fecha actual contra los ciclos de corte de las 3 tarjetas:
  - Si hoy es día 05: Recomienda **Ripley Mastercard** (acaba de cortar el día 03, pago hasta el 01 del siguiente mes = ~56 días libres de interés).
  - Si hoy es día 12: Recomienda **BBVA Bfree** (acaba de cortar el día 10 = ~54 días libres).
  - Si hoy es día 23: Recomienda **Interbank Amex** (acaba de cortar el día 21 = ~53 días libres).
- Alerta al usuario si una tarjeta está próxima a su día de corte para evitar que la compra se facture en pocos días.

---

## 4. Estrategia de Migración y Compatibilidad hacia Atrás

1. **Cero Migraciones Destructivas:**  
   La información de tarjetas seguirá persistiendo en la fila `config-credit-cards-v2` de la tabla `public.transacciones` y localmente en `finper_credit_cards_v2`.
2. **Compatibilidad con Transacciones Existentes:**  
   Las compras pasadas que ya tienen el campo `cuotas` o el formato `[X cuotas]` en el concepto continuarán interpretándose mediante el motor `buildCardInstallmentSchedule` sin necesidad de modificar los 2,246 registros históricos de Supabase.
3. **Desacoplamiento de Despliegue:**  
   El motor financiero y los contratos TypeScript (`src/domain/cards/types.ts`) ya están completamente incorporados y testeados en FINPER 2.0.4. En FINPER 2.1 solo se requerirá la construcción de los componentes de presentación React correspondientes.
