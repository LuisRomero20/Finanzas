import { create } from 'zustand';
import { masterTransactions } from '../utils/masterData';
import { useFinanceStore } from './financeStore';

export type ProjectedRecurrence = 'fijo' | 'temporal' | 'unico';

export interface MonthException {
  suprimido?: boolean;
  montoModificado?: number;
  diaModificado?: number;
}

export interface ProjectedItem {
  id: string;
  tipo: 'Ingreso' | 'Egreso';
  categoria: string;
  concepto: string;
  monto: number;
  entidad: string;
  dia: number; // 1 a 31
  mesInicio: string; // Formato 'YYYY-MM', ej. '2026-10'
  recurrencia: ProjectedRecurrence;
  mesesDuracion?: number; // Si es temporal (ej. 3 meses)
  excepciones?: Record<string, MonthException>; // Clave: 'YYYY-MM'
}

export interface CardCycleDueDetail {
  entity: string;
  totalAPagar: number;
  fechaPago: string; // 'YYYY-MM-DD'
  diaPago: number;
  periodoFacturado: string;
  consumos: Array<{
    id: string;
    fecha: string;
    concepto: string;
    monto: number;
    categoria: string;
    origen: 'Histórico Maestro' | 'Proyección';
  }>;
}

export interface EffectiveProjectedRow {
  id: string;
  itemId: string;
  tipo: 'Ingreso' | 'Egreso';
  fecha: string; // 'YYYY-MM-DD'
  categoria: string;
  concepto: string;
  monto: number;
  montoOriginal: number;
  entidad: string;
  recurrencia: ProjectedRecurrence;
  esFijo: boolean;
  esTemporal: boolean;
  esUnico: boolean;
  esModificado: boolean;
  esTarjetaCredito: boolean;
  esPagoLiquidacionTarjeta?: boolean;
  tarjetaLiquidada?: string;
  detalleConsumosCiclo?: CardCycleDueDetail['consumos'];
  mesPagoTarjeta?: string; // Formato 'YYYY-MM'
  fechaPagoTarjeta?: string; // Formato 'YYYY-MM-DD'
}

export interface CardCycleRule {
  entity: string;
  corteDay: number;
  pagoDay: number;
}

export const CARD_RULES: Record<string, CardCycleRule> = {
  'Interbank Amex': { entity: 'Interbank Amex', corteDay: 21, pagoDay: 15 },
  'BBVA Bfree': { entity: 'BBVA Bfree', corteDay: 11, pagoDay: 5 },
  'Ripley': { entity: 'Ripley', corteDay: 4, pagoDay: 1 },
};

/**
 * Calcula la fecha y mes exacto en que se debe pagar un consumo de tarjeta de crédito
 * considerando el día de corte y el día límite de pago.
 * 
 * Regla:
 * - Si el consumo es ANTES del corte (día < corteDay): pertenece al ciclo actual y se paga el mes siguiente (mes + 1).
 * - Si el consumo es EL DÍA DEL CORTE O DESPUÉS (día >= corteDay): pertenece al nuevo ciclo y se paga 2 meses después (mes + 2).
 *   Ejemplo BBVA (corte 11, pago 5): Consumo del 11 de Setiembre entra al ciclo que cierra en Octubre y se paga el 5 de Noviembre.
 */
export function calculateCardPaymentDate(entity: string, year: number, monthIndex: number, day: number): { 
  mesPago: string; 
  fechaPago: string; 
  cicloDescripcion: string;
  pagaEnMesSiguiente: boolean;
} {
  const rule = CARD_RULES[entity];
  if (!rule) {
    const padM = String(monthIndex + 1).padStart(2, '0');
    return { 
      mesPago: `${year}-${padM}`, 
      fechaPago: `${year}-${padM}-${String(day).padStart(2, '0')}`,
      cicloDescripcion: 'Sin ciclo de tarjeta',
      pagaEnMesSiguiente: false,
    };
  }

  let payYear = year;
  let payMonthIndex: number;
  let cicloDesc = '';

  if (day < rule.corteDay) {
    // Se consumió antes del corte del mes actual -> se paga el mes siguiente
    payMonthIndex = monthIndex + 1;
    if (payMonthIndex > 11) {
      payMonthIndex = 0;
      payYear++;
    }
    cicloDesc = `Antes del corte (día ${rule.corteDay}) · Paga mes siguiente`;
  } else {
    // Se consumió el día del corte o después -> entra al ciclo que cierra el mes siguiente y se paga 2 meses después
    payMonthIndex = monthIndex + 2;
    if (payMonthIndex > 11) {
      payMonthIndex -= 12;
      payYear++;
    }
    cicloDesc = `Corte día ${rule.corteDay} (nuevo ciclo) · Paga en 2 meses`;
  }

  const padPayMonth = String(payMonthIndex + 1).padStart(2, '0');
  const padPayDay = String(rule.pagoDay).padStart(2, '0');

  return {
    mesPago: `${payYear}-${padPayMonth}`,
    fechaPago: `${payYear}-${padPayMonth}-${padPayDay}`,
    cicloDescripcion: cicloDesc,
    pagaEnMesSiguiente: day < rule.corteDay,
  };
}

