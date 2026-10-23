# FINPER 2.1 — SPRINT 02: BACKLOG MÓVIL Y CIERRE MULTIDISPOSITIVO

**Fecha de registro:** 23 de octubre de 2026
**Origen:** validación manual de FINPER en Safari para iPhone
**Rama de origen:** `feature/finper-v21-smart-cards-sprint01`

## Objetivo

Cerrar la prueba de persistencia multidispositivo en un entorno aislado y mejorar la ergonomía móvil sin cambiar reglas financieras no verificadas.

## Prioridad 0 — puerta de liberación

1. Disponer de un proyecto Supabase de ensayo exclusivo para FINPER o de una rama de desarrollo aislada.
2. Aplicar únicamente las migraciones revisadas del repositorio.
3. Crear un usuario de prueba sin datos financieros reales.
4. Verificar casos positivos y negativos de RLS para lectura, inserción, actualización y eliminación.
5. Ejecutar PC → nube → iPhone, modo sin red/reintento y conflicto simultáneo.
6. Eliminar los datos sintéticos o destruir el entorno de ensayo al terminar.

### Evidencia mínima de aceptación

- La PC muestra `Confirmada en Supabase` solo después de escribir y releer el mismo snapshot.
- El iPhone recupera exactamente saldo, estado de verificación y referencia documental.
- Un reintento no duplica conciliaciones ni pagos.
- Un usuario distinto no puede leer ni modificar datos ajenos.
- `anon` no puede acceder a tablas financieras.
- Un conflicto simultáneo no sobrescribe ninguna versión sin resolución asistida.

## Prioridad 1 — modal móvil

- Reducir padding, icono y tipografía del encabezado en anchos móviles.
- Mantener el cuerpo desplazable, con encabezado compacto y pie de acciones fijo dentro del modal.
- Respetar `safe-area-inset-bottom` y un alto máximo basado en `100dvh`.
- Conservar accesibilidad: foco visible, cierre etiquetado y objetivos táctiles de al menos 44 px.

## Prioridad 1 — vencimientos transparentes

- Mostrar junto a la fecha uno de estos estados: `Configurada`, `Estimada` o `Verificada por estado de cuenta`.
- No convertir fines de semana o feriados en una regla bancaria implícita.
- Mantener la fecha contractual configurada hasta que un estado de cuenta confirme una excepción.
- Registrar toda corrección con fuente y fecha de verificación.

## Prioridad 1 — cancelación segura

- Retirar el botón verde prominente de la superficie principal o convertirlo en acceso secundario a `Regularizar`.
- Antes de cancelar, mostrar deuda previa, pago, saldo posterior y origen del pago.
- Mantener la confirmación explícita para regularización externa sin egreso.
- No marcar una deuda como cancelada si una escritura remota falla o queda pendiente.

## Decisión de liberación

La validación visual de Sprint 01 está aprobada. Estas mejoras no bloquean por estética; la única puerta pendiente para autorizar el merge es demostrar persistencia real multidispositivo en un entorno Supabase aislado. El merge a `main` y el despliegue productivo siguen sin autorización.
