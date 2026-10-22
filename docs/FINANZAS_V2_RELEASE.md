# FINANZAS 2.0.0 — Notas de la Versión y Guía de Despliegue

## 1. Identificación del Release

- **Versión:** `2.0.0`
- **Nombre Clave:** *Arquitecura Segura & Motor Financiero Puro*
- **Rama de Entrega:** `feature/finanzas-v2`
- **Destino del Merge:** `main`
- **Fecha de Preparación:** 22 de Octubre de 2026

---

## 2. Resumen de Novedades y Correcciones

### 2.1 Seguridad e Integridad de Datos (Prioridad Crítica)
- **Aislamiento de pruebas:** Eliminada la prueba remota destructiva que escribía datos en producción durante los tests locales.
- **Protección de credenciales:** Retiro definitivo de `.env` y `.env.local` del rastreo de Git y blindaje de `.gitignore`.
- **Diagnóstico y Contención Supabase:** Confirmada la vulnerabilidad de RLS permisiva en `public.transacciones` (2,246 registros expuestos). Redactado el plan formal de remediación y la migración aditiva V2 en espera de confirmación del propietario.
- **Cliente centralizado de Supabase:** Validación estricta de variables de entorno y soporte de claves publicables.

### 2.2 Motor Financiero Puro (`src/domain/`)
- **Aritmética en centavos:** Implementación de `money.ts` y algoritmo `allocateMoney` para erradicar pérdidas de centavos en cronogramas de cuotas.
- **Ciclos bancarios exactos:** Implementación de `billingCycles.ts` con manejo de días de corte, fechas de vencimiento, cruces de año y ajuste de fines de semana.
- **Conversión de tasas y amortización francesa:** Implementación de `rates.ts` con cálculo exacto de cuota nivelada y simulación de prepagos extraordinarios (reducción de plazo vs. reducción de cuota).
- **Regla del Triple Impacto Contable:** Implementación de `accounting.ts` para desglosar el impacto en Resultados Económicos, Flujo de Caja y Pasivos Financieros, eliminando la duplicación del gasto entre compras con tarjeta y pagos de extracto.

### 2.3 Módulo de Tarjetas de Crédito
- Unificación autoritativa de tarjetas predeterminadas:
  - *Interbank American Express Benefit:* Corte día 21, límite de pago día 15.
  - *BBVA Bfree:* Corte día 10, límite de pago día 5.
  - *Ripley Mastercard:* Corte día 3, límite de pago día 1.
- Normalización defensiva para proteger la configuración personalizada del usuario ante sincronizaciones incompletas.

### 2.4 Proyecciones Multi-Horizonte (3, 6, 12 y 24 Meses)
- Integración en `projectionStore.ts` del cálculo multi-horizonte con segmentación en 4 cubetas:
  1. Histórico confirmado
  2. Obligaciones de deuda contratadas
  3. Gastos futuros estimados
  4. Simulaciones hipotéticas de compra o prepago
- Trazabilidad auditable por partida sin alterar el estado real de la base de datos.

### 2.5 Calidad de Código y Suite de Pruebas
- **111 pruebas unitarias automatizadas** aprobadas al 100% (incremento desde 97 pruebas heredadas).
- **0 errores de TypeScript (`npx tsc --noEmit`).**
- **Build de producción limpio y reproducible (`npm run build`).**
- **Deuda de linting drásticamente reducida:** Eliminados todos los errores de escapes innecesarios, bloques vacíos y variables no reasignadas.

---

## 3. Checklist Pre-Despliegue

Antes de fusionar la rama a `main` y autorizar el despliegue automático en Vercel:

1. [x] Ejecutar `npx tsc --noEmit` $\rightarrow$ 0 errores.
2. [x] Ejecutar `npm test` $\rightarrow$ 111 pruebas aprobadas.
3. [x] Ejecutar `npm run build` $\rightarrow$ Compilación exitosa en `dist/`.
4. [x] Verificar que no existan credenciales privadas ni secretos en el historial de commits.
5. [ ] **Aprobación del Usuario:** Confirmar la cuenta de Supabase Auth para la aplicación de la migración de seguridad en producción.
6. [ ] **Creación del Pull Request:** Crear PR desde `feature/finanzas-v2` hacia `main` en GitHub.
