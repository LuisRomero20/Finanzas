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

### Paso 4: Probar el Simulador de Cuotas Puro
1. En el encabezado superior, haz clic en **«Simulador de Cuotas»**.
2. Se abrirá la ventana interactiva del simulador.
3. Prueba una compra en promoción sin intereses:
   - Selecciona **Ripley** o **BBVA**.
   - Ingresa un importe, por ejemplo: `1000`.
   - Selecciona `3 cuotas`.
   - Mantén activa la opción **«0% Interés (Promo)»**.
   - Revisa la tabla inferior: verás cómo divide exactamente el capital en 3 cuotas (S/ 333.34, S/ 333.33, S/ 333.33) con **S/ 0.00 de interés**, y la primera cuota vence en el mes correspondiente según la fecha de compra.
4. Prueba financiamiento con intereses:
   - Cambia a la opción **«Con Intereses (TEA)»**.
   - Coloca una TEA (ej. `45%`) y seguro de desgravamen (`0.39%`).
   - Observa cómo calcula automáticamente las cuotas niveladas (método francés), los intereses totales y el costo total final.
   - Observa el mensaje de seguridad al pie: *"Los datos de esta simulación no se graban"*.
5. Cierra el simulador haciendo clic en **«Cerrar Simulador»** o en la **X**.

---

### Paso 5: Probar la Conciliación de Estado de Cuenta Bancario
1. En el panel de **BBVA Bfree** o **Interbank Amex**, en el bloque de la tarjeta, haz clic en el botón azul **«Conciliar Banco»**.
2. Se abrirá el modal de **Conciliación de Estado de Cuenta**:
   - Muestra el total calculado por FINPER según tus consumos registrados en ese ciclo.
   - En el campo **«Saldo Total Facturado del Mes (S/)»**, ingresa el saldo que figura en tu estado de cuenta real (o haz una prueba ingresando un monto S/ 20 superior).
   - Observa el diagnóstico en tiempo real:
     * Si coincide: marca **«✅ Conciliado exacto»**.
     * Si el banco registra más: te avisa que puede haber comisiones, membresía o consumos pendientes de registrar.
3. Haz clic en **«Guardar Conciliación»**:
   - Observa cómo la tarjeta ahora muestra la barra verde de **Deuda Regularizada / Confirmada**.
   - Si deseas volver al cálculo automático por consumos, simplemente haz clic en **«Restablecer»**.

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
