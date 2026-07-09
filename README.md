# � DeudaTracker — Gestor de Deudas Personales

**Controla tus deudas, calcula cuotas automáticamente y no te pierdas un pago**

![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)

---

## 📋 Descripción

**DeudaTracker** es la herramienta que todo peruano necesita para organizar sus deudas. ¿Tienes crédito en el banco? ¿Prestamista? ¿Tarjeta de crédito? ¿Deuda informal? Gestiona todo en un solo lugar con cálculos automáticos, cronogramas de pago y alertas.

### 🎯 Problema que Resuelve
- ❌ Deudas dispersas sin seguimiento claro
- ❌ Olvidos de fechas de pago
- ❌ Desconocimiento del total a pagar con intereses
- ❌ Cálculos manuales propensos a errores
- ✅ **Solución: Una app que centraliza, calcula y alerta automáticamente**

---

## ✨ Características Principales

| Característica | Descripción |
|---|---|
| 📝 **Registro de Deudas** | Añade deudas con acreedor, monto, tasa y plazo |
| 🧮 **Cálculo Automático** | Calcula cuotas, intereses y TCEA automáticamente |
| 📅 **Cronograma de Pagos** | Ve todas tus cuotas mensuales en un cronograma completo |
| 🚨 **Alertas de Vencimiento** | Recibe avisos de próximos pagos vencidos |
| 📊 **Panel de Control** | Visualiza total adeudado, próximos vencimientos y resumen |
| ✅ **Seguimiento de Pagos** | Marca cuotas como pagadas y rastrea tu progreso |
| 📱 **Responsive Design** | Accede desde móvil, tablet o desktop |
| ⚡ **Velocidad** | Cálculos instantáneos con Vite + React |

---

## 🛠️ Stack Tecnológico

### Frontend
- **React 19+** — UI interactiva y eficiente
- **TypeScript** — Tipo seguro para evitar errores
- **Vite** — Build ultrarrápido
- **Tailwind CSS** — Estilos modernos y responsive
- **HTML5 + CSS3** — Semántica y diseño
- **TypeScript** — Tipado estricto en backend
- **APIs REST** — Endpoints para gestión de datos

### Base de Datos
- **SQL** — Persistencia relacional de transacciones y presupuestos

### Herramientas
- **Git** — Control de versiones
- **npm/yarn** — Gestión de dependencias

---

## 📁 Estructura del Proyecto

```
Finanzas/
├── src/
│   ├── components/          # Componentes React reutilizables
│   │   ├── TransactionForm/ # Formulario para nuevas transacciones
│   │   ├── Dashboard/       # Dashboard principal con métricas
│   │   ├── CategoryChart/   # Gráfico de distribución por categoría
│   │   └── BudgetTracker/   # Tracker de presupuesto vs. gasto
│   ├── pages/              # Páginas de la aplicación
│   │   ├── Home/           # Página principal
│   │   ├── History/        # Historial de transacciones
│   │   └── Analysis/       # Análisis detallado
│   ├── services/           # Llamadas a APIs backend
│   │   └── api.ts          # Cliente HTTP para endpoints
│   ├── types/              # Definiciones TypeScript
│   │   └── Transaction.ts  # Interfaces de datos
│   ├── App.tsx             # Componente raíz
│   ├── main.tsx            # Punto de entrada React
│   └── App.css             # Estilos globales
├── backend/               # Backend Node.js/TypeScript
│   ├── src/
│   │   ├── routes/         # Endpoints API
│   │   ├── controllers/    # Lógica de negocio
│   │   ├── database/       # Conexión a base de datos
│   │   └── server.ts       # Servidor Express
│   └── package.json
├── vite.config.ts          # Configuración Vite
├── tsconfig.json           # Configuración TypeScript
├── package.json            # Dependencias del proyecto
└── README.md              # Este archivo
```

---

## 🚀 Instalación & Configuración

### Prerrequisitos
- Node.js 16+
- npm o yarn
- Git

### 1. Clonar el repositorio
```bash
git clone https://github.com/LuisRomero20/Finanzas.git
cd Finanzas
```

### 2. Instalar dependencias

**Frontend:**
```bash
npm install
```

**Backend:**
```bash
cd backend
npm install
cd ..
```

