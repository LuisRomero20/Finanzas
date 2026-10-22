# FINPER 2.0.1 — DISEÑO DE ARQUITECTURA DE SINCRONIZACIÓN Y RESILIENCIA

**Versión:** FINPER 2.0.1  
**Módulos Clave:** Autenticación, Cola Outbox Offline, Resiliencia de Pagos Pendientes, Persistencia de Configuraciones Personales.  

---

## 1. Arquitectura General de Sincronización

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Cliente (PC o iPhone)                           │
│                                                                        │
│   ┌────────────────────────┐         ┌─────────────────────────────┐   │
│   │  pendingPaymentsStore  │ ──────> │  pendingPaymentsOutbox      │   │
│   │  (Zustand / UI State)  │         │  (Queue en localStorage)    │   │
│   └────────────────────────┘         └──────────────┬──────────────┘   │
│                                                     │                  │
│                                      getValidatedSession()             │
│                                                     │                  │
└─────────────────────────────────────────────────────┼──────────────────┘
                                                      │ HTTPS Bearer JWT
                                                      ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        Supabase Cloud Platform                         │
│                                                                        │
│   ┌────────────────────────────────┐ ┌─────────────────────────────┐   │
│   │ public.transacciones           │ │ public.personal_settings    │   │
│   │ • 2,246 Movimientos Históricos │ │ • Presupuestos (JSONB)      │   │
│   │ • Pagos Pendientes (pending-*) │ │ • Proyecciones (JSONB)      │   │
│   │ • RLS Forzado: user_id = auth  │ │ • Deudas Regularizadas      │   │
│   └────────────────────────────────┘ └─────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Motor de Cola Outbox (`pendingPaymentsOutbox.ts`)

Para resolver de raíz la pérdida silenciosa de datos (como la discrepancia de partidas entre PC y móvil), se implementó el patrón **Outbox Pattern** en el almacenamiento local del navegador (`localStorage`).

### Principios de Diseño:
1. **Atómica e Idempotente:** Toda acción (`save` o `delete`) recibe un identificador único de operación (`token`) y normaliza el ID comercial del ítem removiendo prefijos volátiles (`pending-`, `pend-`).
2. **Desacoplamiento UI / Red:** La interfaz de usuario refleja los cambios inmediatamente en el estado local de Zustand sin bloquearse.
3. **Persistencia Garantizada:** Antes de iniciar cualquier llamada HTTP, la operación queda registrada en `finper_pending_payments_outbox_v1`.
4. **Flush Serializado con Prevención de Condiciones de Carrera:** Si un flush ya se encuentra en ejecución, llamadas concurrentes esperan la misma promesa en lugar de abortar o solapar operaciones.
5. **Drenaje Previo a Lectura:** Antes de ejecutar `syncFromSupabase()`, la aplicación vacía primero las operaciones locales pendientes para evitar que una lectura remota sobrescriba cambios locales no subidos.

```
[Usuario agrega/edita pago] 
       │
       ▼
enqueuePendingSave(item) ───> Almacena en Outbox (localStorage)
       │
       ▼
flushPendingPaymentsOutbox() 
       │
       ├── ¿Sesión válida? ──[NO]──> Conserva en cola para siguiente ciclo
       │         │ [SÍ]
       ▼
savePendingPaymentToSupabase()
       ├── Éxito ──> Remueve ítem de cola + broadcastRealtimeSync()
       └── Error ──> Incrementa attempts, guarda lastError, suspende reintentos
```

---

## 3. Ciclo de Vida de Autenticación y Diagnóstico de Sesión (`authService.ts`)

La aplicación ya no asume que un objeto `user` en `localStorage` constituye una sesión autenticada.

### Mecanismos de Validación:
1. **Inspección de SDK en Memoria:** `supabase.auth.getSession()` evalúa si existe sesión activa y valida estrictamente `isSessionExpired(session)`.
2. **Renovación Transparente:** Si la sesión está expirada pero cuenta con un `refresh_token`, invoca automáticamente `supabase.auth.refreshSession()`.
3. **Cálculo de Expiración en Proxy:** El endpoint `/api/login` calcula explícitamente:
   $$\text{expires\_at} = \lfloor\text{Date.now()} / 1000\rfloor + \text{data.expires\_in}$$
   garantizando que el SDK GoTrue conserve y reconozca la vigencia de la sesión tras recargas.
4. **Diagnóstico en Tiempo Real:** La función `getAuthDiagnostic()` provee a la interfaz:
   - Estado de conexión con Supabase.
   - Validez de la sesión (vigente, por expirar en < 5 min, o expirada).
   - Segundos restantes de validez del JWT.
   - Cantidad de operaciones retenidas en la cola outbox.

---

## 4. Persistencia Desacoplada y Lectura Dual (`settingsSnapshot.ts`)

Históricamente, las configuraciones del usuario (presupuestos, proyecciones, clasificación) se guardaban en la tabla `transacciones` divididas en cientos de fragmentos de 240 caracteres. Para migrar ordenadamente sin romper versiones anteriores, se diseñó un esquema de **Lectura Dual (Dual-Read) y Escritura Dual (Dual-Write)**:

### Estrategia de Transición:
- **Lectura:**
  1. Consulta primero la tabla dedicada `public.personal_settings` por `name`.
  2. Si no existe o retorna error (por ejemplo, antes de aplicar la migración SQL), conmuta inmediatamente a la lectura compatible de fragmentos en `transacciones`.
- **Escritura:**
  1. Serializa y escribe en fragmentos en `transacciones` con verificación de concurrencia optimista (`previousHead`).
  2. En paralelo, ejecuta un `upsert` silencioso en `public.personal_settings` asociando `user_id`, `name`, y `data` (JSONB estructurado).

---

## 5. Diseño de la Migración SQL (`public.personal_settings`)

Archivo: `supabase/migrations/20261022170000_create_personal_settings.sql`

```sql
CREATE TABLE IF NOT EXISTS public.personal_settings (
    id TEXT PRIMARY KEY,               -- Compuesto: {user_id}-{name}
    user_id UUID NOT NULL,             -- Titularidad del usuario
    name TEXT NOT NULL,                -- 'presupuestos', 'proyecciones', etc.
    data JSONB NOT NULL DEFAULT '{}',  -- Carga estructurada completa
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Políticas RLS estrictas
ALTER TABLE public.personal_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_settings FORCE ROW LEVEL SECURITY;

CREATE POLICY "personal_settings_all_own"
    ON public.personal_settings
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
```

### Ventajas Operativas:
- **0 fragmentos:** Una configuración de presupuesto se guarda en 1 sola fila en vez de 35 filas fragmentadas.
- **Sin contaminación contable:** La tabla `transacciones` queda reservada exclusivamente para movimientos financieros reales.
- **Rendimiento instantáneo:** Consultas $O(1)$ por clave primaria sin escaneo de cientos de IDs con patrón `like`.
