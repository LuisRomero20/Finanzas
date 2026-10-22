# FINPER 2.0.3 — Reporte de Pruebas Automatizadas y Calidad de Código

**Fecha:** 22 de Octubre de 2026  
**Rama:** `fix/finper-v203-supabase-config`  
**Framework:** Vitest 2.1.9 con entorno jsdom  
**Resultado Global:**  
- **Suites de Prueba:** 29 pasadas de 29 (100%)  
- **Pruebas Totales:** 153 pasadas de 153 (100%)  
- **Fallos:** 0 (Cero)  
- **TypeScript (`npx tsc --noEmit`):** 0 errores  
- **ESLint (`npm run lint`):** 0 errores, 12 advertencias legacy en vistas no críticas  
- **Compilación de Producción (`npm run build`):** Exitosa en 10.02s con artefactos limpios en `dist/`  

---

## 1. Desglose de Suites de Prueba

| Suite de Prueba | Pruebas | Estado | Componente Evaluado |
| :--- | :---: | :---: | :--- |
| `src/domain/__tests__/supabaseConfigV203.test.ts` | 5 | **PASÓ** | Validación criptográfica de claves, extracción de ref, prevención de fallbacks y diagnóstico seguro |
| `src/domain/__tests__/syncRecoveryV202.test.ts` | 10 | **PASÓ** | Rechazo 23505, carreras PC/iPhone, sesión caducada, refresh, fallo parcial, mirror |
| `src/domain/__tests__/authDiagnostics.test.ts` | 6 | **PASÓ** | Diagnóstico granular de sesión (`server_verified`, `offline_cached`, etc.) |
| `src/utils/__tests__/bidirectionalSync.test.ts` | 6 | **PASÓ** | Fallo de red, concurrencia, cancelación local y aislamiento multiusuario |
| `src/domain/__tests__/personalSettingsMigration.test.ts` | 6 | **PASÓ** | RLS estricto, revocación a anon, aislamiento por tenant |
| `src/utils/__tests__/settingsSnapshot.test.ts` | 3 | **PASÓ** | Unicode round-trip, rechazo de escritor obsoleto, chunks incompletos |
| `src/utils/__tests__/transactionOutbox.test.ts` | 3 | **PASÓ** | Encolado y despacho de movimientos |
| `src/utils/__tests__/pendingPaymentsOutbox.test.ts` | 4 | **PASÓ** | Cola de pagos pendientes y sincronización atómica |
| `src/domain/__tests__/securityPolicies.test.ts` | 5 | **PASÓ** | Reglas de acceso y políticas de seguridad |
| `src/utils/__tests__/settingsSync.test.tsx` | 9 | **PASÓ** | Reactividad del panel de sincronización y resolución de estados |
| `src/utils/__tests__/pagesRender.test.tsx` | 6 | **PASÓ** | Renderizado sin regresiones de las 7 vistas principales |
| *Otras 18 suites de lógica contable y matemática* | 90 | **PASÓ** | Deudas, amortizaciones, CTS, gratificaciones, proyecciones casuales, etc. |
| **TOTAL** | **153** | **PASÓ** | **100% de las suites aprobadas** |

---

## 2. Validación de Escenarios de Configuración

1. **Detección de Claves Mismatched:**
   - La función `extractProjectRefFromKey()` decodifica el token y comprueba que contenga `ref: "njgzhjwfcxdxiibkuuqg"`.
   - Claves ajenas o de formato antiguo (`sb_publishable_...`) son detectadas y rechazadas.
2. **Protección de Escrituras ante Desvío:**
   - Si la configuración del entorno no es saludable (`isHealthy === false`), las peticiones `POST`, `PUT`, `PATCH`, `DELETE` son bloqueadas a nivel de interceptor.
3. **Bloqueo Incondicional de Dominios Obsoletos:**
   - Toda solicitud dirigida a `elsjuyjjkrkyhlylmaip` es interceptada antes de consultar la red, erradicando los errores `net::ERR_NAME_NOT_RESOLVED`.
