# FINPER 2.1 (Sprint 01) — TUTORIAL DE PRUEBAS PASO A PASO (PC + iPHONE)

Este tutorial te guiará para probar y validar localmente las nuevas funciones de **Tarjetas Inteligentes, Conciliación Bancaria y Simulador de Cuotas** en tu PC con Windows (Edge/Chrome) y en tu iPhone (Safari) antes de autorizar cualquier merge a `main`.

---

## 💻 PARTE 1: Pruebas en tu PC (Windows con Edge / Chrome)

### Paso 1: Iniciar el servidor local de desarrollo
Abre tu terminal en la carpeta del proyecto y ejecuta:
```powershell
npm run dev
```
Abre en tu navegador (Edge o Chrome):
`http://localhost:5173`

---

### Paso 2: Navegar al módulo de Tarjetas
1. En la barra superior de navegación o dock, haz clic en **«Tarjetas»**.
2. Observa el nuevo encabezado:
   - Verás el botón negro/oscuro **«Simulador de Cuotas»** con el ícono de calculadora.
   - Verás el botón verde **«Nueva Tarjeta»**.
   - Verás el selector de fechas para navegar entre ciclos pasados, presentes o futuros.

---

### Paso 3: Verificar el Dashboard y Fichas de las 3 Tarjetas
En la sección principal verás tus 3 tarjetas configuradas:
1. **Ripley Mastercard:**
   - Línea autorizada: S/ 1,000.00
   - Corte: día 3 · Pago: día 1
2. **Interbank Amex Benefit:**
   - Línea autorizada: S/ 1,000.00
   - Corte: día 21 · Pago: día 15
3. **BBVA Bfree:**
   - Línea autorizada: S/ 700.00
   - Corte: día 10 · Pago: día 5

Haz clic en el botón **«Ficha»** de cualquiera de tus tarjetas:
- Se abrirá la **Ficha Contractual**.
- Observa cómo muestra la referencia informativa de la central de riesgos (30/09/2026).
- Puedes editar o confirmar la línea de crédito y las fechas de corte/pago.
- Si no hay tasas registradas, notarás la advertencia de transparencia: *"Estimación incompleta: faltan datos contractuales"*.
- Haz clic en **«Cancelar»** o **«Guardar Ficha»**.

---

### Paso 4: Probar el Simulador de Cuotas Puro y la Distinción de Tasas
1. En el encabezado superior, haz clic en **«Simulador de Cuotas»**.
2. Se abrirá la ventana interactiva del simulador.
3. Observa las tasas contractuales al pie:
   - Si la tarjeta seleccionada no tiene TEA confirmada en su contrato, el campo de TEA inicia **vacío**, con la etiqueta **«Hipotética»** en ámbar y el texto referencial *(sin precargar 45.0 de forma oculta)*.
   - Si cambias a una tarjeta con tasa contractual, verás el distintivo **«Confirmada»** en verde.
4. Prueba una compra en promoción sin intereses:
   - Selecciona **Ripley** o **BBVA**.
   - Ingresa un importe, por ejemplo: `1000`.
   - Selecciona `3 cuotas`.
   - Mantén activa la opción **«0% Interés (Promo)»**.
   - Revisa la tabla inferior: verás cómo divide exactamente el capital en 3 cuotas (S/ 333.34, S/ 333.33, S/ 333.33) con **S/ 0.00 de interés**, y la primera cuota vence en el mes correspondiente según la fecha de compra.
5. Prueba financiamiento con intereses:
   - Cambia a la opción **«Con Intereses (TEA)»**.
   - Coloca una TEA hipotética (ej. `45%`) y seguro de desgravamen (`0.39%`).
   - Observa cómo calcula automáticamente las cuotas niveladas (método francés), los intereses totales y el costo total final.
   - Observa el mensaje de seguridad al pie: *"Los datos de esta simulación no se graban"*.
6. Cierra el simulador haciendo clic en **«Cerrar Simulador»** o en la **X**.

---

### Paso 5: Probar la Conciliación Bancaria y Trazabilidad Documental
1. En el panel de **BBVA Bfree** o **Interbank Amex**, en el bloque de la tarjeta, haz clic en el botón azul **«Conciliar Banco»**.
2. Se abrirá el modal de **Conciliación de Estado de Cuenta**:
   - Observa que el campo **«Saldo Total Facturado»** inicia **vacío**, mostrando `—` en la tarjeta comparativa para obligar a ingresar el dato real del banco.
   - Observa que el campo **«Pago Mínimo del Mes»** también inicia **vacío y opcional** *(eliminando el valor arbitrario de 30.00)*.
   - El botón **«Guardar Conciliación»** permanece deshabilitado hasta que ingreses un saldo válido.
3. Observa el nuevo bloque de **Trazabilidad y Origen de Información**:
   - **Declaración Manual:** Si ingresas el saldo revisado en tu app móvil o banca web sin archivo adjunto, se registra como `Declarado por Usuario` (evita mostrar falsamente que está contrastado con un documento).
   - **Estado de Cuenta:** Si cuentas con el PDF o documento bancario oficial, puedes ingresar su referencia o nombre de archivo real (ej. `EECC_BBVA_Oct2026.pdf`) para asignarle el estado `Doc. Verificado`.
   - **Diferencia en Disputa:** Si detectas un cobro no reconocido o en reclamo ante el banco, se asigna el estado `En Disputa`.
