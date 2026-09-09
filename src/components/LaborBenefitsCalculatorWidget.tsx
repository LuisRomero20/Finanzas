import React, { useState, useMemo } from 'react';
import {
  calculateNetSalary,
  calculateGratification,
  calculateCts,
  calculateAnnualBenefits,
  getUser2026HistoricalAndProjectedTable,
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

  // Pestaña activa: 'simulador' o 'excel2026'
  const [activeTab, setActiveTab] = useState<'simulador' | 'excel2026'>('simulador');

  // Sueldo simulado para comparativa ("Qué pasa si subo de sueldo")
  const [sueldoSimulado, setSueldoSimulado] = useState<number>(3000);

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
                Calculadora de Gratificación & CTS
              </h2>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-950/80 text-emerald-300 border border-emerald-800 px-2.5 py-0.5 rounded-full">
                Ley Laboral Perú (Régimen 728)
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 font-medium">
              Calcula con exactitud tu sueldo neto, gratificación con bono y CTS según lo que ganas.
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

      {/* Tabs Switcher: Simulador de Aumentos vs Tabla Réplica Excel 2026 */}
      <div className="mt-8 pt-6 border-t border-slate-800">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
          <button
            onClick={() => setActiveTab('simulador')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'simulador'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <TrendingUp size={15} />
            <span>Simulador & Proyección de Aumento ("Cuánto tendría")</span>
          </button>

          <button
            onClick={() => setActiveTab('excel2026')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
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
