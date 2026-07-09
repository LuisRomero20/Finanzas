# 📖 Manual de Usuario - DeudaTracker

## 📑 Tabla de Contenidos

1. [Inicio Rápido](#inicio-rápido)
2. [Primer Acceso](#primer-acceso)
3. [Dashboard Explicado](#dashboard-explicado)
4. [Crear una Deuda](#crear-una-deuda)
5. [Gestionar Deudas](#gestionar-deudas)
6. [Interpretar Cálculos](#interpretar-cálculos)
7. [Ver Cronograma](#ver-cronograma)
8. [Reportes](#reportes)
9. [Preguntas Frecuentes](#preguntas-frecuentes)

---

## 🚀 Inicio Rápido

### Opción 1: Prueba Rápida (Modo Demo)

Si quieres probar la app sin registrarte:

1. Abre https://finanzas-tau-three.vercel.app
2. Ingresa estos datos:
   - **Email:** `demo@test.com`
   - **Contraseña:** `123456`
3. ¡Listo! Ya estás dentro 🎉

### Opción 2: Crear una Cuenta Real

Si quieres guardar tus datos en la nube:

1. Abre https://finanzas-tau-three.vercel.app
2. Haz clic en "Registrate"
3. Ingresa:
   - Tu nombre
   - Tu email
   - Una contraseña segura
4. Haz clic en "Crear Cuenta"
5. ¡Listo! Tu cuenta está creada

---

## 🔐 Primer Acceso

### Login exitoso

Cuando ingreses correctamente, verás:
- ✅ Navbar superior con tu nombre
- ✅ Menú de navegación (Inicio, Mis Deudas, Crear Deuda, etc.)
- ✅ Un dashboard de bienvenida
- ✅ Notificación verde: "¡Bienvenido!"

### Si ves un error

Si aparece un mensaje de error rojo:
- Verifica que el email sea correcto
- Verifica que la contraseña sea correcta
- En Modo Demo, usa exactamente: `demo@test.com` / `123456`

---

## 📊 Dashboard Explicado

### ¿Qué ves en el Dashboard?

Cuando entras, verás:

#### 1. **Tarjetas de Resumen** (Arriba)
```
┌─────────────────────────────────┐
│  Total adeudado: S/ 150,000.00  │
│  Deudas activas: 1              │
└─────────────────────────────────┘
```

- **Total adeudado:** La suma de todos tus créditos sin pagar
- **Deudas activas:** Cuántas deudas tienes sin terminar

#### 2. **Gráfico de Distribución** (Centro)
Un gráfico de pastel que muestra:
- % de cada deuda vs el total
- Colores diferentes para cada deuda
- Al pasar el mouse, ves el monto exacto

#### 3. **Botones de Acción** (Derecha)
- 🆕 **Nueva deuda** - Crear una nueva deuda
- 👁️ **Ver todas** - Ir a la lista completa

#### 4. **Bienvenida** (Arriba)
Mensaje personalizado: "Bienvenido a DeudaTracker 💳"

### Acciones desde el Dashboard

**Crear una deuda:**
1. Haz clic en "Nueva deuda"
2. Se abre el formulario
3. Sigue los pasos en [Crear una Deuda](#crear-una-deuda)

**Ver todas tus deudas:**
1. Haz clic en "Ver todas"
2. Se abre la página de Mis Deudas
3. Verás una tabla con todas tus deudas

---

## ➕ Crear una Deuda

### Paso 1: Acceder a Crear Deuda

Opciones:
- Desde Dashboard: Clic en "Nueva deuda"
- Desde Navbar: Clic en "Crear Deuda"
- Desde Mis Deudas: Clic en botón

### Paso 2: Llenar el Formulario

Verás estos campos:

#### **Acreedor** (Obligatorio)
- ¿Quién te prestó dinero?
- Ejemplos: "Banco ABC", "Tarjeta Visa", "Prestamista Carlos"
- Escribe el nombre tal como lo quieres recordar

#### **Moneda** (Obligatorio)
- Opciones: Soles (PEN) o Dólares (USD)
- Selecciona la moneda de tu deuda
- Por defecto está Soles

#### **Monto Inicial** (Obligatorio)
- ¿Cuánto dinero te prestaron?
- Ejemplos: 1000, 50000, 150000
- Los cálculos se actualizan automáticamente

#### **Tipo de Tasa** (Obligatorio)
- **Efectiva (TEA):** Tasa con interés compuesto (más común)
- **Nominal:** Tasa simple sin compuesto (menos común)
- Si no sabes cuál es, usa Efectiva

#### **Tasa Anual** (Obligatorio)
- ¿Cuál es el interés anual?
- En decimal: 0.20 = 20%, 0.085 = 8.5%
- Ejemplos:
  - Crédito bancario: 0.15 a 0.25 (15%-25%)
  - Tarjeta de crédito: 0.35 a 0.50 (35%-50%)
  - Prestamista informal: 0.10 a 0.30 (10%-30%)

#### **Plazo (meses)** (Obligatorio)
- ¿En cuántos meses pagarás la deuda?
- Ejemplos:
  - 12 = 1 año
  - 60 = 5 años
  - 180 = 15 años (típico para hipotecas)

#### **Fecha de Inicio** (Obligatorio)
- ¿Cuándo comenzó la deuda?
- Haz clic en el campo y selecciona la fecha
- Por defecto es hoy

### Paso 3: Revisar Cálculos Preliminares

Mientras llenas el formulario, verás en la derecha:

```
📊 Cálculo preliminar
├─ Cuota mensual: S/ 1,140.58
├─ Total a pagar: S/ 205,305.30
├─ Interés total: S/ 55,305.30
└─ Tasa mensual: 0.3675%
```

- **Cuota mensual:** Lo que pagarás cada mes
- **Total a pagar:** Lo que pagarás en total (incluye intereses)
- **Interés total:** Cuánto extra pagarás por los intereses
- **Tasa mensual:** La tasa convertida a mes

### Paso 4: Guardar la Deuda

1. Revisa que todos los datos sean correctos
2. Haz clic en "Guardar deuda" (botón azul)
3. Verás una notificación verde: "Deuda con [acreedor] agregada"
4. La deuda aparecerá en tu lista

### Paso 5: Continuar o Volver

Después de guardar:
- **Crear otra:** El formulario se limpía, completa otro
- **Ver lista:** Haz clic en "Mis Deudas"
- **Ir a inicio:** Haz clic en el logo o "Inicio"

---

## ✏️ Gestionar Deudas

### Ver Todas tus Deudas

1. Haz clic en "Mis Deudas" en el navbar
2. Verás una tabla con todas tus deudas

### Tabla de Deudas

Columnas que verás:

| Columna | Qué significa |
|---------|-------|
| **Acreedor** | Quién te prestó |
| **Monto** | Lo que debías inicialmente |
| **Cuota** | Lo que pagas cada mes |
| **Meses** | Cuotas pagadas / Total de cuotas |
| **Estado** | ✅ Activa, 🟢 Pagada, ⏰ Próximo vencer |
| **Acciones** | Botones para pagar, editar, eliminar |

### Marcar Cuota como Pagada

1. En la columna Acciones, haz clic en ✅
2. La deuda avanza: "0/180" → "1/180"
3. Cuando llegues a "180/180", la deuda cambia a "Pagada"
4. Verás una notificación: "Cuota marcada como pagada"

### Editar una Deuda

1. En la columna Acciones, haz clic en ✏️ (lápiz)
2. Se abre el formulario con los datos actuales
3. Modifica lo que necesites
4. Haz clic en "Guardar cambios"
5. Verás: "Deuda actualizada"

### Eliminar una Deuda

1. En la columna Acciones, haz clic en 🗑️ (papelera)
2. Verás un diálogo de confirmación
3. Haz clic en "Eliminar" para confirmar
4. La deuda desaparece
5. Verás: "Deuda eliminada"

⚠️ **Advertencia:** La eliminación es permanente. No se puede recuperar.

---

## 🧮 Interpretar Cálculos

### Fórmulas Utilizadas

#### 1. Cuota Mensual

Para tasa efectiva (TEA):
```
Tasa mensual = (1 + TEA) ^ (1/12) - 1
Cuota = Monto × (i × (1 + i)^n) / ((1 + i)^n - 1)

Donde:
- i = tasa mensual
- n = número de meses
```

#### 2. Interés Total

```
Interés Total = (Cuota × n) - Monto inicial

Ejemplo:
- Cuota: $1,140.58
- Meses: 180
- Total pagado: $1,140.58 × 180 = $205,305.30
- Interés: $205,305.30 - $150,000 = $55,305.30
```

#### 3. Total a Pagar

```
Total a Pagar = Cuota mensual × Número de meses

Ejemplo:
- Cuota: $1,140.58
- Meses: 180
- Total: $1,140.58 × 180 = $205,305.30
```

### Validar los Cálculos

**Prueba manual:**
1. Crea una deuda de prueba
2. Anota los valores
3. Usa una calculadora financiera online
4. Compara resultados

Todos nuestros cálculos están auditados y son precisos.

---

## 📅 Ver Cronograma

### Acceder al Cronograma

1. Haz clic en "Cronograma" en el navbar
2. Verás un listado de todos tus pagos programados

### Información del Cronograma

Para cada pago verás:
- 📅 **Fecha de pago**
- 💰 **Monto de la cuota**
- 📍 **Acreedor**
- 📊 **Número de cuota (1/180, 2/180, etc.)**

### Usar el Cronograma

**Para planificar tu mes:**
- Suma todas las cuotas del mes
- Verifica tu disponibilidad de dinero
- Nota las fechas importantes

**Para verificar pagos:**
- Comprueba que los montos coincidan con tu contrato
- Identifica discrepancias
- Contacta al acreedor si hay diferencias

---

## 📈 Reportes

### Acceder a Reportes

1. Haz clic en "Reportes" en el navbar
2. Verás análisis detallados de tus deudas

### Tipos de Reportes

#### 1. **Resumen General**
- Total adeudado
- Cuota mensual total
- Deudas activas
- Deudas pagadas

#### 2. **Análisis por Acreedor**
- Monto de cada deuda
- Porcentaje del total
- Tasa de interés
- Plazo restante

#### 3. **Proyecciones**
- Fecha estimada de pago completo
- Interés que pagarás
- Total que pagarás

#### 4. **Comparativa de Monedas**
- Deudas en Soles
- Deudas en Dólares
- Comparación de tasas

### Exportar Reportes

⚠️ Funcionalidad próxima:
- Descargar como PDF
- Exportar a Excel
- Enviar por email

---

## 🔧 Configuración

### Acceder a Configuración

1. Haz clic en "Config" en el navbar
2. Verás las opciones de personalización

### Opciones de Configuración

- **Moneda por defecto:** Elige entre Soles o Dólares
- **Tema:** Claro u Oscuro
- **Idioma:** Español (próximas versiones)
- **Notificaciones:** Activar/Desactivar alertas
- **Exportar datos:** Descargar todos tus datos

---

## 🔐 Seguridad y Privacidad

### Cómo Protegemos tus Datos

- 🔐 **Encriptación:** Tus datos se envían encriptados
- 🛡️ **Row Level Security:** Solo tú ves tus deudas
- ✅ **Autenticación:** Login seguro con contraseña
- 📋 **Cumplimiento:** Adherimos a GDPR y LGPD

### Tu Contraseña

- Nunca la compartas
- Usa 8+ caracteres
- Incluye mayúsculas, minúsculas, números, símbolos
- Cámbiala cada 90 días

### Cerrar Sesión

1. Haz clic en tu nombre (arriba a la derecha)
2. Selecciona "Cerrar sesión"
3. Se cierra tu sesión
4. Debes volver a ingresar para acceder

---

## ❓ Preguntas Frecuentes

### General

**P: ¿Es gratis usar DeudaTracker?**
R: Sí, completamente gratis. No hay planes pagos.

**P: ¿Necesito registrarme para usar la app?**
R: No. Puedes usar el Modo Demo sin registro. Pero si quieres guardar datos en la nube, sí necesitas una cuenta.

**P: ¿Dónde se guardan mis datos?**
R: En Supabase, un servicio seguro en la nube. Tus datos están protegidos con encriptación.

**P: ¿Qué pasa si olvido mi contraseña?**
R: Próximamente habrá un botón de "Olvidé mi contraseña". Por ahora, contacta al soporte.

### Funcionalidad

**P: ¿Cómo sé si mi tasa es Nominal o Efectiva?**
R: Pregunta al banco o prestamista. Si no sabes, usa Efectiva (es más común).

**P: ¿Los cálculos incluyen seguros?**
R: No, solo capital e intereses. Agrega manualmente si tienes seguros.

**P: ¿Puedo cambiar una deuda de Soles a Dólares?**
R: No directamente. Edita la deuda y selecciona la nueva moneda.

**P: ¿Qué significa "Próximo vencer"?**
R: La deuda vence en menos de 30 días. ¡Prepárate para pagar!

**P: ¿Puedo deshacer la eliminación de una deuda?**
R: No. La eliminación es permanente. Contacta al soporte si fue un error.

### Soporte Técnico

**P: La app no carga. ¿Qué hago?**
R: 
1. Recarga la página (F5)
2. Limpia el caché (Ctrl+Shift+Del)
3. Prueba en otro navegador
4. Contacta al soporte

**P: Veo números raros en los cálculos. ¿Es normal?**
R: Probablemente no. Puede ser un bug. Reporta con screenshot.

**P: ¿Por qué el gráfico no se actualiza?**
R: A veces tarda. Espera 5 segundos o recarga la página.

**P: ¿Funciona en móvil?**
R: Sí. La app es responsive y funciona perfectamente en móviles.

---

## 🆘 Contacto y Soporte

### Reportar un Problema

1. Abre GitHub: https://github.com/LuisRomero20/Finanzas
2. Haz clic en "Issues"
3. Clic en "New Issue"
4. Describe el problema:
   - ¿Qué intentabas hacer?
   - ¿Qué pasó?
   - ¿Qué esperabas que pasara?
   - Screenshots si es posible

### Sugerir una Feature

1. Abre GitHub
2. Haz clic en "Discussions"
3. Crea un nuevo tema
4. Describe tu idea
5. ¡Esperamos tu feedback!

---

## 📚 Tips y Trucos

### 💡 Mejores Prácticas

1. **Registra deudas pronto**
   - Cuanto antes registres, mejor seguimiento tendrás
   - No esperes a haber olvidado los detalles

2. **Actualiza regularmente**
   - Marca cuotas cada mes cuando pagues
   - Edita si los términos cambian

3. **Revisa tu cronograma**
   - Planifica tu presupuesto viendo los próximos meses
   - Anticípate a los pagos

4. **Usa monedas consistentes**
   - Si todas tus deudas son en Soles, mántelo así
   - Facilita el seguimiento

### ⚡ Atajos

- `Inicio` - Ir al dashboard
- `Mis Deudas` - Ver todas las deudas
- `Crear Deuda` - Nueva deuda
- `Cronograma` - Ver calendario de pagos
- Tu nombre → `Cerrar sesión` - Salir

---

**¡Felicidades! Ahora eres un experto en DeudaTracker. 🎉**

¿Necesitas más ayuda? Abre un issue en GitHub o contacta a soporte.

---

*Última actualización: Julio 2026*
*Versión de la guía: 1.0*
