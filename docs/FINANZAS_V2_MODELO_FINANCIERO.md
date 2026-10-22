# FINANZAS 2.0 — Modelo Matemático y Financiero

Este documento detalla formalmente los fundamentos matemáticos, fórmulas financieras y algoritmos de redondeo implementados en la versión 2.0.0.

---

## 1. Precisión Monetaria y Manejo de Centavos (`src/domain/finance/money.ts`)

Para evitar los clásicos errores de redondeo acumulado inherentes a la aritmética de coma flotante IEEE 754 (ej. `0.1 + 0.2 === 0.30000000000000004`), el motor opera internamente convirtiendo las cantidades monetarias a enteros en unidades menores (centavos):

$$\text{minorUnits} = \text{round}\big((\text{amount} + \text{sign}(\text{amount}) \cdot \varepsilon) \times 10^{\text{scale}}\big)$$

### Algoritmo de Distribución Equitativa de Cuotas (`allocateMoney`)
Cuando un monto total $T$ debe distribuirse en $n$ cuotas, la división simple $T / n$ genera fracciones de centavo. El algoritmo `allocateMoney` calcula:

$$\text{base} = \lfloor \text{abs}(T_{\text{minor}}) / n \rfloor, \quad r = \text{abs}(T_{\text{minor}}) \pmod n$$

Las primeras $(n - r)$ cuotas reciben el monto base $\text{base}$, mientras que las últimas $r$ cuotas reciben $(\text{base} + 1)$ centavos. Esto garantiza que:

$$\sum_{k=1}^{n} \text{cuota}_k \equiv T \quad (\text{con exactitud al centavo, sin fugas ni sobrantes})$$

---

## 2. Conversión de Tasas de Interés (`src/domain/finance/rates.ts`)

### 2.1 Tasa Efectiva Anual (TEA) a Tasa Efectiva Mensual (TEM)
En el sistema bancario peruano y latinoamericano, las tasas activas pactadas en préstamos y tarjetas se expresan en TEA (año base de 360 días o capitalización mensual continua):

$$\text{TEM} = (1 + \text{TEA})^{1/12} - 1$$

$$\text{TEA} = (1 + \text{TEM})^{12} - 1$$

---

## 3. Amortización por Sistema Francés (Cuota Nivelada)

Para un capital inicial $P$, una tasa periódica $i = \text{TEM}$ y un plazo de $n$ cuotas:

### Cuota Base Periódica:
$$\text{Cuota} = P \cdot \frac{i(1 + i)^n}{(1 + i)^n - 1} \quad (\text{para } i > 0)$$

### Desglose Periódico por Cuota $k$:
Para cada cuota $k \in \{1, \dots, n\}$ con saldo deudor inicial $S_{k-1}$:

1. **Interés del período:**
   $$I_k = \text{roundMoney}(S_{k-1} \cdot i)$$
2. **Seguro de desgravamen:**
   $$\text{Seguro}_k = \text{roundMoney}(S_{k-1} \cdot r_{\text{desgravamen}})$$
3. **Amortización de capital:**
   $$A_k = \begin{cases} S_{k-1} & \text{si } k = n \\ \text{roundMoney}(\text{Cuota} - I_k) & \text{si } k < n \end{cases}$$
4. **Saldo final del período:**
   $$S_k = S_{k-1} - A_k$$
5. **Cuota total a pagar:**
   $$\text{CuotaTotal}_k = A_k + I_k + \text{Seguro}_k + \text{ComisiónFija}$$

Al finalizar el período $n$, $S_n \equiv 0.00$.

---

## 4. Simulación de Amortización Anticipada (Prepagos)

El motor financiero permite evaluar dos modalidades de amortización extraordinaria sobre el saldo deudor remanente $S_{\text{prepago}} = S_k - \text{MontoExtra}$:

### 4.1 Reducción de Plazo (`reduce_term`)
- Se mantiene el valor de la cuota mensual original.
- Al aplicarse sobre el nuevo saldo menor, una porción significativamente mayor de cada cuota se destina a amortización de capital en lugar de intereses.
- El préstamo se cancela en un número menor de meses ($m < n$).
- **Ahorro de intereses:**
  $$\Delta I = \sum I_{\text{original}} - \sum I_{\text{simulado}}$$

### 4.2 Reducción de Cuota (`reduce_installment`)
- Se mantiene el número de meses restantes pactados originalmente.
- Se recalcula la cuota mensual para el plazo remanente con base en el nuevo saldo reducido.
- Proporciona alivio inmediato de liquidez mensual al usuario.

---

## 5. Ciclos de Facturación de Tarjetas de Crédito (`src/domain/cards/billingCycles.ts`)

Un ciclo de facturación se parametriza por:
- **Día de corte ($D_c$):** día del mes en que la entidad emisora cierra el estado de cuenta.
- **Día límite de pago ($D_p$):** día del mes en que vence la obligación de pago.

### Reglas de Asignación Temporal de un Consumo Realizado el Día $D$:
1. **Consumo antes del corte ($D < D_c$):**
   - Pertenece al ciclo del mes en curso.
   - Fecha de vencimiento: día $D_p$ del mes siguiente ($M + 1$).
2. **Consumo el día del corte o posterior ($D \ge D_c$):**
   - Entra al nuevo ciclo que cerrará el mes siguiente ($M + 1$).
   - Fecha de vencimiento: día $D_p$ de dos meses posteriores ($M + 2$).
3. **Ajuste de fines de semana (`moveWeekendDueDateToMonday`):**
   - Si la fecha límite cae en sábado o domingo, la fecha de exigibilidad bancaria se traslada al día hábil siguiente (lunes).
