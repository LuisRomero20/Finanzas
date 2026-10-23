import { create } from 'zustand';
import { useCreditLineStore } from './creditLineStore';
import {
  saveCardsConfigToSupabase,
  fetchCardsConfigFromSupabase,
} from '../services/supabaseService';
import { broadcastRealtimeSync } from '../utils/syncBus';

export interface CardConfig {
  id: string;
  entity: string;
  name: string;
  issuer?: string;
  productVariant?: string;
  network?: 'Visa' | 'Mastercard' | 'American Express' | 'Otra' | 'Por confirmar';
  currency?: 'PEN' | 'USD';
  cycleStartDay: number; // día que inicia el ciclo (corte)
  paymentDay: number;    // día límite de pago
  billingRulesStatus?: 'unverified' | 'user_confirmed' | 'statement_confirmed';
  annualEffectiveRate?: number;
  tcea?: number;
  membershipFee?: number;
  debtInsurance?: number;
  otherFees?: number;
  rewardsNotes?: string;
  status?: 'active' | 'blocked' | 'closed';
  accentBg: string;
  accentText: string;
  headerBg: string;
  pillBg: string;
  pillText: string;
  creditLine?: number;
  lineaCredito?: number;
  referenceCreditLine?: number;
  referenceUsedDebt?: number;
  referenceDate?: string;
  ratesStatus?: 'unverified' | 'contract_confirmed';
}

export const DEFAULT_CARDS: CardConfig[] = [
  {
    id: 'card-ibk-amex',
    entity: 'Interbank Amex',
    name: 'Interbank Amex',
    issuer: 'Interbank',
    productVariant: 'American Express Benefit',
    network: 'American Express',
    currency: 'PEN',
    cycleStartDay: 21,
    paymentDay: 15,
    billingRulesStatus: 'unverified',
    status: 'active',
    creditLine: 1000,
    lineaCredito: 1000,
    referenceCreditLine: 1000.00,
    referenceUsedDebt: 182.38,
    referenceDate: '2026-09-30',
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
    issuer: 'BBVA Perú',
    productVariant: 'BBVA Bfree',
    network: 'Visa',
    currency: 'PEN',
    cycleStartDay: 10,
    paymentDay: 5,
    billingRulesStatus: 'unverified',
    status: 'active',
    creditLine: 700,
    lineaCredito: 700,
    referenceCreditLine: 700.00,
    referenceUsedDebt: 436.21,
    referenceDate: '2026-09-30',
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
    issuer: 'Banco Ripley',
    productVariant: 'Ripley Mastercard',
    network: 'Mastercard',
    currency: 'PEN',
    cycleStartDay: 3,
    paymentDay: 1,
    billingRulesStatus: 'unverified',
    status: 'active',
    creditLine: 1000,
    lineaCredito: 1000,
    referenceCreditLine: 1000.00,
    referenceUsedDebt: 358.66,
    referenceDate: '2026-09-30',
    accentBg: 'bg-purple-600',
    accentText: 'text-purple-700',
    headerBg: 'from-purple-700 to-purple-500',
    pillBg: 'bg-purple-100',
    pillText: 'text-purple-700',
  },
];

const STORAGE_KEY = 'finper_credit_cards_v2';

function normalizeDay(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? Math.min(31, Math.max(1, parsed)) : fallback;
}

export function normalizeCardConfig(value: unknown): CardConfig | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Partial<CardConfig>;
  if (typeof candidate.id !== 'string' || typeof candidate.entity !== 'string' || typeof candidate.name !== 'string') return null;
  const fallback = DEFAULT_CARDS.find(card => card.id === candidate.id || card.entity === candidate.entity);
  const visualFallback = fallback ?? DEFAULT_CARDS[0];
  return {
    ...visualFallback,
    ...candidate,
    id: candidate.id,
    entity: candidate.entity.trim(),
    name: candidate.name.trim(),
    cycleStartDay: normalizeDay(candidate.cycleStartDay, fallback?.cycleStartDay ?? 1),
    paymentDay: normalizeDay(candidate.paymentDay, fallback?.paymentDay ?? 1),
    billingRulesStatus: candidate.billingRulesStatus ?? (fallback ? 'unverified' : 'user_confirmed'),
    currency: candidate.currency ?? 'PEN',
    status: candidate.status ?? 'active',
  };
}

function loadStoredCards(): CardConfig[] {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const normalized = parsed.map(normalizeCardConfig).filter((card): card is CardConfig => card !== null);
          if (normalized.length > 0) return normalized;
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
  saveCardsConfigToSupabase(cards)
    .then((saved) => { if (saved) broadcastRealtimeSync('cards'); })
    .catch(() => { /* La copia local permanece como fuente de recuperación. */ });
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
      currency: 'PEN',
      cycleStartDay: Math.min(31, Math.max(1, data.cycleStartDay)),
      paymentDay: Math.min(31, Math.max(1, data.paymentDay)),
      billingRulesStatus: 'user_confirmed',
      status: 'active',
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
      const updated = state.cards.map((card) => {
        if (card.id !== id) return card;
        const billingRulesChanged = updates.cycleStartDay !== undefined || updates.paymentDay !== undefined;
        return normalizeCardConfig({
          ...card,
          ...updates,
          billingRulesStatus: updates.billingRulesStatus ?? (billingRulesChanged ? 'user_confirmed' : card.billingRulesStatus),
        }) ?? card;
      });
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
        const normalized = cloudCards.map(normalizeCardConfig).filter((card): card is CardConfig => card !== null);
        if (normalized.length === 0) return 0;
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
