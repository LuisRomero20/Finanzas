# FINPER 2.1 — REGLAS FINANCIERAS Y DE CÁLCULO DE TARJETAS

**Fecha de vigencia:** Octubre 2026  
**Área de aplicación:** Motor de Tarjetas, Conciliación y Simulador

---

## 1. Principio de Transparencia Total Contractual

> [!IMPORTANT]
> **REGLA DE ORO:** Ningún componente de FINPER inventará tasas de interés, porcentajes de desgravamen o cobros de membresía.

1. Si una tarjeta no tiene configurada la TEA o el seguro de desgravamen y no se trata de una promoción explícita a 0% de interés, cualquier cálculo o simulación debe llevar el distintivo:  
   **"Estimación incompleta: faltan datos contractuales"**.
2. Las referencias de la central de riesgos (30/09/2026) son **estrictamente informativas**. No se consideran datos contractuales ni se asumen como saldos vivos en Supabase sin conciliación expresa del usuario.

---

## 2. Reglas de Ciclo de Facturación y Vencimiento

Las 3 tarjetas del usuario operan con la siguiente lógica de corte y pago:

### 2.1 Ripley Mastercard
- **Día de Corte:** Día 3 de cada mes.
- **Día Límite de Pago:** Día 1 del mes subsiguiente.
- **Comportamiento:**
  - Compra realizada los días 1 o 2 del mes: entra en el ciclo que corta el día 3 y se paga el día 1 del mes siguiente.
  - Compra realizada a partir del día 3: entra al nuevo ciclo y se paga en 2 meses (ej. compra el 3 de octubre se paga el 1 de diciembre).

### 2.2 Interbank Amex Benefit
- **Día de Corte:** Día 21 de cada mes.
- **Día Límite de Pago:** Día 15 del mes siguiente.
- **Comportamiento:**
  - Compra antes del 21 (días 1 al 20): se factura al corte del 21 y se paga el 15 del mes siguiente.
  - Compra desde el día 21: entra al nuevo ciclo y se paga en 2 meses.

### 2.3 BBVA Bfree
- **Día de Corte:** Día 10 de cada mes.
- **Día Límite de Pago:** Día 5 del mes siguiente.
- **Comportamiento:**
  - Compra antes del 10 (días 1 al 9): corta el día 10 y se paga el 5 del mes siguiente.
  - Compra desde el día 10: entra al nuevo ciclo y se paga en 2 meses.

### 2.4 Manejo de Meses Cortos y Febrero
- Si el día de corte o pago excede los días del mes (ej. día 30 en febrero), se ajusta automáticamente al último día hábil/calendario del mes mediante `daysInMonth(year, month)` sin generar desbordamiento de fecha.

---

## 3. Modalidades de Compra y Financiamiento

### 3.1 Compra Directa (`direct`, 1 Cuota)
- Modalidad en la que el usuario adquiere un bien/servicio en un solo pago al vencimiento del ciclo.
- Tasa de interés financiero rotatorio: 0.00% si se cancela en la fecha límite de pago.
- Clasificación formal en el motor: `modality: 'direct'` con `isZeroInterestPromo: false` (evita catalogar incorrectamente como convenio de 0% sin intereses lo que es una compra regular directa).

### 3.2 Promoción Cuotas Sin Intereses (`zero_interest_promo`, 0% TEA)
- Autorizado para compras bajo convenios contractuales especiales (ej. 3 cuotas sin intereses en Ripley o BBVA).
- Clasificación formal: `modality: 'zero_interest_promo'` con `isZeroInterestPromo: true`.
- El capital se divide exactamente entre el número de cuotas ($n$).
- Los centavos indivisibles se asignan a las primeras cuotas asegurando que:
  $$\sum_{k=1}^n \text{Cuota}_k = \text{Importe Total Exacto}$$
- Interés: estrictamente S/ 0.00.

