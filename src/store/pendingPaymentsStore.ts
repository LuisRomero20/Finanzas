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
const LS_DELETED_PENDING_KEY = 'finper_deleted_pending_v2';

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

export function getDeletedPendingKeys(): Set<string> {
  try {
    const raw = safeGetStorage(LS_DELETED_PENDING_KEY);
    if (raw) return new Set(JSON.parse(raw));
  } catch {}
  return new Set();
}

export function addDeletedPendingKey(key: string, id?: string) {
  try {
    const current = getDeletedPendingKeys();
    if (key) current.add(key);
    if (id) {
      const cleanId = String(id).replace(/^pending-/, '');
      current.add(cleanId);
      current.add(`pending-${cleanId}`);
    }
    const arr = Array.from(current).slice(-300);
    safeSetStorage(LS_DELETED_PENDING_KEY, JSON.stringify(arr));
  } catch {}
}

export function removeDeletedPendingKey(key: string, id?: string) {
  try {
    const current = getDeletedPendingKeys();
    if (key) current.delete(key);
    if (id) {
      const cleanId = String(id).replace(/^pending-/, '');
      current.delete(cleanId);
      current.delete(`pending-${cleanId}`);
    }
    safeSetStorage(LS_DELETED_PENDING_KEY, JSON.stringify(Array.from(current)));
  } catch {}
}

export function getPendingBusinessKey(it: PendingPaymentItem | { fecha?: string; concepto?: string; entidad?: string; tipo?: string; monto?: number }): string {
  const normConcept = (it.concepto || '').trim().toLowerCase().replace(/\s*-\s*proy/gi, '');
  const normEntidad = (it.entidad || '').trim().toLowerCase();
  const normTipo = (it.tipo || 'Egreso').trim().toLowerCase();
  const fecha = it.fecha || '';
  const monto = Number(it.monto || 0).toFixed(2);
  return `${fecha}_${normConcept}_${normEntidad}_${normTipo}_${monto}`;
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
        const deletedKeys = getDeletedPendingKeys();
        const cleaned = parsed
          .filter((it) => {
            const key = getPendingBusinessKey(it);
            const cleanId = String(it.id || '').replace(/^pending-/, '');
            return !deletedKeys.has(key) && !deletedKeys.has(it.id) && !deletedKeys.has(cleanId) && !deletedKeys.has(`pending-${cleanId}`);
          })
          .map((it) => ({
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
      removeDeletedPendingKey(getPendingBusinessKey(it), it.id);
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

    removeDeletedPendingKey(getPendingBusinessKey(newItem), newItem.id);

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
    const currentItems = get().items;
    const cleanId = String(id).replace(/^pending-/, '');
    const target = currentItems.find((it) => it.id === id || it.id === cleanId || `pending-${it.id}` === id);

    if (target) {
      const key = getPendingBusinessKey(target);
      addDeletedPendingKey(key, target.id);
    } else {
      addDeletedPendingKey('', id);
    }

    set((state) => {
      const updated = state.items.filter((it) => it.id !== id && it.id !== cleanId && `pending-${it.id}` !== id);
      safeSetStorage(LS_PENDING_KEY, JSON.stringify(updated));
      return { items: updated };
    });

    deletePendingPaymentFromSupabase(id, target ? {
      fecha: target.fecha,
      concepto: target.concepto,
      entidad: target.entidad,
      monto: target.monto,
    } : undefined).catch((err) => console.warn('Cloud pending delete error:', err));
  },

  syncFromSupabase: async () => {
    try {
      const cloudItems = await fetchPendingPaymentsFromSupabase();
      if (!cloudItems) {
        return get().items.length;
      }

      const deletedKeys = getDeletedPendingKeys();

      // 1. Filtrar los items de la nube contra la lista de eliminados conocidos
      const survivingCloudItems: PendingPaymentItem[] = [];
      const itemsToPurgeFromCloud: { id: string; fecha?: string; concepto?: string; entidad?: string; monto?: number }[] = [];

      for (const item of cloudItems) {
        const key = getPendingBusinessKey(item);
        const cleanId = String(item.id).replace(/^pending-/, '');
        if (
          deletedKeys.has(key) ||
          deletedKeys.has(item.id) ||
          deletedKeys.has(cleanId) ||
          deletedKeys.has(`pending-${cleanId}`)
        ) {
          itemsToPurgeFromCloud.push({
            id: item.id,
            fecha: item.fecha,
            concepto: item.concepto,
            entidad: item.entidad,
            monto: item.monto,
          });
        } else {
          survivingCloudItems.push(item);
        }
      }

      // Purgar de Supabase aquellos que ya habían sido eliminados por el usuario
      if (itemsToPurgeFromCloud.length > 0) {
        itemsToPurgeFromCloud.forEach((target) => {
          deletePendingPaymentFromSupabase(target.id, target).catch(() => {});
        });
      }

      // 2. Deduplicar los items que quedan
      const { uniqueList, duplicateIds } = deduplicatePendingList(survivingCloudItems);

      // Si había IDs duplicados en Supabase, borrarlos en segundo plano
      if (duplicateIds.length > 0) {
        duplicateIds.forEach((dupId) => {
          deletePendingPaymentFromSupabase(dupId).catch(() => {});
        });
      }

      // 3. Supabase es la fuente autoritativa:
      // Reemplazamos el almacenamiento y estado local con la lista de la nube.
      // NUNCA volvemos a subir ítems viejos de localStorage a Supabase durante el sync.
      safeSetStorage(LS_PENDING_KEY, JSON.stringify(uniqueList));
      set({ items: uniqueList });

      return uniqueList.length;
    } catch (err) {
      console.warn('Error syncing pending payments from Supabase:', err);
      return get().items.length;
    }
  },

  executePendingPayment: (id, customData) => {
    const item = get().items.find((it) => it.id === id || it.id === String(id).replace(/^pending-/, ''));
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

    // Registrar en eliminados para que no resucite en otros dispositivos
    const key = getPendingBusinessKey(item);
    addDeletedPendingKey(key, item.id);

    // 2. Remover de pendientes local y de Supabase
    set((state) => {
      const cleanId = String(id).replace(/^pending-/, '');
      const updated = state.items.filter((it) => it.id !== id && it.id !== cleanId);
      safeSetStorage(LS_PENDING_KEY, JSON.stringify(updated));
      return { items: updated };
    });

    deletePendingPaymentFromSupabase(id, {
      fecha: item.fecha,
      concepto: item.concepto,
      entidad: item.entidad,
      monto: item.monto,
    }).catch((err) => console.warn('Cloud pending delete on execute error:', err));

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
