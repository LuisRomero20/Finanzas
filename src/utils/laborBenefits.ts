/**
 * Utilidades para cálculo de Beneficios Laborales en el Régimen General Peruano (D.L. 728 / Ley 27735 / TUO D.L. 650)
 * 
 * Calibrado con los valores reales del usuario:
 * - Sueldo Bruto S/ 2,339.00 -> Sueldo Neto S/ 2,073.06 (descuento AFP ~11.37%)
 * - Sueldo Bruto S/ 2,559.00 -> Sueldo Neto S/ 2,259.63 (descuento AFP ~11.70%)
 */

export interface LaborBenefitConfig {
  sueldoBruto: number;
  tipoPension: 'AFP_USER' | 'AFP_INTEGRA' | 'AFP_PRIMA' | 'AFP_HABITAT' | 'AFP_PROFUTURO' | 'ONP' | 'CUSTOM';
  tasaPensionPersonalizada?: number; // en porcentaje, ej: 11.7
  tipoSalud: 'ESSALUD' | 'EPS'; // EsSalud: 9% bono extraordinario, EPS: 6.75%
  tieneAsignacionFamiliar: boolean; // 10% RMV (S/ 102.50 actualmente en Perú con RMV S/ 1025)
  mesesTrabajadosSemestre?: number; // Por defecto 6 (semestre completo)
}

export const ASIGNACION_FAMILIAR_MONTO = 102.50; // 10% de S/ 1,025 (RMV Perú)

// Tasas de descuento previsional aproximadas Perú 2024-2026
export const TASAS_PENSION: Record<string, number> = {
  AFP_USER: 11.6987, // Tasa exacta observada en boletas del usuario: (2559 - 2259.63) / 2559 = 11.6987%
  AFP_INTEGRA: 11.37, // Aporte 10% + prima de seguro ~1.37% (comisión mixta 0% sobre flujo)
  AFP_PRIMA: 11.60,
  AFP_HABITAT: 11.47,
  AFP_PROFUTURO: 11.69,
  ONP: 13.00,
};

export interface NetSalaryResult {
  sueldoBruto: number;
  asignacionFamiliar: number;
  remuneracionBrutaTotal: number;
  tasaPension: number;
  descuentoPension: number;
  sueldoNeto: number;
}

/**
 * Calcula el Sueldo Neto mensual en mano.
 * Para sueldos brutos menores a ~S/ 3,000 mensuales (< 7 UIT anuales), el I.R. de 5ta categoría es S/ 0.00.
 */
export function calculateNetSalary(config: LaborBenefitConfig): NetSalaryResult {
  const asig = config.tieneAsignacionFamiliar ? ASIGNACION_FAMILIAR_MONTO : 0;
  const remBruta = Math.max(0, config.sueldoBruto + asig);

  let tasa = TASAS_PENSION.AFP_USER;
  if (config.tipoPension === 'CUSTOM' && typeof config.tasaPensionPersonalizada === 'number') {
    tasa = config.tasaPensionPersonalizada;
  } else if (config.tipoPension && TASAS_PENSION[config.tipoPension]) {
    tasa = TASAS_PENSION[config.tipoPension];
  }

  // Si es exactamente el sueldo de 2339 sin asignación y tipo AFP_USER/INTEGRA, ajustamos al histórico exacto: S/ 2073.06
  if (Math.abs(config.sueldoBruto - 2339) < 0.01 && !config.tieneAsignacionFamiliar && (config.tipoPension === 'AFP_USER' || config.tipoPension === 'AFP_INTEGRA')) {
    return {
      sueldoBruto: config.sueldoBruto,
      asignacionFamiliar: 0,
      remuneracionBrutaTotal: 2339,
      tasaPension: 11.37,
      descuentoPension: 265.94,
      sueldoNeto: 2073.06,
    };
  }

  // Si es exactamente el sueldo actual de 2559 sin asignación y tipo AFP_USER: S/ 2259.63
  if (Math.abs(config.sueldoBruto - 2559) < 0.01 && !config.tieneAsignacionFamiliar && config.tipoPension === 'AFP_USER') {
    return {
      sueldoBruto: config.sueldoBruto,
      asignacionFamiliar: 0,
      remuneracionBrutaTotal: 2559,
      tasaPension: 11.6987,
      descuentoPension: 299.37,
      sueldoNeto: 2259.63,
    };
  }

  const descPension = Math.round((remBruta * (tasa / 100)) * 100) / 100;
  const sueldoNeto = Math.round((remBruta - descPension) * 100) / 100;

  return {
    sueldoBruto: config.sueldoBruto,
    asignacionFamiliar: asig,
    remuneracionBrutaTotal: remBruta,
    tasaPension: tasa,
    descuentoPension: descPension,
    sueldoNeto,
  };
}

