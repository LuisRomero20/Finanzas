import React, { useState, useMemo } from 'react';
import {
  calculateNetSalary,
  calculateGratification,
  calculateCts,
  calculateAnnualBenefits,
  getUser2026HistoricalAndProjectedTable,
  calculateUtilidades,
  SECTORES_UTILIDADES,
  type SectorUtilidades,
  type LaborBenefitConfig,
  ASIGNACION_FAMILIAR_MONTO,
} from '../utils/laborBenefits';
import { useProjectionStore } from '../store/projectionStore';
import {
  Calculator,
  TrendingUp,
  Sparkles,
  Calendar,
  DollarSign,
  ShieldCheck,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
  Send,
  X,
  Layers,
  FileSpreadsheet,
  Zap,
  Info,
  Coins,
  Building2,
  Percent,
} from 'lucide-react';

const fmt = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' });

const SALARY_PRESETS = [
  { label: 'S/ 2,339 (Anterior)', amount: 2339, note: 'Neto: S/ 2,073.06' },
  { label: 'S/ 2,559 (Actual)', amount: 2559, note: 'Neto: S/ 2,259.63' },
  { label: 'S/ 2,800', amount: 2800, note: 'Aumento +S/ 241' },
  { label: 'S/ 3,000', amount: 3000, note: 'Aumento +S/ 441' },
  { label: 'S/ 3,500', amount: 3500, note: 'Aumento +S/ 941' },
  { label: 'S/ 4,000', amount: 4000, note: 'Aumento +S/ 1,441' },
];

interface LaborBenefitsCalculatorWidgetProps {
  onClose?: () => void;
  isModal?: boolean;
}

