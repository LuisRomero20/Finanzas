# FINPER 2.0.4 — Tutorial Paso a Paso para Probar y Revisar la Versión

> **REGLA PERMANENTE DE FINPER:** Este tutorial es de entrega obligatoria al finalizar cada sprint para permitir al usuario validar todos los cambios en su PC Windows e iPhone antes de autorizar cualquier fusión a `main`.

---

## 1. Resumen de las Correcciones en Esta Entrega

En esta revisión pre-merge de **FINPER 2.0.4**:
1. **Erradicación de Errores HTTP 406:** Se reemplazó el 100% de consultas `.single()` por `fetchOptionalConfigRow` con `.maybeSingle()`. Ya no verás códigos 406 en DevTools al consultar tarjetas o líneas de crédito ausentes.
2. **Comparador Detallado de Conflictos (Diff por Registro):** Ahora puedes examinar exactamente qué registros son exclusivos de tu PC, cuáles están en la nube y qué campos difieren antes de decidir qué hacer.
3. **Fusión Inteligente (Smart Merge):** Puedes combinar de forma segura las 19 partidas locales con las 11 rescatadas de la nube (o las 770 clasificaciones locales con las 29 de la nube) sin duplicaciones.
4. **Respaldo Descargable Previo:** Puedes descargar ambas versiones completas en un archivo JSON antes de cualquier resolución.
5. **Protección del Entorno de Desarrollo:** Se añadió el banner visible `DevGuardrailBanner` advirtiendo que localhost está conectado a la base de datos real de Supabase (`njgzhjwfcxdxiibkuuqg`) para **no crear movimientos ficticios de prueba en producción**.
6. **Tus 2,246 registros históricos y tus 4 movimientos pendientes (`GYM`, `iCloud`, `Fútbol`, `Salida`) continúan 100% intactos.**

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

Antes de abrir el navegador, valida que la calidad de código y las 181 pruebas pasen limpiamente en tu máquina:
```powershell
npm run lint
npx tsc --noEmit
npm test
npm run build
```
*Resultados esperados:*
- `lint`: 0 errores.
- `tsc`: 0 errores.
- `test`: **34 suites aprobadas, 181 tests aprobados (100% éxito)**.
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
   Verás que ahora devuelven código **200 OK** (con valor `null` si no existe la configuración), erradicando las excepciones de la consola.

---

## 6. Paso 5: Examinar los Conflictos Registro por Registro (Modo Solo-Lectura)

En el panel superior de **Sincronización Segura PC / iPhone**:
1. Haz clic en **Revisar sincronización multidispositivo** para desplegar el panel.
2. Observarás las tarjetas de:
   - **Proyecciones & Ingresos Fijos:** Indica la discrepancia (ej. 19 partidas en PC vs 30 en la nube).
   - **Clasificación de movimientos:** Indica la discrepancia (ej. 770 registros en PC vs 799 en la nube).
   - **Deudas regularizadas de tarjetas:** 3 registros vs 3 registros.
3. Haz clic en el botón amarillo:  
   👉 **"🔍 Comparar diferencias por registro"**.
4. Se abrirá la nueva ventana modal **Comparación Detallada**:
   - **Pestaña "Diferencias":** Te muestra solo los registros que difieren.
   - **Pestaña "Solo en Nube":** Verás las 11 partidas de proyecciones que están en la nube pero no en esta PC, con su concepto, categoría y monto.
   - **Pestaña "Solo en PC":** Verás las partidas exclusivas de este equipo.
   - **Pestaña "Modificados":** Te muestra en qué campo exacto difieren (ej. Monto: S/ 500 en PC vs S/ 600 en Nube).
5. **Prueba de Respaldo Previo:**  
   Haz clic en **"Descargar Respaldo JSON"**: se descargará inmediatamente un archivo con ambas versiones completas y el reporte de diferencias para tu custodia.
6. **Opciones de Resolución Disponibles:**
   - **"✨ Fusión Inteligente" (Recomendada):** Combina todas las partidas sin duplicar obligaciones ni sueldos.
   - **"Conservar PC":** Sube la versión de tu PC a la nube.
   - **"Usar Nube":** Descarga la versión de la nube a tu PC.
   *(Nota: Puedes cerrar el modal con la "X" en cualquier momento sin aplicar ningún cambio).*

---

## 7. Paso 6: Cómo Revisar la Aplicación en tu iPhone

Para inspeccionar la aplicación desde tu iPhone sin riesgo:
1. Con tu iPhone en la **misma red Wi-Fi** que la PC, abre Safari e ingresa la dirección IP que muestra Vite (ej. `http://192.168.1.XX:5173`).
2. Verifica:
   - Carga limpia de la interfaz móvil.
   - Navegación táctil en el dock inferior (General, Registrar, Proyección, Tarjetas, Deudas, Categorías, Métricas).
   - Bloqueo y desbloqueo de pantalla: la sesión no se cierra y no hay pantallas blancas.
   - En el panel de sincronización del iPhone, el comparador de diferencias también es 100% responsivo y táctil.

---

## 8. Paso 7: Comprobar los Archivos Modificados

En tu terminal ejecuta:
```powershell
git status
git log -2 --stat
```
Verás que todos los cambios están contenidos exclusivamente en la rama `feature/finper-v204-consolidation`.

---

## 9. Condiciones de Aprobación para Autorizar el Merge

Marca mentalmente las 6 condiciones antes de dar tu aprobación:

- [ ] **1. Errores 406 eliminados:** Filtrando por 406 en DevTools no aparece ninguna solicitud.
- [ ] **2. Comparación detallada operativa:** El modal permite ver qué registros difieren ítem por ítem.
- [ ] **3. Respaldo descargable verificado:** El botón descarga el JSON con la comparativa.
- [ ] **4. Banner de desarrollo visible:** Aparece la advertencia protegiendo la base de datos de producción.
- [ ] **5. Suite de pruebas aprobada:** 34 suites y 181 tests pasando al 100%.
- [ ] **6. Cero impacto en datos reales:** Los 2,246 registros históricos y tus 4 movimientos pendientes siguen intactos.

---

## 10. Cómo Autorizar el Merge

Cuando hayas concluido tu revisión en PC y/o iPhone y estés conforme con el resultado, escribe en el chat:

> **"Aprobado FINPER 2.0.4, proceder con el merge a main y despliegue a producción"**

*(Recordatorio: Ningún cambio se incorporará a la rama `main` ni se publicará en Vercel sin tu orden explícita).*
