# FINPER 2.1 — SPRINT 02: Alertas Tempranas, Vencimientos y Proyecciones Protegidas

**Fecha:** 23 de octubre de 2026  
**Rama:** `feature/finper-v21-sprint02-alerts` (derivada de `main` en `074020a`)  
**Estado de pruebas:** 268/268 pruebas aprobadas en 40 suites (Vitest)  
**Calidad de código:** 0 errores TypeScript (`tsc --noEmit`), 0 errores ESLint (`eslint .`)  
**Compilación:** Build de producción exitoso en 9.55s  
**Integridad financiera:** Cero modificaciones sobre `transacciones`, esquemas o datos históricos de Supabase.

---

## 1. Principio Fundamental y Regla de Oro

> [!IMPORTANT]
> **El módulo «Presupuesto Fijo & Proyección» es una fuente sagrada de información.**
> 
> El nuevo motor de alertas y briefing financiero opera bajo el principio de **estricta solo lectura**:
> - **NO** borra, sobrescribe ni regenera partidas proyectadas.
> - **NO** modifica montos, conceptos, fechas, categorías ni entidades.
> - **NO** genera transacciones por el simple hecho de recordar un vencimiento.
> - **NO** marca pagos como ejecutados automáticamente sin previa confirmación en movimientos reales.
> - **NO** duplica obligaciones de tarjetas ni de servicios.
> - Todos los avisos referencian las partidas originales por su **ID único** (`referenceItemId`).

---

## 2. Auditoría del Escenario de Referencia (Noviembre 2026)

Se tomó como referencia inmutable la planificación de noviembre de 2026 proporcionada por el usuario:
- **Total partidas:** 23
- **Ingresos proyectados:** S/ 4,007.32 (Sueldo S/ 2,375.30 + CTS S/ 1,632.02)
- **Egresos proyectados:** S/ 4,228.74 (21 partidas que incluyen Teléfono Móvil, Luz, Préstamo BCP, Titulación, Kevin, Viaje Brasil, iCloud, cuotas de tarjetas, etc.)
- **Balance mensual proyectado:** -S/ 221.42 (Déficit previsto)

