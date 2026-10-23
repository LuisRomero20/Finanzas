# FINPER 2.0.4 — Tutorial Paso a Paso para Probar y Revisar la Versión

> **REGLA PERMANENTE DE FINPER:** Este tutorial es de entrega obligatoria al finalizar cada sprint para permitir al usuario validar todos los cambios en su PC Windows e iPhone antes de autorizar cualquier fusión a `main`.

---

## 1. Resumen de las Correcciones del Cierre de Aceptación

En esta entrega de **FINPER 2.0.4**:
1. **Probabilidad de Sueldo sin Selección Implícita:** Se eliminó cualquier valor predeterminado (`use_local`). Si los escenarios de probabilidad de sueldo difieren entre PC y Nube, el sistema exige una decisión explícita (botón "Probabilidades PC" o "Probabilidades Nube") y bloquea la conciliación hasta resolverla.
2. **Simulación de Impacto: Flujo Mensual Real vs Inventario de Partidas:**
   - **Flujo de caja mensual proyectado:** Evalúa el motor financiero con reglas de recurrencia (`fijo`, `temporal`, `unico`), meses de vigencia (`mesInicio`), excepciones del mes activo (`suprimido`, `montoModificado`) y porcentajes de certeza de sueldo.
   - **Total bruto de catálogo:** Se presenta claramente como inventario de partidas en base de datos para auditoría, diferenciado de la liquidez mensual.
3. **Persistencia Segura (Commit Posterior a la Confirmación Remota):**
   - El resultado conciliado se mantiene como borrador en memoria y se envía primero a Supabase con control de concurrencia optimista contra `remote.head`.
   - El estado local en Zustand / LocalStorage **NO se altera** hasta recibir la confirmación exitosa de Supabase.
   - Si la llamada remota falla (por corte de red o colisión), el estado local permanece 100% idéntico a su versión previa sin corrupción.
4. **Erradicación de Errores HTTP 406:** Se reemplazó el 100% de consultas `.single()` por `fetchOptionalConfigRow` con `.maybeSingle()`. Cero errores 406 en DevTools.
5. **Preservación Estricta de Identificadores:** Partidas con el mismo concepto y mes pero distinto ID se conservan íntegramente sin deduplicación errónea.
6. **Tus 2,246 registros históricos y tus 4 movimientos pendientes (`GYM`, `iCloud`, `Fútbol`, `Salida`) continúan 100% intactos.**

---

## 2. Paso 1: Abrir la Rama en tu PC Windows

Abre PowerShell en la carpeta del proyecto y verifica el commit:
```powershell
cd "c:\Users\Luis Romero\Documents\Proyectos\FinanzasPersonales"
git status
git branch --show-current
git log -1 --oneline
```
*Debe indicar:* rama `feature/finper-v204-consolidation`.

---

## 3. Paso 2: Ejecutar Pruebas Automatizadas y Compilación Local

Antes de abrir el navegador, valida que la calidad de código y las 192 pruebas pasen limpiamente en tu máquina:
```powershell
npm run lint
npx tsc --noEmit
npm test
npm run build
```
*Resultados esperados:*
- `lint`: 0 errores.
- `tsc`: 0 errores.
- `test`: **35 suites aprobadas, 192 tests aprobados (100% éxito)**.
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

## 6. Paso 5: Procedimiento de Revisión de la Conciliación Asistida (Modo Seguro)

En el panel superior de **Sincronización Segura PC / iPhone**:
1. Haz clic en **Revisar sincronización multidispositivo** para desplegar el panel.
2. En la tarjeta **Proyecciones & Ingresos Fijos** observarás:
   - PC: 19 partidas | Supabase: 30 partidas.
   - Botón: 👉 **"🔍 Conciliación Asistida Requerida (5 modificadas)"**.
3. Haz clic en el botón para abrir el modal interactivo **Comparación Detallada y Conciliación Asistida**.

### Verificaciones Clave dentro del Modal:

