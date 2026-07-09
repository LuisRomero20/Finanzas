# 💳 DeudaTracker - Gestor Inteligente de Deudas Personales

[![Live Demo](https://img.shields.io/badge/Live-Demo-success?style=for-the-badge)](https://finanzas-tau-three.vercel.app)
[![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com)
[![Supabase](https://img.shields.io/badge/Database-Supabase-green?style=for-the-badge&logo=supabase)](https://supabase.com)

## 📋 Descripción

**DeudaTracker** es una aplicación web moderna para gestionar tus deudas personales de forma inteligente. Proporciona:

- 📊 **Cálculos automáticos** de cuotas, intereses y cronogramas de pago
- 🎯 **Seguimiento en tiempo real** de tus deudas
- 📈 **Visualización de datos** con gráficos interactivos
- 🔐 **Autenticación segura** con Supabase
- 💾 **Sincronización en la nube** entre dispositivos
- 📱 **Interfaz responsiva** que funciona en cualquier dispositivo
- 🚀 **Rendimiento optimizado** con React y Vite

## 🚀 Demostración Rápida

Accede a la app en vivo:
```
https://finanzas-tau-three.vercel.app
```

**Modo Demo (sin registro):**
- 📧 Email: `demo@test.com`
- 🔑 Contraseña: `123456`

## 🎯 Características Principales

### 1️⃣ Dashboard Intuitivo
- Vista general de todas tus deudas
- Total adeudado consolidado
- Cuota mensual total
- Cantidad de deudas activas

### 2️⃣ Gestión de Deudas
- ➕ Crear nuevas deudas con cálculos automáticos
- ✏️ Editar deudas existentes
- 🗑️ Eliminar deudas
- ✅ Marcar cuotas como pagadas

### 3️⃣ Cálculos Precisos
- Conversión automática entre tasas nominales y efectivas
- Cálculo de cuota mensual
- Cálculo de interés total
- Cálculo de tasa mensual equivalente
- Múltiples monedas (Soles, Dólares)

### 4️⃣ Visualizaciones
- 📊 Gráfico de pastel con distribución de deudas
- 📋 Tabla detallada de deudas
- 📈 Resumen de métricas clave

### 5️⃣ Cronograma Personalizado
- Ver schedule completo de pagos
- Seguimiento de meses pagados
- Alertas de próximos vencimientos

### 6️⃣ Reportes Detallados
- Análisis de deudas por acreedor
- Proyecciones de pago
- Comparativas de monedas

## 🛠️ Stack Tecnológico

### Frontend
- **React 19.1.1** - UI moderna y reactiva
- **TypeScript 5.9.3** - Type safety
- **Vite 5.4.21** - Build tool ultrarrápido
- **Tailwind CSS 3.4.13** - Estilos utilitarios
- **Zustand 5.0.14** - State management
- **Recharts 3.9.2** - Gráficos interactivos
- **Lucide React** - Iconos de calidad

### Backend
- **Supabase** - PostgreSQL + Autenticación
- **PostgreSQL** - Base de datos relacional
- **Row Level Security (RLS)** - Seguridad por usuario

### Hosting
- **Vercel** - Hosting y deployment continuo
- **Git** - Control de versiones

## 📦 Instalación Local

### Requisitos Previos
- Node.js 18+ 
- npm o yarn
- Git

### Pasos

1. **Clonar repositorio**
```bash
git clone https://github.com/LuisRomero20/Finanzas.git
cd Finanzas
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Crear archivo `.env.local`**
```bash
VITE_SUPABASE_URL=tu_url_aqui
VITE_SUPABASE_ANON_KEY=tu_clave_aqui
```

4. **Ejecutar en desarrollo**
```bash
npm run dev
```

5. **Abrir en navegador**
```
http://localhost:5173
```

## 🚀 Deployment

### Vercel (Recomendado)

1. **Conectar repositorio**
```bash
vercel link
```

2. **Agregar variables de entorno**
```bash
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
```

3. **Deploy en producción**
```bash
vercel deploy --prod
```

## 📚 Estructura del Proyecto

```
Finanzas/
├── src/
│   ├── App.tsx                 # Componente principal
│   ├── main.tsx               # Punto de entrada
│   ├── store.ts               # Estado global (Zustand)
│   ├── index.css              # Estilos globales
│   ├── App.css                # Estilos de App
│   ├── lib/
│   │   └── supabase.ts        # Cliente y tipos Supabase
│   ├── hooks/
│   │   └── useAuthInit.ts     # Hook de inicialización de auth
│   └── assets/
├── public/                    # Archivos estáticos
├── vite.config.ts            # Configuración Vite
├── tsconfig.json             # Configuración TypeScript
├── tailwind.config.js        # Configuración Tailwind
├── postcss.config.js         # Configuración PostCSS
├── eslint.config.js          # Configuración ESLint
├── package.json              # Dependencias
├── README.md                 # Este archivo
└── USER_GUIDE.md             # Guía de usuario
```

## 🔐 Autenticación

### Modo Demo
- Sin registro requerido
- Datos almacenados en localStorage
- Perfecto para pruebas rápidas

### Autenticación Real (Supabase)
- Crea una cuenta con tu email
- Contraseña segura
- Datos sincronizados en la nube
- Acceso desde múltiples dispositivos

## 📖 Guía de Usuario

Para una guía completa paso a paso, consulta [USER_GUIDE.md](./USER_GUIDE.md)

## 🧪 Testing

El proyecto incluye pruebas manuales extensivas. Para validar que todo funciona:

1. Sigue los pasos en [USER_GUIDE.md](./USER_GUIDE.md)
2. Prueba cada característica listada
3. Verifica que los cálculos son correctos
4. Comprueba la sincronización de datos

## 🐛 Reporte de Bugs

Si encuentras un bug:
1. Abre un issue en GitHub
2. Describe el problema detalladamente
3. Incluye pasos para reproducirlo
4. Adjunta screenshots si es relevante

## 💡 Sugerencias de Mejora

¿Tienes ideas para mejorar DeudaTracker? 
- Abre una discussion en GitHub
- Comparte tu feedback
- Propón nuevas features

## 📄 Licencia

Este proyecto está disponible bajo la licencia MIT.

## 👨‍💻 Autor

**Luis Romero**
- GitHub: [@LuisRomero20](https://github.com/LuisRomero20)

## 🙏 Agradecimientos

- React team por el framework increíble
- Supabase por el backend en la nube
- Vercel por el hosting
- Comunidad open source

## 🔗 Enlaces Útiles

- 🌐 [Aplicación en vivo](https://finanzas-tau-three.vercel.app)
- 📖 [Guía de Usuario](./USER_GUIDE.md)
- 📊 [Supabase Console](https://supabase.com/dashboard)
- 🚀 [Vercel Dashboard](https://vercel.com)

---

**Hecho con ❤️ para gestionar tus finanzas de forma inteligente**