La suite de pruebas automatizadas [`obligationAlerts.test.ts`](file:///c:/Users/Luis%20Romero/Documents/Proyectos/FinanzasPersonales/src/domain/__tests__/obligationAlerts.test.ts) certifica que tras ejecutar la evaluación de alertas sobre este escenario, el conjunto de datos de entrada permanece **idéntico al 100%**, sin ninguna mutación de propiedades ni adición de filas.

---

## 3. Arquitectura del Motor de Alertas

El módulo reside de manera aislada en `src/domain/alerts/`:

1. **[`types.ts`](file:///c:/Users/Luis%20Romero/Documents/Proyectos/FinanzasPersonales/src/domain/alerts/types.ts):**
   - Define interfaces puras `ObligationItem`, `DailyFinancialBriefing`, `ObligationUrgency` (`due_today`, `due_soon`, `overdue`, `future`) y `LiquidityHealthStatus` (`surplus`, `tight`, `deficit`).
   - Todo recordatorio contiene `referenceItemId` y `source` ('projection' | 'credit_card').

2. **[`dateUtils.ts`](file:///c:/Users/Luis%20Romero/Documents/Proyectos/FinanzasPersonales/src/domain/alerts/dateUtils.ts):**
   - Garantiza cómputo estricto en la zona horaria oficial del Perú: `America/Lima` (UTC-5), independientemente de la zona horaria del dispositivo del usuario.
   - Detecta la franja matutina (06:00 a 11:59 a. m. Lima, cubriendo la hora objetivo de las 7:30 a. m.).

3. **[`obligationAlertsEngine.ts`](file:///c:/Users/Luis%20Romero/Documents/Proyectos/FinanzasPersonales/src/domain/alerts/obligationAlertsEngine.ts):**
   - Función pura `generateFinancialBriefing()`.
   - Cruza las partidas proyectadas contra las transacciones reales registradas en `financeStore`:
     - Si existe un movimiento real en el mes que coincida en tipo, monto (tolerancia S/ 0.05) y concepto/entidad, la obligación se marca como `executed` (`Confirmado`) y **no se alerta como pendiente ni vencida**.
     - Si no se encuentra pago registrado, permanece como `pending`.
     - Si la fecha ya pasó en el mes, se clasifica como `overdue` (Vencida sin confirmar).
     - Si vence hoy (`todayStr`), se clasifica como `due_today`.
     - Si vence en los próximos 7 días, se agrupa en `due_soon`.
   - Diagnostica liquidez: detecta el déficit de -S/ 221.42 de noviembre y emite una advertencia de disponibilidad sin alterar los números.

---

## 4. Integración Visual: `DailyFinancialBriefingWidget`

El componente [`DailyFinancialBriefingWidget.tsx`](file:///c:/Users/Luis%20Romero/Documents/Proyectos/FinanzasPersonales/src/components/DailyFinancialBriefingWidget.tsx) se integró tanto en la pantalla **General** ([`Dashboard.tsx`](file:///c:/Users/Luis%20Romero/Documents/Proyectos/FinanzasPersonales/src/pages/Dashboard.tsx)) como en **Proyecciones** ([`ProyeccionPage.tsx`](file:///c:/Users/Luis%20Romero/Documents/Proyectos/FinanzasPersonales/src/pages/ProyeccionPage.tsx)):

- **Cabecera compacta de 1 sola línea:** Muestra el total pendiente de hoy, próximos 7 días, vencidos y balance general.
- **Colapsable por diseño:** La flecha `▲` / `▼` conmuta la vista extendida según la voluntad del usuario y recuerda la preferencia en `sessionStorage`.
- **Vista extendida en 3 columnas:**
  - Vencen Hoy (con badges `Confirmado` o `Pendiente`).
  - Próximos 7 días (cronológico con fecha).
  - Vencidos sin confirmar (alerta en color coral/rose).
- **Diseño móvil (iPhone Safari):** Las tarjetas se apilan verticalmente respetando un ancho táctil cómodo y tipografía de alto contraste.
- **Cero botones peligrosos:** No existen botones de «pagar todo» ni «autocompletar», evitando cualquier creación accidental de transacciones.

---

## 5. Arquitectura para Notificaciones a las 7:30 a. m.

Para recibir el resumen a las 7:30 a. m. cuando la aplicación web no está abierta en el navegador:
1. **Opciones estándar documentadas:**
   - **Vercel Cron Jobs:** Un endpoint `/api/cron/daily-briefing` que se ejecute a las 12:30 UTC (`07:30 Lima`) configurado en `vercel.json`.
   - **GitHub Actions Scheduled Workflow:** Disparo diario a las `30 12 * * *`.
   - **Web Push API (PWA):** Notificaciones del navegador con Service Worker para usuarios suscritos.
2. **Estado actual:** **Ningún cron externo ha sido activado** para cumplir con la restricción de cero costos imprevistos y cero dependencias externas no autorizadas.

---

## 6. Resultados Técnicos

| Control | Estado | Detalle |
| :--- | :---: | :--- |
| **Pruebas unitarias e integrales** | **Aprobado** | **268 pruebas pasando en 40 suites** (Vitest v2.1.9) |
| **Pruebas específicas de Alertas** | **Aprobado** | 8 pruebas de motor + 2 pruebas de widget UI aprobadas |
| **TypeScript (`tsc --noEmit`)** | **Aprobado** | 0 errores de tipos |
| **ESLint (`eslint .`)** | **Aprobado** | 0 errores en toda la base de código |
| **Build de producción (`vite build`)** | **Aprobado** | 2,490 módulos transformados en 9.55s |
| **Mutación de base de datos** | **Aprobado** | 0 llamadas de escritura a Supabase |

---

## 7. Guía de Ejecución Local (Windows 11)

Para probar la nueva funcionalidad en tu computadora con PowerShell:

```powershell
# 1. Posicionarte en la carpeta raíz del proyecto
Set-Location "c:\Users\Luis Romero\Documents\Proyectos\FinanzasPersonales"

# 2. Confirmar que estás en la rama de alertas de Sprint 02
git status
git branch --show-current

# 3. Iniciar el servidor local de desarrollo
npm run dev
```

Abre en tu navegador Edge: `http://localhost:5173`.
1. En la página **General** verás la nueva barra superior: **«Briefing Financiero 7:30 a. m.»**.
2. Haz clic en la flecha para expandir y revisar las 3 columnas de obligaciones.
3. Ve a la pestaña **Proyecciones**: el briefing estará sincronizado con el mes seleccionado (por ejemplo, Noviembre 2026), mostrando los totales correspondientes.

---

## 8. Guía de Revisión en iPhone (Safari)

1. Con el servidor Vite iniciado mediante:
   ```powershell
   Set-Location "c:\Users\Luis Romero\Documents\Proyectos\FinanzasPersonales"
   npm run dev -- --host 0.0.0.0
   ```
2. En tu iPhone conectado a la misma red Wi-Fi, abre Safari e ingresa la IP local de tu PC (por ejemplo, `http://192.168.18.8:5173`).
3. Comprueba que:
   - El widget del briefing aparece en la parte superior sin desbordar el ancho de la pantalla.
   - Al tocar la barra o la flecha, se despliega y se contrae de forma táctil y fluida.
   - Las 23 partidas de tus proyecciones continúan exactamente en su sitio.

---

## 9. Checklist Pre-Merge

- [x] Rama aislada creada: `feature/finper-v21-sprint02-alerts`.
- [x] Proyecciones protegidas al 100%: ninguna partida borrada, alterada ni regenerada.
- [x] Motor de alertas implementado en `src/domain/alerts/`.
- [x] Cálculo exacto en zona horaria `America/Lima` (UTC-5).
- [x] Componente visual `DailyFinancialBriefingWidget` integrado en Dashboard y Proyecciones.
- [x] 268/268 pruebas unitarias e integrales aprobadas.
- [x] Compilación de producción exitosa.
- [x] Sin merge a `main` y sin despliegue a producción a la espera de autorización.