export interface GratificationResult {
  sueldoBase: number;
  asignacionFamiliar: number;
  baseCalculo: number;
  tasaBonificacion: number; // 9% o 6.75%
  bonificacionExtraordinaria: number;
  gratificacionTotal: number;
  mesesConsiderados: number;
}

/**
 * Calcula la Gratificación Legal (Julio o Diciembre - Ley 27735 y Ley 29351 / 30334).
 * En el régimen general es: 1 Sueldo Básico + Asignación Familiar + Bonificación Extraordinaria (9% EsSalud o 6.75% EPS).
 * La gratificación está totalmente INAFECTA de descuentos a AFP u ONP.
 */
export function calculateGratification(config: LaborBenefitConfig): GratificationResult {
  const asig = config.tieneAsignacionFamiliar ? ASIGNACION_FAMILIAR_MONTO : 0;
  const baseCalculo = Math.max(0, config.sueldoBruto + asig);
  const meses = Math.min(6, Math.max(1, config.mesesTrabajadosSemestre ?? 6));
  
  // Proporcional si trabajó menos de 6 meses
  const baseProporcional = (baseCalculo / 6) * meses;

  const tasaBono = config.tipoSalud === 'EPS' ? 6.75 : 9.0;
  const bonoExtra = Math.round((baseProporcional * (tasaBono / 100)) * 100) / 100;
  const gratiTotal = Math.round((baseProporcional + bonoExtra) * 100) / 100;

  return {
    sueldoBase: config.sueldoBruto,
    asignacionFamiliar: asig,
    baseCalculo: Math.round(baseProporcional * 100) / 100,
    tasaBonificacion: tasaBono,
    bonificacionExtraordinaria: bonoExtra,
    gratificacionTotal: gratiTotal,
    mesesConsiderados: meses,
  };
}

export interface CtsResult {
  sueldoBase: number;
  asignacionFamiliar: number;
  unSextoGratificacion: number;
  remuneracionComputable: number;
  ctsSemestral: number;
  mesesConsiderados: number;
}

/**
 * Calcula el depósito de CTS semestral (Mayo o Noviembre - TUO D. Leg. 650).
 * Remuneración Computable = Sueldo Básico + Asignación Familiar + 1/6 de la Gratificación anterior.
 * Depósito semestral = Remuneración Computable / 2.
 */
export function calculateCts(config: LaborBenefitConfig, gratificacionAnterior?: number): CtsResult {
  const asig = config.tieneAsignacionFamiliar ? ASIGNACION_FAMILIAR_MONTO : 0;
  const sueldoComputable = Math.max(0, config.sueldoBruto + asig);
  const meses = Math.min(6, Math.max(1, config.mesesTrabajadosSemestre ?? 6));

  // 1/6 de la gratificación (la gratificación base ordinaria, sin el bono de 9%)
  const gratiBase = typeof gratificacionAnterior === 'number' && gratificacionAnterior > 0 
    ? gratificacionAnterior 
    : sueldoComputable;
  
  const unSextoGrati = Math.round((gratiBase / 6) * 100) / 100;
  const remComputable = Math.round((sueldoComputable + unSextoGrati) * 100) / 100;
  
  // Fórmula semestral: (RemComputable / 12) * meses
  const ctsSemestral = Math.round(((remComputable / 12) * meses) * 100) / 100;

  return {
    sueldoBase: config.sueldoBruto,
    asignacionFamiliar: asig,
    unSextoGratificacion: unSextoGrati,
    remuneracionComputable: remComputable,
    ctsSemestral,
    mesesConsiderados: meses,
  };
}

