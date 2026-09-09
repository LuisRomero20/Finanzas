import React, { useState, useMemo } from 'react';
import {
  Calculator,
  Snowflake,
  Flame,
  Zap,
  CheckCircle2,
  TrendingDown,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  PlusCircle,
  X,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { calculateDebtPayoff, type DebtItem } from '../utils/debtPayoffSimulator';

export interface DeudaItemStore {
  id: string;
  acreedor: string;
  monto: number;
  tasa_anual: number;
  plazo_meses: number;
  meses_pagados: number;
  tipo_tasa: string;
  moneda: string;
  estado: string;
}

interface Props {
  deudas?: DeudaItemStore[];
  onPreFillNewDebt?: (debt: {
    acreedor: string;
    monto: number;
    tasa_anual: number;
    plazo_meses: number;
  }) => void;
}

const fmt = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' });

export const DebtPayoffSimulatorWidget: React.FC<Props> = ({ deudas = [], onPreFillNewDebt }) => {
  // Pestañas principales: 'proxima' (Simulador de Deuda Próxima) vs 'estrategia' (Liquidación de Deudas Actuales)
  const [activeTab, setActiveTab] = useState<'proxima' | 'estrategia'>('proxima');

  // ── ESTADOS PARA SIMULADOR DE PRÓXIMA DEUDA ──
  const [proximoConcepto, setProximoConcepto] = useState('Próximo Préstamo Personal');
  const [proximoMonto, setProximoMonto] = useState<number>(3000);
  const [proximoPlazo, setProximoPlazo] = useState<number>(12); // meses
  const [proximaTea, setProximaTea] = useState<number>(24.0); // % anual
  const [proximoAbonoExtra, setProximoAbonoExtra] = useState<number>(0);
  const [showAmortizationSchedule, setShowAmortizationSchedule] = useState<boolean>(false);

  // ── ESTADOS PARA ESTRATEGIA DE DEUDAS ACTUALES ──
  const [strategy, setStrategy] = useState<'snowball' | 'avalanche'>('snowball');
  const [extraPayment, setExtraPayment] = useState<number>(200);
  const [incluirProximaEnEstrategia, setIncluirProximaEnEstrategia] = useState<boolean>(false);

  // ── ESTADO DEL MODAL / TOOLTIP DE INCÓGNITO (?) ──
  // Guarda la clave de la opción sobre la cual el usuario quiere saber "¿a qué se refiere?"
  const [helpInfoKey, setHelpInfoKey] = useState<string | null>(null);

  // ── DICCIONARIO EXPLICATIVO DE INCÓGNITO (?) ──
  const HELP_DICTIONARY: Record<string, { title: string; desc: string; icon: string; highlight?: string }> = {
    snowball: {
      title: 'Método Bola de Nieve (Snowball)',
      desc: 'Esta estrategia ordena todas tus deudas de menor a mayor saldo pendiente. Pagas el monto mínimo en todas y concentras cualquier dinero extra en eliminar primero la deuda más pequeña. Al liquidar tu primera deuda rápidamente, sientes un impulso psicológico inmediato y puedes usar todo ese dinero liberado para atacar la siguiente.',
      icon: '❄️',
      highlight: 'Ideal para: Ganar motivación y reducir el número de acreedores rápido.',
    },
    avalanche: {
      title: 'Método Avalancha (Avalanche)',
      desc: 'Esta estrategia ordena tus deudas de mayor a menor tasa de interés (TEA). Pagas el mínimo en todas y concentras el dinero extra en la deuda más cara (la que cobra más intereses). Matemáticamente es la más eficiente porque te ahorra la mayor cantidad posible de dinero en intereses bancarios.',
      icon: '⚡',
      highlight: 'Ideal para: Pagar la menor cantidad posible de intereses al banco.',
    },
    tea: {
      title: 'TEA (Tasa Efectiva Anual)',
      desc: 'Es el costo real que te cobra una entidad financiera por prestarte dinero durante un año. Incluye la capitalización de los intereses. En el Perú, préstamos personales suelen tener una TEA de 18% a 35%, mientras que tarjetas de crédito o retiros de efectivo pueden llegar al 50% - 90% TEA.',
      icon: '📈',
      highlight: 'Tip: A menor TEA, menor será tu cuota y menos intereses pagarás.',
    },
    abonoExtra: {
      title: 'Abono Extra Mensual al Capital',
      desc: 'Es un pago adicional voluntario que se descuenta 100% del saldo deudor principal (capital), no de los intereses futuros. Al reducir el capital directamente, el banco recalcula los intereses y tu deuda se extingue en muchos menos meses de lo pactado.',
      icon: '💰',
      highlight: 'Tip: Incluso S/ 50 o S/ 100 extra al mes pueden ahorrarte cientos de soles en intereses.',
    },
    cuotaFija: {
      title: 'Cuota Mensual (Sistema Francés)',
      desc: 'Es la fórmula bancaria estándar en Perú: pagas un monto idéntico cada mes. Al principio de la vida del crédito, la mayor parte de tu cuota son intereses y amortizas poco capital; hacia el final, amortizas casi todo a capital y pagas casi nada de interés.',
      icon: '🧮',
      highlight: 'Resultado: Cuota fija y predecible todos los meses.',
    },
    combinarSimulacion: {
      title: 'Incluir Deuda Simulada en Estrategia Global',
      desc: 'Suma esta deuda hipotética que estás pensando sacar a tus deudas reales ya existentes (como Préstamo Yape, iPhone 16, BCP) para ver cómo cambiaría tu fecha de libertad financiera y en qué orden te convendría pagarla.',
      icon: '🔮',
      highlight: 'Te permite ver el impacto global antes de firmar cualquier contrato.',
    },
  };

  // ── CÁLCULO DE LA PRÓXIMA DEUDA SIMULADA ──
  const proximaSimulacion = useMemo(() => {
    const P = Math.max(0, proximoMonto);
    const n = Math.max(1, proximoPlazo);
    const teaDecimal = Math.max(0, proximaTea) / 100;
    
    // Tasa mensual efectiva
    const i_m = teaDecimal > 0 ? Math.pow(1 + teaDecimal, 1 / 12) - 1 : 0;

    // Cuota regular sin abonos extras
    let cuotaRegular = 0;
    if (i_m > 0) {
      cuotaRegular = (P * i_m * Math.pow(1 + i_m, n)) / (Math.pow(1 + i_m, n) - 1);
    } else {
      cuotaRegular = P / n;
    }

    const totalSinExtra = cuotaRegular * n;
    const interesesSinExtra = Math.max(0, totalSinExtra - P);

    // Cronograma mes a mes (considerando abono extra si existe)
    let saldo = P;
    let mes = 0;
    let totalInteresConExtra = 0;
    let totalPagadoConExtra = 0;
    const schedule: {
      mes: number;
      cuotaBase: number;
      abonoExtra: number;
      cuotaTotal: number;
      capital: number;
      interes: number;
      saldoRestante: number;
    }[] = [];

    while (saldo > 0.01 && mes < 120) {
      mes++;
      const interesMes = saldo * i_m;
      totalInteresConExtra += interesMes;

      const pagoRequerido = Math.min(saldo + interesMes, cuotaRegular);
      const extra = Math.min(Math.max(0, saldo + interesMes - pagoRequerido), proximoAbonoExtra);
      const pagoTotal = pagoRequerido + extra;
      const amortizacionCapital = pagoTotal - interesMes;

      saldo = Math.max(0, saldo - amortizacionCapital);
      totalPagadoConExtra += pagoTotal;

      schedule.push({
        mes,
        cuotaBase: pagoRequerido,
        abonoExtra: extra,
        cuotaTotal: pagoTotal,
        capital: amortizacionCapital,
        interes: interesMes,
        saldoRestante: saldo,
      });

      if (saldo <= 0.01) break;
    }

    const mesesParaPagar = mes;
    const interesesAhorrados = Math.max(0, interesesSinExtra - totalInteresConExtra);
    const mesesAhorrados = Math.max(0, n - mesesParaPagar);

    return {
      cuotaRegular,
      interesesSinExtra,
      totalSinExtra,
      mesesParaPagar,
      mesesAhorrados,
      interesesAhorrados,
      totalConExtra: totalPagadoConExtra,
      interesesConExtra: totalInteresConExtra,
      schedule,
    };
  }, [proximoMonto, proximoPlazo, proximaTea, proximoAbonoExtra]);

  // ── CÁLCULO DE DEUDAS ACTIVAS EN CURSO ──
  const activeDebts: DebtItem[] = useMemo(() => {
    const list: DebtItem[] = deudas
      .filter((d) => d.estado === 'activa')
      .map((d) => {
        const i_m = d.tipo_tasa === 'efectiva' ? Math.pow(1 + d.tasa_anual, 1 / 12) - 1 : d.tasa_anual / 12;
        const n = Math.max(1, d.plazo_meses - d.meses_pagados);
        const cuota = i_m > 0 ? (d.monto * i_m) / (1 - Math.pow(1 + i_m, -n)) : d.monto / n;

        return {
          id: d.id,
          name: d.acreedor,
          balance: d.monto,
          minPayment: Math.max(10, Math.round(cuota)),
          interestRate: Number((d.tasa_anual * 100).toFixed(1)),
        };
      });

    // Si el usuario marcó incluir la próxima deuda simulada en la estrategia
    if (incluirProximaEnEstrategia && proximoMonto > 0) {
      list.push({
        id: 'simulada-proxima',
        name: `🔮 ${proximoConcepto || 'Próxima Deuda'} (Simulada)`,
        balance: proximoMonto,
        minPayment: Math.max(10, Math.round(proximaSimulacion.cuotaRegular)),
        interestRate: proximaTea,
      });
    }

    return list;
  }, [deudas, incluirProximaEnEstrategia, proximoMonto, proximoConcepto, proximaSimulacion, proximaTea]);

  const totalBalance = activeDebts.reduce((acc, d) => acc + d.balance, 0);
  const payoff = calculateDebtPayoff(activeDebts, extraPayment, strategy);

  // Componente Reutilizable: Botón Incógnito (?)
  const IncognitoBtn: React.FC<{ infoKey: string; label?: string }> = ({ infoKey, label }) => {
    const isOpen = helpInfoKey === infoKey;
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setHelpInfoKey(isOpen ? null : infoKey);
        }}
        className={`inline-flex items-center justify-center h-4 w-4 rounded-full text-[10px] font-black transition cursor-pointer shrink-0 ${
          isOpen
            ? 'bg-amber-500 text-slate-900 ring-2 ring-amber-400/50'
            : 'bg-slate-200 dark:bg-slate-700 hover:bg-amber-400 hover:text-slate-900 text-slate-600 dark:text-slate-300'
        }`}
        title={`¿A qué se refiere ${label || 'esta opción'}?`}
      >
        ?
      </button>
    );
  };

  return (
    <div className="bg-white dark:bg-[#0D1518] rounded-3xl p-5 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
      
      {/* ── ENCABEZADO Y SELECTOR DE MODO / PESTAÑAS ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-600/20">
            <Calculator size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                Simulador de Deudas & Préstamos
              </h3>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                Planificación Inteligente
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Simula <strong>deudas próximas que estés pensando adquirir</strong> o planea la liquidación de tus pasivos actuales.
            </p>
          </div>
        </div>

        {/* Pestañas: Próxima Deuda vs Liquidación Actuales */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('proxima')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'proxima'
                ? 'bg-white dark:bg-[#141E22] text-slate-900 dark:text-white shadow-xs ring-1 ring-slate-200 dark:ring-slate-700'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Sparkles size={14} className="text-purple-500" />
            <span>Simular Próxima Deuda</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('estrategia')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'estrategia'
                ? 'bg-white dark:bg-[#141E22] text-slate-900 dark:text-white shadow-xs ring-1 ring-slate-200 dark:ring-slate-700'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <TrendingDown size={14} className="text-rose-500" />
            <span>Liquidación Actuales ({deudas.filter(d => d.estado === 'activa').length})</span>
          </button>
        </div>
      </div>

      {/* ── PANEL INFORMATIVO DE INCÓGNITO FLOTANTE ── */}
      {helpInfoKey && HELP_DICTIONARY[helpInfoKey] && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-950 dark:text-amber-200 text-xs animate-in fade-in zoom-in-95 duration-150 space-y-2 relative shadow-md">
          <button
            type="button"
            onClick={() => setHelpInfoKey(null)}
            className="absolute right-3 top-3 p-1 rounded-lg text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/60 transition cursor-pointer"
          >
            <X size={14} />
          </button>

          <div className="flex items-center gap-2 font-black text-amber-900 dark:text-amber-300 text-sm">
            <span>{HELP_DICTIONARY[helpInfoKey].icon}</span>
            <span>{HELP_DICTIONARY[helpInfoKey].title}</span>
          </div>

          <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 pr-6">
            {HELP_DICTIONARY[helpInfoKey].desc}
          </p>

          {HELP_DICTIONARY[helpInfoKey].highlight && (
            <div className="p-2 rounded-xl bg-amber-100/70 dark:bg-amber-900/40 font-bold text-[11px] text-amber-800 dark:text-amber-200">
              💡 {HELP_DICTIONARY[helpInfoKey].highlight}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          PESTAÑA 1: SIMULADOR DE PRÓXIMA DEUDA (UNA QUE PUEDA HACER)
         ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'proxima' && (
        <div className="space-y-6">
          
          {/* Formulario de Parámetros de la Próxima Deuda */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            
            {/* Lado Izquierdo: Inputs (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              
              {/* 1. Concepto o Motivo del Préstamo */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Motivo o Próximo Préstamo</span>
                  <span className="text-[11px] text-slate-400 font-normal">¿En qué estás pensando financiarte?</span>
                </label>
                <input
                  type="text"
                  value={proximoConcepto}
                  onChange={(e) => setProximoConcepto(e.target.value)}
                  placeholder="Ej: Préstamo BCP, Laptop en cuotas, Crédito Vehicular..."
                  className="w-full bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-2.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />

                {/* Botones de Presets Rápidos */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  {[
                    { label: '💻 Laptop / PC', tea: 28, plazo: 12 },
                    { label: '🏦 Préstamo Personal', tea: 22, plazo: 24 },
                    { label: '📱 Celular Cuotas', tea: 35, plazo: 12 },
                    { label: '🚗 Vehicular', tea: 14, plazo: 36 },
                    { label: '🏥 Salud / Imprevisto', tea: 24, plazo: 6 },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setProximoConcepto(preset.label);
                        setProximaTea(preset.tea);
                        setProximoPlazo(preset.plazo);
                      }}
                      className="text-[10px] font-semibold px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-slate-600 dark:text-slate-300 transition cursor-pointer border border-slate-200/60 dark:border-slate-700/60"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Monto a Solicitar y Plazo en Cuotas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                
                {/* Monto */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>Monto a Financiar</span>
                    <span className="text-purple-600 dark:text-purple-400 font-black">{fmt.format(proximoMonto)}</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">S/</span>
                    <input
                      type="number"
                      step="100"
                      min="100"
                      value={proximoMonto || ''}
                      onChange={(e) => setProximoMonto(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  {/* Chips rápidos de monto */}
                  <div className="flex items-center gap-1 flex-wrap">
                    {[1000, 2500, 5000, 10000].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setProximoMonto(m)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md transition cursor-pointer ${
                          proximoMonto === m
                            ? 'bg-purple-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        S/ {m.toLocaleString('es-PE')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Plazo en meses */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>Plazo de Cuotas</span>
                    <span className="text-purple-600 dark:text-purple-400 font-black">{proximoPlazo} Meses</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="48"
                    step="1"
                    value={proximoPlazo}
                    onChange={(e) => setProximoPlazo(parseInt(e.target.value, 10))}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-600"
                  />
                  {/* Chips rápidos de plazo */}
                  <div className="flex items-center gap-1 flex-wrap">
                    {[3, 6, 12, 18, 24, 36].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setProximoPlazo(p)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md transition cursor-pointer ${
                          proximoPlazo === p
                            ? 'bg-purple-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        {p}m
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* 3. Tasa de Interés TEA (%) con Símbolo de Incógnito (?) */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Tasa de Interés (TEA Anual)
                    </span>
                    <IncognitoBtn infoKey="tea" label="Tasa Efectiva Anual (TEA)" />
                  </div>
                  <span className="text-xs font-black text-purple-600 dark:text-purple-400">
                    {proximaTea.toFixed(1)}% TEA
                  </span>
                </div>

                <input
                  type="range"
                  min="0"
                  max="90"
                  step="0.5"
                  value={proximaTea}
                  onChange={(e) => setProximaTea(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-600"
                />

                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { label: '0% Sin Interés', val: 0 },
                    { label: '18% Banco Preferente', val: 18 },
                    { label: '26% Préstamo Regular', val: 26 },
                    { label: '42% Tarjeta en Cuotas', val: 42 },
                    { label: '65% Préstamo Rápido', val: 65 },
                  ].map((t) => (
                    <button
                      key={t.label}
                      type="button"
                      onClick={() => setProximaTea(t.val)}
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-md transition cursor-pointer ${
                        proximaTea === t.val
                          ? 'bg-purple-600 text-white'
                          : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Abono Extra Voluntario con Símbolo de Incógnito (?) */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Zap size={14} className="text-amber-500" />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Abono Extra Mensual al Capital (Opcional)
                    </span>
                    <IncognitoBtn infoKey="abonoExtra" label="Abono Extra al Capital" />
                  </div>
                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                    +S/ {proximoAbonoExtra} / mes
                  </span>
                </div>

                <input
                  type="range"
                  min="0"
                  max="1000"
                  step="25"
                  value={proximoAbonoExtra}
                  onChange={(e) => setProximoAbonoExtra(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />

                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>S/ 0 (Solo cuota normal)</span>
                  <span>S/ 500 / mes</span>
                  <span>S/ 1,000 / mes</span>
                </div>
              </div>

            </div>

            {/* Lado Derecho: Resultados & Métricas Calculadas (5 cols) */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-3.5">
              
              {/* Tarjeta Gigante: Cuota Mensual Estimada */}
              <div className="p-5 rounded-3xl bg-gradient-to-br from-purple-900 to-indigo-950 text-white shadow-lg shadow-purple-950/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-wider font-extrabold text-purple-200 flex items-center gap-1.5">
                    <Sparkles size={13} className="text-amber-300" />
                    Cuota Mensual Estimada
                  </span>
                  <IncognitoBtn infoKey="cuotaFija" label="Cuota Fija Mensual" />
                </div>

                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl sm:text-4xl font-black tracking-tight">
                      {fmt.format(proximaSimulacion.cuotaRegular)}
                    </span>
                    <span className="text-xs text-purple-200 font-bold">/ mes</span>
                  </div>
                  <p className="text-[11px] text-purple-200/80 mt-1">
                    Por {proximoPlazo} meses a una TEA de {proximaTea.toFixed(1)}%.
                  </p>
                </div>

                {proximoAbonoExtra > 0 && (
                  <div className="pt-2 border-t border-purple-800/80 flex items-center justify-between text-xs">
                    <span className="text-emerald-300 font-bold flex items-center gap-1">
                      <Zap size={13} />
                      Con tu abono extra (+S/ {proximoAbonoExtra}):
                    </span>
                    <span className="font-black text-white">
                      {fmt.format(proximaSimulacion.cuotaRegular + proximoAbonoExtra)}/m
                    </span>
                  </div>
                )}
              </div>

              {/* Métricas de Costo Total e Intereses */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-center">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Total Intereses a Pagar</p>
                  <p className="text-base sm:text-lg font-black text-rose-600 dark:text-rose-400 mt-0.5">
                    {fmt.format(proximoAbonoExtra > 0 ? proximaSimulacion.interesesConExtra : proximaSimulacion.interesesSinExtra)}
                  </p>
                  <p className="text-[10px] text-slate-400">Costo financiero puro</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-center">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Total a Devolver</p>
                  <p className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-0.5">
                    {fmt.format(proximoAbonoExtra > 0 ? proximaSimulacion.totalConExtra : proximaSimulacion.totalSinExtra)}
                  </p>
                  <p className="text-[10px] text-slate-400">Capital + Intereses</p>
                </div>
              </div>

              {/* Beneficio si aplica Abono Extra */}
              {proximoAbonoExtra > 0 && proximaSimulacion.mesesAhorrados > 0 && (
                <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    <div>
                      <p className="font-bold text-emerald-900 dark:text-emerald-200">
                        ¡Terminarás en {proximaSimulacion.mesesParaPagar} meses!
                      </p>
                      <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                        Te ahorras <strong>{proximaSimulacion.mesesAhorrados} meses</strong> y <strong>{fmt.format(proximaSimulacion.interesesAhorrados)}</strong> en intereses.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Botones de Acción */}
              <div className="space-y-2 pt-1">
                {onPreFillNewDebt && (
                  <button
                    type="button"
                    onClick={() =>
                      onPreFillNewDebt({
                        acreedor: proximoConcepto,
                        monto: proximoMonto,
                        tasa_anual: proximaTea / 100,
                        plazo_meses: proximoPlazo,
                      })
                    }
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition shadow-sm cursor-pointer"
                  >
                    <PlusCircle size={15} />
                    <span>Llevar estos datos a "Registrar Nueva Deuda"</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setIncluirProximaEnEstrategia(true);
                    setActiveTab('estrategia');
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-purple-300 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-xs font-bold transition cursor-pointer"
                >
                  <Layers size={14} />
                  <span>Ver impacto en mis deudas actuales (Liquidación Global)</span>
                  <ArrowRight size={13} />
                </button>
              </div>

            </div>

          </div>

          {/* Cronograma de Amortización Cuota por Cuota (Desplegable) */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowAmortizationSchedule(!showAmortizationSchedule)}
              className="flex items-center justify-between w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 transition cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-200"
            >
              <div className="flex items-center gap-2">
                <Calculator size={15} className="text-purple-600" />
                <span>Cronograma de Pagos Cuota por Cuota ({proximaSimulacion.schedule.length} Meses)</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400">
                <span>{showAmortizationSchedule ? 'Ocultar' : 'Ver Detalle'}</span>
                {showAmortizationSchedule ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </div>
            </button>

            {showAmortizationSchedule && (
              <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 max-h-72 animate-in fade-in">
                <table className="w-full text-[11px] text-left">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold sticky top-0">
                    <tr>
                      <th className="py-2 px-3"># Mes</th>
                      <th className="py-2 px-3">Cuota Total</th>
                      <th className="py-2 px-3">Capital Amortizado</th>
                      <th className="py-2 px-3">Interés del Mes</th>
                      <th className="py-2 px-3 text-right">Saldo Restante</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-[#0D1518]">
                    {proximaSimulacion.schedule.map((row) => (
                      <tr key={row.mes} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="py-1.5 px-3 font-black text-slate-700 dark:text-slate-300">Mes {row.mes}</td>
                        <td className="py-1.5 px-3 font-bold text-slate-900 dark:text-white">{fmt.format(row.cuotaTotal)}</td>
                        <td className="py-1.5 px-3 text-emerald-600 dark:text-emerald-400 font-medium">{fmt.format(row.capital)}</td>
                        <td className="py-1.5 px-3 text-rose-600 dark:text-rose-400 font-medium">{fmt.format(row.interes)}</td>
                        <td className="py-1.5 px-3 text-right font-bold text-slate-700 dark:text-slate-300">{fmt.format(row.saldoRestante)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          PESTAÑA 2: ESTRATEGIA DE LIQUIDACIÓN DE DEUDAS ACTUALES
         ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'estrategia' && (
        <div className="space-y-5">
          
          {/* Cabecera de Estrategia con Botones e Incógnitos (?) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm font-black text-slate-900 dark:text-white">
                  Estrategia para Liquidar Deudas en Camino
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                  Total a Liquidar: {fmt.format(totalBalance)}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Selecciona la estrategia de aceleración de pagos que mejor se adapte a tu meta.
              </p>
            </div>

            {/* Selector de Estrategia con Botones e Icono de Incógnito (?) */}
            <div className="flex items-center gap-2 flex-wrap">
              
              {/* Botón Bola de Nieve + Incógnito */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-900 rounded-xl p-0.5 border border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setStrategy('snowball')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    strategy === 'snowball'
                      ? 'bg-white dark:bg-[#141E22] text-slate-900 dark:text-white shadow-xs ring-1 ring-cyan-500/40'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <Snowflake size={14} className="text-cyan-500" />
                  <span>Bola de Nieve</span>
                </button>
                <div className="px-1.5">
                  <IncognitoBtn infoKey="snowball" label="Estrategia Bola de Nieve" />
                </div>
              </div>

              {/* Botón Avalancha + Incógnito */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-900 rounded-xl p-0.5 border border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setStrategy('avalanche')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    strategy === 'avalanche'
                      ? 'bg-white dark:bg-[#141E22] text-slate-900 dark:text-white shadow-xs ring-1 ring-amber-500/40'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <Flame size={14} className="text-amber-500" />
                  <span>Avalancha</span>
                </button>
                <div className="px-1.5">
                  <IncognitoBtn infoKey="avalanche" label="Estrategia Avalancha" />
                </div>
              </div>

            </div>
          </div>

          {/* Toggle para incluir o no la próxima deuda simulada */}
          <div className="p-3 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/70 dark:border-purple-900/40 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="incluirProxima"
                checked={incluirProximaEnEstrategia}
                onChange={(e) => setIncluirProximaEnEstrategia(e.target.checked)}
                className="accent-purple-600 w-4 h-4 rounded cursor-pointer"
              />
              <label htmlFor="incluirProxima" className="font-bold text-slate-800 dark:text-slate-200 cursor-pointer flex items-center gap-1.5">
                <span>Sumar a la simulación mi próxima deuda ({proximoConcepto}: {fmt.format(proximoMonto)})</span>
                <IncognitoBtn infoKey="combinarSimulacion" label="Combinar Deuda Simulada" />
              </label>
            </div>
            <span className="text-[11px] text-purple-700 dark:text-purple-300 font-semibold">
              {incluirProximaEnEstrategia ? '✓ Incluida en el cálculo' : 'Solo deudas actuales'}
            </span>
          </div>

          {/* Control Deslizante de Abono Extra */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-amber-500" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  Abono Extra Mensual al Capital
                </span>
                <IncognitoBtn infoKey="abonoExtra" label="Abono Extra al Capital" />
              </div>
              <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                +S/ {extraPayment} / mes
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="1500"
              step="50"
              value={extraPayment}
              onChange={(e) => setExtraPayment(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />

            <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
              <span>S/ 0 (Solo cuotas mínimas)</span>
              <span>S/ 500</span>
              <span>S/ 1,500 / mes</span>
            </div>
          </div>

          {/* Métricas de Resultado */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 text-center">
              <p className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400">Tiempo de Liquidación</p>
              <p className="text-xl font-black text-emerald-800 dark:text-emerald-200 mt-0.5">
                {payoff.totalMonths} Meses
              </p>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                {payoff.totalMonths <= 12 ? '¡Menos de 1 año!' : `~${(payoff.totalMonths / 12).toFixed(1)} años`}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 text-center">
              <p className="text-[10px] uppercase font-bold text-blue-700 dark:text-blue-400">Intereses Totales Estimados</p>
              <p className="text-xl font-black text-blue-800 dark:text-blue-200 mt-0.5">
                {fmt.format(payoff.totalInterestPaid)}
              </p>
              <p className="text-[10px] text-blue-600 dark:text-blue-400 mt-0.5">Costo financiero estimado</p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 text-center">
              <p className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400">Ahorro en Intereses</p>
              <p className="text-xl font-black text-amber-800 dark:text-amber-200 mt-0.5">
                {fmt.format(payoff.interestSaved)}
              </p>
              <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">Por abonos adicionales</p>
            </div>
          </div>

          {/* Cronograma y Orden de Liquidación */}
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
              Cronograma y Orden de Liquidación ({strategy === 'snowball' ? 'Bola de Nieve: Menor Saldo Primero' : 'Avalancha: Mayor Tasa Primero'})
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {payoff.debtOrder.map((d, index) => (
                <div
                  key={d.name}
                  className="p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="h-6 w-6 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black text-xs flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{d.name}</p>
                      <p className="text-[10px] text-slate-400">Saldo: {fmt.format(d.balance)}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
                      Mes {d.monthsToPayoff}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