4. Prueba la protección de saldo S/ 0.00:
   - Escribe `0` en el saldo facturado.
   - Observa cómo aparece inmediatamente un aviso de advertencia con una **casilla obligatoria**: *"Confirmo conscientemente que revisé el estado de cuenta oficial del banco y el saldo a pagar para este ciclo es exactamente S/ 0.00"*.
   - El botón de guardado permanece bloqueado hasta marcar dicha casilla.

---

### Paso 6: Probar Pagos Parciales, Totales y Control de Excedente
1. En una tarjeta con saldo pendiente (o abre el modal con **«Regularizar»**):
2. **Prueba de Pago Parcial (ej. ingresar S/ 100 ante deuda de S/ 455.60):**
   - Observa el desglose interactivo previo a la confirmación:
     * *Deuda pendiente antes del pago:* `S/ 455.60`
     * *Monto que se abonará:* `- S/ 100.00`
     * *Saldo pendiente resultante:* `S/ 355.60`
   - El distintivo superior muestra en ámbar: **«Pago Parcial (Pendiente: S/ 355.60)»**.
   - El botón indica: **«Registrar Pago Parcial de S/ 100.00»**.
   - **Garantía:** No se anuncia erróneamente que la tarjeta quedó cancelada; la deuda restante permanece viva en el sistema.
3. **Prueba de Pago Total (ej. ingresar S/ 455.60):**
   - El desglose muestra saldo resultante `S/ 0.00 (Cancelado)` con distintivo verde **«Pago Total (Deuda Saldada 100%)»**.
   - El botón indica: **«Registrar Pago Total de S/ 455.60 y Cancelar»**.
4. **Prueba de Pago con Excedente (ej. ingresar S/ 500.00):**
   - Detecta automáticamente el excedente de `S/ 44.40` a favor.
   - Bloquea el botón hasta que marques la casilla obligatoria: *"Confirmo conscientemente que este pago genera un saldo a favor / pago adelantado"*.
5. **Opción B (Cancelar Directa sin Egreso):**
   - No inventa transacciones de pago bancario en tus cuentas; marca la tarjeta como cancelada por regularización externa exigiendo confirmación consciente si existía deuda pendiente.

> [!NOTE]
> **Importante para la revisión local:** Puedes interactuar libremente con los modales, verificar los cálculos y el comportamiento dinámico sin pulsar el botón final de guardado, garantizando que tu base de datos de producción se mantenga 100% limpia. Todos los flujos de persistencia y no-regresión están respaldados por las 224 pruebas automatizadas con datos sintéticos.

---

## 📱 PARTE 2: Pruebas en tu iPhone (Safari Mobile)

### Paso 1: Abrir la aplicación en Safari
1. Con tu PC y iPhone en la misma red Wi-Fi, inicia `npm run dev -- --host`.
2. En Safari de tu iPhone, ingresa a la IP local de tu PC (ej. `http://192.168.1.XX:5173`).
3. También puedes agregarla a tu pantalla de inicio mediante el botón **Compartir > Agregar a pantalla de inicio**.

### Paso 2: Validación Visual y Táctil
1. **Dock de Navegación Inferior:**
   - Toca el ícono **«Tarjetas»** en el dock fijo inferior.
   - Verifica que el contenido respete el margen seguro inferior (*safe area inset*) del iPhone sin tapar los botones.
2. **Selector de Tarjeta para Celular:**
   - En la parte superior de las tarjetas verás un menú de botones táctiles: `[Interbank Amex]`, `[BBVA Bfree]`, `[Ripley]`.
   - Toca cada botón para alternar rápidamente entre tarjetas con una sola mano.
3. **Consumos Acumulados:**
   - Toca en **«Ver consumos acumulados»** para desplegar la lista de compras del ciclo con scroll suave sin desbordamiento horizontal.
4. **Modal Táctil de Simulación:**
   - Toca **«Simulador de Cuotas»**.
   - Selecciona `3m`, `6m` o `12m` con los botones de cuotas táctiles.
   - Comprueba que la ventana no se desborde ni tape los botones de cierre.

---

## ✅ Lista de Comprobación Final

| Control | ¿Aprobado? |
| :--- | :---: |
| ¿El simulador calcula correctamente 3 cuotas sin intereses? | [ ] |
| ¿La conciliación detecta discrepancias contra el saldo del banco? | [ ] |
| ¿La ficha contractual muestra las fechas de corte y límites de tus 3 tarjetas? | [ ] |
| ¿En iPhone se navega cómodamente entre tarjetas con botones táctiles? | [ ] |
| ¿No hay errores en la consola del navegador? | [ ] |

Una vez que completes estas pruebas satisfactoriamente, puedes dar tu **autorización explícita** para proceder con el merge a `main` y el despliegue a producción en Vercel.