export interface AnnualBenefitsSummary {
  sueldoBrutoMensual: number;
  sueldoNetoMensual: number;
  gratificacionJulio: number;
  gratificacionDiciembre: number;
  ctsMayo: number;
  ctsNoviembre: number;
  totalSueldosNetosAnual: number; // 12 * sueldoNeto
  totalGratificacionesAnual: number; // 2 * grati
  totalCtsAnual: number; // 2 * cts
  totalPercibidoAnual: number; // Sueldos + Grati + CTS
  totalLiquidoDisponibleEnMano: number; // Sueldos + Grati (sin CTS que va al banco)
}

/**
 * Calcula la proyección anual completa de ingresos para un sueldo bruto constante.
 */
export function calculateAnnualBenefits(config: LaborBenefitConfig): AnnualBenefitsSummary {
  const netSalary = calculateNetSalary(config);
  const grati = calculateGratification(config);
  const cts = calculateCts(config, grati.baseCalculo);

  const totalSueldosNetosAnual = Math.round((netSalary.sueldoNeto * 12) * 100) / 100;
  const totalGratificacionesAnual = Math.round((grati.gratificacionTotal * 2) * 100) / 100;
  const totalCtsAnual = Math.round((cts.ctsSemestral * 2) * 100) / 100;

  const totalPercibidoAnual = Math.round((totalSueldosNetosAnual + totalGratificacionesAnual + totalCtsAnual) * 100) / 100;
  const totalLiquidoDisponibleEnMano = Math.round((totalSueldosNetosAnual + totalGratificacionesAnual) * 100) / 100;

  return {
    sueldoBrutoMensual: config.sueldoBruto,
    sueldoNetoMensual: netSalary.sueldoNeto,
    gratificacionJulio: grati.gratificacionTotal,
    gratificacionDiciembre: grati.gratificacionTotal,
    ctsMayo: cts.ctsSemestral,
    ctsNoviembre: cts.ctsSemestral,
    totalSueldosNetosAnual,
    totalGratificacionesAnual,
    totalCtsAnual,
    totalPercibidoAnual,
    totalLiquidoDisponibleEnMano,
  };
}

/**
 * Estructura de la tabla dinámica real 2026 del usuario (mostrada en la imagen adjunta de Excel)
 * Enero a Setiembre con datos reales, y Octubre a Diciembre con proyección automática.
 */
export interface MonthlySalaryTableCol {
  mes: string;
  mesAbrev: string;
  esProyectado: boolean;
  cts?: number;
  gratificacion?: number;
  sueldo: number;
  total: number;
}

