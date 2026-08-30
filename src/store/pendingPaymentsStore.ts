import { create } from 'zustand';
import type { EffectiveProjectedRow } from './projectionStore';
import { useFinanceStore, getMonthNameFromDate } from './financeStore';

export interface PendingPaymentItem {
  id: string;
  sourceRowId?: string;
  mes: string; // 'Octubre', 'Noviembre', etc.
  mesStr: string; // '2026-10', '2026-11'
  tipo: 'Ingreso' | 'Egreso';
  fecha: string; // 'YYYY-MM-DD'
  categoria: string;
  concepto: string;
  monto: number;
  entidad: string;
  estado: 'pendiente' | 'completado' | 'cancelado';
  origen: 'Proyección' | 'Manual';
  esLiquidacionTarjeta?: boolean;
  tarjetaLiquidada?: string;
  fechaCreacion: string;
  fechaEjecucion?: string;
  transactionMasterId?: string;
}

const LS_PENDING_KEY = 'finper_pending_payments_v1';

function safeGetStorage(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem(key);
    }
  } catch {}
  return null;
}

function safeSetStorage(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(key, value);
    }
  } catch {}
}

function loadInitialPendingPayments(): PendingPaymentItem[] {
  try {
    const saved = safeGetStorage(LS_PENDING_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error loading pending payments from storage', e);
  }
  return [];
}

interface PendingPaymentsState {
  items: PendingPaymentItem[];
  
  // Acciones
  importFromProjection: (mesStr: string, rows: EffectiveProjectedRow[]) => { added: number; updated: number; alreadyExisting: number };
  addPendingItem: (item: Omit<PendingPaymentItem, 'id' | 'estado' | 'fechaCreacion'>) => PendingPaymentItem;
  updatePendingItem: (id: string, updates: Partial<PendingPaymentItem>) => void;
  deletePendingItem: (id: string) => void;
  
  // Ejecutar / Liquidar pago -> Transfiere a la lista maestra y lo retira de pendientes
  executePendingPayment: (id: string, customData?: { monto?: number; fecha?: string }) => { success: boolean; transactionId?: string; item?: PendingPaymentItem };
  
  // Getters
  getItemsByMonth: (monthNameOrStr: string) => PendingPaymentItem[];
  getTotalsByMonth: (monthNameOrStr: string) => {
    totalPendienteEgresos: number;
    totalPendienteIngresos: number;
    countPendientes: number;
  };
}

export const usePendingPaymentsStore = create<PendingPaymentsState>((set, get) => ({
  items: loadInitialPendingPayments(),

  importFromProjection: (mesStr, rows) => {
    const mesName = getMonthNameFromDate(`${mesStr}-01`);
    const currentItems = get().items;
    let added = 0;
    let updated = 0;
    let alreadyExisting = 0;

    const newItems = [...currentItems];

    for (const r of rows) {
      const normConcept = r.concepto.trim().toLowerCase();
      const existingIndex = newItems.findIndex(
        (it) => it.sourceRowId === r.id || (
          it.mesStr === mesStr && 
          it.concepto.trim().toLowerCase() === normConcept && 
          it.entidad === r.entidad && 
          it.tipo === r.tipo
        )
      );

      if (existingIndex >= 0) {
        const existing = newItems[existingIndex];
        if (existing.estado === 'pendiente') {
          // Si ya existe y cambió el monto o fecha, actualizarlo sin duplicar
          if (existing.monto !== r.monto || existing.fecha !== r.fecha) {
            newItems[existingIndex] = {
              ...existing,
              monto: r.monto,
              fecha: r.fecha,
              categoria: r.categoria,
              esLiquidacionTarjeta: r.esPagoLiquidacionTarjeta,
              tarjetaLiquidada: r.tarjetaLiquidada,
            };
            updated++;
          } else {
            alreadyExisting++;
          }
        } else {
          alreadyExisting++;
        }
      } else {
        // Crear nuevo pendiente
        const newItem: PendingPaymentItem = {
          id: `pend-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          sourceRowId: r.id,
          mes: mesName,
          mesStr: mesStr,
          tipo: r.tipo,
          fecha: r.fecha,
          categoria: r.categoria,
          concepto: r.concepto,
          monto: r.monto,
          entidad: r.entidad,
          estado: 'pendiente',
          origen: 'Proyección',
          esLiquidacionTarjeta: r.esPagoLiquidacionTarjeta,
          tarjetaLiquidada: r.tarjetaLiquidada,
          fechaCreacion: new Date().toISOString(),
        };
        newItems.push(newItem);
        added++;
      }
    }

    // Guardar en almacenamiento
    safeSetStorage(LS_PENDING_KEY, JSON.stringify(newItems));
    set({ items: newItems });

    return { added, updated, alreadyExisting };
  },

  addPendingItem: (itemData) => {
    const mesName = itemData.mes || getMonthNameFromDate(itemData.fecha);
    const mesStr = itemData.mesStr || itemData.fecha.slice(0, 7);
    const newItem: PendingPaymentItem = {
      ...itemData,
      id: `pend-man-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      mes: mesName,
      mesStr: mesStr,
      estado: 'pendiente',
      fechaCreacion: new Date().toISOString(),
    };

    set((state) => {
      const updated = [newItem, ...state.items];
      safeSetStorage(LS_PENDING_KEY, JSON.stringify(updated));
      return { items: updated };
    });

    return newItem;
  },

  updatePendingItem: (id, updates) => {
    set((state) => {
      const updated = state.items.map((it) => (it.id === id ? { ...it, ...updates } : it));
      safeSetStorage(LS_PENDING_KEY, JSON.stringify(updated));
      return { items: updated };
    });
  },

  deletePendingItem: (id) => {
    set((state) => {
      const updated = state.items.filter((it) => it.id !== id);
      safeSetStorage(LS_PENDING_KEY, JSON.stringify(updated));
      return { items: updated };
    });
  },

  executePendingPayment: (id, customData) => {
    const item = get().items.find((it) => it.id === id);
    if (!item) {
      return { success: false };
    }

    const activeAmount = customData?.monto !== undefined ? Number(customData.monto) : item.monto;
    const activeDate = customData?.fecha || item.fecha;
    const mes = getMonthNameFromDate(activeDate);

    // 1. Insertar automáticamente en la lista maestra de useFinanceStore
    const financeStore = useFinanceStore.getState();
    const createdTx = financeStore.addTransaction({
      Tipo: item.tipo,
      Fecha: activeDate,
      Categoria: item.categoria,
      Concepto: item.concepto,
      Monto: activeAmount,
      Entidad: item.entidad,
      Mes: mes,
    });

    // 2. Remover automáticamente de la bandeja de pendientes
    set((state) => {
      const updated = state.items.filter((it) => it.id !== id);
      safeSetStorage(LS_PENDING_KEY, JSON.stringify(updated));
      return { items: updated };
    });

    return { success: true, transactionId: createdTx.id, item };
  },

  getItemsByMonth: (monthNameOrStr) => {
    const { items } = get();
    const filtered = !monthNameOrStr || monthNameOrStr === 'Todos'
      ? items
      : items.filter(
          (it) => it.mes === monthNameOrStr || it.mesStr === monthNameOrStr || it.fecha.startsWith(monthNameOrStr)
        );
    return [...filtered].sort((a, b) => a.fecha.localeCompare(b.fecha));
  },

  getTotalsByMonth: (monthNameOrStr) => {
    const items = get().getItemsByMonth(monthNameOrStr);
    
    let totalPendienteEgresos = 0;
    let totalPendienteIngresos = 0;
    let countPendientes = 0;

    for (const it of items) {
      if (it.estado === 'pendiente') {
        countPendientes++;
        if (it.tipo === 'Egreso') totalPendienteEgresos += it.monto;
        else totalPendienteIngresos += it.monto;
      }
    }

    return {
      totalPendienteEgresos,
      totalPendienteIngresos,
      countPendientes,
    };
  },
}));
