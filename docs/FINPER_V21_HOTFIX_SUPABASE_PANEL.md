# FINPER 2.1 — Hotfix de configuración Supabase y panel de sincronización

Fecha de validación local: 23 de octubre de 2026.

## Alcance y límites de seguridad

- Proyecto Supabase autorizado: `njgzhjwfcxdxiibkuuqg`.
- Rama: `feature/finper-v21-smart-cards-sprint01`.
- No se modificaron tablas, RLS, movimientos, saldos, IndexedDB ni colas locales.
- No se ejecutaron pruebas de escritura con información financiera real.
- No se desplegó, no se fusionó a `main` y no se envió el commit al remoto.

## Diagnóstico

### 1. Falso positivo con claves `sb_publishable_...`

Las claves publicables modernas de Supabase son opacas: no son JWT y no incluyen un `ref` decodificable. El código anterior interpretaba la ausencia de ese dato como si la clave perteneciera a otro proyecto y luego sustituía silenciosamente la configuración por una clave anon incrustada.

El hotfix ahora:

- distingue clave publicable moderna, JWT `anon` heredado, clave secreta/`service_role`, formato desconocido y credencial ausente;
- comprueba localmente que la URL sea exactamente la del proyecto autorizado;
- deja las claves modernas como **no verificadas**, no como incompatibles;
- verifica la clave con un `GET /auth/v1/settings` de solo lectura contra el API gateway del proyecto autorizado;
- solo habilita escrituras después de una respuesta satisfactoria del gateway;
- diferencia configuración ausente, verificación temporalmente no disponible, rechazo confirmado e incompatibilidad de URL/JWT;
- elimina la clave anon incorporada en el cliente, la función de login y los scripts auxiliares;
- conserva Supabase Auth y no registra claves, JWT ni tokens.

Una falta de red mantiene el estado **pendiente de verificación** y las escrituras bloqueadas. Un `401` o `403` del gateway para esa clave se muestra como rechazo confirmado.

### 2. Panel imposible de contraer

La expresión `expanded || needsAttention` obligaba a renderizar el detalle siempre que existiera una alerta. El estado de atención ahora solo controla indicadores y colores; la visibilidad depende exclusivamente de la elección del usuario.

La barra contraída conserva:

- estado general de la conexión;
- cantidad de módulos con problemas;
- cantidad de operaciones pendientes;
- diagnóstico compacto si la configuración no está verificada;
- control accesible para expandir.

La preferencia se conserva en `sessionStorage` durante la sesión de la pestaña. La acción **Limpiar caché PWA** se retiró del panel para evitar asociar incorrectamente este diagnóstico con un problema de caché.

## Protección de sincronización

Antes de vaciar las colas o sincronizar almacenes, FINPER ejecuta únicamente la comprobación de configuración de solo lectura. Si no queda confirmada:

- no vacía outboxes;
- no inicia la sincronización global;
- no sincroniza ajustes personales;
- deshabilita reintentos y resoluciones remotas en el panel;
- conserva todos los datos y operaciones locales.

## Archivos del hotfix

- `src/lib/supabase.ts`
- `src/components/SettingsSyncPanel.tsx`
- `src/utils/liveUpdateService.ts`
- `src/services/personalSettingsSync.ts`
- `api/login.ts`
- `scripts/supabaseScriptClient.ts`
- cinco scripts de importación/exportación que antes incorporaban una clave
- `src/domain/__tests__/supabaseConfigV203.test.ts`
- `src/components/__tests__/SettingsSyncPanel.test.tsx`
- ajustes de infraestructura de pruebas en `src/utils/__tests__/`

No se modificó lógica de cálculo contable, saldos, ciclos, intereses ni movimientos.

## Resultado técnico local

| Control | Resultado |
| --- | --- |
| `npm run lint` | Aprobado: 0 errores; 11 advertencias preexistentes fuera del hotfix |
| `npx tsc --noEmit` | Aprobado |
| `npm test` | Aprobado: 38 archivos, 258 pruebas |
| `npm run build` | Aprobado: 2,487 módulos transformados |
| Escritura real en Supabase | No ejecutada por diseño |
| Despliegue Vercel/Netlify | No ejecutado |

El build conserva dos avisos no bloqueantes ya existentes: datos de compatibilidad de navegadores desactualizados y una importación simultáneamente estática/dinámica de `personalSettingsSync.ts`.

## Tutorial Windows 11 + Edge

1. Confirma que estás en la rama de desarrollo y no en `main`:

   ```powershell
   git branch --show-current
   ```

2. En `.env.local`, configura únicamente variables públicas. No uses `service_role` ni `sb_secret_...`:

   ```text
   VITE_SUPABASE_URL=https://njgzhjwfcxdxiibkuuqg.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=<clave publicable del proyecto autorizado>
   ```

   Si el proyecto aún usa la clave `anon` JWT heredada, puede mantenerse temporalmente como `VITE_SUPABASE_ANON_KEY`. No configures ambas para intentar ocultar un error: si existe `VITE_SUPABASE_PUBLISHABLE_KEY`, esa es la que FINPER valida.