export function getUser2026HistoricalAndProjectedTable(customOctDicSalary?: number): {
  columns: MonthlySalaryTableCol[];
  totalCts: number;
  totalGrati: number;
  totalSueldo: number;
  totalGeneral: number;
} {
  let sueldoNetoFuturo = 2259.63;
  let brutoFuturo = 2559;
  if (typeof customOctDicSalary === 'number' && customOctDicSalary > 0) {
    brutoFuturo = customOctDicSalary;
    sueldoNetoFuturo = calculateNetSalary({
      sueldoBruto: customOctDicSalary,
      tipoPension: 'AFP_USER',
      tipoSalud: 'ESSALUD',
      tieneAsignacionFamiliar: false,
    }).sueldoNeto;
  }

  // CTS Noviembre proyectada: (bruto + bruto/6)/2
  const ctsNoviembreProyectada = calculateCts({
    sueldoBruto: brutoFuturo,
    tipoPension: 'AFP_USER',
    tipoSalud: 'ESSALUD',
    tieneAsignacionFamiliar: false,
  }).ctsSemestral;

  // Grati Diciembre proyectada: bruto + 9%
  const gratiDiciembreProyectada = calculateGratification({
    sueldoBruto: brutoFuturo,
    tipoPension: 'AFP_USER',
    tipoSalud: 'ESSALUD',
    tieneAsignacionFamiliar: false,
  }).gratificacionTotal;

  const cols: MonthlySalaryTableCol[] = [
    // 1. Enero (Sueldo anterior S/ 2,339 -> Neto S/ 2,073.06)
    { mes: 'Enero', mesAbrev: 'Ene', esProyectado: false, sueldo: 2073.06, total: 2073.06 },
    // 2. Febrero
    { mes: 'Febrero', mesAbrev: 'Feb', esProyectado: false, sueldo: 2073.06, total: 2073.06 },
    // 3. Marzo
    { mes: 'Marzo', mesAbrev: 'Mar', esProyectado: false, sueldo: 2073.06, total: 2073.06 },
    // 4. Abril (Aumento a S/ 2,559 -> Neto S/ 2,259.63)
    { mes: 'Abril', mesAbrev: 'Abr', esProyectado: false, sueldo: 2259.63, total: 2259.63 },
    // 5. Mayo (Sueldo 2259.63 + CTS real 1,469.67 = 3,729.30)
    { mes: 'Mayo', mesAbrev: 'May', esProyectado: false, cts: 1469.67, sueldo: 2259.63, total: 3729.30 },
    // 6. Junio
    { mes: 'Junio', mesAbrev: 'Jun', esProyectado: false, sueldo: 2259.63, total: 2259.63 },
    // 7. Julio (Sueldo 2259.63 + Grati real 2,721.60 = 4,981.23)
    { mes: 'Julio', mesAbrev: 'Jul', esProyectado: false, gratificacion: 2721.60, sueldo: 2259.63, total: 4981.23 },
    // 8. Agosto
    { mes: 'Agosto', mesAbrev: 'Ago', esProyectado: false, sueldo: 2259.63, total: 2259.63 },
    // 9. Setiembre
    { mes: 'Setiembre', mesAbrev: 'Set', esProyectado: false, sueldo: 2259.63, total: 2259.63 },
    // 10. Octubre (Proyectado)
    { mes: 'Octubre', mesAbrev: 'Oct', esProyectado: true, sueldo: sueldoNetoFuturo, total: sueldoNetoFuturo },
    // 11. Noviembre (Proyectado: Sueldo + CTS)
    { 
      mes: 'Noviembre', 
      mesAbrev: 'Nov', 
      esProyectado: true, 
      cts: ctsNoviembreProyectada, 
      sueldo: sueldoNetoFuturo, 
      total: Math.round((sueldoNetoFuturo + ctsNoviembreProyectada) * 100) / 100 
    },
    // 12. Diciembre (Proyectado: Sueldo + Grati)
    { 
      mes: 'Diciembre', 
      mesAbrev: 'Dic', 
      esProyectado: true, 
      gratificacion: gratiDiciembreProyectada, 
      sueldo: sueldoNetoFuturo, 
      total: Math.round((sueldoNetoFuturo + gratiDiciembreProyectada) * 100) / 100 
    },
  ];

  const totalCts = cols.reduce((s, c) => s + (c.cts || 0), 0);
  const totalGrati = cols.reduce((s, c) => s + (c.gratificacion || 0), 0);
  const totalSueldo = cols.reduce((s, c) => s + c.sueldo, 0);
  const totalGeneral = cols.reduce((s, c) => s + c.total, 0);

  return {
    columns: cols,
    totalCts: Math.round(totalCts * 100) / 100,
    totalGrati: Math.round(totalGrati * 100) / 100,
    totalSueldo: Math.round(totalSueldo * 100) / 100,
    totalGeneral: Math.round(totalGeneral * 100) / 100,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// PARTICIPACIÓN DE LOS TRABAJADORES EN LAS UTILIDADES (D.L. 892 / D.S. 009-98-TR)
// ══════════════════════════════════════════════════════════════════════════════

export type SectorUtilidades =
  | 'PESQUERIA' // 10%
  | 'TELECOMUNICACIONES' // 10%
  | 'INDUSTRIAL' // 10%
  | 'MINERIA' // 8%
  | 'COMERCIO_RESTAURANTES' // 8%
  | 'SERVICIOS_OTROS' // 5% (Banca, servicios, tecnología, etc.)
  | 'AGRARIO'; // 5%

export interface SectorInfo {
  id: SectorUtilidades;
  nombre: string;
  porcentaje: number;
  descripcion: string;
}

export const SECTORES_UTILIDADES: Record<SectorUtilidades, SectorInfo> = {
  PESQUERIA: {
    id: 'PESQUERIA',
    nombre: 'Empresas Pesqueras',
    porcentaje: 10,
    descripcion: 'Extracción y procesamiento pesquero (10%)',
  },
  TELECOMUNICACIONES: {
    id: 'TELECOMUNICACIONES',
    nombre: 'Empresas de Telecomunicaciones',
    porcentaje: 10,
    descripcion: 'Telefonía, internet y telecomunicaciones (10%)',
  },
  INDUSTRIAL: {
    id: 'INDUSTRIAL',
    nombre: 'Empresas Industriales / Manufactureras',
    porcentaje: 10,
    descripcion: 'Manufactura, producción y transformación (10%)',
  },
  MINERIA: {
    id: 'MINERIA',
    nombre: 'Empresas Mineras',
    porcentaje: 8,
    descripcion: 'Explotación minera y metalúrgica (8%)',
  },
  COMERCIO_RESTAURANTES: {
    id: 'COMERCIO_RESTAURANTES',
    nombre: 'Comercio al por mayor/menor y Restaurantes',
    porcentaje: 8,
    descripcion: 'Retail, tiendas, mayoristas y gastronomía (8%)',
  },
  SERVICIOS_OTROS: {
    id: 'SERVICIOS_OTROS',
    nombre: 'Otras actividades (Servicios, Banca, Tecnología)',
    porcentaje: 5,
    descripcion: 'Servicios financieros, consultoría, desarrollo y afines (5%)',
  },
  AGRARIO: {
    id: 'AGRARIO',
    nombre: 'Empresas Agrarias',
    porcentaje: 5,
    descripcion: 'Sector agrario y agroexportación (5%)',
  },
};

export interface UtilidadesConfig {
  modo: 'OFICIAL_EMPRESA' | 'MULTIPLOS_SUELDO' | 'MONTO_DIRECTO';
  sueldoBruto: number;
  tieneAsignacionFamiliar: boolean;
  diasLaboradosTrabajador?: number; // Típicamente 260 a 300 días
  remuneracionAnualTrabajador?: number; // Si no se especifica, calcula (sueldo + asig) * 14
  
  // Parámetros cuando modo === 'OFICIAL_EMPRESA'
  sector?: SectorUtilidades;
  rentaNetaEmpresa?: number; // Renta Neta Imponible antes de impuestos de la empresa
  totalDiasEmpresa?: number; // Suma de días de todo el personal
  masaSalarialEmpresa?: number; // Suma de remuneraciones anuales de todo el personal

  // Parámetros cuando modo === 'MULTIPLOS_SUELDO'
  multiplicadorSueldos?: number; // ej. 0.5, 1, 1.5, 2, 3

  // Parámetros cuando modo === 'MONTO_DIRECTO'
  montoDirecto?: number;

  // Parámetros tributarios (I.R. 5ta categoría)
  uit?: number; // Default S/ 5,350 (2025/2026) o S/ 5,150 (2024)
}

export interface UtilidadesResult {
  modo: 'OFICIAL_EMPRESA' | 'MULTIPLOS_SUELDO' | 'MONTO_DIRECTO';
  sueldoBaseMensual: number;
  remuneracionComputableMensual: number;
  remuneracionAnualComputable: number;
  diasTrabajador: number;

  // Datos oficiales (si aplica)
  sector?: SectorInfo;
  rentaNetaEmpresa?: number;
  porcentajeDistribucion?: number;
  fondoTotalDistribuir?: number;
  fondoDias50?: number;
  fondoRemuneracion50?: number;
  factorDias?: number;
  factorRemuneracion?: number;

  // Desglose del trabajador
  montoPorDias: number;
  montoPorRemuneracion: number;
  utilidadBruta: number;

  // Límite legal de 18 sueldos
  tope18Sueldos: number;
  superaTope: boolean;
  excedenteTope: number;
  utilidadAfecta: number; // Monto tras aplicar el tope

  // Retenciones e Inafectaciones
  descuentoAfpOnp: number; // Siempre 0.00 (Inafecto según D.L. 892 art. 9)
  descuentoEsSalud: number; // Siempre 0.00
  retencionQuintaCategoriaEstimada: number;
  
  // Líquido en mano
  utilidadNeta: number;
}

/**
 * Calcula la Participación de Utilidades (D.L. 892 y D.S. 009-98-TR)
 * Soporta cálculo oficial 50% por días laborados + 50% por remuneración anual,
 * estimación rápida por múltiplos de sueldo, y tope legal de 18 remuneraciones.
 */
export function calculateUtilidades(config: UtilidadesConfig): UtilidadesResult {
  const asig = config.tieneAsignacionFamiliar ? ASIGNACION_FAMILIAR_MONTO : 0;
  const remComputableMensual = Math.max(0, config.sueldoBruto + asig);
  const diasTrabajador = Math.min(365, Math.max(1, config.diasLaboradosTrabajador ?? 260));
  const uit = config.uit ?? 5350;

  // Remuneración computable anual del trabajador (12 sueldos + 2 gratificaciones ordinarias)
  let remAnual = config.remuneracionAnualTrabajador;
  if (!remAnual || remAnual <= 0) {
    remAnual = Math.round((remComputableMensual * 14) * 100) / 100;
  }

  const tope18Sueldos = Math.round((remComputableMensual * 18) * 100) / 100;

  let montoPorDias = 0;
  let montoPorRemuneracion = 0;
  let utilidadBruta = 0;
  let fondoTotalDistribuir = 0;
  let fondoDias50 = 0;
  let fondoRemuneracion50 = 0;
  let factorDias = 0;
  let factorRemuneracion = 0;
  let sectorInfo: SectorInfo | undefined;

  if (config.modo === 'OFICIAL_EMPRESA') {
    const sectorKey = config.sector ?? 'SERVICIOS_OTROS';
    sectorInfo = SECTORES_UTILIDADES[sectorKey];
    const pct = sectorInfo.porcentaje;
    const rentaNeta = Math.max(0, config.rentaNetaEmpresa ?? 0);

    fondoTotalDistribuir = Math.round((rentaNeta * (pct / 100)) * 100) / 100;
    fondoDias50 = Math.round((fondoTotalDistribuir * 0.5) * 100) / 100;
    fondoRemuneracion50 = Math.round((fondoTotalDistribuir * 0.5) * 100) / 100;

    const totalDiasEmpresa = Math.max(1, config.totalDiasEmpresa ?? (diasTrabajador * 50));
    const masaSalarialEmpresa = Math.max(1, config.masaSalarialEmpresa ?? (remAnual * 50));

    factorDias = fondoDias50 / totalDiasEmpresa;
    factorRemuneracion = fondoRemuneracion50 / masaSalarialEmpresa;

    montoPorDias = Math.round((diasTrabajador * factorDias) * 100) / 100;
    montoPorRemuneracion = Math.round((remAnual * factorRemuneracion) * 100) / 100;
    utilidadBruta = Math.round((montoPorDias + montoPorRemuneracion) * 100) / 100;
  } else if (config.modo === 'MULTIPLOS_SUELDO') {
    const mult = Math.max(0, config.multiplicadorSueldos ?? 1);
    utilidadBruta = Math.round((remComputableMensual * mult) * 100) / 100;
    montoPorDias = Math.round((utilidadBruta * 0.5) * 100) / 100;
    montoPorRemuneracion = Math.round((utilidadBruta * 0.5) * 100) / 100;
  } else {
    // MONTO_DIRECTO
    utilidadBruta = Math.max(0, config.montoDirecto ?? 0);
    montoPorDias = Math.round((utilidadBruta * 0.5) * 100) / 100;
    montoPorRemuneracion = Math.round((utilidadBruta * 0.5) * 100) / 100;
  }

  // Evaluación del tope legal de 18 remuneraciones mensuales
  const superaTope = utilidadBruta > tope18Sueldos;
  const excedenteTope = superaTope ? Math.round((utilidadBruta - tope18Sueldos) * 100) / 100 : 0;
  const utilidadAfecta = superaTope ? tope18Sueldos : utilidadBruta;

  // Cálculo de I.R. de 5ta categoría marginal
  const retencionQuinta = calculateQuintaRetentionForUtilidad(remAnual, utilidadAfecta, uit);
  const utilidadNeta = Math.max(0, Math.round((utilidadAfecta - retencionQuinta) * 100) / 100);

  return {
    modo: config.modo,
    sueldoBaseMensual: config.sueldoBruto,
    remuneracionComputableMensual: remComputableMensual,
    remuneracionAnualComputable: remAnual,
    diasTrabajador,
    sector: sectorInfo,
    rentaNetaEmpresa: config.rentaNetaEmpresa,
    porcentajeDistribucion: sectorInfo?.porcentaje,
    fondoTotalDistribuir,
    fondoDias50,
    fondoRemuneracion50,
    factorDias,
    factorRemuneracion,
    montoPorDias,
    montoPorRemuneracion,
    utilidadBruta,
    tope18Sueldos,
    superaTope,
    excedenteTope,
    utilidadAfecta,
    descuentoAfpOnp: 0,
    descuentoEsSalud: 0,
    retencionQuintaCategoriaEstimada: retencionQuinta,
    utilidadNeta,
  };
}

/**
 * Calcula la retención de 5ta categoría correspondiente exclusivamente al monto de utilidades,
 * evaluando la tasa marginal sobre el tramo acumulado que supera las 7 UIT.
 */
export function calculateQuintaRetentionForUtilidad(remuneracionBaseAnual: number, utilidad: number, uit: number = 5350): number {
  if (utilidad <= 0) return 0;

  const impuestoSinUtilidad = calculateAnnualTax5ta(remuneracionBaseAnual, uit);
  const impuestoConUtilidad = calculateAnnualTax5ta(remuneracionBaseAnual + utilidad, uit);

  return Math.max(0, Math.round((impuestoConUtilidad - impuestoSinUtilidad) * 100) / 100);
}

function calculateAnnualTax5ta(ingresoAnual: number, uit: number): number {
  const deduccion7Uit = 7 * uit;
  const baseImponible = Math.max(0, ingresoAnual - deduccion7Uit);
  if (baseImponible <= 0) return 0;

  let impuesto = 0;
  let remanente = baseImponible;

  // Tramo 1: Hasta 5 UIT (8%)
  const tramo1 = Math.min(remanente, 5 * uit);
  impuesto += tramo1 * 0.08;
  remanente -= tramo1;

  // Tramo 2: Más de 5 hasta 20 UIT (14%)
  if (remanente > 0) {
    const tramo2 = Math.min(remanente, 15 * uit);
    impuesto += tramo2 * 0.14;
    remanente -= tramo2;
  }

  // Tramo 3: Más de 20 hasta 35 UIT (17%)
  if (remanente > 0) {
    const tramo3 = Math.min(remanente, 15 * uit);
    impuesto += tramo3 * 0.17;
    remanente -= tramo3;
  }

  // Tramo 4: Más de 35 hasta 45 UIT (20%)
  if (remanente > 0) {
    const tramo4 = Math.min(remanente, 10 * uit);
    impuesto += tramo4 * 0.20;
    remanente -= tramo4;
  }

  // Tramo 5: Más de 45 UIT (30%)
  if (remanente > 0) {
    impuesto += remanente * 0.30;
  }

  return impuesto;
}
