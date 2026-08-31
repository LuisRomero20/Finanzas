import React, { useState } from 'react';
import {
  LayoutDashboard,
  Smartphone,
  CalendarRange,
  CreditCard,
  MoreHorizontal,
  Landmark,
  Layers,
  LineChart,
  Database,
  Search,
  X,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

interface Props {
  currentTab: string;
  setTab: (tab: string) => void;
  onOpenBackup: () => void;
  onOpenSearch: () => void;
}

export const BottomNavBar: React.FC<Props> = ({ currentTab, setTab, onOpenBackup, onOpenSearch }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const PRIMARY_TABS = [
    { id: 'Finanzas General', name: 'General', icon: LayoutDashboard },
    { id: 'Registro Rápido', name: 'Registrar', icon: Smartphone, highlight: true },
    { id: 'Proyecciones', name: 'Proyecciones', icon: CalendarRange },
    { id: 'Tarjetas', name: 'Tarjetas', icon: CreditCard },
  ];

  const SECONDARY_TABS = [
    {
      id: 'Mis Deudas',
      name: 'Deudas',
      desc: 'Cronograma, saldos y pagos programados',
      icon: Landmark,
      color: 'text-amber-500 bg-amber-500/10',
    },
    {
      id: 'Clasificación',
      name: 'Categorías',
      desc: '21 categorías de gastos con emojis y filtros',
      icon: Layers,
      color: 'text-emerald-500 bg-emerald-500/10',
    },
    {
      id: 'Dashboards',
      name: 'Dashboards',
      desc: 'Gráficos de barras, donas y tendencias',
      icon: LineChart,
      color: 'text-blue-500 bg-blue-500/10',
    },
  ];

  const handleSelectTab = (tabId: string) => {
    setTab(tabId);
    setIsMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isSecondaryActive = SECONDARY_TABS.some(t => t.id === currentTab);

  return (
    <>
      {/* 📱 DOCK INFERIOR FIJO PARA SMARTPHONE */}
      <div 
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-[#0c1417]/90 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800/80 px-2 pt-1.5 pb-safe shadow-[0_-8px_20px_rgba(0,0,0,0.06)]"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))' }}
      >
        <nav className="flex items-center justify-around max-w-md mx-auto">
          {PRIMARY_TABS.map((t) => {
            const Icon = t.icon;
            const isActive = currentTab === t.id && !isMenuOpen;

            if (t.highlight) {
              return (
                <button
                  key={t.id}
                  onClick={() => handleSelectTab(t.id)}
                  className="flex flex-col items-center justify-center -mt-5 group cursor-pointer"
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform active:scale-95 ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-emerald-600/40 ring-4 ring-white dark:ring-[#0c1417]'
                      : 'bg-emerald-700 text-white shadow-emerald-900/30'
                  }`}>
                    <Icon size={22} className="stroke-[2.5]" />
                  </div>
                  <span className={`text-[10px] font-bold mt-1 ${
                    isActive ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'
                  }`}>
                    {t.name}
                  </span>
                </button>
              );
            }

            return (
              <button
                key={t.id}
                onClick={() => handleSelectTab(t.id)}
                className={`flex-1 py-1.5 flex flex-col items-center justify-center gap-0.5 rounded-xl transition-all cursor-pointer ${
                  isActive
                    ? 'text-emerald-700 dark:text-emerald-400 font-black'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <div className={`p-1 rounded-xl transition-all ${
                  isActive ? 'bg-emerald-100/70 dark:bg-emerald-950/60' : ''
                }`}>
                  <Icon size={20} className={isActive ? 'stroke-[2.5]' : 'stroke-2'} />
                </div>
                <span className="text-[10px] font-semibold tracking-tight">{t.name}</span>
              </button>
            );
          })}

          {/* Botón MÁS (Menú expandible) */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`flex-1 py-1.5 flex flex-col items-center justify-center gap-0.5 rounded-xl transition-all cursor-pointer ${
              isMenuOpen || isSecondaryActive
                ? 'text-emerald-700 dark:text-emerald-400 font-black'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <div className={`p-1 rounded-xl transition-all ${
              isMenuOpen || isSecondaryActive ? 'bg-emerald-100/70 dark:bg-emerald-950/60' : ''
            }`}>
              <MoreHorizontal size={20} className={isMenuOpen || isSecondaryActive ? 'stroke-[2.5]' : 'stroke-2'} />
            </div>
            <span className="text-[10px] font-semibold tracking-tight">Más</span>
          </button>
        </nav>
      </div>

      {/* 📄 BOTTOM SHEET DRAWER (Para pestañas secundarias y respaldos) */}
      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="fixed inset-0"
            onClick={() => setIsMenuOpen(false)}
          />

          <div className="relative bg-white dark:bg-[#11191D] rounded-t-3xl border-t border-slate-200 dark:border-slate-800 p-6 pb-safe shadow-2xl space-y-4 animate-in slide-in-from-bottom duration-250">
            {/* Grabber handle */}
            <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-2" />

            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">Módulos & Herramientas</h3>
                <p className="text-xs text-slate-400">Acceso rápido a todas las secciones</p>
              </div>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-xl"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2">
              {/* ⚡ Buscador Universal */}
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  onOpenSearch();
                }}
                className="w-full p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border border-emerald-200/70 dark:border-emerald-800/70 flex items-center justify-between transition text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl text-emerald-600 bg-emerald-500/10">
                    <Search size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-emerald-950 dark:text-emerald-200">Buscador Universal</p>
                    <p className="text-[11px] text-emerald-600/70 dark:text-emerald-300/70">Buscar en +700 movimientos (Ctrl + K)</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-emerald-400 shrink-0" />
              </button>

              {SECONDARY_TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = currentTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => handleSelectTab(tab.id)}
                    className={`w-full p-3.5 rounded-2xl flex items-center justify-between transition text-left cursor-pointer ${
                      isActive
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                        : 'bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${tab.color}`}>
                        <Icon size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">{tab.name}</p>
                        <p className="text-[11px] text-slate-400">{tab.desc}</p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-slate-400 shrink-0" />
                  </button>
                );
              })}

              {/* Botón de Respaldos dentro del drawer */}
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  onOpenBackup();
                }}
                className="w-full p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 border border-indigo-200/70 dark:border-indigo-800/70 flex items-center justify-between transition text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl text-indigo-600 bg-indigo-500/10">
                    <Database size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-indigo-950 dark:text-indigo-200">Centro de Respaldos</p>
                    <p className="text-[11px] text-indigo-600/70 dark:text-indigo-300/70">Exportar / Importar Excel y JSON</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-indigo-400 shrink-0" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
