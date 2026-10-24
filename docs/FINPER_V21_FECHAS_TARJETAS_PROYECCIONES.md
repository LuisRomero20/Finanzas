# FINPER 2.1 — Corrección y Desambiguación de Fechas en Proyecciones y Tarjetas

**Fecha:** 23 de octubre de 2026  
**Rama:** `feature/finper-v21-card-dates-clarification` (derivada de `main` en `074020a`)  
**Estado de pruebas:** 264/264 pruebas aprobadas en 39 suites (Vitest v2.1.9)  
**Calidad de código:** 0 errores TypeScript (`tsc --noEmit`), 0 errores ESLint (`eslint .`)  
**Compilación:** Build de producción exitoso en 14.86s  
**Integridad financiera:** Cero modificaciones sobre `transacciones`, esquemas o registros históricos de Supabase.

---

## 1. Diagnóstico de la Auditoría

En versiones anteriores, las partidas proyectadas pagadas con tarjeta de crédito (ej. BBVA Bfree, Interbank Amex, Ripley) mostraban simultáneamente su fecha de consumo programado (ej. `01/11/2026` u `11/11/2026`) y la fecha bancaria de liquidación de la tarjeta (ej. `05/12/2026` o `05/01/2027`) sin diferenciarlas claramente en la interfaz.

Esto provocaba tres confusiones:
1. **Confusión temporal:** ¿Por qué un consumo programado en noviembre (como Teléfono Móvil o Luz) indica pago en enero de 2027?
2. **Riesgo de percepción de doble contabilización:** No se distinguía si la partida representaba el gasto económico del mes de noviembre o la salida real de efectivo bancario (cashflow).
3. **Falta de visibilidad del ciclo de corte:** No se explicaba al usuario que los consumos realizados después del día de corte bancario pertenecen al ciclo del mes siguiente y se pagan 2 meses después.

---

## 2. Solución Arquitectónica: Modelo de Triple Fecha Explícita

