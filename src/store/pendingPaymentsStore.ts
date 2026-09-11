import { create } from 'zustand';
import type { EffectiveProjectedRow } from './projectionStore';
import { useFinanceStore, getMonthNameFromDate } from './financeStore';
import { useAppStore } from '../store';
import {
  savePendingPaymentToSupabase,
  deletePendingPaymentFromSupabase,
  fetchPendingPaymentsFromSupabase,
} from '../services/supabaseService';

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

function getPendingBusinessKey(it: PendingPaymentItem): string {
  if (it.sourceRowId) return `src:${it.sourceRowId}`;
  const norm = (it.concepto || '').trim().toLowerCase().replace(/\s*-\s*proy/gi, '');
  const mesStr = it.mesStr || (it.fecha ? it.fecha.slice(0, 7) : '');
  return `biz:${mesStr}_${norm}_${it.entidad}_${it.tipo}_${it.fecha}_${it.monto}`;
}

export function deduplicatePendingList(items: PendingPaymentItem[]): { uniqueList: PendingPaymentItem[]; duplicateIds: string[] } {
  const seenKeys = new Map<string, PendingPaymentItem>();
  const duplicateIds: string[] = [];

  for (const it of items) {
    const key = getPendingBusinessKey(it);
    if (seenKeys.has(key)) {
      duplicateIds.push(it.id);
    } else {
      seenKeys.set(key, it);
    }
  }

  return {
    uniqueList: Array.from(seenKeys.values()),
    duplicateIds,
  };
}