### 3.3 Cuotas Regulares con Financiamiento (`revolving_financed`, Sistema Francés)
- Aplica para consumos en 2 o más cuotas sin convenio promocional.
- Requiere obligatoriamente TEA y seguro de desgravamen contractuales para validación completa.
- Aplica cuota constante nivelada para capital e interés:
  $$\text{Cuota Base} = P \times \frac{\text{TEM} \cdot (1 + \text{TEM})^n}{(1 + \text{TEM})^n - 1}$$
- Seguro de desgravamen: calculado mensualmente sobre el saldo deudor remanente al inicio de cada periodo:
  $$\text{Desgravamen}_k = \text{SaldoInicial}_k \times \text{TasaDesgravamenMensual}$$
- Redondeo: cada componente se redondea a 2 decimales. La última cuota absorbe la diferencia marginal de centavos para dejar el saldo en S/ 0.00.

---

## 4. Reglas de Conciliación Bancaria y Trazabilidad Documental

1. **Campos No Precargados:**
   - Tanto el saldo total facturado como el pago mínimo inician vacíos.
   - FINPER jamás asume S/ 0.00 ni precarga montos ficticios (como S/ 30.00 de pago mínimo).
2. **Protección de Saldo Cero (S/ 0.00):**
   - Si el usuario ingresa un saldo deudor de S/ 0.00, el sistema exige marcar conscientemente una casilla certificando que revisó el estado de cuenta bancario oficial.
3. **4 Estados de Verificación Explícitos:**
   - `draft`: Conciliación en edición previa a su confirmación.
   - `user_declared`: Importe verificado por el usuario en banca móvil/web sin identificar o adjuntar documento formal.
   - `statement_verified`: Respaldado con documento bancario oficial identificado (`documentReference` o archivo real).
   - `disputed`: Cargos no reconocidos o diferencia pendiente de reclamo bancario.
4. **Varianza ($\Delta$):**
   $$\Delta = \text{Saldo Estado de Cuenta Confirmado} - \text{Total Consumos Calculados FINPER}$$
5. **Interpretación:**
   - $|\Delta| \le 0.05$: **CONCILIADO**. La app refleja exactamente la deuda del banco.
   - $\Delta > 0.05$: **DISCREPANCIA (BANCO MAYOR)**. Indica posibles cargos no registrados en FINPER: seguros, comisiones, membresía o consumos de tarjeta omitidos.
   - $\Delta < -0.05$: **DISCREPANCIA (FINPER MAYOR)**. Indica posibles compras registradas por duplicado o consumos hechos el día de corte que el banco asignó al ciclo posterior.
6. **Inmutabilidad:** La conciliación almacena el saldo verificado del estado de cuenta en `cardStatementStore` sin borrar ni alterar los movimientos individuales del usuario.

---

## 5. Reglas de Pagos Parciales, Totales y Control de Excedente

1. **Clasificación Estricta del Pago:**
   - **Pago Parcial:** $\text{Pago} < \text{DeudaPendiente} - 0.005$.
     * Saldo pendiente restante: $\text{DeudaPendiente} - \text{Pago}$.
     * Estado: Pendiente. La tarjeta **NO** se marca como cancelada.
   - **Pago Total:** $|\text{Pago} - \text{DeudaPendiente}| \le 0.005$.
     * Saldo restante: S/ 0.00.
     * Estado: Cancelada al 100%.
   - **Pago con Excedente:** $\text{Pago} > \text{DeudaPendiente} + 0.005$.
     * Excedente generado: $\text{Pago} - \text{DeudaPendiente}$.
     * Exige confirmación consciente del usuario antes de habilitar el registro (saldo a favor / pago adelantado).
2. **Bloqueo de Pagos No Positivos:**
   - Todo pago $\le \text{S/ } 0.00$, infinito o `NaN` es rechazado y bloquea el botón de envío.
3. **Regularización Externa Directa (Opción B):**
   - No genera egresos ni movimientos contables ficticios.
   - Requiere confirmación obligatoria si existía saldo positivo y se etiqueta como cancelación externa.
4. **Idempotencia y Prevención de Duplicados:**
   - Cada pago se genera con identificador financiero único estable (`pay-[tarjeta]-[vencimiento]-[timestamp]`) y se bloquea el botón durante el envío (`isSubmitting`) para evitar doble cobro.
