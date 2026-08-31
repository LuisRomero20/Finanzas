import React, { useState, useEffect, Suspense, lazy } from "react";
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
  RefreshCw,
  Database,
} from "lucide-react";
import { useFinanceStore } from "./store/financeStore";
import { BackupRestoreModal } from "./components/BackupRestoreModal";
import { BottomNavBar } from "./components/BottomNavBar";

// Lazy-loaded routes for high-performance code-splitting
const Dashboard = lazy(() => import("./pages/Dashboard").then(m => ({ default: m.Dashboard })));
const RegistroMovimientoPage = lazy(() => import("./pages/RegistroMovimientoPage").then(m => ({ default: m.RegistroMovimientoPage })));
const ProyeccionPage = lazy(() => import("./pages/ProyeccionPage").then(m => ({ default: m.ProyeccionPage })));
const ClasificacionPage = lazy(() => import("./pages/ClasificacionPage").then(m => ({ default: m.ClasificacionPage })));
const HojaDeudas = lazy(() => import("./pages/HojaDeudas").then(m => ({ default: m.HojaDeudas })));
const CronogramaPagos = lazy(() => import("./pages/CronogramaPagos").then(m => ({ default: m.CronogramaPagos })));
const DashboardsPage = lazy(() => import("./pages/DashboardsPage").then(m => ({ default: m.DashboardsPage })));

// ============ CONFIGURACIÓN DE TABS ============
interface TabConfig {
  id: string;
  name: string;
  shortName: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const TABS: TabConfig[] = [
  { id: "Finanzas General", name: "General", shortName: "General", icon: LayoutDashboard },
  { id: "Registro Rápido", name: "Registrar", shortName: "Registrar", icon: Smartphone },
  { id: "Proyecciones", name: "Proyecciones", shortName: "Proyección", icon: CalendarRange },
  { id: "Tarjetas", name: "Tarjetas", shortName: "Tarjetas", icon: CreditCard },
  { id: "Mis Deudas", name: "Deudas", shortName: "Deudas", icon: Landmark },
  { id: "Clasificación", name: "Categorías", shortName: "Categorías", icon: Layers },
  { id: "Dashboards", name: "Dashboards", shortName: "Métricas", icon: LineChart },
];

export default function App() {
  const [tab, setTab] = useState<string>("Finanzas General");
  const [isBackupOpen, setIsBackupOpen] = useState(false);
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
        <Navbar currentTab={tab} setTab={setTab} onOpenBackup={() => setIsBackupOpen(true)} />
        <Notifications />
        <main className="w-full max-w-[1750px] mx-auto px-4 sm:px-8 lg:px-12 py-5 sm:py-8 pb-28 md:pb-8 animate-in fade-in duration-200">
          <Suspense fallback={<PageLoader />}>
            {tab === "Finanzas General" && <Dashboard />}
            {tab === "Registro Rápido" && <RegistroMovimientoPage />}
            {tab === "Proyecciones" && <ProyeccionPage />}
            {tab === "Tarjetas" && <CronogramaPagos />}
            {tab === "Mis Deudas" && <HojaDeudas />}
            {tab === "Clasificación" && <ClasificacionPage />}
            {tab === "Dashboards" && <DashboardsPage />}
          </Suspense>
        </main>
      </div>
      <Footer onOpenBackup={() => setIsBackupOpen(true)} />
      
      {/* 📱 Dock de Navegación Móvil */}
      <BottomNavBar currentTab={tab} setTab={setTab} onOpenBackup={() => setIsBackupOpen(true)} />

      <BackupRestoreModal isOpen={isBackupOpen} onClose={() => setIsBackupOpen(false)} />
    </div>
  );
}

// ⏳ SKELETON LOADER SUAVE
function PageLoader() {
  return (
    <div className="min-h-[400px] flex flex-col items-center justify-center space-y-4 py-20 animate-in fade-in duration-150">
      <div className="p-3 bg-emerald-100/50 dark:bg-emerald-950/60 rounded-2xl border border-emerald-300 dark:border-emerald-800">
        <RefreshCw size={28} className="animate-spin text-emerald-700 dark:text-emerald-400" />
      </div>
      <div className="text-center">
        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Cargando módulo financiero...</p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Optimizando datos y visualizaciones</p>
      </div>
    </div>
  );
}

