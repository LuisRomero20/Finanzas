# FINPER 2.0.4 — Tutorial Paso a Paso para Probar y Revisar la Versión

> **REGLA PERMANENTE DE FINPER:** Este tutorial es de entrega obligatoria al finalizar cada sprint para permitir al usuario validar todos los cambios en su PC Windows e iPhone antes de autorizar cualquier fusión a `main`.

---

## 1. Resumen de lo que vas a probar

En esta versión **FINPER 2.0.4**:
- **Se eliminaron los errores de hidratación y parpadeos de sesión** al abrir o recargar la aplicación.
- **Se blindó el sistema fuera de línea (Outbox):** ahora cualquier gasto o ingreso que registres sin internet se guarda de forma segura con protección contra pérdidas y reintentos automáticos.
- **Tus 2,246 registros históricos de Supabase siguen intactos.**
- **Tus 4 movimientos pendientes en la PC (`GYM`, `iCloud`, `Fútbol`, `Salida`) se mantienen a salvo en la cola local.**
- **Se prepararon los contratos de cálculo de tarjetas de crédito** para las 3 tarjetas: Ripley Mastercard, Interbank Amex Benefit y BBVA Bfree.

---

## 2. Preparación del Entorno en tu PC Windows

Para probar esta rama sin afectar la versión de producción que está en Vercel:

### Paso 2.1: Abrir la terminal en la carpeta del proyecto
Abre PowerShell o tu terminal en:
`c:\Users\Luis Romero\Documents\Proyectos\FinanzasPersonales`

### Paso 2.2: Confirmar que estás en la rama correcta
Ejecuta:
```powershell
git status
```
Debe indicar: `On branch feature/finper-v204-consolidation`.

### Paso 2.3: Iniciar el servidor local de desarrollo
Ejecuta:
```powershell
npm run dev -- --host
```
Verás un mensaje similar a este:
```text
  VITE v5.4.21  ready in 450 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.1.XX:5173/
```
*(Nota: El parámetro `--host` permite que tu iPhone conectado a la misma red Wi-Fi también pueda abrir la aplicación).*

---

## 3. Pruebas en tu PC Windows (Microsoft Edge)

Abre **Microsoft Edge** e ingresa a [http://localhost:5173/](http://localhost:5173/).

### Caso de Prueba 1: Navegación por los 7 Apartados
1. Haz clic en el menú lateral o superior para recorrer las 7 secciones:
   - **General (Dashboard):** Revisa que los balances totales y tarjetas se visualicen sin errores.
   - **Registrar Movimiento:** Verifica que el formulario cargue con las categorías y entidades habituales.
   - **Proyecciones:** Comprueba que la tabla de partidas proyectadas cargue correctamente.
   - **Tarjetas de Crédito:** Entra a la vista de tarjetas y verifica los ciclos y fechas límite.
   - **Deudas:** Comprueba que la lista de deudas personales y bancarias esté presente.
   - **Clasificación:** Revisa que el listado de reglas de comercios cargue normalmente.
   - **Dashboards:** Verifica los gráficos de barras y comparativas mensuales.
- **Resultado Esperado:** Ninguna pantalla blanca, ningún bloqueo, transición fluida entre páginas.

### Caso de Prueba 2: Resiliencia de Sesión y Recargas Rápidas
1. Con la sesión iniciada en la PC, presiona `F5` o `Ctrl + R` cinco veces consecutivas rápidamente.
2. Abre una pestaña nueva en Edge, entra a `http://localhost:5173/` y regresa a la pestaña original.
- **Resultado Esperado:** La sesión se mantiene estable. No hay cierre de sesión inesperado ni mensajes de token expirado.

### Caso de Prueba 3: Prueba de Registro Fuera de Línea (Outbox Offline)
1. En Edge, presiona `F12` para abrir las Herramientas de Desarrollador.
2. Ve a la pestaña **Network (Red)** y en el selector de velocidad (donde dice *No throttling* o *Sin limitación*), selecciona **Offline**.
3. Ve al apartado **Registrar Movimiento**.
4. Registra un gasto de prueba:
   - Concepto: `Prueba Offline Consolidación`
   - Monto: `15.00`
   - Categoría: `Otros Gastos`
   - Entidad: `Efectivo`
5. Pulsa en **Guardar**.
6. Observa la notificación: el movimiento se registra de inmediato y aparece en el listado local.
7. Vuelve a la pestaña Network de F12 y cambia de nuevo a **No throttling (Con conexión)**.
- **Resultado Esperado:** El sistema detecta el retorno a la red y envía la transacción a Supabase automáticamente en segundo plano sin duplicarla.

### Caso de Prueba 4: Verificación de las 4 Operaciones Pendientes en PC
1. En Edge, abre la consola con `F12` > pestaña **Console**.
2. Escribe el siguiente comando y pulsa Enter:
   ```javascript
   JSON.parse(localStorage.getItem('finper_transaction_outbox_v1') || '[]')
   ```
- **Resultado Esperado:** Verás tus 4 movimientos pendientes originales (`GYM`, `iCloud`, `Fútbol`, `Salida`) conservados con todos sus datos intactos.

---

## 4. Pruebas en tu iPhone (Safari / PWA)

Asegúrate de que tu iPhone esté conectado a la **misma red Wi-Fi** que tu PC.

### Paso 4.1: Conectar desde el iPhone
1. Mira la dirección de red que arrojó `npm run dev -- --host` en tu PC (ejemplo: `http://192.168.1.35:5173`).
2. Abre **Safari** en tu iPhone e introduce esa URL.

### Caso de Prueba 5: Experiencia Táctil y PWA en iOS
1. Inicia sesión con tus credenciales.
2. Navega entre los apartados usando el menú inferior táctil.
3. Bloquea la pantalla de tu iPhone durante 15 segundos y vuelve a desbloquearla.
4. Regresa a Safari o a la PWA.
- **Resultado Esperado:** La aplicación no pierde el estado, no muestra pantallas en blanco y la sesión continúa activa de inmediato gracias al deduplicador de hidratación.

---

## 5. Lista de Chequeo Final del Usuario (Sign-off)

Marca cada casilla una vez verificada en tus dispositivos:

- [ ] **PC:** Los 7 apartados abren y responden correctamente.
- [ ] **PC:** Al recargar la página (`F5`), la sesión se mantiene intacta sin parpadeos.
- [ ] **PC:** Un movimiento registrado en modo offline se guarda y no se pierde.
- [ ] **PC:** Las 4 operaciones previas (`GYM`, `iCloud`, `Fútbol`, `Salida`) están presentes.
- [ ] **iPhone:** La aplicación carga en Safari y tolera el bloqueo/desbloqueo de pantalla.
- [ ] **iPhone:** La navegación táctil entre módulos es fluida y cómoda.

---

## 6. Siguiente Paso

Una vez que completes esta revisión y estés satisfecho con el resultado:
Escribe en el chat:
> **"Aprobado FINPER 2.0.4, proceder con el merge a main y despliegue a producción"**

*(Nota: Ningún cambio se incorporará a la rama principal de producción hasta recibir tu confirmación expresa).*
