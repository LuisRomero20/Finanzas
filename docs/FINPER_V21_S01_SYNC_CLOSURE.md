# FINPER 2.1 · Sprint 01 — Cierre de sincronización de conciliaciones

**Rama:** `feature/finper-v21-smart-cards-sprint01` · **Base de la corrección:** `19109de`

## 1. Hallazgo de la auditoría

`syncStatementsToCloud()` ejecutaba `syncPersonalSettings()` dentro de un `try/catch` vacío y se invocaba con `void`.
Además `sync()` convertía los errores en un estado de interfaz y **no devolvía nada**. Consecuencia: guardar una
conciliación nunca informaba si había llegado a la nube, había fallado o había quedado en conflicto.

## 2. Fuente autoritativa (verificada en código, sin asumir tablas)

| Elemento | Papel real |
| :--- | :--- |
| `public.transacciones` (`config-sync-statements` + fragmentos `config-sync-statements-<rev>-<n>`) | **Ruta autoritativa** de lectura y escritura (`readSnapshot` / `writeSnapshot`, con control optimista por `previousHead`). |
| `public.personal_settings` | **Espejo opcional**: se escribe en `writeSnapshot` y solo se lee como rescate. FINPER funciona si no existe (`table_not_migrated`). |

No se creó ninguna fuente nueva ni se asume que `personal_settings` exista. Se reutiliza `personalSettingsSync` + `settingsSnapshot`.

## 3. Resultado estructurado

`syncSettingsWithOutcome(name)` / `syncStatementsWithOutcome()` devuelven `SyncOutcome`:

| Estado | Significado | Cuándo |
| :--- | :--- | :--- |
| `remote_confirmed` | La nube contiene exactamente esta versión | Escritura OK **y** relectura de `transacciones` idéntica (canónica); o la descarga/igualdad fue verificada |
| `local_pending` | Guardada solo en el dispositivo | Sin red, o los datos cambiaron durante la sincronización (se reintenta hasta 2 veces) |
| `sync_failed` | Error recuperable | Sesión expirada, RLS, escritura no verificada (`integrity`), otros |
| `conflict` | Versiones distintas | Local, nube y línea base divergen, o el `head` cambió entre lectura y escritura (`concurrency`) |

Reglas: una excepción nunca se silencia; la ausencia de excepción **no** es confirmación (la relectura verificada lo es);
ante `conflict` no se escribe nada y se prepara el reporte de diferencias existente (`generateDiffReport`).

## 4. Persistencia recuperable

* El guardado local **relee** `localStorage` y compara; si falla, `localSaved: false` y no se anuncia éxito ni se sincroniza.
* Clave estable por tarjeta y ciclo (`cycleKey`), id estable `stmt-<cycleKey>`: reintentar reemplaza, nunca duplica.
* Marcador persistente `finper_verified_card_statements_pending_v1`: tras recargar la app el estado sigue `local_pending`
  hasta que una sincronización lo confirme.
* La versión remota nunca se sustituye si otro dispositivo la modificó (`previousHead` + `decideSync`).
* El servicio registra su transporte en el store (`registerStatementSyncTransport`), sin importaciones circulares ocultas.

## 5. Interfaz

`StatementSyncBadge` (modal «Conciliar Banco» y barra de deuda regularizada del Cronograma) muestra:
*Guardada en este dispositivo · Sincronizando… · Confirmada en Supabase · Versiones distintas · Error recuperable*, con **Reintentar**.
Aparece bajo el rótulo «Guardado en la nube (no es verificación bancaria)». `statement_verified` / `user_declared` / `disputed`
siguen representando la verificación bancaria y **no** se mezclan con `remote_confirmed`.

## 6. Qué es simulado y qué requiere dispositivos reales

| Evidencia | Tipo |
| :--- | :--- |
| `statementSyncV21.test.ts` (16 pruebas) | **Simulada**: Supabase = doble en memoria con control optimista; cada dispositivo = módulos independientes + `localStorage` propio. Cero llamadas a producción. |
| Mutación de control | Verificado: desactivar la relectura verificada hace fallar la prueba 4b. |
| Sincronización PC ↔ iPhone reales | **Pendiente de ejecución manual** en un proyecto Supabase de pruebas aislado (ver `FINPER_V21_S01_COMO_PROBAR.md`, Parte 3). No se ha ejecutado contra dispositivos reales. |
| Confirmación bancaria real | Fuera de alcance: `remote_confirmed` solo prueba persistencia informática. |
