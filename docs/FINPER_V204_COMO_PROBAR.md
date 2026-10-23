# FINPER 2.0.4 — Tutorial Paso a Paso para Probar y Revisar la Versión

> **REGLA PERMANENTE DE FINPER:** Este tutorial es de entrega obligatoria al finalizar cada sprint para permitir al usuario validar todos los cambios en su PC Windows e iPhone antes de autorizar cualquier fusión a `main`.

---

## 1. Resumen de las Correcciones en Esta Entrega

En esta versión pre-merge de **FINPER 2.0.4**:
1. **Erradicación de Errores HTTP 406:** Se reemplazó el 100% de consultas `.single()` por `fetchOptionalConfigRow` con `.maybeSingle()`. Cero errores 406 en DevTools al consultar tarjetas o líneas de crédito ausentes.
2. **Fusión Financiera Asistida (Safe Assisted Reconciliation):** Se eliminó la sobreescritura automática de importes modificados. Toda partida con diferencias exige una decisión consciente por parte del usuario (`PC`, `Nube` o `Editar Monto`).
3. **Simulador de Impacto Financiero en Tiempo Real:** El modal muestra el cálculo en vivo de tus ingresos totales, obligaciones totales y la variación neta mensual de liquidez según las decisiones que vas tomando.
4. **Preservación Estricta de Identificadores:** Partidas con el mismo concepto y mes (ej. pagos mensuales de servicios o cuotas) pero distinto ID ya no se colapsan erróneamente.
5. **Control de Concurrencia Optimista:** Antes de guardar en Supabase, el sistema verifica que la versión en la nube no haya sido alterada por otro dispositivo mientras revisabas las partidas.
6. **Respaldo Descargable Previo:** Puedes descargar ambas versiones completas en un archivo JSON antes de cualquier resolución.
7. **Protección del Entorno de Desarrollo:** El banner `DevGuardrailBanner` advierte prominentemente en localhost que estás conectado a la base de producción real (`njgzhjwfcxdxiibkuuqg`) para **no crear movimientos ficticios de prueba en producción**.
8. **Tus 2,246 registros históricos y tus 4 movimientos pendientes (`GYM`, `iCloud`, `Fútbol`, `Salida`) continúan 100% intactos.**

---

## 2. Paso 1: Abrir la Rama en tu PC Windows

Abre PowerShell en la carpeta de tu proyecto y confirma que estás en la rama correcta:
```powershell
cd "c:\Users\Luis Romero\Documents\Proyectos\FinanzasPersonales"
git status
git branch --show-current
```
*Debe indicar:* `feature/finper-v204-consolidation`.

---

## 3. Paso 2: Ejecutar Pruebas Automatizadas y Compilación Local

Antes de abrir el navegador, valida que la calidad de código y las 187 pruebas pasen limpiamente en tu máquina:
```powershell
npm run lint
npx tsc --noEmit
npm test
npm run build
```
*Resultados esperados:*
- `lint`: 0 errores.
- `tsc`: 0 errores.
- `test`: **34 suites aprobadas, 187 tests aprobados (100% éxito)**.
- `build`: compila en ~9 segundos generando los activos en `dist/`.

---

## 4. Paso 3: Iniciar FINPER en Localhost y Verificar la Advertencia de Seguridad