Se amplió la interfaz `EffectiveProjectedRow` y la función `calculateCardPaymentDate()` en [`src/store/projectionStore.ts`](file:///c:/Users/Luis%20Romero/Documents/Proyectos/FinanzasPersonales/src/store/projectionStore.ts) para desacoplar y documentar las tres fechas esenciales de toda operación:

| Dimensión | Campo en Código | Significado | Ejemplo (Luz en BBVA Bfree) |
| :--- | :--- | :--- | :--- |
| **1. Fecha de Consumo** | `fechaConsumo` / `mesConsumo` | Cuándo se realiza o planifica el consumo económico | `11/11/2026` (`2026-11`) |
| **2. Ciclo de Facturación** | `cicloFacturacion` / `fechaCorteTarjeta` | Rango de fechas del estado de cuenta bancario | `10/11 — 09/12` (Corte: `10/12/2026`) |
| **3. Fecha de Pago (Caja)** | `fechaPagoEfectiva` / `mesImpactoCaja` | Cuándo sale efectivamente el dinero de la cuenta | `05/01/2027` (`2027-01`) |

Se incorporó además el campo `desfaseMesesCaja`:
- `0`: Para gastos directos en efectivo, sueldo o transferencias bancarias (impacto inmediato en el mismo mes).
- `1`: Para consumos de tarjeta realizados **antes del día de corte** (se pagan en el mes siguiente).
- `2`: Para consumos de tarjeta realizados **el día de corte o después** (cruzan al siguiente ciclo y se pagan en 2 meses).

---

## 3. Auditoría Caso por Caso — Noviembre 2026

### Reglas contractuales auditadas:
- **BBVA Bfree:** Día de corte: `10` · Día límite de pago: `5`.
- **Interbank Amex:** Día de corte: `21` · Día límite de pago: `15`.
- **Ripley:** Día de corte: `3` · Día límite de pago: `1`.

### Evaluación de partidas clave de noviembre:

| Partida | Entidad | Fecha Consumo | Posición frente al Corte | Ciclo Facturado | Fecha y Mes de Pago (Caja) | Desfase |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **Internet** (S/ 79.00) | BBVA Bfree | `01/11/2026` | Antes del corte (1 < 10) | `10/10 — 09/11` | **`05/12/2026`** (`2026-12`) | 1 mes |
| **Gas** (S/ 50.00) | BBVA Bfree | `01/11/2026` | Antes del corte (1 < 10) | `10/10 — 09/11` | **`05/12/2026`** (`2026-12`) | 1 mes |
| **Telefonia Movil** (S/ 39.90) | BBVA Bfree | `11/11/2026` | **Posterior al corte** (11 >= 10) | `10/11 — 09/12` | **`05/01/2027`** (`2027-01`) | **2 meses (Cruza año)** |
| **Luz** (S/ 120.00) | BBVA Bfree | `11/11/2026` | **Posterior al corte** (11 >= 10) | `10/11 — 09/12` | **`05/01/2027`** (`2027-01`) | **2 meses (Cruza año)** |
| **Spotify** (S/ 12.00) | Interbank Amex | `01/11/2026` | Antes del corte (1 < 21) | `21/10 — 20/11` | **`15/12/2026`** (`2026-12`) | 1 mes |
| **Pastilla Madre** (S/ 120.00) | Ripley | `04/11/2026` | **Posterior al corte** (4 >= 3) | `03/11 — 02/12` | **`01/01/2027`** (`2027-01`) | **2 meses (Cruza año)** |
| **Utensilios Limpieza** (S/ 30.00) | Ripley | `04/11/2026` | **Posterior al corte** (4 >= 3) | `03/11 — 02/12` | **`01/01/2027`** (`2027-01`) | **2 meses (Cruza año)** |
| **Sueldo, BCP, Titulación** | Interbank (Débito) | Varios | No aplica tarjeta | Directo | Misma fecha de consumo | 0 meses |

---

## 4. Comparación Visual: Antes vs. Después

### Antes (Ambiguo):
```text
[Tabla Noviembre 2026]
Fecha: 11/11/2026 | Luz | S/ 120.00 | BBVA Bfree | [Facturación: Pago el 05/01 (Enero)]
--> Confusión: ¿Por qué una fila de noviembre dice pago en enero? ¿Se suma dos veces?
```

### Después (Desambiguado y Transparente):
```text
[Tabla Noviembre 2026 — Presupuesto Fijo & Proyección]
Guía de cabecera: 📅 Fecha = Consumo programado · 💳 Ciclo = Periodo facturado · 🗓️ Caja = Salida real de dinero

Columna Fecha:
11/11/2026
(Consumo)

Columna Concepto:
Luz
[💳 Ciclo: 10/11 — 09/12]  [🗓️ Caja: Pago 05/01 (Enero) · Cruza corte]

--> Claridad total: El consumo se imputa económicamente a noviembre; el dinero saldrá del banco el 5 de enero porque el recibo vence después del corte del día 10.
```

---

## 5. Prevención de Doble Contabilización

FINPER ahora distingue contablemente entre dos perspectivas sin duplicar transacciones:
1. **Presupuesto Económico (Mes de Consumo):**
   Suma las compras planificadas en el mes (incluyendo consumos con tarjeta de crédito de noviembre). Para noviembre de 2026, suma exactamente **S/ 4,007.32 de ingresos vs S/ 4,228.74 de egresos** (Balance: **-S/ 221.42**).
2. **Flujo de Caja Real (Mes de Salida de Dinero):**
   En el mes corriente únicamente impactan los pagos de servicios al contado y las cuotas/liquidaciones de tarjeta que vencen efectivamente en ese mes. Los consumos que vencen en diciembre o enero no restan efectivo de las cuentas en noviembre.

---

## 6. Resultados de Calidad y Pruebas

- **Suite específica de desambiguación:** [`creditCardDateDisambiguation.test.ts`](file:///c:/Users/Luis%20Romero/Documents/Proyectos/FinanzasPersonales/src/domain/__tests__/creditCardDateDisambiguation.test.ts) (6 pruebas exhaustivas para BBVA, Interbank, Ripley, cruces de fin de año e inmutabilidad).
- **Pruebas totales:** **264 de 264 aprobadas** en 39 suites (Vitest).
- **TypeScript:** 0 errores de compilación (`tsc --noEmit`).
- **ESLint:** 0 errores.
- **Build de producción:** Generado con éxito en 14.86s.

---

## 7. Guía de Ejecución Local (Windows 11)

```powershell
# 1. Posicionarte en la carpeta del proyecto
Set-Location "c:\Users\Luis Romero\Documents\Proyectos\FinanzasPersonales"

# 2. Confirmar que estás en la rama de corrección de fechas
git status
git branch --show-current

# 3. Iniciar el servidor local
npm run dev
```

Abre Edge en `http://localhost:5173`, entra a **Proyecciones** y selecciona **Noviembre 2026**:
- Revisa las partidas **Internet**, **Gas**, **Telefonia Movil** y **Luz**.
- Comprueba que la columna Fecha indica claramente `Consumo`.
- Comprueba los badges de tarjeta que especifican el ciclo y la fecha de salida de caja (`05/12` para Internet/Gas, y `05/01 Cruza corte` para Teléfono/Luz).

---

## 8. Guía de Revisión en iPhone (Safari)

1. En Windows, inicia el servidor en red local:
   ```powershell
   Set-Location "c:\Users\Luis Romero\Documents\Proyectos\FinanzasPersonales"
   npm run dev -- --host 0.0.0.0
   ```
2. Desde tu iPhone abre Safari: `http://192.168.18.8:5173`.
3. Navega a **Proyecciones**:
   - En la lista móvil verás claramente la etiqueta: `Consumo: 11/11 · BBVA Bfree`.
   - Al tocar el detalle se desglosa: `💳 Ciclo: 10/11 — 09/12` y `🗓️ Impacto en caja: 05/01 (Cruza corte · Paga en 2 meses)`.

---

## 9. Checklist Pre-Merge

- [x] Rama aislada creada: `feature/finper-v21-card-dates-clarification`.
- [x] Modelo de Triple Fecha (`fechaConsumo`, `cicloFacturacion`, `fechaPagoEfectiva`) implementado en `projectionStore.ts`.
- [x] Cálculos de ciclos BBVA Bfree, Interbank Amex y Ripley auditados y matemáticamente verificados.
- [x] Interfaz de escritorio ([`ProyeccionPage.tsx`](file:///c:/Users/Luis%20Romero/Documents/Proyectos/FinanzasPersonales/src/pages/ProyeccionPage.tsx)) y móvil ([`MobileProjectionList.tsx`](file:///c:/Users/Luis%20Romero/Documents/Proyectos/FinanzasPersonales/src/components/MobileProjectionList.tsx)) actualizadas con badges informativos.
- [x] Las 23 partidas de noviembre conservan sus IDs, montos, fechas y conceptos intactos.
- [x] 264/264 pruebas pasando en Vitest.
- [x] Sin mutaciones en Supabase de producción.