#### A. Respaldo Descargable Previo
- Haz clic en **"Descargar Respaldo JSON"**: se descargará inmediatamente un archivo con ambas versiones completas y el reporte de diferencias para tu custodia.

#### B. Simulación de Flujo Mensual Real vs Inventario de Partidas
- Observa la cabecera del modal:
  * **Flujo Ingresos (Mes Activo):** Suma únicamente las partidas de ingreso vigentes en el mes.
  * **Obligaciones (Mes Activo):** Suma únicamente las obligaciones vigentes (excluye partidas temporales vencidas o únicas de otros meses).
  * **Liquidez Neta Mensual:** Ingresos menos Obligaciones del mes activo y variación neta respecto a la PC.
  * **Catálogo total bruto:** Nota explicativa inferior indicando que el total de catálogo es la suma de base de datos y no el flujo de un mes.

#### C. Exigencia Estricta en Escenarios de Probabilidad de Sueldo
- En la pestaña **Modificados**, busca la fila **"Escenarios de Probabilidad de Sueldo"**.
- Observarás que ahora tiene dos botones dedicados:
  * **"Probabilidades PC"**
  * **"Probabilidades Nube"**
- Mientras no pulses uno de ellos, la fila permanecerá resaltada con aviso de decisión pendiente y el botón final de guardado estará bloqueado con:  
  `⚠️ Faltan X partida(s) por conciliar`.

#### D. Prueba de Simulación en Partidas Modificadas (BBVA, Interbank, Ripley, Sueldo)
- Pulsa alternadamente entre **PC**, **Nube** o **Editar** en una de las tarjetas:
  * Observa cómo las tarjetas superiores de flujo mensual recalculan instantáneamente la liquidez neta.
- **Cierre Seguro sin Guardar:** Cierra el modal con la **"X"** superior derecha sin pulsar el botón verde de confirmación. Tu base de datos y tu estado local permanecerán 100% inalterados.

---

## 7. Paso 6: Cómo Revisar la Aplicación en tu iPhone

Para inspeccionar la aplicación desde tu iPhone sin riesgo:
1. Con tu iPhone en la **misma red Wi-Fi** que la PC, abre Safari e ingresa la dirección IP local de tu PC que muestra Vite (ej. `http://192.168.1.XX:5173`).
2. Verifica:
   - Carga limpia de la interfaz móvil en Safari.
   - Navegación táctil en el dock inferior (General, Registrar, Proyección, Tarjetas, Deudas, Categorías, Métricas).
   - Bloqueo y desbloqueo de pantalla: la sesión no se cierra y no hay pantallas blancas.
   - En el panel de sincronización del iPhone, el comparador de diferencias y conciliación asistida es 100% responsivo y táctil.

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
- [ ] **2. Conciliación asistida operativa:** El modal exige decidir `PC` o `Nube` para las probabilidades de sueldo y montos de tarjetas.
- [ ] **3. Simulador financiero reactivo y desglosado:** Distingue el flujo de caja mensual activo del inventario bruto del catálogo.
- [ ] **4. Persistencia segura verificada:** Orden transaccional verificado por pruebas unitarias (commit posterior a confirmación remota).
- [ ] **5. Respaldo descargable verificado:** El botón descarga el archivo JSON con ambas versiones.
- [ ] **6. Suite de pruebas aprobada:** 35 suites y 192 tests pasando al 100%.
- [ ] **7. Cero impacto en datos reales:** Los 2,246 registros históricos y tus 4 movimientos pendientes siguen intactos.

---

## 10. Cómo Autorizar el Merge

Cuando hayas concluido tu revisión en PC y/o iPhone y estés conforme con el resultado, escribe en el chat:

> **"Aprobado FINPER 2.0.4, proceder con el merge a main y despliegue a producción"**

*(Recordatorio: Ningún cambio se incorporará a la rama `main` ni se publicará en Vercel sin tu orden explícita).*