Ejecuta:
```powershell
npm run dev
```
Abre **Microsoft Edge** e ingresa a [http://localhost:5173/](http://localhost:5173/).

### Verificación del Guardrail de Seguridad:
1. En la parte superior de la pantalla observarás el nuevo banner ámbar:  
   **"🛡️ MODO DESARROLLO LOCAL (localhost:5173) · BD PRODUCCIÓN EN VIVO (njgzhjwfcxdxiibkuuqg)"**.
2. **IMPORTANTE:** Al estar conectado a tu Supabase real, **NO ingreses movimientos ficticios de prueba** (como "Gasto de prueba S/ 10"). Las pruebas de escritura y borrado ya están verificadas al 100% con mocks en la suite automatizada (`npm test`).

---

## 5. Paso 4: Verificar la Ausencia de Errores HTTP 406 en DevTools

1. En Microsoft Edge, presiona `F12` para abrir las Herramientas de Desarrollador.
2. Ve a la pestaña **Network (Red)**.
3. En la caja de filtro de texto escribe: `406`.
4. Recarga la página con `F5` o `Ctrl + R`.
5. **Resultado Esperado:** **CERO solicitudes con código 406**.
6. Limpia el filtro y busca `config-credit-cards-v2` o `config-credit-lines-v2`:  
   Verás que devuelven código **200 OK** (con valor `null` si no existe la configuración), erradicando las excepciones de la consola.

---

## 6. Paso 5: Ejecutar la Conciliación Asistida de Proyecciones

En el panel superior de **Sincronización Segura PC / iPhone**:
1. Haz clic en **Revisar sincronización multidispositivo** para desplegar el panel.
2. En la tarjeta **Proyecciones & Ingresos Fijos** observarás:
   - PC: 19 partidas | Supabase: 30 partidas.
   - Botón: 👉 **"🔍 Conciliación Asistida Requerida (5 modificadas)"** *(o botón amarillo de diferencias)*.
3. Haz clic en el botón para abrir el modal interactivo **Comparación Detallada y Conciliación Asistida**.

### Qué observar dentro del Modal:
1. **Respaldo Inmediato:** Haz clic en **"Descargar Respaldo JSON"** para guardar una copia de seguridad local de ambas versiones completas.
2. **Pestaña "Modificados (5)":**
   Observarás las 5 partidas que diferían en tus capturas:
   - **Pago de Tarjeta BBVA Bfree:** PC S/ 271.84 vs Nube S/ 272.80.
   - **Pago de Tarjeta Interbank Amex:** PC S/ 36.60 vs Nube S/ 465.30.
   - **Pago Tarjeta Ripley:** PC S/ 381.88 vs Nube S/ 374.82.
   - **Sueldo:** PC S/ 2,259.63 vs Nube S/ 2,384.15.
   - **Escenarios de Probabilidad de Sueldo:** Difiere el porcentaje asignado.
3. **Decisiones Asistidas por Partida:**
   Para cada fila modificada, pulsa el botón correspondiente a tu realidad actual:
   - Pulsa **"PC (S/ ...)"** si el valor de tu computadora es el más exacto.
   - Pulsa **"Nube (S/ ...)"** si el valor de la nube es el más reciente.
   - Pulsa **"Editar"** para tipear manualmente un importe específico.
4. **Simulador de Impacto Financiero en Vivo:**
   En la cabecera del modal verás cómo se actualizan instantáneamente:
   - **Ingresos Totales Resueltos** (ej. S/ 2,384.15).
   - **Obligaciones Totales Resueltas**.
   - **Variación Neta Mensual** respecto a lo que tenías en tu PC.
5. **Pestaña "Solo en Nube (13)" / "Solo en PC (2)":**
   Verás las partidas que existen únicamente de un lado (ej. Netflix, Seguro Rímac, etc.). Estas se conservarán automáticamente sin colisión.
6. **Aplicar Conciliación Segura:**
   - Mientras quede alguna partida modificada sin decisión, el botón mostrará:  
     `⚠️ Faltan X partidas por conciliar`.
   - Una vez resueltas las 5 partidas, el botón verde se activará:  
     👉 **"Aplicar Fusión Asistida Consciente"**.
   - Al pulsarlo, se verificará la concurrencia optimista contra la nube, se guardará un respaldo previo en tu navegador y se consolidará la información.

---

## 7. Paso 6: Cómo Revisar la Aplicación en tu iPhone

Para inspeccionar la aplicación desde tu iPhone sin riesgo:
1. Con tu iPhone en la **misma red Wi-Fi** que la PC, abre Safari e ingresa la dirección IP local de tu PC que muestra Vite (ej. `http://192.168.1.XX:5173`).
2. Verifica:
   - Carga limpia de la interfaz móvil.
   - Navegación táctil en el dock inferior (General, Registrar, Proyección, Tarjetas, Deudas, Categorías, Métricas).
   - Bloqueo y desbloqueo de pantalla: la sesión no se cierra y no hay pantallas blancas.
   - En el panel de sincronización del iPhone, el comparador de diferencias también es 100% responsivo y táctil.

---

## 8. Paso 7: Comprobar el Historial de Commits

En tu terminal ejecuta:
```powershell
git status
git log -3 --stat
```
Verás que todos los cambios están contenidos exclusivamente en la rama `feature/finper-v204-consolidation`.

---

## 9. Condiciones de Aprobación para Autorizar el Merge

Marca mentalmente las 7 condiciones antes de dar tu aprobación:

- [ ] **1. Errores 406 eliminados:** Filtrando por 406 en DevTools no aparece ninguna solicitud.
- [ ] **2. Conciliación asistida operativa:** El modal te permite elegir `PC`, `Nube` o `Editar` para cada una de las 5 partidas modificadas.
- [ ] **3. Simulador financiero reactivo:** Refleja en tiempo real la variación neta de tus obligaciones e ingresos.
- [ ] **4. Respaldo descargable verificado:** El botón descarga el archivo JSON con ambas versiones.
- [ ] **5. Banner de desarrollo visible:** Aparece la advertencia protegiendo la base de datos de producción.
- [ ] **6. Suite de pruebas aprobada:** 34 suites y 187 tests pasando al 100%.
- [ ] **7. Cero impacto en datos reales:** Los 2,246 registros históricos y tus 4 movimientos pendientes siguen intactos.

---

## 10. Cómo Autorizar el Merge

Cuando hayas concluido tu revisión en PC y/o iPhone y estés conforme con el resultado, escribe en el chat:

> **"Aprobado FINPER 2.0.4, proceder con el merge a main y despliegue a producción"**

*(Recordatorio: Ningún cambio se incorporará a la rama `main` ni se publicará en Vercel sin tu orden explícita).*
