import React, { useState, useEffect } from "react";
import { useAppStore } from "./store";
import { useThemeStore, applyThemeClass } from "./store/themeStore";
import {
  AlertCircle,
  CheckCircle2,
  Info,
  LayoutDashboard,
  Layers,
  Landmark,
  CreditCard,
  LineChart,
  CalendarRange,
  ShieldCheck,
  TrendingUp,
  Sun,
  Moon,
  Smartphone,
} from "lucide-react";
import { Dashboard } from "./pages/Dashboard";
import { RegistroMovimientoPage } from "./pages/RegistroMovimientoPage";
import { ProyeccionPage } from "./pages/ProyeccionPage";
import { ClasificacionPage } from "./pages/ClasificacionPage";
import { HojaDeudas } from "./pages/HojaDeudas";
import { CronogramaPagos } from "./pages/CronogramaPagos";
import { DashboardsPage } from "./pages/DashboardsPage";
import { useFinanceStore } from "./store/financeStore";

// ============ CONFIGURACIÓN DE TABS ============
interface TabConfig {
  id: string;
  name: string;
  shortName: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const TABS: TabConfig[] = [
  { id: "Finanzas General", name: "Resumen Ejecutivo", shortName: "General", icon: LayoutDashboard },
  { id: "Registro Rápido", name: "📱 Registro Rápido", shortName: "Registrar", icon: Smartphone },
  { id: "Proyecciones", name: "Proyecciones & Cashflow", shortName: "Proyección", icon: CalendarRange },
  { id: "Tarjetas", name: "Cronograma de Tarjetas", shortName: "Tarjetas", icon: CreditCard },
  { id: "Mis Deudas", name: "Gestión de Pasivos", shortName: "Deudas", icon: Landmark },
  { id: "Clasificación", name: "Auditoría de Gastos", shortName: "Clasificación", icon: Layers },
  { id: "Dashboards", name: "Análisis & Tendencias", shortName: "Métricas", icon: LineChart },
];

export default function App() {
  const [tab, setTab] = useState<string>("Finanzas General");
  const { theme } = useThemeStore();
  const { syncFromSupabase } = useFinanceStore();

  // Sincronizar automáticamente con Supabase al abrir la aplicación
  useEffect(() => {
    syncFromSupabase().catch(err => console.warn('Background Supabase sync error:', err));
  }, [syncFromSupabase]);

  // Asegurar sincronización exacta de la clase 'dark' en el documento
  useEffect(() => {
    applyThemeClass(theme);
  }, [theme]);

  return (
    <div className="min-h-screen w-screen overflow-x-hidden bg-[#EEF2F6] dark:bg-[#070C0E] text-slate-800 dark:text-slate-100 flex flex-col justify-between transition-colors duration-200">
      <div>
        <Navbar currentTab={tab} setTab={setTab} />
        <Notifications />
        <main className="w-full max-w-[1750px] mx-auto px-4 sm:px-8 lg:px-12 py-8 animate-in fade-in duration-200">
          {tab === "Finanzas General" && <Dashboard />}
          {tab === "Registro Rápido" && <RegistroMovimientoPage />}
          {tab === "Proyecciones" && <ProyeccionPage />}
          {tab === "Tarjetas" && <CronogramaPagos />}
          {tab === "Mis Deudas" && <HojaDeudas />}
          {tab === "Clasificación" && <ClasificacionPage />}
          {tab === "Dashboards" && <DashboardsPage />}
        </main>
      </div>
      <Footer />
    </div>
  );
}

// 🔔 NOTIFICACIONES GLOBALES
function Notifications() {
  const { notificaciones } = useAppStore();

  return (
    <div className="fixed top-20 right-4 z-50 space-y-2 max-w-sm">
      {notificaciones.map((notif) => (
        <div
          key={notif.id}
          className={`rounded-2xl p-4 shadow-xl border flex items-center gap-3 animate-in fade-in slide-in-from-right duration-200 ${
            notif.tipo === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/80 dark:border-emerald-800 dark:text-emerald-200"
              : notif.tipo === "error"
              ? "bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/80 dark:border-rose-800 dark:text-rose-200"
              : notif.tipo === "warning"
              ? "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/80 dark:border-amber-800 dark:text-amber-200"
              : "bg-slate-50 border-slate-200 text-slate-800 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
          }`}
        >
          {notif.tipo === "success" && <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />}
          {notif.tipo === "error" && <AlertCircle size={18} className="text-rose-600 dark:text-rose-400 shrink-0" />}
          {notif.tipo === "warning" && <AlertCircle size={18} className="text-amber-600 dark:text-amber-400 shrink-0" />}
          {notif.tipo === "info" && <Info size={18} className="text-blue-600 dark:text-blue-400 shrink-0" />}
          <span className="text-xs font-semibold">{notif.mensaje}</span>
        </div>
      ))}
    </div>
  );
}

// 🧭 NAVBAR PROFESIONAL CON SELECTOR DE TEMA DÍA / NOCHE
function Navbar({ currentTab, setTab }: { currentTab: string; setTab: (t: string) => void }) {
  const { theme, setTheme } = useThemeStore();

  return (
    <header className="sticky top-0 z-30 bg-[#0F2A1D] dark:bg-[#07130D] text-white border-b border-emerald-950/60 dark:border-emerald-950 shadow-md transition-colors duration-200">
      <div className="w-full max-w-[1750px] mx-auto px-4 sm:px-8 lg:px-12 py-3 flex items-center justify-between gap-4 flex-wrap">
        
        {/* Brand & Logo */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 p-0.5 shadow-md flex items-center justify-center text-white">
            <TrendingUp size={22} className="stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading font-black text-lg sm:text-xl tracking-tight text-white">
                FINPER
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest bg-emerald-800/80 dark:bg-emerald-900/90 text-emerald-200 border border-emerald-700/50 px-2 py-0.5 rounded-full">
                Cost Analysis
              </span>
            </div>
            <p className="text-[11px] text-emerald-300/80 hidden sm:block">
              Suite de Inteligencia & Gestión Financiera
            </p>
          </div>
        </div>

        {/* Navigation Tabs & Theme Toggle */}
        <div className="flex items-center gap-3">
          
          <nav className="flex items-center gap-1 bg-black/25 dark:bg-black/40 p-1 rounded-2xl border border-white/10 overflow-x-auto">
            {TABS.map((t) => {
              const Icon = t.icon;
              const isActive = currentTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/30"
                      : "text-emerald-200/80 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <Icon size={15} />
                  <span className="hidden md:inline">{t.name}</span>
                  <span className="md:hidden">{t.shortName}</span>
                </button>
              );
            })}
          </nav>

          {/* ☀️ / 🌙 SELECTOR SEGMENTADO CLARO / OSCURO */}
          <div className="flex items-center bg-black/30 dark:bg-black/50 p-1 rounded-2xl border border-white/10 shadow-inner">
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                theme === 'light'
                  ? 'bg-amber-400 text-slate-950 shadow-md ring-1 ring-amber-300'
                  : 'text-emerald-200/70 hover:text-white hover:bg-white/10'
              }`}
              title="Activar Modo Claro / Día"
            >
              <Sun size={14} className={theme === 'light' ? 'text-slate-950' : 'text-amber-300'} />
              <span>Día</span>
            </button>
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                theme === 'dark'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40 ring-1 ring-emerald-400/40'
                  : 'text-emerald-200/70 hover:text-white hover:bg-white/10'
              }`}
              title="Activar Modo Oscuro / Noche"
            >
              <Moon size={14} className={theme === 'dark' ? 'text-amber-300' : 'text-slate-300'} />
              <span>Noche</span>
            </button>
          </div>

        </div>

      </div>
    </header>
  );
}

// 🔗 FOOTER
function Footer() {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0D1518] mt-12 transition-colors duration-200">
      <div className="w-full max-w-[1750px] mx-auto px-4 sm:px-8 lg:px-12 py-6 text-xs text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-emerald-700 dark:text-emerald-400" />
          <span className="font-medium">
            © {new Date().getFullYear()} FinPer — Sistema de Control Financiero y Análisis de Costos
          </span>
        </div>
        <div className="flex items-center gap-4 text-slate-600 dark:text-slate-400 font-medium">
          <span>Moneda Base: <strong>PEN (S/)</strong></span>
          <span>·</span>
          <span>Versión 2.0 Pro</span>
        </div>
      </div>
    </footer>
  );
}
