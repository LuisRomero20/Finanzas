import { create } from 'zustand';
import { useCreditLineStore } from './creditLineStore';
import {
  saveCardsConfigToSupabase,
  fetchCardsConfigFromSupabase,
} from '../services/supabaseService';

export interface CardConfig {
  id: string;
  entity: string;
  name: string;
  cycleStartDay: number; // día que inicia el ciclo (corte)
  paymentDay: number;    // día límite de pago
  accentBg: string;
  accentText: string;
  headerBg: string;
  pillBg: string;
  pillText: string;
  creditLine?: number;
  lineaCredito?: number;
}

export const DEFAULT_CARDS: CardConfig[] = [
  {
    id: 'card-ibk-amex',
    entity: 'Interbank Amex',
    name: 'Interbank Amex',
    cycleStartDay: 21,
    paymentDay: 15,
    accentBg: 'bg-blue-600',
    accentText: 'text-blue-700',
    headerBg: 'from-blue-700 to-blue-500',
    pillBg: 'bg-blue-100',
    pillText: 'text-blue-700',
  },
  {
    id: 'card-bbva-bfree',
    entity: 'BBVA Bfree',
    name: 'BBVA Bfree',
    cycleStartDay: 10,
    paymentDay: 5,
    accentBg: 'bg-sky-600',
    accentText: 'text-sky-700',
    headerBg: 'from-sky-700 to-sky-500',
    pillBg: 'bg-sky-100',
    pillText: 'text-sky-700',
  },
  {
    id: 'card-ripley',
    entity: 'Ripley',
    name: 'Ripley',
    cycleStartDay: 3,
    paymentDay: 1,
    accentBg: 'bg-purple-600',
    accentText: 'text-purple-700',
    headerBg: 'from-purple-700 to-purple-500',
    pillBg: 'bg-purple-100',
    pillText: 'text-purple-700',
  },
];

const STORAGE_KEY = 'finper_credit_cards_v2';

function loadStoredCards(): CardConfig[] {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Asegurar que las tarjetas predeterminadas tengan los días exactos actualizados
          return parsed.map((c: CardConfig) => {
            if (/^BBVA/i.test(c.entity)) {
              return { ...c, cycleStartDay: 10, paymentDay: 5 };
            }
            if (/^Ripley/i.test(c.entity)) {
              return { ...c, cycleStartDay: 3, paymentDay: 1 };
            }
            if (/^Interbank\s*Amex/i.test(c.entity)) {
              return { ...c, cycleStartDay: 21, paymentDay: 15 };
            }
            return c;
          });
        }
      }
    }
  } catch (e) {
    console.warn('Error cargando tarjetas guardadas:', e);
  }
  return DEFAULT_CARDS;
}

function persistCards(cards: CardConfig[]): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
    }
  } catch (e) {
    console.warn('Error persistiendo tarjetas:', e);
  }
  // Sincronizar en la nube para que otros dispositivos (Vercel/iPhone) accedan a la config actualizada
  saveCardsConfigToSupabase(cards).catch(() => {});
}

interface CreditCardStoreState {
  cards: CardConfig[];
  addCard: (newCard: {
    name: string;
    entity?: string;
    cycleStartDay: number;
    paymentDay: number;
    creditLine?: number;
    lineaCredito?: number;
    colorTheme?: string;
  }) => CardConfig;
  updateCard: (id: string, updates: Partial<CardConfig>) => void;
  deleteCard: (id: string, force?: boolean) => boolean;
  getCardByEntity: (entity: string) => CardConfig | undefined;
  syncFromSupabase: () => Promise<number>;
}