export const LaborBenefitsCalculatorWidget: React.FC<LaborBenefitsCalculatorWidgetProps> = ({
  onClose,
  isModal = false,
}) => {
  // Estado del Sueldo Principal
  const [sueldoBruto, setSueldoBruto] = useState<number>(2559);
  const [tipoPension, setTipoPension] = useState<LaborBenefitConfig['tipoPension']>('AFP_USER');
  const [tipoSalud, setTipoSalud] = useState<LaborBenefitConfig['tipoSalud']>('ESSALUD');
  const [tieneAsignacionFamiliar, setTieneAsignacionFamiliar] = useState<boolean>(false);
  const [mesesTrabajados, setMesesTrabajados] = useState<number>(6);

  // Pestaña activa: 'simulador' | 'utilidades' | 'excel2026'
  const [activeTab, setActiveTab] = useState<'simulador' | 'utilidades' | 'excel2026'>('simulador');

  // Sueldo simulado para comparativa ("Qué pasa si subo de sueldo")
  const [sueldoSimulado, setSueldoSimulado] = useState<number>(3000);

  // Estado de Participación de Utilidades (D.L. 892)
  const [modoUtilidad, setModoUtilidad] = useState<'MULTIPLOS_SUELDO' | 'OFICIAL_EMPRESA' | 'MONTO_DIRECTO'>('MULTIPLOS_SUELDO');
  const [multiplicadorUtilidad, setMultiplicadorUtilidad] = useState<number>(1.5);
  const [montoDirectoUtilidad, setMontoDirectoUtilidad] = useState<number>(3800);
  const [sectorUtilidad, setSectorUtilidad] = useState<SectorUtilidades>('SERVICIOS_OTROS');
  const [rentaNetaEmpresa, setRentaNetaEmpresa] = useState<number>(5000000);
  const [totalDiasEmpresa, setTotalDiasEmpresa] = useState<number>(26000);
  const [masaSalarialEmpresa, setMasaSalarialEmpresa] = useState<number>(3500000);
  const [diasLaboradosTrabajador, setDiasLaboradosTrabajador] = useState<number>(260);
  const [mesCobroUtilidades, setMesCobroUtilidades] = useState<string>('2027-03');

  // Notificación Toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Cálculos reactivos para el sueldo actual
  const currentConfig: LaborBenefitConfig = useMemo(() => ({
    sueldoBruto,
    tipoPension,
    tipoSalud,
    tieneAsignacionFamiliar,
    mesesTrabajadosSemestre: mesesTrabajados,
  }), [sueldoBruto, tipoPension, tipoSalud, tieneAsignacionFamiliar, mesesTrabajados]);

  const netSalary = useMemo(() => calculateNetSalary(currentConfig), [currentConfig]);
  const gratification = useMemo(() => calculateGratification(currentConfig), [currentConfig]);
  const cts = useMemo(() => calculateCts(currentConfig, gratification.baseCalculo), [currentConfig, gratification.baseCalculo]);
  const annualSummary = useMemo(() => calculateAnnualBenefits(currentConfig), [currentConfig]);

  // Cálculo reactivo de Utilidades Laborales (D.L. 892)
  const utilidadesResult = useMemo(() => {
    return calculateUtilidades({
      modo: modoUtilidad,
      sueldoBruto,
      tieneAsignacionFamiliar,
      diasLaboradosTrabajador,
      sector: sectorUtilidad,
      rentaNetaEmpresa,
      totalDiasEmpresa,
      masaSalarialEmpresa,
      multiplicadorSueldos: multiplicadorUtilidad,
      montoDirecto: montoDirectoUtilidad,
    });
  }, [
    modoUtilidad,
    sueldoBruto,
    tieneAsignacionFamiliar,
    diasLaboradosTrabajador,
    sectorUtilidad,
    rentaNetaEmpresa,
    totalDiasEmpresa,
    masaSalarialEmpresa,
    multiplicadorUtilidad,
    montoDirectoUtilidad,
  ]);

  // Sincronizar Utilidades con Proyecciones
  const handleSyncUtilidadesToProjections = () => {
    const { addItem, items, updateItem } = useProjectionStore.getState();
    const monto = utilidadesResult.utilidadNeta;
    const targetMonth = mesCobroUtilidades;

    const existing = items.find(
      (i) => i.concepto.toLowerCase().includes('utilidad') && i.mesInicio === targetMonth
    );

    if (existing) {
      updateItem(existing.id, { monto });
    } else {
      addItem({
        tipo: 'Ingreso',
        categoria: 'Otro Ing',
        concepto: `Utilidades Laborales (D.L. 892) - ${targetMonth}`,
        monto,
        entidad: 'Interbank',
        dia: 25,
        mesInicio: targetMonth,
        recurrencia: 'unico',
      });
    }

    showToast(`✅ Sincronizado: Utilidades (${fmt.format(monto)}) proyectadas para ${targetMonth}.`);
  };

  // Cálculos reactivos para el sueldo simulado
  const simulatedConfig: LaborBenefitConfig = useMemo(() => ({
    sueldoBruto: sueldoSimulado,
    tipoPension,
    tipoSalud,
    tieneAsignacionFamiliar,
    mesesTrabajadosSemestre: 6,
  }), [sueldoSimulado, tipoPension, tipoSalud, tieneAsignacionFamiliar]);

  const simAnnualSummary = useMemo(() => calculateAnnualBenefits(simulatedConfig), [simulatedConfig]);

  // Tabla real 2026 del usuario
  const table2026 = useMemo(() => {
    return getUser2026HistoricalAndProjectedTable(sueldoBruto);
  }, [sueldoBruto]);

  // Sincronizar CTS de Noviembre y Grati de Diciembre con Proyecciones
  const handleSyncToProjections = () => {
    const { addItem, items, updateItem } = useProjectionStore.getState();

    const ctsMonto = cts.ctsSemestral;
    const gratiMonto = gratification.gratificacionTotal;

    // Buscar si ya existen partidas previas de CTS Nov y Grati Dic
    const existingCts = items.find(i => i.concepto.includes('CTS') && i.mesInicio === '2026-11');
    if (existingCts) {
      updateItem(existingCts.id, { monto: ctsMonto });
    } else {
      addItem({
        tipo: 'Ingreso',
        categoria: 'Otro Ing',
        concepto: 'Depósito CTS Noviembre (Beneficio Laboral)',
        monto: ctsMonto,
        entidad: 'Interbank',
        dia: 15,
        mesInicio: '2026-11',
        recurrencia: 'unico',
      });
    }

    const existingGrati = items.find(i => i.concepto.includes('Gratificación') && i.mesInicio === '2026-12');
    if (existingGrati) {
      updateItem(existingGrati.id, { monto: gratiMonto });
    } else {
      addItem({
        tipo: 'Ingreso',
        categoria: 'Otro Ing',
        concepto: 'Gratificación Legal Diciembre (+9% Bono)',
        monto: gratiMonto,
        entidad: 'Interbank',
        dia: 15,
        mesInicio: '2026-12',
        recurrencia: 'unico',
      });
    }

    showToast(`✅ Sincronizado: CTS Nov (${fmt.format(ctsMonto)}) y Grati Dic (${fmt.format(gratiMonto)}) agregados a Proyecciones.`);
  };

  return (
    <div className="w-full bg-[#0D1519] border border-slate-700/80 rounded-3xl p-5 sm:p-7 shadow-2xl text-white relative transition-all duration-200">
      
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-emerald-500/60 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-bold animate-in fade-in slide-in-from-bottom">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span className="text-white">{toastMsg}</span>
        </div>
      )}

      {/* Header Superior */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div className="flex items-start gap-3">
          <div className="p-3 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl shadow-lg border border-emerald-400/30 text-white">
            <Calculator size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Calculadora de Beneficios Laborales
              </h2>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-950/80 text-emerald-300 border border-emerald-800 px-2.5 py-0.5 rounded-full">
                Grati · CTS · Utilidades (D.L. 728 / 892)
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 font-medium">
              Calcula con exactitud tu sueldo neto, gratificación con bono, CTS y participación de utilidades según lo que ganas.
            </p>
          </div>
        </div>

        {/* Acciones y Botón Cerrar si es Modal */}
        <div className="flex items-center gap-2.5 self-end sm:self-center">
          <button
            onClick={handleSyncToProjections}
            className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950/40 border border-emerald-400/40 transition"
            title="Enviar CTS Noviembre y Grati Diciembre al módulo de Proyecciones"
          >
            <Send size={14} className="text-emerald-100" />
            <span>Proyectar en mi Flujo</span>
          </button>

          {isModal && onClose && (
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
              title="Cerrar ventana"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Controles de Configuración y Entrada de Sueldo */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Columna Izquierda: Input y Presets (5 cols) */}
        <div className="lg:col-span-5 space-y-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-200 mb-2">
              Sueldo Bruto Mensual (Planilla)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400 font-bold text-base">
                S/
              </span>
              <input
                type="number"
                value={sueldoBruto}
                onChange={(e) => setSueldoBruto(Math.max(0, Number(e.target.value)))}
                className="w-full pl-11 pr-4 py-3 bg-[#070C0E] border border-slate-700 focus:border-emerald-500 rounded-xl text-white font-black text-xl tracking-tight outline-none transition"
                placeholder="2559"
              />
            </div>
          </div>

          {/* Presets de Sueldo */}
          <div>
            <span className="block text-[11px] font-semibold text-slate-400 mb-2">
              Valores Rápidos & Tu Historial:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SALARY_PRESETS.map((p) => {
                const isActive = sueldoBruto === p.amount;
                return (
                  <button
                    key={p.amount}
                    type="button"
                    onClick={() => setSueldoBruto(p.amount)}
                    className={`px-2.5 py-2 rounded-xl text-left border transition text-xs ${
                      isActive
                        ? 'bg-emerald-950/80 border-emerald-500 text-white font-bold ring-1 ring-emerald-500'
                        : 'bg-slate-800/80 border-slate-700/80 text-slate-200 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="font-bold text-white leading-tight">{p.label}</div>
                    <div className="text-[10px] text-emerald-400 mt-0.5">{p.note}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Opciones Legales Avanzadas */}
          <div className="pt-3 border-t border-slate-800/80 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {/* AFP / ONP */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Descuento Previsional
                </label>
                <select
                  value={tipoPension}
                  onChange={(e) => setTipoPension(e.target.value as LaborBenefitConfig['tipoPension'])}
                  className="w-full px-2.5 py-1.5 bg-[#070C0E] border border-slate-700 rounded-lg text-xs text-white font-semibold outline-none focus:border-emerald-500"
                >
                  <option value="AFP_USER">AFP Real Boleta (~11.70%)</option>
                  <option value="AFP_INTEGRA">AFP Integra (11.37%)</option>
                  <option value="AFP_PRIMA">AFP Prima (11.60%)</option>
                  <option value="AFP_HABITAT">AFP Hábitat (11.47%)</option>
                  <option value="AFP_PROFUTURO">AFP Profuturo (11.69%)</option>
                  <option value="ONP">ONP (13.00%)</option>
                </select>
              </div>

              {/* Salud / EPS */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Bono de Grati
                </label>
                <select
                  value={tipoSalud}
                  onChange={(e) => setTipoSalud(e.target.value as LaborBenefitConfig['tipoSalud'])}
                  className="w-full px-2.5 py-1.5 bg-[#070C0E] border border-slate-700 rounded-lg text-xs text-white font-semibold outline-none focus:border-emerald-500"
                >
                  <option value="ESSALUD">EsSalud (+9% Bono)</option>
                  <option value="EPS">EPS (+6.75% Bono)</option>
                </select>
              </div>
            </div>

            {/* Asignación Familiar */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-slate-300 font-medium flex items-center gap-1.5">
                <span>Asignación Familiar (+S/ 102.50)</span>
              </span>
              <button
                type="button"
                onClick={() => setTieneAsignacionFamiliar(!tieneAsignacionFamiliar)}
                className={`relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  tieneAsignacionFamiliar ? 'bg-emerald-600' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    tieneAsignacionFamiliar ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Columna Derecha: 4 KPIs Principales (7 cols) */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Card 1: Sueldo Neto Mensual */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-700/90 rounded-2xl p-4 shadow-lg hover:border-emerald-500/50 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Sueldo Neto en Mano
              </span>
              <span className="p-1.5 bg-emerald-950/80 text-emerald-400 rounded-lg border border-emerald-800">
                <DollarSign size={16} />
              </span>
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-black text-white tracking-tight">
              {fmt.format(netSalary.sueldoNeto)}
            </div>
            <div className="mt-2 text-[11px] text-slate-300 flex items-center justify-between pt-2 border-t border-slate-800">
              <span>Descuento AFP ({netSalary.tasaPension.toFixed(2)}%):</span>
              <span className="font-bold text-rose-400">-{fmt.format(netSalary.descuentoPension)}</span>
            </div>
          </div>

          {/* Card 2: Gratificación Legal */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-700/90 rounded-2xl p-4 shadow-lg hover:border-cyan-500/50 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Gratificación Neta
              </span>
              <span className="p-1.5 bg-cyan-950/80 text-cyan-400 rounded-lg border border-cyan-800">
                <Sparkles size={16} />
              </span>
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-black text-cyan-200 tracking-tight">
              {fmt.format(gratification.gratificacionTotal)}
            </div>
            <div className="mt-2 text-[11px] text-slate-300 flex items-center justify-between pt-2 border-t border-slate-800">
              <span>Julio y Diciembre (Inafecta):</span>
              <span className="font-bold text-emerald-400">+{fmt.format(gratification.bonificacionExtraordinaria)} bono</span>
            </div>
          </div>

          {/* Card 3: CTS Semestral */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-700/90 rounded-2xl p-4 shadow-lg hover:border-amber-500/50 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Depósito CTS Semestral
              </span>
              <span className="p-1.5 bg-amber-950/80 text-amber-400 rounded-lg border border-amber-800">
                <ShieldCheck size={16} />
              </span>
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-black text-amber-200 tracking-tight">
              {fmt.format(cts.ctsSemestral)}
            </div>
            <div className="mt-2 text-[11px] text-slate-300 flex items-center justify-between pt-2 border-t border-slate-800">
              <span>Mayo y Noviembre:</span>
              <span className="font-bold text-amber-300">Rem. Comp. {fmt.format(cts.remuneracionComputable)}</span>
            </div>
          </div>

          {/* Card 4: Ingreso Total Percibido Anual */}
          <div className="bg-gradient-to-br from-emerald-950/60 to-slate-900 border border-emerald-600/50 rounded-2xl p-4 shadow-lg hover:border-emerald-400 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                Total Percibido al Año
              </span>
              <span className="p-1.5 bg-emerald-900/80 text-emerald-300 rounded-lg border border-emerald-700">
                <TrendingUp size={16} />
              </span>
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-black text-white tracking-tight">
              {fmt.format(annualSummary.totalPercibidoAnual)}
            </div>
            <div className="mt-2 text-[11px] text-slate-300 flex items-center justify-between pt-2 border-t border-slate-800">
              <span>12 Sueldos + 2 Grati + 2 CTS:</span>
              <span className="font-bold text-white">{fmt.format(annualSummary.totalLiquidoDisponibleEnMano)} en mano</span>
            </div>
          </div>

        </div>
      </div>

      {/* Tabs Switcher: Simulador de Aumentos vs Utilidades vs Tabla Réplica Excel 2026 */}
      <div className="mt-8 pt-6 border-t border-slate-800">
        <div className="flex items-center gap-2 sm:gap-3 border-b border-slate-800 pb-3 flex-wrap">
          <button
            onClick={() => setActiveTab('simulador')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'simulador'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <TrendingUp size={15} />
            <span>Simulador de Sueldo & Aumentos</span>
          </button>

          <button
            onClick={() => setActiveTab('utilidades')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'utilidades'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-950/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Coins size={15} className={activeTab === 'utilidades' ? 'text-amber-200' : 'text-amber-400'} />
            <span>Participación de Utilidades (D.L. 892)</span>
          </button>

          <button
            onClick={() => setActiveTab('excel2026')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'excel2026'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileSpreadsheet size={15} />
            <span>Mi Historial 2026 (Réplica Excel & Proyección)</span>
          </button>
        </div>

        {/* CONTENIDO TAB 1: SIMULADOR DE AUMENTO */}
        {activeTab === 'simulador' && (
          <div className="mt-5 space-y-6 animate-in fade-in duration-150">
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <Zap size={18} className="text-amber-400" />
                    <span>¿Cuánto tendría si subo de sueldo?</span>
                  </h3>
                  <p className="text-xs text-slate-300 mt-1">
                    Compara tu sueldo actual ({fmt.format(sueldoBruto)}) contra una nueva propuesta o aumento laboral.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-300">Simular Sueldo:</span>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400 font-bold text-xs">S/</span>
                    <input
                      type="number"
                      value={sueldoSimulado}
                      onChange={(e) => setSueldoSimulado(Math.max(0, Number(e.target.value)))}
                      className="w-32 pl-8 pr-3 py-1.5 bg-[#070C0E] border border-slate-700 focus:border-cyan-500 rounded-xl text-white font-bold text-sm outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Comparativa Lado a Lado */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
                
                {/* Diferencia Mensual */}
                <div className="bg-[#070C0E] border border-slate-800 rounded-xl p-4">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Diferencia Mensual Neta
                  </span>
                  <div className="text-xl font-black text-emerald-400 mt-1">
                    +{fmt.format(simAnnualSummary.sueldoNetoMensual - annualSummary.sueldoNetoMensual)} / mes
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1">
                    De {fmt.format(annualSummary.sueldoNetoMensual)} a {fmt.format(simAnnualSummary.sueldoNetoMensual)} neto
                  </p>
                </div>

                {/* Diferencia en Beneficios (Grati & CTS) */}
                <div className="bg-[#070C0E] border border-slate-800 rounded-xl p-4">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Incremento en Grati & CTS
                  </span>
                  <div className="text-xl font-black text-cyan-300 mt-1">
                    +{fmt.format(
                      (simAnnualSummary.gratificacionJulio - annualSummary.gratificacionJulio) +
                      (simAnnualSummary.ctsMayo - annualSummary.ctsMayo)
                    )} / semestre
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1">
                    +Grati: {fmt.format(simAnnualSummary.gratificacionJulio - annualSummary.gratificacionJulio)} | +CTS: {fmt.format(simAnnualSummary.ctsMayo - annualSummary.ctsMayo)}
                  </p>
                </div>

                {/* Diferencia Anual Total */}
                <div className="bg-gradient-to-br from-emerald-950/80 to-[#070C0E] border border-emerald-500/50 rounded-xl p-4">
                  <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider">
                    Ganancia Total Anual
                  </span>
                  <div className="text-xl font-black text-white mt-1">
                    +{fmt.format(simAnnualSummary.totalPercibidoAnual - annualSummary.totalPercibidoAnual)}
                  </div>
                  <p className="text-[11px] text-slate-200 mt-1 font-medium">
                    Total anual de {fmt.format(annualSummary.totalPercibidoAnual)} a {fmt.format(simAnnualSummary.totalPercibidoAnual)}
                  </p>
                </div>

              </div>

              {/* Desglose de Porcentajes del Ingreso Anual */}
              <div className="mt-5 p-4 bg-[#070C0E] border border-slate-800 rounded-xl">
                <span className="text-xs font-bold text-white block mb-2">
                  Estructura de cómo recibes tu dinero en el año ({fmt.format(annualSummary.totalPercibidoAnual)}):
                </span>
                <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden flex">
                  <div
                    style={{ width: `${(annualSummary.totalSueldosNetosAnual / annualSummary.totalPercibidoAnual) * 100}%` }}
                    className="bg-emerald-500 h-full"
                    title={`Sueldos Netos: ${fmt.format(annualSummary.totalSueldosNetosAnual)}`}
                  />
                  <div
                    style={{ width: `${(annualSummary.totalGratificacionesAnual / annualSummary.totalPercibidoAnual) * 100}%` }}
                    className="bg-cyan-500 h-full"
                    title={`Gratificaciones: ${fmt.format(annualSummary.totalGratificacionesAnual)}`}
                  />
                  <div
                    style={{ width: `${(annualSummary.totalCtsAnual / annualSummary.totalPercibidoAnual) * 100}%` }}
                    className="bg-amber-500 h-full"
                    title={`CTS: ${fmt.format(annualSummary.totalCtsAnual)}`}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-300 mt-2 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                    <span>Sueldos Netos (76%)</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-cyan-500 rounded-full" />
                    <span>Gratificaciones (16%)</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-amber-500 rounded-full" />
                    <span>Depósito CTS (8%)</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CONTENIDO TAB UTILIDADES (D.L. 892) */}
        {activeTab === 'utilidades' && (
          <div className="mt-5 space-y-6 animate-in fade-in duration-150">
            {/* Cabecera descriptiva */}
            <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-[#070C0E] border border-amber-500/30 rounded-2xl p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <Coins size={20} className="text-amber-400" />
                    <span>Cálculo de Utilidades Laborales (D.L. N° 892)</span>
                  </h3>
                  <p className="text-xs text-slate-300 mt-1">
                    Beneficio legal para trabajadores en empresas privadas con más de 20 trabajadores que generan rentas de 3ra categoría.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-bold bg-amber-950/80 text-amber-300 border border-amber-800/80 px-2.5 py-1 rounded-lg">
                    Pago: Marzo - Abril
                  </span>
                  <span className="text-[11px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 px-2.5 py-1 rounded-lg">
                    ✓ Inafecto de AFP y EsSalud
                  </span>
                </div>
              </div>

              {/* Selector de Modo de Cálculo */}
              <div className="mt-5 flex items-center gap-2 bg-[#070C0E] p-1.5 rounded-xl border border-slate-800 max-w-xl">
                <button
                  type="button"
                  onClick={() => setModoUtilidad('MULTIPLOS_SUELDO')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    modoUtilidad === 'MULTIPLOS_SUELDO'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Percent size={13} />
                  <span>Por Múltiplos de Sueldo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModoUtilidad('OFICIAL_EMPRESA')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    modoUtilidad === 'OFICIAL_EMPRESA'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Building2 size={13} />
                  <span>Fórmula Oficial 50/50</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModoUtilidad('MONTO_DIRECTO')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    modoUtilidad === 'MONTO_DIRECTO'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <DollarSign size={13} />
                  <span>Monto Libre</span>
                </button>
              </div>

              {/* Formulario según modo */}
              {modoUtilidad === 'MULTIPLOS_SUELDO' && (
                <div className="mt-5 p-4 bg-slate-900/60 rounded-xl border border-slate-800/80 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <span className="text-xs font-bold text-slate-300">
                      ¿Cuántos sueldos suele repartir tu empresa? (Histórico o expectativa):
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="18"
                        value={multiplicadorUtilidad}
                        onChange={(e) => setMultiplicadorUtilidad(Math.max(0, Number(e.target.value)))}
                        className="w-24 px-3 py-1.5 bg-[#070C0E] border border-slate-700 rounded-xl text-white font-bold text-xs outline-none focus:border-amber-500 text-right"
                      />
                      <span className="text-xs font-bold text-amber-300">sueldos</span>
                    </div>
                  </div>

                  {/* Chips Presets */}
                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    {[
                      { label: '0.5 sueldo', val: 0.5 },
                      { label: '1.0 sueldo', val: 1.0 },
                      { label: '1.5 sueldos (Promedio)', val: 1.5 },
                      { label: '2.0 sueldos', val: 2.0 },
                      { label: '3.0 sueldos', val: 3.0 },
                    ].map((chip) => (
                      <button
                        key={chip.val}
                        type="button"
                        onClick={() => setMultiplicadorUtilidad(chip.val)}
                        className={`text-[11px] font-bold px-3 py-1 rounded-lg border transition ${
                          multiplicadorUtilidad === chip.val
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500'
                            : 'bg-slate-800/60 text-slate-300 border-slate-700 hover:border-slate-500'
                        }`}
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {modoUtilidad === 'OFICIAL_EMPRESA' && (
                <div className="mt-5 p-4 bg-slate-900/60 rounded-xl border border-slate-800/80 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Sector Económico */}
                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">
                        Sector / Actividad de la Empresa:
                      </label>
                      <select
                        value={sectorUtilidad}
                        onChange={(e) => setSectorUtilidad(e.target.value as SectorUtilidades)}
                        className="w-full px-3 py-2 bg-[#070C0E] border border-slate-700 rounded-xl text-white font-bold text-xs outline-none focus:border-amber-500"
                      >
                        {Object.values(SECTORES_UTILIDADES).map((sec) => (
                          <option key={sec.id} value={sec.id}>
                            {sec.nombre} ({sec.porcentaje}%)
                          </option>
                        ))}
                      </select>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        Porcentaje a repartir por ley: <strong className="text-amber-300">{SECTORES_UTILIDADES[sectorUtilidad].porcentaje}% de la renta neta</strong>
                      </span>
                    </div>

                    {/* Renta Neta Imponible */}
                    <div>
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">
                        Utilidad Neta de la Empresa (S/):
                      </label>
                      <input
                        type="number"
                        step="10000"
                        value={rentaNetaEmpresa}
                        onChange={(e) => setRentaNetaEmpresa(Math.max(0, Number(e.target.value)))}
                        className="w-full px-3 py-2 bg-[#070C0E] border border-slate-700 rounded-xl text-white font-bold text-xs outline-none focus:border-amber-500"
                        placeholder="Ej. 5000000"
                      />
                      <span className="text-[10px] text-slate-400 mt-1 block">Renta antes de impuestos</span>
                    </div>

                    {/* Días Trabajados del Usuario */}
                    <div>
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">
                        Tus Días Laborados en el Año:
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="365"
                        value={diasLaboradosTrabajador}
                        onChange={(e) => setDiasLaboradosTrabajador(Math.min(365, Math.max(1, Number(e.target.value))))}
                        className="w-full px-3 py-2 bg-[#070C0E] border border-slate-700 rounded-xl text-white font-bold text-xs outline-none focus:border-amber-500"
                      />
                      <span className="text-[10px] text-slate-400 mt-1 block">Año completo: 260 a 300 días</span>
                    </div>

                    {/* Días Totales de toda la Planilla */}
                    <div>
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">
                        Días Totales de la Planilla Empresa:
                      </label>
                      <input
                        type="number"
                        step="1000"
                        value={totalDiasEmpresa}
                        onChange={(e) => setTotalDiasEmpresa(Math.max(1, Number(e.target.value)))}
                        className="w-full px-3 py-2 bg-[#070C0E] border border-slate-700 rounded-xl text-white font-bold text-xs outline-none focus:border-amber-500"
                      />
                      <span className="text-[10px] text-slate-400 mt-1 block">Suma de días de todos</span>
                    </div>

                    {/* Masa Salarial Anual de la Empresa */}
                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">
                        Masa Salarial Anual de toda la Empresa (S/):
                      </label>
                      <input
                        type="number"
                        step="50000"
                        value={masaSalarialEmpresa}
                        onChange={(e) => setMasaSalarialEmpresa(Math.max(1, Number(e.target.value)))}
                        className="w-full px-3 py-2 bg-[#070C0E] border border-slate-700 rounded-xl text-white font-bold text-xs outline-none focus:border-amber-500"
                      />
                      <span className="text-[10px] text-slate-400 mt-1 block">Suma de remuneraciones brutas de todo el personal</span>
                    </div>

                    {/* Fondo total a repartir */}
                    <div className="sm:col-span-2 flex items-center justify-between p-3 bg-amber-950/30 border border-amber-800/40 rounded-xl">
                      <span className="text-xs font-bold text-amber-200">Fondo Total a Repartir ({SECTORES_UTILIDADES[sectorUtilidad].porcentaje}%):</span>
                      <span className="text-base font-black text-amber-300">{fmt.format(utilidadesResult.fondoTotalDistribuir || 0)}</span>
                    </div>
                  </div>
                </div>
              )}

              {modoUtilidad === 'MONTO_DIRECTO' && (
                <div className="mt-5 p-4 bg-slate-900/60 rounded-xl border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <span className="text-xs font-bold text-slate-300">
                    Ingresa el monto bruto estimado de utilidades que te comunicaron:
                  </span>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-400 font-bold text-xs">S/</span>
                    <input
                      type="number"
                      value={montoDirectoUtilidad}
                      onChange={(e) => setMontoDirectoUtilidad(Math.max(0, Number(e.target.value)))}
                      className="w-36 pl-8 pr-3 py-1.5 bg-[#070C0E] border border-slate-700 rounded-xl text-white font-bold text-sm outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Tarjeta Principal de Resultados */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
              
              {/* Tarjeta Destacada: Neto Líquido */}
              <div className="lg:col-span-5 bg-gradient-to-br from-amber-900/60 via-amber-950/80 to-[#070C0E] border border-amber-500/50 rounded-2xl p-6 flex flex-col justify-between shadow-2xl">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                      Utilidad Neta a Cobrar
                    </span>
                    <span className="p-2 bg-amber-500/20 text-amber-300 rounded-xl border border-amber-500/40">
                      <Coins size={20} />
                    </span>
                  </div>
                  <div className="mt-3 text-3xl sm:text-4xl font-black text-amber-200 tracking-tight">
                    {fmt.format(utilidadesResult.utilidadNeta)}
                  </div>
                  <p className="text-xs text-amber-300/80 mt-1 font-medium">
                    Líquido estimado en cuenta (después de 5ta categoría).
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-amber-700/40 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Utilidad Bruta Calculada:</span>
                    <span className="font-bold text-white">{fmt.format(utilidadesResult.utilidadBruta)}</span>
                  </div>
                  {utilidadesResult.superaTope && (
                    <div className="flex items-center justify-between text-rose-300">
                      <span>Excedente sobre Tope 18 sueldos:</span>
                      <span className="font-bold">-{fmt.format(utilidadesResult.excedenteTope)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Retención I.R. 5ta Categoría:</span>
                    <span className={`font-bold ${utilidadesResult.retencionQuintaCategoriaEstimada > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {utilidadesResult.retencionQuintaCategoriaEstimada > 0
                        ? `-${fmt.format(utilidadesResult.retencionQuintaCategoriaEstimada)}`
                        : 'S/ 0.00 (Inafecto < 7 UIT)'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-emerald-300">
                    <span>Descuento AFP / ONP (Ley):</span>
                    <span className="font-bold">S/ 0.00 (100% Exento)</span>
                  </div>
                </div>
              </div>

              {/* Grid 7 cols: Desglose de Factores y Tope Legal */}
              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* 50% por Días */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase text-slate-400 block">
                      50% por Días Laborados
                    </span>
                    <div className="text-xl sm:text-2xl font-black text-white mt-1">
                      {fmt.format(utilidadesResult.montoPorDias)}
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Días considerados:</span>
                    <span className="font-bold text-slate-200">{utilidadesResult.diasTrabajador} días</span>
                  </div>
                </div>

                {/* 50% por Remuneración */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase text-slate-400 block">
                      50% por Remuneración Percibida
                    </span>
                    <div className="text-xl sm:text-2xl font-black text-white mt-1">
                      {fmt.format(utilidadesResult.montoPorRemuneracion)}
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Remun. computable:</span>
                    <span className="font-bold text-slate-200">{fmt.format(utilidadesResult.remuneracionAnualComputable)}</span>
                  </div>
                </div>

                {/* Tope Legal de 18 Remuneraciones */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase text-slate-400">
                        Tope Legal (18 Sueldos)
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        utilidadesResult.superaTope ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}>
                        {utilidadesResult.superaTope ? 'Tope Aplicado' : 'Dentro del Límite'}
                      </span>
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-amber-200 mt-1">
                      {fmt.format(utilidadesResult.tope18Sueldos)}
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2">
                    Límite máximo por ley: 18 veces tu remuneración mensual computable ({fmt.format(utilidadesResult.remuneracionComputableMensual)}).
                  </p>
                </div>

                {/* Integración: Sincronizar con Proyecciones */}
                <div className="bg-gradient-to-br from-slate-900 to-[#0F2A1D] border border-emerald-600/40 rounded-2xl p-4 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase text-emerald-300 block">
                      Sincronizar a Proyecciones
                    </span>
                    <p className="text-[11px] text-slate-300 mt-1">
                      Proyecta la liquidez de tus utilidades en el mes de desembolso legal.
                    </p>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <select
                      value={mesCobroUtilidades}
                      onChange={(e) => setMesCobroUtilidades(e.target.value)}
                      className="px-2.5 py-1.5 bg-[#070C0E] border border-slate-700 rounded-xl text-white font-bold text-xs outline-none focus:border-emerald-500"
                    >
                      <option value="2027-03">Marzo 2027</option>
                      <option value="2027-04">Abril 2027</option>
                      <option value="2026-03">Marzo 2026</option>
                      <option value="2026-04">Abril 2026</option>
                    </select>

                    <button
                      type="button"
                      onClick={handleSyncUtilidadesToProjections}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition"
                    >
                      <Send size={13} />
                      <span>Proyectar</span>
                    </button>
                  </div>
                </div>

              </div>

            </div>

            {/* Garantías de Ley */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 flex items-start gap-2.5">
                <ShieldCheck size={18} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block">Cero Descuento AFP/ONP</strong>
                  <span className="text-slate-400 text-[11px]">Por el D.L. 892 Art. 9, las utilidades son conceptos no remunerativos libres de aportes previsionales.</span>
                </div>
              </div>

              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 flex items-start gap-2.5">
                <CheckCircle2 size={18} className="text-teal-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block">Inafecto a EsSalud</strong>
                  <span className="text-slate-400 text-[11px]">El empleador no realiza aporte de EsSalud (9%) sobre el importe de las utilidades.</span>
                </div>
              </div>

              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 flex items-start gap-2.5">
                <Info size={18} className="text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block">Plazo Legal de Pago</strong>
                  <span className="text-slate-400 text-[11px]">Se abonan dentro de los 30 días posteriores al vencimiento de la DJ Anual del I.R. a la SUNAT.</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CONTENIDO TAB 2: RÉPLICA EXACTA EXCEL 2026 */}
        {activeTab === 'excel2026' && (
          <div className="mt-5 space-y-4 animate-in fade-in duration-150">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <FileSpreadsheet size={18} className="text-emerald-400" />
                  <span>Tu Cuadro 2026: Histórico Real + Cierre Proyectado</span>
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  Enero a Setiembre con tus montos reales (S/ 23,968.23) y Octubre a Diciembre con tus beneficios proyectados.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold">
                <span className="flex items-center gap-1 text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-slate-500" /> Real
                </span>
                <span className="flex items-center gap-1 text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> Proyectado
                </span>
              </div>
            </div>

            {/* Tabla Dinámica Responsive */}
            <div className="overflow-x-auto border border-slate-700/80 rounded-2xl bg-[#070C0E] shadow-xl">
              <table className="w-full text-xs text-left text-white border-collapse min-w-[950px]">
                <thead>
                  <tr className="bg-slate-900/90 text-slate-300 uppercase tracking-wider text-[10px] border-b border-slate-800">
                    <th className="py-3 px-4 sticky left-0 bg-slate-900 font-bold z-10">Etiquetas de fila</th>
                    {table2026.columns.map((c) => (
                      <th
                        key={c.mes}
                        className={`py-3 px-3 text-right font-bold ${
                          c.esProyectado ? 'text-emerald-400 bg-emerald-950/20' : 'text-slate-200'
                        }`}
                      >
                        {c.mesAbrev}
                        {c.esProyectado && <span className="block text-[8px] font-normal text-emerald-500">Proj</span>}
                      </th>
                    ))}
                    <th className="py-3 px-4 text-right font-black text-white bg-slate-900/90">Total General</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 font-medium">
                  {/* Fila CTS */}
                  <tr className="hover:bg-slate-800/40 transition">
                    <td className="py-2.5 px-4 font-bold text-amber-300 sticky left-0 bg-[#070C0E] z-10">
                      CTS
                    </td>
                    {table2026.columns.map((c) => (
                      <td key={c.mes} className="py-2.5 px-3 text-right text-slate-200 font-mono">
                        {c.cts ? (
                          <span className="font-bold text-amber-300 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-800/50">
                            {fmt.format(c.cts)}
                          </span>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                    ))}
                    <td className="py-2.5 px-4 text-right font-black text-amber-300 font-mono bg-slate-900/40">
                      {fmt.format(table2026.totalCts)}
                    </td>
                  </tr>

                  {/* Fila Gratificación */}
                  <tr className="hover:bg-slate-800/40 transition">
                    <td className="py-2.5 px-4 font-bold text-cyan-300 sticky left-0 bg-[#070C0E] z-10">
                      Gratificación
                    </td>
                    {table2026.columns.map((c) => (
                      <td key={c.mes} className="py-2.5 px-3 text-right text-slate-200 font-mono">
                        {c.gratificacion ? (
                          <span className="font-bold text-cyan-300 bg-cyan-950/40 px-1.5 py-0.5 rounded border border-cyan-800/50">
                            {fmt.format(c.gratificacion)}
                          </span>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                    ))}
                    <td className="py-2.5 px-4 text-right font-black text-cyan-300 font-mono bg-slate-900/40">
                      {fmt.format(table2026.totalGrati)}
                    </td>
                  </tr>

                  {/* Fila Sueldo */}
                  <tr className="hover:bg-slate-800/40 transition">
                    <td className="py-2.5 px-4 font-bold text-white sticky left-0 bg-[#070C0E] z-10">
                      Sueldo Neto
                    </td>
                    {table2026.columns.map((c) => (
                      <td key={c.mes} className="py-2.5 px-3 text-right text-slate-200 font-mono">
                        {fmt.format(c.sueldo)}
                      </td>
                    ))}
                    <td className="py-2.5 px-4 text-right font-black text-white font-mono bg-slate-900/40">
                      {fmt.format(table2026.totalSueldo)}
                    </td>
                  </tr>

                  {/* Fila Total General */}
                  <tr className="bg-slate-900/90 font-black border-t-2 border-slate-700">
                    <td className="py-3 px-4 text-white sticky left-0 bg-slate-900 z-10">
                      Total general
                    </td>
                    {table2026.columns.map((c) => (
                      <td
                        key={c.mes}
                        className={`py-3 px-3 text-right font-mono ${
                          c.cts || c.gratificacion ? 'text-emerald-400 font-bold' : 'text-white'
                        }`}
                      >
                        {fmt.format(c.total)}
                      </td>
                    ))}
                    <td className="py-3 px-4 text-right font-black text-emerald-400 text-sm font-mono bg-slate-900">
                      {fmt.format(table2026.totalGeneral)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-slate-300 bg-slate-900/70 p-3 rounded-xl border border-slate-800 gap-2">
              <div className="flex items-center gap-2">
                <Info size={16} className="text-emerald-400 flex-shrink-0" />
                <span>
                  Acumulado real percibido de Ene a Set: <strong>{fmt.format(23968.23)}</strong>. Total estimado al cierre del 2026: <strong>{fmt.format(table2026.totalGeneral)}</strong>.
                </span>
              </div>
              <button
                onClick={handleSyncToProjections}
                className="text-emerald-400 hover:text-emerald-300 underline font-bold flex items-center gap-1 text-xs"
              >
                <span>Sincronizar con mis proyecciones</span>
                <ArrowRight size={12} />
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export interface LaborBenefitsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LaborBenefitsModal: React.FC<LaborBenefitsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-5xl my-auto animate-in zoom-in-95 duration-200">
        <LaborBenefitsCalculatorWidget isModal={true} onClose={onClose} />
      </div>
    </div>
  );
};