3. Inicia Vite en la red local:

   ```powershell
   npm run dev -- --host 0.0.0.0
   ```

4. Abre en Edge `http://localhost:5173` e inicia sesión normalmente si la sesión no está activa.

5. Verifica la barra **Sincronización PC / iPhone**:

   - resultado esperado con red y credencial correctas: **Conexión configurada correctamente**;
   - si no hay red: **Conexión pendiente de verificación**; no debe afirmar que la clave pertenece a otro proyecto;
   - si falta una variable: **Configuración ausente**;
   - si el gateway rechaza la clave o la URL es incompatible: **Configuración bloqueada**.

6. Opcionalmente, abre las herramientas de desarrollador (`F12`) y filtra la pestaña Red por `settings`. Debe existir un `GET` a `/auth/v1/settings`. No debe existir una escritura de prueba.

7. Pulsa **Expandir panel de sincronización**. Confirma que aparecen los detalles. Pulsa **Colapsar panel de sincronización** incluso si hay una alerta y confirma que vuelve la barra compacta.

8. No pulses **Sincronizar Todo**, **Reintentar sincronización** ni acciones de resolución durante esta comprobación. No borres datos del sitio ni almacenamiento del navegador.

## Tutorial iPhone + Safari

1. Mantén el iPhone y la PC en la misma red Wi-Fi.

2. En Windows, consulta la IPv4 de la PC:

   ```powershell
   ipconfig
   ```

3. Con Vite activo mediante `--host 0.0.0.0`, abre en Safari la dirección local, por ejemplo `http://192.168.18.8:5173`. Si la IP cambió, usa la nueva.

4. Localiza la barra **Sincronización PC / iPhone**. Verifica el mismo estado observado en Edge. Una credencial moderna correcta debe pasar a **Conexión configurada correctamente** después del `GET` de verificación.

5. Con una alerta visible, toca la flecha para abrir el panel y vuelve a tocarla para cerrarlo. La alerta compacta, el número de módulos con problemas y las operaciones pendientes deben seguir visibles.

6. Cambia de sección y regresa. Durante la misma sesión de Safari, el estado abierto/cerrado debe conservarse en esa pestaña.

7. No registres movimientos, no reintentes sincronización y no borres datos/caché durante esta revisión visual.

## Por qué apareció Netlify

Supabase y Vercel cumplen funciones diferentes: Supabase es el backend y Vercel es el hosting previsto. Netlify apareció porque el repositorio GitHub también está vinculado a un sitio Netlify antiguo. La evidencia es doble:

- el repositorio conserva `netlify.toml` desde el commit inicial;
- los PR reciben comentarios de `netlify[bot]` y `vercel[bot]` para el mismo commit.

No se usó Netlify para este hotfix. Tampoco se modificó esa integración porque desconectarla cambia un servicio externo. Para impedir futuras previews duplicadas, el propietario debe desvincular el repositorio desde la configuración **Build & deploy / Repository** del sitio Netlify, o retirar el acceso de Netlify a este repositorio desde las aplicaciones instaladas de GitHub. Borrar únicamente `netlify.toml` no garantiza que el webhook deje de construir.

## Riesgos pendientes

- La persistencia multidispositivo real sigue pendiente en un proyecto Supabase de ensayo.
- En Vercel, la variable publicable moderna se observó configurada solo para Production, mientras la URL y la clave anon heredada también cubren Preview/Development. Conviene homogeneizar los tres entornos antes de validar un preview, sin revelar valores.
- La clave pública retirada continúa en el historial Git previo. Aunque es una clave pública protegida por RLS, conviene rotarla tras estabilizar las variables de entorno.
- La integración histórica de Netlify seguirá generando previews hasta que el propietario la desconecte.
- Una caída de red mantiene FINPER deliberadamente en estado no verificado; no es evidencia de una clave errónea.

## Checklist previo al merge

- [x] Clave moderna reconocida sin intentar decodificarla como JWT.
- [x] Verificación remota de solo lectura antes de permitir escrituras.
- [x] URL/JWT incompatibles bloquean escrituras.
- [x] Fallback de clave incorporada eliminado del código ejecutable.
- [x] Panel colapsable aun con `needsAttention = true`.
- [x] Diagnóstico grave visible en modo compacto.
- [x] `aria-expanded`, `aria-controls` y etiquetas accesibles.
- [x] Preferencia de expansión durante la sesión.
- [x] Lint, TypeScript, pruebas y build aprobados localmente.
- [ ] Revisión visual final en Edge.
- [ ] Revisión visual final en Safari/iPhone.
- [ ] Variables Preview/Development verificadas sin mostrar secretos.
- [ ] Prueba multidispositivo contra Supabase de ensayo.
- [ ] Integración Netlify desvinculada si el propietario lo aprueba.
- [ ] Aprobación explícita antes de push, deploy o merge a `main`.