/**
 * Calcula el detalle y la suma total de consumos que vencen para pagarse en targetMonthStr ('YYYY-MM')
 * para una tarjeta de crédito específica (BBVA Bfree, Interbank Amex, Ripley).
 * 
 * Agrega tanto las compras reales del histórico (masterTransactions) como los consumos proyectados.
 */
export function getCardDueDetailsForMonth(
  entity: string,
  targetMonthStr: string,
  projectedItems: ProjectedItem[] = []
): CardCycleDueDetail {
  const rule = CARD_RULES[entity];
  if (!rule) {
    return {
      entity,
      totalAPagar: 0,
      fechaPago: `${targetMonthStr}-01`,
      diaPago: 1,
      periodoFacturado: '-',
      consumos: [],
    };
  }

  const [targetYear, targetMonth] = targetMonthStr.split('-').map(Number);
  const padPayDay = String(rule.pagoDay).padStart(2, '0');
  const fechaPago = `${targetMonthStr}-${padPayDay}`;

  const consumos: CardCycleDueDetail['consumos'] = [];
  const seenKeys = new Set<string>();

  // 1. Transacciones reales registradas en lista maestra (Supabase / local)
  const sourceTransactions = useFinanceStore?.getState ? useFinanceStore.getState().transactions : masterTransactions;
  sourceTransactions.forEach((t) => {
    if (t.Entidad === entity && t.Tipo === 'Egreso') {
      const parts = t.Fecha.split('-').map(Number);
      if (parts.length === 3) {
        const y = parts[0];
        const mIndex = parts[1] - 1;
        const d = parts[2];
        const payInfo = calculateCardPaymentDate(entity, y, mIndex, d);
        if (payInfo.mesPago === targetMonthStr) {
          const key = `${t.Fecha}-${t.Concepto}-${t.Monto}`;
          if (!seenKeys.has(key)) {
            seenKeys.add(key);
            consumos.push({
              id: `master-${t.id || key}`,
              fecha: t.Fecha,
              concepto: t.Concepto,
              monto: t.Monto,
              categoria: t.Categoria,
              origen: 'Histórico Maestro',
            });
          }
        }
      }
    }
  });

  // 2. Partidas proyectadas para meses que alimentan este mesPago
  // (mes anterior para consumos < corteDay, o 2 meses antes para consumos >= corteDay)
  for (let offset = 1; offset <= 2; offset++) {
    let sourceMonthVal = targetMonth - offset;
    let sourceYear = targetYear;
    while (sourceMonthVal < 1) {
      sourceMonthVal += 12;
      sourceYear--;
    }
    const sourceMonthStr = `${sourceYear}-${String(sourceMonthVal).padStart(2, '0')}`;

    for (const item of projectedItems) {
      if (item.entidad === entity && item.tipo === 'Egreso') {
        const [startYear, startMonth] = item.mesInicio.split('-').map(Number);
        const startDateVal = startYear * 12 + (startMonth - 1);
        const sourceDateVal = sourceYear * 12 + (sourceMonthVal - 1);

        if (sourceDateVal >= startDateVal) {
          const monthsDiff = sourceDateVal - startDateVal;
          if (item.recurrencia === 'unico' && monthsDiff !== 0) continue;
          if (item.recurrencia === 'temporal' && monthsDiff >= (item.mesesDuracion || 1)) continue;

          const excepcion = item.excepciones?.[sourceMonthStr];
          if (excepcion?.suprimido) continue;

          const activeDay = excepcion?.diaModificado ?? item.dia;
          const activeAmount = excepcion?.montoModificado ?? item.monto;
          const payInfo = calculateCardPaymentDate(entity, sourceYear, sourceMonthVal - 1, activeDay);

          if (payInfo.mesPago === targetMonthStr) {
            const padD = String(activeDay).padStart(2, '0');
            const consDate = `${sourceYear}-${String(sourceMonthVal).padStart(2, '0')}-${padD}`;
            const key = `${consDate}-${item.concepto}-${activeAmount}`;
            if (!seenKeys.has(key)) {
              seenKeys.add(key);
              consumos.push({
                id: `proj-${item.id}-${sourceMonthStr}`,
                fecha: consDate,
                concepto: item.concepto,
                monto: activeAmount,
                categoria: item.categoria,
                origen: 'Proyección',
              });
            }
          }
        }
      }
    }
  }

  // Ordenar consumos cronológicamente
  consumos.sort((a, b) => a.fecha.localeCompare(b.fecha));

  const totalAPagar = consumos.reduce((s, c) => s + c.monto, 0);

  // Calcular rango del ciclo
  let startCycleMonth = targetMonth - 2;
  let startCycleYear = targetYear;
  if (startCycleMonth < 1) {
    startCycleMonth += 12;
    startCycleYear--;
  }
  let endCycleMonth = targetMonth - 1;
  let endCycleYear = targetYear;
  if (endCycleMonth < 1) {
    endCycleMonth += 12;
    endCycleYear--;
  }
  const periodoFacturado = `${String(rule.corteDay).padStart(2, '0')}/${String(startCycleMonth).padStart(2, '0')} — ${String(rule.corteDay - 1).padStart(2, '0')}/${String(endCycleMonth).padStart(2, '0')}`;

  return {
    entity,
    totalAPagar: Math.round(totalAPagar * 100) / 100,
    fechaPago,
    diaPago: rule.pagoDay,
    periodoFacturado,
    consumos,
  };
}