### 3. Configurar variables de entorno

Crea un archivo `.env` en la raíz:
```env
VITE_API_URL=http://localhost:3001/api
```

Y otro `.env` en `backend/`:
```env
PORT=3001
DATABASE_URL=your_database_connection_string
NODE_ENV=development
```

### 4. Ejecutar en desarrollo

**Iniciar backend:**
```bash
npm run backend:dev
```

**En otra terminal, iniciar frontend:**
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173` (Vite)

---

## 📊 Cómo Usar

### 1. Registrar una Transacción
- Click en "Nueva Transacción"
- Completa monto, categoría, fecha y descripción
- El sistema clasifica automáticamente el tipo (ingreso/gasto)

### 2. Ver Dashboard
- Dashboard principal muestra:
  - Saldo actual
  - Gastos del mes
  - Ingresos del mes
  - Proyección de saldo

### 3. Analizar por Categoría
- Visualiza distribución de gastos en gráfico circular
- Identifica categorías con mayor gasto
- Detecta patrones y oportunidades de ahorro

### 4. Seguimiento de Presupuesto
- Define presupuesto mensual por categoría
- El sistema compara gasto real vs. planificado
- Alertas cuando se supera el límite

### 5. Historial & Exportación
- Visualiza todas las transacciones registradas
- Filtra por fecha, categoría o monto
- Opción de exportar a CSV para análisis externo

---

## 🔧 Comandos Disponibles

```bash
# Desarrollo
npm run dev              # Inicia frontend + HMR
npm run backend:dev     # Inicia backend con nodemon

# Build
npm run build           # Compila frontend para producción
npm run build:backend   # Compila backend

# Testing
npm run test            # Ejecuta tests
npm run test:watch     # Tests en modo watch

# Linting
npm run lint            # Verifica código con ESLint
npm run lint:fix       # Arregla problemas automáticos

# Producción
npm run preview        # Preview de build local
npm run start:prod     # Inicia backend en producción
```

---

## 📈 Próximas Mejoras

- [ ] 🔐 Autenticación y autorización de usuarios
- [ ] 📱 App móvil nativa (React Native)
- [ ] 💳 Integración con APIs de bancos
- [ ] 🎯 Metas de ahorro y seguimiento
- [ ] 📧 Reportes mensuales por correo
- [ ] 🤖 Recomendaciones basadas en IA
- [ ] 📊 Gráficos avanzados (Recharts, Chart.js)
- [ ] 🌙 Modo oscuro

---

## 🧪 Testing

```bash
# Correr todos los tests
npm run test

# Tests específicos
npm run test -- TransactionForm

# Coverage
npm run test:coverage
```

---

## 📝 Estructura de Datos

### Transacción
```typescript
interface Transaction {
  id: string;
  amount: number;           // Monto en moneda local
  category: string;         // Categoría (Comida, Transporte, etc.)
  type: 'income' | 'expense'; // Tipo
  date: Date;               // Fecha
  description: string;      // Descripción
  createdAt: Date;
  updatedAt: Date;
}
```

### Presupuesto
```typescript
interface Budget {
  id: string;
  category: string;
  limit: number;            // Límite mensual
  month: string;            // YYYY-MM
  createdAt: Date;
}
```

---

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:
1. Fork el proyecto
2. Crea una rama para tu feature: `git checkout -b feature/AmazingFeature`
3. Commit tus cambios: `git commit -m 'Add AmazingFeature'`
4. Push a la rama: `git push origin feature/AmazingFeature`
5. Abre un Pull Request

---

## 📄 Licencia

Proyecto de uso personal. Todos los derechos reservados © 2025 Luis Jesús Romero Castro

---

## 👤 Autor

**Luis Jesús Romero Castro**
- 🔗 LinkedIn: [linkedin.com/in/luisjesusromerocastro](https://linkedin.com/in/luisjesusromerocastro)
- 📧 Email: luis_jesusrc@hotmail.com
- 💻 GitHub: [github.com/LuisRomero20](https://github.com/LuisRomero20)

---

<p align="center">
  <i>Gestiona tus finanzas de forma inteligente 💰 | Análisis en tiempo real 📊 | Decisiones financieras basadas en datos 📈</i>
</p>
