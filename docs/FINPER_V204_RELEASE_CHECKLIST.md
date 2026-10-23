# FINPER 2.0.4 — Lista de Control de Lanzamiento Pre-Merge (Release Checklist)

**Versión:** FINPER 2.0.4 (Consolidación Técnica + Fusión Financiera Asistida)  
**Fecha:** 22 de Octubre de 2026  
**Rama de Trabajo:** `feature/finper-v204-consolidation`  
**Rama de Destino:** `main`  
**Estado:** LISTO PARA REVISIÓN Y PRUEBAS DEL USUARIO (Merge bloqueado hasta aprobación explícita)  

---

## 1. Verificación de Seguridad y Secretos

- [x] **Sin claves privadas en el repositorio:** Archivos `.env`, `.env.local` y carpetas de credenciales excluidos por `.gitignore`.
- [x] **Sin `service_role` en frontend:** El cliente solo utiliza la clave pública anónima autorizada.
- [x] **Aislamiento de Supabase:** Conexión exclusiva al proyecto autorizado `njgzhjwfcxdxiibkuuqg.supabase.co`. Rechazo estricto de refs obsoletos (`elsjuyjjkrkyhlylmaip`).
- [x] **Políticas RLS Activas:** Pruebas automatizadas validan que las políticas de seguridad a nivel de fila (`securityPolicies.test.ts`) aíslan y protegen la información por usuario.
- [x] **Tokens GoTrue Seguros:** La inyección de autorización se limita estrictamente a la URL de PostgREST del proyecto y no sobrescribe llamadas externas.
- [x] **Banner Guardrail de Entorno Local:** Advertencia visible `DevGuardrailBanner` en localhost alertando que se está conectado a la base de datos de producción real para evitar mutaciones ficticias.

---

## 2. Erradicación de Errores HTTP 406 (PostgREST)

- [x] **Auditoría completa de `.single()`:** Reemplazadas 100% de llamadas `.single()` por `fetchOptionalConfigRow` con `.maybeSingle()`.
- [x] **Tarjetas de Crédito:** `fetchCardsConfigFromSupabase` devuelve `null` sin error 406 si la fila no existe.
- [x] **Líneas de Crédito:** `fetchCreditLinesConfigFromSupabase` devuelve `null` sin error 406 si la fila no existe.
- [x] **Días Puente:** `fetchBridgeConfigFromSupabase` devuelve `null` sin error 406 si la fila no existe.
- [x] **Metas de Ahorro:** `fetchSavingsGoalsFromSupabase` devuelve `null` sin error 406 si la fila no existe.
- [x] **Diferenciación de Errores:** Manejo explícito de ausencia de registro (200 data=null), permisos RLS (403 / 42501), colisión de múltiples filas (PGRST116) y desconexión.

---

## 3. Fusión Financiera Asistida y Comparación Detallada

- [x] **Comparación Detallada Ítem por Ítem:** Módulo `diffComparison.ts` calcula diferencias de registros exclusivos, modificados e idénticos.
- [x] **Modal Interactivo de Conciliación Asistida:** `DiffComparisonModal` permite filtrar, buscar e inspeccionar diferencias antes de cualquier escritura.
- [x] **Prohibición de Sobreescritura Automática:** `computeSmartMerge` arroja excepción si `modifiedCount > 0`, exigiendo decisión explícita para cada partida modificada (`computeAssistedMerge`).
- [x] **Decisión Explícita por Registro Modificado:** El usuario puede elegir individualmente: `PC`, `Nube` o `Editar Monto` personalizado.
- [x] **Preservación de Pagos con Igual Nombre/Mes:** Partidas con el mismo concepto y mes pero distinto ID se conservan íntegramente sin deduplicación errónea.
- [x] **Simulación Financiera en Tiempo Real:** Caja de pre-flight que simula en vivo el impacto en ingresos, obligaciones totales y variación neta de liquidez mensual.
- [x] **Control de Concurrencia Optimista:** Verificación contra `remote.head` antes de escribir en Supabase; rechaza la escritura si otro dispositivo modificó el estado durante la conciliación.
- [x] **Respaldos Previos Descargables y Locales:** Botón de descarga JSON de ambas versiones completas y su reporte de diferencias antes de ejecutar cualquier acción.

---

## 4. Integridad y Preservación de Datos

- [x] **2,246 Registros Históricos Intactos:** Cero sentencias destructivas (`DROP`, `TRUNCATE`, `DELETE` masivos).
- [x] **Preservación de Cola Local en PC:** Las 4 transacciones pendientes (`GYM`, `iCloud`, `Fútbol`, `Salida`) permanecen conservadas en `finper_transaction_outbox_v1`.
- [x] **Compatibilidad de Esquema:** No se fuerza la creación de `personal_settings` en producción; el sistema opera en modo dual con transacciones como fuente autorizada.
- [x] **Respaldo Pre-Sincronización:** Cada descarga o fusión genera una copia con timestamp en `localStorage` (`finper_sync_backup_*`).

---

## 5. Calidad de Código y Validación Técnica

- [x] **Linter (`npm run lint`):** 0 errores (12 advertencias documentadas en hooks legados).
- [x] **Chequeo de Tipos (`npx tsc --noEmit`):** 0 errores de TypeScript en toda la base de código.
- [x] **Suite Completa de Pruebas (`npm test`):** **34 suites aprobadas (34/34), 187 pruebas aprobadas (187/187, 100% éxito)**.
- [x] **Compilación de Producción (`npm run build`):** Vite compila limpiamente en `dist/` en 9.64 segundos.

---

## 6. Cobertura de las 7 Secciones del Sistema

- [x] **General (Dashboard):** Renderizado verificado en `pagesRender.test.tsx` sin crashes.
- [x] **Registrar Movimiento:** Formulario operativo con encolado local inmediato y persistencia en Outbox.
- [x] **Proyecciones:** Gestión de partidas, escenarios de probabilidad y amortizaciones intactas.
- [x] **Tarjetas de Crédito:** Ciclos de corte, fechas de pago y cálculo normativo de pago mínimo SBS operativo.
- [x] **Deudas:** Hoja de deudas activa con preservación de préstamos personales.
- [x] **Clasificación:** Mapeo y reclasificación de comercios verificado con ordenamiento canónico.
- [x] **Dashboards:** Métricas y agregaciones mensuales funcionando sobre datos locales.

---

## 7. Criterios de Aprobación para Merge

- [ ] **Tutorial de Revisión ejecutado por el usuario** (`docs/FINPER_V204_COMO_PROBAR.md`).
- [ ] **Pruebas satisfactorias en PC Windows (Microsoft Edge).**
- [ ] **Pruebas satisfactorias en iPhone (Safari / PWA).**
- [ ] **Autorización explícita por escrito del usuario para merge a `main` y despliegue a Vercel.**
