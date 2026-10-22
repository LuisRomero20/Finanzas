# FINPER 2.0.2 — Checklist de Publicación, Verificación y Protocolo de Recuperación

**Versión:** 2.0.2  
**Fecha:** 22 de Octubre de 2026  
**Rama de Trabajo:** `fix/finper-v202-sync-recovery`  
**Rama Destino:** `main`  
**URL de Producción:** [https://finanzas-tau-three.vercel.app/](https://finanzas-tau-three.vercel.app/)  

---

## 1. Verificaciones Previas a la Fusión (Pre-Merge Checklist)

- [x] **Suite de pruebas completa:** 147 de 147 pruebas automatizadas pasadas en 28 suites.
- [x] **Cero sobrescritura ciega:** Eliminado `UPDATE` sin versión en colisiones `23505`; concurrencia optimista real comprobada.
- [x] **Interceptor HTTP acotado:** Inyección estricta a `/rest/v1/`, sin interferir en auth (`/auth/v1/`) ni almacenamiento.
- [x] **Fuente autoritativa única:** `public.transacciones` definido formalmente como Single Source of Truth; mirror secundario con estado verificable (`getMirrorSyncStatus()`, `repairMirrorSync()`).
- [x] **Verificación TypeScript:** `npx tsc --noEmit` completado sin errores de tipado.
- [x] **Verificación ESLint:** 0 errores de lint; 12 advertencias en páginas legacy documentadas transparentemente.
- [x] **Empaquetado de producción:** `npm run build` ejecutado exitosamente con artefactos limpios en `dist/`.
- [x] **Integridad de base de datos:** Los 2,246 registros históricos de Supabase permanecen íntegros y RLS rechaza el rol `anon`.
- [x] **Cero comandos destructivos:** No se ejecutó ningún `DROP`, `TRUNCATE` ni borrado en lote en producción.
- [x] **Seguridad de credenciales:** Ningún secreto (`service_role` o contraseñas) ha sido incluido en el código cliente.
- [x] **Aislamiento de rama:** Todo el trabajo se encuentra encapsulado en `fix/finper-v202-sync-recovery`.

---

## 2. Protocolo de Verificación en Dispositivos tras el Despliegue

Una vez que el usuario apruebe la fusión de la rama a `main` y Vercel complete el despliegue automático, sigue estos pasos en orden:

### Paso 1: Verificación en la PC (Dispositivo Principal con los 4 movimientos en cola)

1. Abre [https://finanzas-tau-three.vercel.app/](https://finanzas-tau-three.vercel.app/) en Google Chrome / Microsoft Edge.
2. Inicia sesión con `luis_jesusrc@hotmail.com` (o recarga si la sesión ya está guardada).
3. Localiza el panel superior **Sincronización Segura PC / iPhone**.
4. Confirma visualmente:
   - **Estado de Sesión:** Debe mostrar **«Validada en Supabase»** (texto verde).
   - **Cola de Movimientos:** Mostrará inicialmente los 4 movimientos pendientes.
5. Pulsa el botón verde **«Sincronizar Todo»**:
   - Observa cómo la **Cola de Movimientos** se despacha hacia Supabase y pasa de `4 pendientes` a **`0 pendientes`**.
   - Observa cómo los 4 módulos de configuración se sincronizan:
     - Si muestran **«Sincronizado»** (verde), la sincronización se completó.
     - Si alguno muestra **«Versiones distintas»** (ámbar), pulsa **«Compartir este dispositivo a la nube»**.
6. Realiza un respaldo preventivo pulsando **«Descargar copia de seguridad local (JSON)»**.

---

### Paso 2: Verificación en el iPhone (Safari / PWA)

1. En el iPhone, abre la PWA de FINPER o ingresa desde Safari a la misma URL.
2. Asegúrate de tener la sesión iniciada con `luis_jesusrc@hotmail.com`.
3. En el panel superior, pulsa **«Sincronizar Todo»**:
   - En la lista de transacciones, verifica que los movimientos registrados en la PC (como GYM, iCloud, Fútbol, Salida) ahora se visualicen de forma idéntica en el iPhone.
   - Si los módulos de ajustes muestran **«Versiones distintas»**, pulsa **«Usar versión de la nube»** para adoptar las configuraciones emitidas desde tu PC.
4. Comprueba que ambos dispositivos muestran exactamente el mismo resumen y estado verde.

---

## 3. Protocolo Opcional para Habilitar la Tabla `personal_settings` en Supabase

> [!IMPORTANT]
> FINPER 2.0.2 funciona al 100% sin necesidad de esta tabla, pues opera sobre `transacciones` como fuente autoritativa.
> **Solo ejecuta este paso si deseas habilitar la tabla dedicada para optimizar el almacenamiento futuro.**

Si decides aplicarla:
1. Ingresa a la consola de Supabase: [https://supabase.com/dashboard/project/njgzhjwfcxdxiibkuuqg](https://supabase.com/dashboard/project/njgzhjwfcxdxiibkuuqg).
2. Ve a la sección **SQL Editor**.
3. Abre o pega el contenido del archivo:
   `supabase/migrations/20261022170000_create_personal_settings.sql`
4. Pulsa **Run**.
5. Verifica que la tabla fue creada ejecutando:
   ```sql
   SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'personal_settings';
   ```
   Debe retornar `personal_settings`.

---

## 4. Protocolo de Rollback (Plan de Contingencia)

En caso de cualquier comportamiento inesperado tras el despliegue:

1. **Reversión de Git:**
   ```bash
   git checkout main
   git revert HEAD -m 1
   git push origin main
   ```
2. **Restauración Local:**
   Tanto la PC como el iPhone conservan sus datos en `localStorage` y en el archivo descargable `finper-respaldo-sincronizacion-*.json`.
3. Los 2,246 registros históricos de `transacciones` en Supabase no son alterados ni borrados por este hotfix, por lo que la integridad financiera está 100% resguardada.