const COLOR_THEMES = {
  blue: {
    accentBg: 'bg-blue-600',
    accentText: 'text-blue-700',
    headerBg: 'from-blue-700 to-blue-500',
    pillBg: 'bg-blue-100',
    pillText: 'text-blue-700',
  },
  sky: {
    accentBg: 'bg-sky-600',
    accentText: 'text-sky-700',
    headerBg: 'from-sky-700 to-sky-500',
    pillBg: 'bg-sky-100',
    pillText: 'text-sky-700',
  },
  purple: {
    accentBg: 'bg-purple-600',
    accentText: 'text-purple-700',
    headerBg: 'from-purple-700 to-purple-500',
    pillBg: 'bg-purple-100',
    pillText: 'text-purple-700',
  },
  emerald: {
    accentBg: 'bg-emerald-600',
    accentText: 'text-emerald-700',
    headerBg: 'from-emerald-700 to-teal-500',
    pillBg: 'bg-emerald-100',
    pillText: 'text-emerald-700',
  },
  amber: {
    accentBg: 'bg-amber-600',
    accentText: 'text-amber-700',
    headerBg: 'from-amber-700 to-orange-500',
    pillBg: 'bg-amber-100',
    pillText: 'text-amber-700',
  },
  rose: {
    accentBg: 'bg-rose-600',
    accentText: 'text-rose-700',
    headerBg: 'from-rose-700 to-pink-500',
    pillBg: 'bg-rose-100',
    pillText: 'text-rose-700',
  },
  cyan: {
    accentBg: 'bg-cyan-600',
    accentText: 'text-cyan-700',
    headerBg: 'from-cyan-700 to-teal-500',
    pillBg: 'bg-cyan-100',
    pillText: 'text-cyan-700',
  },
};

export const useCreditCardStore = create<CreditCardStoreState>((set, get) => ({
  cards: loadStoredCards(),

  addCard: (data) => {
    const theme = (data.colorTheme && (COLOR_THEMES as Record<string, any>)[data.colorTheme]) || COLOR_THEMES.emerald;
    const entityName = data.entity?.trim() || data.name.trim();
    const newCard: CardConfig = {
      id: `card-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: data.name.trim(),
      entity: entityName,
      cycleStartDay: Math.min(31, Math.max(1, data.cycleStartDay)),
      paymentDay: Math.min(31, Math.max(1, data.paymentDay)),
      accentBg: theme.accentBg,
      accentText: theme.accentText,
      headerBg: theme.headerBg,
      pillBg: theme.pillBg,
      pillText: theme.pillText,
      creditLine: data.creditLine ?? data.lineaCredito,
      lineaCredito: data.lineaCredito ?? data.creditLine,
    };

    set((state) => {
      const updated = [...state.cards, newCard];
      persistCards(updated);
      return { cards: updated };
    });

    // Sincronizar línea de crédito en creditLineStore si fue proporcionada
    const finalCreditLine = data.creditLine ?? data.lineaCredito;
    if (finalCreditLine && finalCreditLine > 0) {
      try {
        useCreditLineStore.getState().setCreditLine(entityName, finalCreditLine);
      } catch (e) {
        console.warn('Error sincronizando linea de credito:', e);
      }
    }

    return newCard;
  },

  updateCard: (id, updates) => {
    set((state) => {
      const updated = state.cards.map((c) => (c.id === id ? { ...c, ...updates } : c));
      persistCards(updated);
      return { cards: updated };
    });
  },

  deleteCard: (id) => {
    const card = get().cards.find((c) => c.id === id);
    if (!card) return false;

    set((state) => {
      const updated = state.cards.filter((c) => c.id !== id);
      persistCards(updated);
      return { cards: updated };
    });
    return true;
  },

  getCardByEntity: (entity) => {
    const norm = entity.trim().toLowerCase();
    return get().cards.find(
      (c) => c.entity.toLowerCase() === norm || c.name.toLowerCase() === norm
    );
  },

  syncFromSupabase: async () => {
    try {
      const cloudCards = await fetchCardsConfigFromSupabase();
      if (cloudCards && cloudCards.length > 0) {
        // Aplicar correcciones de días a tarjetas conocidas
        const normalized = cloudCards.map((c: CardConfig) => {
          if (/^BBVA/i.test(c.entity)) return { ...c, cycleStartDay: 10, paymentDay: 5 };
          if (/^Ripley/i.test(c.entity)) return { ...c, cycleStartDay: 3, paymentDay: 1 };
          if (/^Interbank\s*Amex/i.test(c.entity)) return { ...c, cycleStartDay: 21, paymentDay: 15 };
          return c;
        });
        // Guardar localmente y actualizar el estado
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
        } catch {}
        set({ cards: normalized });
        return normalized.length;
      }
    } catch (e) {
      console.warn('Error sincronizando tarjetas desde Supabase:', e);
    }
    return 0;
  },
}));
