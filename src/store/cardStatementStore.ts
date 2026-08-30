import { create } from 'zustand';

export interface VerifiedStatement {
  id: string;
  cardEntity: string;
  cycleKey: string;
  dueDate?: string; // YYYY-MM-DD
  cutoffDate?: string; // YYYY-MM-DD
  periodStart?: string;
  periodEnd?: string;
  finalDebt: number;
  minPayment?: number;
  fileName: string;
  matchedCount: number;
  totalStatementItems: number;
  totalAppItems: number;
  totalStatementCargos: number;
  totalAppCargos: number;
  diferenciaGastos: number;
  verifiedAt: string;
  notes?: string;
}

interface CardStatementStore {
  statements: Record<string, VerifiedStatement>;
  saveVerifiedStatement: (statement: VerifiedStatement) => void;
  removeVerifiedStatement: (key: string) => void;
  getVerifiedStatement: (cardEntity: string, cyclePayDate?: Date, cycleEndDate?: Date) => VerifiedStatement | undefined;
  getVerifiedDebt: (cardEntity: string, cyclePayDate?: Date, cycleEndDate?: Date) => number | undefined;
  clearAll: () => void;
}

const STORAGE_KEY = 'finper_verified_card_statements';

function loadFromStorage(): Record<string, VerifiedStatement> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error al cargar estados de cuenta desde localStorage:', e);
    return {};
  }
}

function saveToStorage(data: Record<string, VerifiedStatement>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Error al guardar estados de cuenta en localStorage:', e);
  }
}

export const useCardStatementStore = create<CardStatementStore>((set, get) => ({
  statements: loadFromStorage(),

  saveVerifiedStatement: (statement) => {
    set((state) => {
      // Guardar con clave única por tarjeta y fecha de vencimiento/corte
      const key = statement.cycleKey || `${statement.cardEntity}_${statement.dueDate || statement.cutoffDate || Date.now()}`;
      const updated = {
        ...state.statements,
        [key]: statement,
      };
      saveToStorage(updated);
      return { statements: updated };
    });
  },

  removeVerifiedStatement: (key) => {
    set((state) => {
      const updated = { ...state.statements };
      delete updated[key];
      // También limpiar si se pasó solo el cardEntity
      Object.keys(updated).forEach(k => {
        if (k.startsWith(`${key}_`) || updated[k].cardEntity === key) {
          delete updated[k];
        }
      });
      saveToStorage(updated);
      return { statements: updated };
    });
  },

  getVerifiedStatement: (cardEntity, cyclePayDate, cycleEndDate) => {
    const { statements } = get();
    const all = Object.values(statements).filter(s => s.cardEntity === cardEntity);
    if (all.length === 0) return undefined;

    // Si se pasa la fecha de pago del ciclo, buscar la coincidencia exacta o más cercana (+- 5 días)
    if (cyclePayDate) {
      const targetTime = cyclePayDate.getTime();
      for (const stmt of all) {
        if (stmt.dueDate) {
          const [y, m, d] = stmt.dueDate.split('-').map(Number);
          const stmtPayTime = new Date(y, m - 1, d).getTime();
          const diffDays = Math.abs(targetTime - stmtPayTime) / (1000 * 60 * 60 * 24);
          if (diffDays <= 5) {
            return stmt;
          }
        }
      }
    }

    // Si se pasa la fecha de corte del ciclo, buscar por fecha de corte (+- 5 días)
    if (cycleEndDate) {
      const targetEndTime = cycleEndDate.getTime();
      for (const stmt of all) {
        if (stmt.cutoffDate) {
          const [y, m, d] = stmt.cutoffDate.split('-').map(Number);
          const stmtCutTime = new Date(y, m - 1, d).getTime();
          const diffDays = Math.abs(targetEndTime - stmtCutTime) / (1000 * 60 * 60 * 24);
          if (diffDays <= 5) {
            return stmt;
          }
        }
      }
    }

    // Si no se pasaron fechas, devolver el más reciente para esa tarjeta
    return undefined;
  },

  getVerifiedDebt: (cardEntity, cyclePayDate, cycleEndDate) => {
    const stmt = get().getVerifiedStatement(cardEntity, cyclePayDate, cycleEndDate);
    return stmt ? stmt.finalDebt : undefined;
  },

  clearAll: () => {
    set({ statements: {} });
    saveToStorage({});
  },
}));