// 🔔 NOTIFICACIONES GLOBALES
function Notifications() {
  const { notificaciones } = useAppStore();

  return (
    <div className="fixed top-16 md:top-20 right-4 z-50 space-y-2 max-w-sm">
      {notificaciones.map((notif) => (
        <div
          key={notif.id}
          className={`px-4 py-3 rounded-2xl shadow-lg border backdrop-blur-md flex items-center gap-3 animate-in slide-in-from-top-4 duration-300 ${
            notif.tipo === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/80 dark:border-emerald-800 dark:text-emerald-200"
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

// 🧭 NAVBAR PROFESIONAL (RESPONSIVE & ANTI-COLLISION)
function Navbar({ currentTab, setTab, onOpenBackup }: { currentTab: string; setTab: (t: string) => void; onOpenBackup: () => void }) {
  const { theme, setTheme } = useThemeStore();

  return (
    <header 
      className="sticky top-0 z-30 bg-[#0F2A1D] dark:bg-[#07130D] text-white border-b border-emerald-950/60 dark:border-emerald-950 shadow-md transition-colors duration-200"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <div className="w-full max-w-[1750px] mx-auto px-4 sm:px-8 lg:px-12 py-2 sm:py-3 flex items-center justify-between gap-6">
        
        {/* Brand & Logo (shrink-0 ensures it NEVER collapses or overlaps) */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 p-0.5 shadow-md flex items-center justify-center text-white">
            <TrendingUp size={22} className="stroke-[2.5]" />
          </div>
          <div className="shrink-0">
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

        {/* 💻 Navegación Desktop */}
        <div className="hidden md:flex items-center gap-2.5 min-w-0">
          <nav className="flex items-center gap-1 bg-black/25 dark:bg-black/40 p-1 rounded-2xl border border-white/10 overflow-x-auto no-scrollbar shrink">
            {TABS.map((t) => {
              const Icon = t.icon;
              const isActive = currentTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                    isActive
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/30"
                      : "text-emerald-200/80 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <Icon size={14} />
                  <span>{t.name}</span>
                </button>
              );
            })}
          </nav>

          {/* 💾 BOTÓN RESPALDO & EXCEL */}
          <button
            type="button"
            onClick={onOpenBackup}
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-black/30 dark:bg-black/50 hover:bg-white/10 text-emerald-200 hover:text-white text-xs font-bold border border-white/10 shadow-inner transition cursor-pointer shrink-0"
            title="Abrir Centro de Respaldos & Exportación a Excel/JSON"
          >
            <Database size={14} className="text-emerald-400" />
            <span className="hidden xl:inline">Respaldos</span>
          </button>

          {/* ☀️ / 🌙 SELECTOR SEGMENTADO CLARO / OSCURO */}
          <div className="flex items-center bg-black/30 dark:bg-black/50 p-1 rounded-2xl border border-white/10 shadow-inner shrink-0">
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                theme === 'light'
                  ? 'bg-amber-400 text-slate-950 shadow-md ring-1 ring-amber-300'
                  : 'text-emerald-200/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <Sun size={14} className={theme === 'light' ? 'text-slate-950' : 'text-amber-300'} />
              <span className="hidden xl:inline">Día</span>
            </button>
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                theme === 'dark'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40 ring-1 ring-emerald-400/40'
                  : 'text-emerald-200/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <Moon size={14} className={theme === 'dark' ? 'text-amber-300' : 'text-slate-300'} />
              <span className="hidden xl:inline">Noche</span>
            </button>
          </div>
        </div>

        {/* 📱 Controles Rápidos Móvil (Compactos) */}
        <div className="flex md:hidden items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenBackup}
            className="p-2 rounded-xl bg-black/30 dark:bg-black/50 text-emerald-200 hover:text-white border border-white/10 transition cursor-pointer"
            title="Respaldos y Excel"
          >
            <Database size={16} />
          </button>
          <button
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className={`p-2 rounded-xl border border-white/10 transition cursor-pointer ${
              theme === 'light'
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'bg-black/40 text-amber-300'
            }`}
            title="Cambiar Modo Día / Noche"
          >
            {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
          </button>
        </div>

      </div>
    </header>
  );
}

// 🔗 FOOTER
function Footer({ onOpenBackup }: { onOpenBackup: () => void }) {
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
          <button
            onClick={onOpenBackup}
            className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer font-bold"
          >
            <Database size={13} />
            <span>Descargar Respaldo / Excel</span>
          </button>
          <span>·</span>
          <span>Moneda Base: <strong>PEN (S/)</strong></span>
          <span>·</span>
          <span>Versión 2.0 Pro</span>
        </div>
      </div>
    </footer>
  );
}