// Plantilla inicial basada en la estructura real del usuario (Octubre 2026)
const INITIAL_PROJECTIONS: ProjectedItem[] = [
  {
    id: 'proj-1',
    tipo: 'Ingreso',
    categoria: 'Otro Ing',
    concepto: 'Bonificación Ahorro',
    monto: 0.0,
    entidad: 'Interbank',
    dia: 1,
    mesInicio: '2026-10',
    recurrencia: 'fijo',
  },
  {
    id: 'proj-2',
    tipo: 'Ingreso',
    categoria: 'Sueldo',
    concepto: 'Sueldo',
    monto: 2259.63,
    entidad: 'Interbank',
    dia: 1,
    mesInicio: '2026-10',
    recurrencia: 'fijo',
  },
  {
    id: 'proj-3',
    tipo: 'Egreso',
    categoria: 'Servicio',
    concepto: 'Spotify',
    monto: 12.0,
    entidad: 'Interbank Amex',
    dia: 1,
    mesInicio: '2026-10',
    recurrencia: 'fijo',
  },
  {
    id: 'proj-4',
    tipo: 'Egreso',
    categoria: 'Servicio',
    concepto: 'Internet',
    monto: 79.0,
    entidad: 'BBVA Bfree',
    dia: 1,
    mesInicio: '2026-10',
    recurrencia: 'fijo',
  },
  {
    id: 'proj-5',
    tipo: 'Egreso',
    categoria: 'Servicio',
    concepto: 'Gas',
    monto: 50.0,
    entidad: 'BBVA Bfree',
    dia: 1,
    mesInicio: '2026-10',
    recurrencia: 'fijo',
  },
  {
    id: 'proj-6',
    tipo: 'Egreso',
    categoria: 'Servicio',
    concepto: 'Corte de Cabello',
    monto: 20.0,
    entidad: 'Interbank',
    dia: 1,
    mesInicio: '2026-10',
    recurrencia: 'fijo',
  },
  {
    id: 'proj-7',
    tipo: 'Egreso',
    categoria: 'Deuda',
    concepto: 'iPhone 16',
    monto: 245.75,
    entidad: 'Interbank',
    dia: 1,
    mesInicio: '2026-10',
    recurrencia: 'fijo',
  },
  {
    id: 'proj-8',
    tipo: 'Egreso',
    categoria: 'Servicio',
    concepto: 'Pago de Tarjeta Ripley',
    monto: 381.88,
    entidad: 'Interbank',
    dia: 1,
    mesInicio: '2026-10',
    recurrencia: 'fijo',
  },
  {
    id: 'proj-9',
    tipo: 'Egreso',
    categoria: 'Deuda',
    concepto: 'Prestamo Yape',
    monto: 116.85,
    entidad: 'Interbank',
    dia: 1,
    mesInicio: '2026-10',
    recurrencia: 'fijo',
  },
  {
    id: 'proj-10',
    tipo: 'Egreso',
    categoria: 'Gasto',
    concepto: 'Pastilla Madre',
    monto: 120.0,
    entidad: 'Ripley',
    dia: 4,
    mesInicio: '2026-10',
    recurrencia: 'fijo',
  },
  {
    id: 'proj-11',
    tipo: 'Egreso',
    categoria: 'Servicio',
    concepto: 'Agua + Mantenimiento',
    monto: 160.0,
    entidad: 'Interbank',
    dia: 5,
    mesInicio: '2026-10',
    recurrencia: 'fijo',
  },
  {
    id: 'proj-12',
    tipo: 'Egreso',
    categoria: 'Servicio',
    concepto: 'Pago de Tarjeta Interbank Amex',
    monto: 36.6,
    entidad: 'Interbank',
    dia: 5,
    mesInicio: '2026-10',
    recurrencia: 'fijo',
  },
  {
    id: 'proj-13',
    tipo: 'Egreso',
    categoria: 'Servicio',
    concepto: 'Pago de Tarjeta BBVA Bfree',
    monto: 271.84,
    entidad: 'Interbank',
    dia: 5,
    mesInicio: '2026-10',
    recurrencia: 'fijo',
  },
  {
    id: 'proj-14',
    tipo: 'Egreso',
    categoria: 'Servicio',
    concepto: 'Telefonia Movil',
    monto: 39.9,
    entidad: 'BBVA Bfree',
    dia: 11,
    mesInicio: '2026-10',
    recurrencia: 'fijo',
  },
  {
    id: 'proj-15',
    tipo: 'Egreso',
    categoria: 'Servicio',
    concepto: 'Luz',
    monto: 120.0,
    entidad: 'BBVA Bfree',
    dia: 11,
    mesInicio: '2026-10',
    recurrencia: 'fijo',
  },
  {
    id: 'proj-16',
    tipo: 'Egreso',
    categoria: 'Deuda',
    concepto: 'Prestamo BCP',
    monto: 143.16,
    entidad: 'Interbank',
    dia: 15,
    mesInicio: '2026-10',
    recurrencia: 'fijo',
  },
  {
    id: 'proj-17',
    tipo: 'Egreso',
    categoria: 'Otro Egre',
    concepto: 'Titulación',
    monto: 980.0,
    entidad: 'Interbank',
    dia: 15,
    mesInicio: '2026-10',
    recurrencia: 'fijo',
  },
  {
    id: 'proj-18',
    tipo: 'Egreso',
    categoria: 'Servicio',
    concepto: 'iCloud',
    monto: 15.0,
    entidad: 'Interbank',
    dia: 23,
    mesInicio: '2026-10',
    recurrencia: 'fijo',
  },
];

