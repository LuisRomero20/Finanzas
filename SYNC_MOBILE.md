# Sincronización y vista móvil

La misma aplicación funciona en computadora y celular. GitHub/Vercel distribuyen el código; Supabase comparte los datos. La cuenta de GitHub no inicia sesión ni transfiere el almacenamiento privado de un navegador.

## Primera conexión de los datos existentes

1. Abre la versión actualizada en **el navegador de computadora donde ya ves tus valores correctos**.
2. Abre **Ajustes financieros · Nube**. Descarga las copias de respaldo si quieres guardarlas como archivo.
3. En los apartados con versiones distintas, revisa los resúmenes y pulsa **Compartir este dispositivo** para publicar los valores de la computadora.
4. Abre la misma dirección de FINPER en el celular. Si aparece un conflicto, pulsa **Usar nube** en ese apartado.

Los cambios posteriores en presupuestos, proyecciones, regularizaciones de tarjetas y clasificaciones se sincronizan automáticamente. Si ambos dispositivos cambian el mismo apartado antes de sincronizar, se conserva la versión local y se solicita elegir; no se mezclan silenciosamente datos financieros incompatibles.

Las proyecciones antiguas se leen separando los formatos `config-proj-chunk-0` y `config-proj-chunk-000`. La versión con tres dígitos corresponde al escritor más reciente. No se eliminan fragmentos antiguos.

## Protección y límites

- Los nuevos documentos se guardan como versiones completas e inmutables. El cambio de versión activa comprueba que otro dispositivo no la haya cambiado durante el envío.
- Una lectura incompleta o un error de red conserva la copia local. Los cambios locales se comparan con la última versión sincronizada al reconectar.
- Los movimientos nuevos, editados o eliminados tienen una cola local persistente y se reintentan. Las notificaciones de esa cola se envían después de recibir confirmación de Supabase.
- Antes de reemplazar ajustes locales se guarda una copia de recuperación. El botón de descarga incluye esas copias; no es el mismo formato de importación del centro de respaldos original.
- La sincronización nueva protege estos cuatro apartados y la cola de movimientos. Los otros módulos conservan sus mecanismos existentes; no se promete resolución automática de todos los conflictos posibles entre ediciones simultáneas.
- La primera transferencia de configuraciones que solo existen en un navegador exige abrir ese navegador; el repositorio no contiene su almacenamiento local.

## Interfaz móvil

Proyecciones muestra las cifras en dos columnas y cinco movimientos por página. Al tocar una fila aparecen el detalle y las mismas acciones del escritorio. Las acciones secundarias están en **Más opciones**. Presupuestos muestra cuatro categorías por página. Tarjetas permite elegir una tarjeta y desplegar sus consumos. El escritorio conserva sus tablas y cuadrículas.

## Verificación sin datos reales

`node node_modules/vitest/vitest.mjs run --config vitest.sync.config.ts`

Esta configuración simula Supabase. Evita ejecutar la prueba antigua `testSupabase.test.ts` contra producción, pues incluye una eliminación remota.
