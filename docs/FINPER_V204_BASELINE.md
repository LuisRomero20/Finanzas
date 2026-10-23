# FINPER 2.0.4 — Línea Base, Inventario de Módulos y Estado Inicial

**Fecha:** 22 de Octubre de 2026  
**Rama:** `feature/finper-v204-consolidation`  
**Commit Inicial:** `b05c28a`  
**Proyecto Supabase Autorizado:** `njgzhjwfcxdxiibkuuqg`  
**URL de Producción:** [https://finanzas-tau-three.vercel.app/](https://finanzas-tau-three.vercel.app/)  

---

## 1. Estado del Repositorio y Entorno

- **Rama activa:** `feature/finper-v204-consolidation` (derivada limpiamente desde `main`).
- **Estado de Git:** Árbol de trabajo limpio (Clean working tree).
- **Control de Secretos:** `.gitignore` verificado (excluye `.env`, `.env.*`, `backups/`, `.vercel`). Ninguna clave de servicio (`service_role`) presente en el repositorio.
- **Configuración Supabase:**
  - `TARGET_PROJECT_REF`: `njgzhjwfcxdxiibkuuqg`.
  - Dominio PostgREST: `https://njgzhjwfcxdxiibkuuqg.supabase.co/rest/v1`.
  - Registros históricos confirmados: **2,246 registros** en `public.transacciones`.
  - Políticas RLS: Activas y forzadas para rol `anon` y usuarios autenticados.

---

## 2. Inventario de los 7 Apartados y Fuentes de Datos

| # | Apartado / Vista | Archivo Principal | Stores Involucrados | Fuente Autorizada | Persistencia Local |
| :-: | :--- | :--- | :--- | :--- | :--- |
| 1 | **General (Dashboard)** | `src/pages/Dashboard.tsx` | `useAppStore` | `public.transacciones` | `localStorage` |
| 2 | **Registrar Movimiento** | `src/pages/RegistroMovimientoPage.tsx` | `useAppStore` | `public.transacciones` | `finper_transaction_outbox_v1` |
| 3 | **Proyecciones** | `src/pages/ProyeccionPage.tsx` | `projectionStore` | `transacciones` (`config-sync-projections`) | `localStorage` (`personal_projections_v1`) |
| 4 | **Tarjetas de Crédito** | `src/pages/CronogramaPagos.tsx` | `useAppStore` | `transacciones` (`config-credit-cards-v2`) | `localStorage` (`credit_cards`) |
| 5 | **Deudas** | `src/pages/HojaDeudas.tsx` | `useAppStore` | `transacciones` (`config-deuda-*`) | `localStorage` (`demo_deudas`) |
| 6 | **Clasificación** | `src/pages/ClasificacionPage.tsx` | `useAppStore` | `transacciones` (`config-sync-classifications`) | `localStorage` |
| 7 | **Dashboards (Métricas)**| `src/pages/DashboardsPage.tsx` | `useAppStore` | `public.transacciones` | `localStorage` |

---

## 3. Estado Inicial de la Suite de Pruebas

- **Framework:** Vitest 2.1.9 con entorno `jsdom`.
- **Suites de Prueba Disponibles:** 29 suites.
- **Total de Pruebas:** 153 pruebas ejecutadas, **153 aprobadas (100%)**, 0 fallos.
- **Verificación de Tipos (`npx tsc --noEmit`):** 0 errores.
- **Linter (`npm run lint`):** 0 errores, 12 advertencias en páginas legadas documentadas.
- **Empaquetado (`npm run build`):** Exitoso en 10.02s en `dist/`.

---

## 4. Principios de No Regresión para el Sprint 2.0.4

1. **Intocabilidad de Datos:** No se ejecutarán sentencias `DROP`, `TRUNCATE`, `DELETE` masivos ni escrituras directas sobre los 2,246 registros históricos de Supabase.
2. **Preservación de Colas:** Las 4 transacciones pendientes en cola local (`GYM`, `iCloud`, `Fútbol`, `Salida`) se mantienen intactas en `finper_transaction_outbox_v1`.
3. **Aislamiento de Producción:** El desarrollo se mantendrá estrictamente en la rama `feature/finper-v204-consolidation` hasta recibir la autorización expresa del usuario.