function loadInitialPendingPayments(): PendingPaymentItem[] {
  try {
    const saved = safeGetStorage(LS_PENDING_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        const cleaned = parsed.map((it) => ({
          ...it,
          concepto: typeof it.concepto === 'string' ? it.concepto.replace(/\s*-\s*proy/gi, '').trim() : it.concepto,
        }));
        return deduplicatePendingList(cleaned).uniqueList;
      }
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
  syncFromSupabase: () => Promise<number>;
  
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
        // Crear nuevo pendiente con ID determinista para evitar duplicación entre dispositivos
        const deterministicId = r.id ? `pend-proj-${r.id}` : `pend-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const newItem: PendingPaymentItem = {
          id: deterministicId,
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

    // Sincronizar en segundo plano con Supabase para móvil y web
    newItems.forEach((it) => {
      savePendingPaymentToSupabase(it).catch(() => {});
    });

    return { added, updated, alreadyExisting };
  },

  addPendingItem: (itemData) => {
    const mesName = itemData.mes || getMonthNameFromDate(itemData.fecha);
    const mesStr = itemData.mesStr || itemData.fecha.slice(0, 7);
    const cleanConcepto = (itemData.concepto || '').replace(/\s*-\s*proy/gi, '').trim();

    // Evitar duplicar si ya existe un item pendiente idéntico
    const currentItems = get().items;
    const existing = currentItems.find(
      (it) =>
        it.estado === 'pendiente' &&
        it.fecha === itemData.fecha &&
        it.concepto.trim().toLowerCase() === cleanConcepto.toLowerCase() &&
        it.entidad === itemData.entidad &&
        Number(it.monto) === Number(itemData.monto) &&
        it.tipo === itemData.tipo
    );
    if (existing) {
      return existing;
    }

    const newItem: PendingPaymentItem = {
      ...itemData,
      concepto: cleanConcepto,
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

    // Guardar en Supabase para sincronización móvil
    savePendingPaymentToSupabase(newItem).catch((err) => console.warn('Cloud pending add error:', err));

    return newItem;
  },

  updatePendingItem: (id, updates) => {
    let updatedItem: PendingPaymentItem | null = null;
    set((state) => {
      const updated = state.items.map((it) => {
        if (it.id === id) {
          updatedItem = { ...it, ...updates };
          return updatedItem;
        }
        return it;
      });
      safeSetStorage(LS_PENDING_KEY, JSON.stringify(updated));
      return { items: updated };
    });

    if (updatedItem) {
      savePendingPaymentToSupabase(updatedItem).catch((err) => console.warn('Cloud pending update error:', err));
    }
  },

  deletePendingItem: (id) => {
    set((state) => {
      const updated = state.items.filter((it) => it.id !== id);
      safeSetStorage(LS_PENDING_KEY, JSON.stringify(updated));
      return { items: updated };
    });

    deletePendingPaymentFromSupabase(id).catch((err) => console.warn('Cloud pending delete error:', err));
  },

  syncFromSupabase: async () => {
    try {
      const cloudItems = await fetchPendingPaymentsFromSupabase();
      const currentItems = get().items;

      const combined: PendingPaymentItem[] = [];
      if (cloudItems && cloudItems.length > 0) {
        combined.push(...cloudItems);
      }
      for (const loc of currentItems) {
        combined.push(loc);
      }

      if (combined.length > 0) {
        const { uniqueList, duplicateIds } = deduplicatePendingList(combined);

        // Purgar duplicados detectados de Supabase para limpiar la base de datos
        if (duplicateIds.length > 0) {
          duplicateIds.forEach((dupId) => {
            deletePendingPaymentFromSupabase(dupId).catch(() => {});
          });
        }

        safeSetStorage(LS_PENDING_KEY, JSON.stringify(uniqueList));
        set({ items: uniqueList });

        // Asegurar que los únicos queden guardados en la nube
        uniqueList.forEach((it) => {
          savePendingPaymentToSupabase(it).catch(() => {});
        });

        return uniqueList.length;
      }
    } catch (err) {
      console.warn('Error syncing pending payments from Supabase:', err);
    }
    return get().items.length;
  },

  executePendingPayment: (id, customData) => {
    const item = get().items.find((it) => it.id === id);
    if (!item) {
      return { success: false };
    }

    const activeAmount = customData?.monto !== undefined ? Number(customData.monto) : item.monto;
    const activeDate = customData?.fecha || item.fecha;
    const mes = getMonthNameFromDate(activeDate);

    // 1. Insertar automáticamente en la lista maestra de useFinanceStore (que ya sincroniza con Supabase)
    const financeStore = useFinanceStore.getState();
    const isProy = item.origen === 'Proyección' || item.concepto.toLowerCase().includes('proy') || (item.sourceRowId !== undefined);
    const createdTx = financeStore.addTransaction({
      id: isProy ? `proy-${item.id.replace(/^pend-/, '')}` : undefined,
      Tipo: item.tipo,
      Fecha: activeDate,
      Categoria: item.categoria,
      Concepto: item.concepto,
      Monto: activeAmount,
      Entidad: item.entidad,
      Mes: mes,
      estado: isProy ? 'provisional' : 'confirmado',
    });

    // 2. Remover de pendientes local y de Supabase
    set((state) => {
      const updated = state.items.filter((it) => it.id !== id);
      safeSetStorage(LS_PENDING_KEY, JSON.stringify(updated));
      return { items: updated };
    });

    deletePendingPaymentFromSupabase(id).catch((err) => console.warn('Cloud pending delete on execute error:', err));

    // 3. Sincronizar con el gestor de pasivos: si coincide con una deuda activa, avanzar la cuota pagada
    try {
      const appStore = useAppStore.getState();
      const normConcept = (item.concepto || '').trim().toLowerCase();
      const matchingDebt = appStore.deudas.find(
        (d) => d.estado !== 'pagada' && (
          d.acreedor.trim().toLowerCase() === normConcept ||
          normConcept.includes(d.acreedor.trim().toLowerCase()) ||
          d.acreedor.trim().toLowerCase().includes(normConcept)
        )
      );
      if (matchingDebt) {
        appStore.marcarCuotaPagada(matchingDebt.id);
      }
    } catch (err) {
      console.error('Error al sincronizar cuota con useAppStore', err);
    }

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