interface ProjectionState {
  items: ProjectedItem[];
  probabilidadSueldoPorMes: Record<string, number>; // Ej: { '2026-10': 2700.00 }
  
  // Acciones
  addItem: (item: Omit<ProjectedItem, 'id'>) => string;
  updateItem: (id: string, updates: Partial<ProjectedItem>) => void;
  deleteItem: (id: string) => void;
  
  // Manejo de excepciones por mes (suprimir o modificar puntualmente)
  suppressInMonth: (id: string, monthStr: string) => void;
  restoreInMonth: (id: string, monthStr: string) => void;
  modifyAmountInMonth: (id: string, monthStr: string, amount: number) => void;
  modifyDateInMonth: (id: string, monthStr: string, day: number) => void;
  clearMonthException: (id: string, monthStr: string) => void;
  
  // Escenario de probabilidad de sueldo
  setProbabilidadSueldo: (monthStr: string, monto: number) => void;
  
  // Selector de cálculo
  getMonthlyProjections: (monthStr: string) => EffectiveProjectedRow[];
  resetToDefaults: () => void;
}

const LS_KEY = 'finper_projections_v1';
const LS_PROB_KEY = 'finper_projection_prob_v1';

function loadStoredItems(): ProjectedItem[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return INITIAL_PROJECTIONS;
}

