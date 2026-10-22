# FINPER 2.0.4 — Lista de Control de Lanzamiento Pre-Merge (Release Checklist)

**Versión:** FINPER 2.0.4  
**Fecha:** 22 de Octubre de 2026  
**Rama de Trabajo:** `feature/finper-v204-consolidation`  
**Rama de Destino:** `main`  
**Estado:** LISTO PARA REVISIÓN Y PRUEBAS DEL USUARIO (Merge bloqueado hasta aprobación explícita)  

---

## 1. Verificación de Seguridad y Secretos

- [x] **Sin claves privadas en el repositorio:** Archivos `.env`, `.env.local` y carpetas de credenciales excluidos por `.gitignore`.
- [x] **Sin `service_role` en frontend:** El cliente solo utiliza la clave pública anónima autorizada.
- [x] **Aislamiento de Supabase:** Se garantiza conexión exclusiva al proyecto autorizado `njgzhjwfcxdxiibkuuqg.supabase.co`. Rechazo estricto de refs obsoletos (`elsjuyjjkrkyhlylmaip`).
- [x] **Políticas RLS Activas:** Pruebas automatizadas validan que las políticas de seguridad a nivel de fila (`securityPolicies.test.ts`) aíslan y protegen la información por usuario.
- [x] **Tokens GoTrue Seguros:** La inyección de autorización se limita estrictamente a la URL de PostgREST del proyecto y no sobrescribe llamadas externas.

---

## 2. Integridad y Preservación de Datos

- [x] **2,246 Registros Históricos Intactos:** Cero sentencias destructivas (`DROP`, `TRUNCATE`, `DELETE` masivos).
- [x] **Preservación de Cola Local en PC:** Las 4 transacciones pendientes (`GYM`, `iCloud`, `Fútbol`, `Salida`) permanecen conservadas en `finper_transaction_outbox_v1`.
- [x] **Compatibilidad de Esquema:** No se fuerza la creación de `personal_settings` en producción; el sistema opera en modo dual con transacciones como fuente autorizada.
- [x] **Respaldo Pre-Sincronización:** Cada descarga o fusión genera una copia con timestamp en `localStorage` (`finper_sync_backup_*`).

---

## 3. Calidad de Código y Validación Técnica

- [x] **Linter (`npm run lint`):** 0 errores.
- [x] **Chequeo de Tipos (`npx tsc --noEmit`):** 0 errores de TypeScript en toda la base de código.
- [x] **Suite Completa de Pruebas (`npm test`):** 32 suites pasadas, 169 pruebas aprobadas (100% de éxito).
- [x] **Compilación de Producción (`npm run build`):** Vite compila limpiamente en `dist/` en 8.62 segundos.

---

## 4. Cobertura de las 7 Secciones del Sistema

- [x] **General (Dashboard):** Renderizado verificado en `pagesRender.test.tsx` sin crashes.
- [x] **Registrar Movimiento:** Formulario operativo con encolado local inmediato y persistencia en Outbox.
- [x] **Proyecciones:** Gestión de partidas, escenarios de probabilidad y amortizaciones intactas.
- [x] **Tarjetas de Crédito:** Ciclos de corte, fechas de pago y cálculo normativo de pago mínimo SBS operativo.
- [x] **Deudas:** Hoja de deudas activa con preservación de préstamos personales.
- [x] **Clasificación:** Mapeo y reclasificación de comercios verificado con ordenamiento canónico.
- [x] **Dashboards:** Métricas y agregaciones mensuales funcionando sobre datos locales.

---

## 5. Criterios de Aprobación para Merge

- [ ] **Tutorial de Revisión ejecutado por el usuario** (`docs/FINPER_V204_COMO_PROBAR.md`).
- [ ] **Pruebas satisfactorias en PC Windows (Microsoft Edge).**
- [ ] **Pruebas satisfactorias en iPhone (Safari / PWA).**
- [ ] **Autorización explícita por escrito del usuario para merge a `main` y despliegue a Vercel.**