function loadStoredProb(): Record<string, number> {
  try {
    const raw = localStorage.getItem(LS_PROB_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { '2026-10': 2700.0 };
}

export const useProjectionStore = create<ProjectionState>((set, get) => ({
  items: typeof window !== 'undefined' ? loadStoredItems() : INITIAL_PROJECTIONS,
  probabilidadSueldoPorMes: typeof window !== 'undefined' ? loadStoredProb() : { '2026-10': 2700.0 },

  addItem: (newItem) => {
    const id = `proj-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const fullItem: ProjectedItem = { ...newItem, id };
    set((state) => {
      const updated = [...state.items, fullItem];
      localStorage.setItem(LS_KEY, JSON.stringify(updated));
      return { items: updated };
    });
    return id;
  },

  updateItem: (id, updates) => {
    set((state) => {
      const updated = state.items.map((item) => (item.id === id ? { ...item, ...updates } : item));
      localStorage.setItem(LS_KEY, JSON.stringify(updated));
      return { items: updated };
    });
  },

  deleteItem: (id) => {
    set((state) => {
      const updated = state.items.filter((item) => item.id !== id);
      localStorage.setItem(LS_KEY, JSON.stringify(updated));
      return { items: updated };
    });
  },

  suppressInMonth: (id, monthStr) => {
    set((state) => {
      const updated = state.items.map((item) => {
        if (item.id !== id) return item;
        const excepciones = { ...(item.excepciones || {}) };
        excepciones[monthStr] = { ...(excepciones[monthStr] || {}), suprimido: true };
        return { ...item, excepciones };
      });
      localStorage.setItem(LS_KEY, JSON.stringify(updated));
      return { items: updated };
    });
  },

  restoreInMonth: (id, monthStr) => {
    set((state) => {
      const updated = state.items.map((item) => {
        if (item.id !== id) return item;
        const excepciones = { ...(item.excepciones || {}) };
        if (excepciones[monthStr]) {
          excepciones[monthStr] = { ...excepciones[monthStr], suprimido: false };
        }
        return { ...item, excepciones };
      });
      localStorage.setItem(LS_KEY, JSON.stringify(updated));
      return { items: updated };
    });
  },

  modifyAmountInMonth: (id, monthStr, amount) => {
    set((state) => {
      const updated = state.items.map((item) => {
        if (item.id !== id) return item;
        const excepciones = { ...(item.excepciones || {}) };
        excepciones[monthStr] = { ...(excepciones[monthStr] || {}), montoModificado: amount };
        return { ...item, excepciones };
      });
      localStorage.setItem(LS_KEY, JSON.stringify(updated));
      return { items: updated };
    });
  },

  modifyDateInMonth: (id, monthStr, day) => {
    set((state) => {
      const updated = state.items.map((item) => {
        if (item.id !== id) return item;
        const excepciones = { ...(item.excepciones || {}) };
        excepciones[monthStr] = { ...(excepciones[monthStr] || {}), diaModificado: day };
        return { ...item, excepciones };
      });
      localStorage.setItem(LS_KEY, JSON.stringify(updated));
      return { items: updated };
    });
  },

  clearMonthException: (id, monthStr) => {
    set((state) => {
      const updated = state.items.map((item) => {
        if (item.id !== id || !item.excepciones) return item;
        const excepciones = { ...item.excepciones };
        delete excepciones[monthStr];
        return { ...item, excepciones };
      });
      localStorage.setItem(LS_KEY, JSON.stringify(updated));
      return { items: updated };
    });
  },

  setProbabilidadSueldo: (monthStr, monto) => {
    set((state) => {
      const updated = { ...state.probabilidadSueldoPorMes, [monthStr]: monto };
      localStorage.setItem(LS_PROB_KEY, JSON.stringify(updated));
      return { probabilidadSueldoPorMes: updated };
    });
  },

  getMonthlyProjections: (targetMonthStr) => {
    const { items } = get();
    // targetMonthStr es 'YYYY-MM', ej. '2026-10'
    const [targetYear, targetMonth] = targetMonthStr.split('-').map(Number);
    const targetDateVal = targetYear * 12 + (targetMonth - 1);

    const rows: EffectiveProjectedRow[] = [];

    for (const item of items) {
      const [startYear, startMonth] = item.mesInicio.split('-').map(Number);
      const startDateVal = startYear * 12 + (startMonth - 1);

      // Si el mes objetivo es anterior al mes de inicio, no aplica
      if (targetDateVal < startDateVal) continue;

      const monthsDiff = targetDateVal - startDateVal;

      // Evaluar recurrencia
      if (item.recurrencia === 'unico' && monthsDiff !== 0) {
        continue;
      }
      if (item.recurrencia === 'temporal') {
        const duracion = item.mesesDuracion || 1;
        if (monthsDiff >= duracion) continue;
      }

      // Evaluar excepciones del mes objetivo
      const excepcion = item.excepciones?.[targetMonthStr];
      if (excepcion?.suprimido) {
        // Suprimido en este mes específico
        continue;
      }

      const activeDay = excepcion?.diaModificado ?? item.dia;
      let activeAmount = excepcion?.montoModificado ?? item.monto;
      const isModified = excepcion?.montoModificado !== undefined || excepcion?.diaModificado !== undefined;

      // Detección de filas de liquidación/pago de tarjeta de crédito
      const isCardPaymentAmex = /pago.*tarjeta.*amex/i.test(item.concepto);
      const isCardPaymentBbva = /pago.*tarjeta.*bbva/i.test(item.concepto);
      const isCardPaymentRipley = /pago.*tarjeta.*ripley/i.test(item.concepto);

      let isCardSettlement = false;
      let cardSettledName = '';
      let cardDueDetail: CardCycleDueDetail | undefined;

      if (isCardPaymentAmex || isCardPaymentBbva || isCardPaymentRipley) {
        isCardSettlement = true;
        cardSettledName = isCardPaymentAmex ? 'Interbank Amex' : isCardPaymentBbva ? 'BBVA Bfree' : 'Ripley';
        cardDueDetail = getCardDueDetailsForMonth(cardSettledName, targetMonthStr, items);

        // Si el usuario no ingresó un monto manual específico para este mes,
        // utilizar el total exacto liquidado según los consumos reales y proyectados del ciclo
        if (excepcion?.montoModificado === undefined) {
          activeAmount = cardDueDetail.totalAPagar;
        }
      }

      const padDay = String(Math.min(activeDay, 31)).padStart(2, '0');
      const padMonth = String(targetMonth).padStart(2, '0');
      const fullDate = `${targetYear}-${padMonth}-${padDay}`;

      const isCreditCard = Boolean(CARD_RULES[item.entidad]);
      let cardPayInfo: { mesPago: string; fechaPago: string } | undefined;

      if (isCreditCard) {
        cardPayInfo = calculateCardPaymentDate(item.entidad, targetYear, targetMonth - 1, activeDay);
      }

      rows.push({
        id: `${item.id}-${targetMonthStr}`,
        itemId: item.id,
        tipo: item.tipo,
        fecha: fullDate,
        categoria: item.categoria,
        concepto: item.concepto,
        monto: activeAmount,
        montoOriginal: item.monto,
        entidad: item.entidad,
        recurrencia: item.recurrencia,
        esFijo: item.recurrencia === 'fijo',
        esTemporal: item.recurrencia === 'temporal',
        esUnico: item.recurrencia === 'unico',
        esModificado: isModified,
        esTarjetaCredito: isCreditCard,
        esPagoLiquidacionTarjeta: isCardSettlement,
        tarjetaLiquidada: cardSettledName || undefined,
        detalleConsumosCiclo: cardDueDetail?.consumos,
        mesPagoTarjeta: cardPayInfo?.mesPago,
        fechaPagoTarjeta: cardPayInfo?.fechaPago,
      });
    }

    // Ordenar por día de fecha ascendente
    rows.sort((a, b) => a.fecha.localeCompare(b.fecha));
    return rows;
  },

  resetToDefaults: () => {
    localStorage.removeItem(LS_KEY);
    localStorage.removeItem(LS_PROB_KEY);
    set({
      items: INITIAL_PROJECTIONS,
      probabilidadSueldoPorMes: { '2026-10': 2700.0 },
    });
  },
}));
