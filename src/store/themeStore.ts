import { create } from 'zustand';

export type ThemeMode = 'light' | 'dark';

interface ThemeState {
  theme: ThemeMode;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
}

const THEME_KEY = 'finper_theme_mode';

export function applyThemeClass(theme: ThemeMode) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const body = document.body;

  if (theme === 'dark') {
    root.classList.add('dark');
    if (body) body.classList.add('dark');
    root.setAttribute('data-theme', 'dark');
  } else {
    root.classList.remove('dark');
    if (body) body.classList.remove('dark');
    root.setAttribute('data-theme', 'light');
    // Asegurar limpieza total de cualquier clase 'dark' remanente
    root.className = (root.className || '').replace(/\bdark\b/g, '').trim();
    if (body) body.className = (body.className || '').replace(/\bdark\b/g, '').trim();
  }
}

function getInitialTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'light';
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'dark' || stored === 'light') {
      return stored;
    }
  } catch {}
  return 'light';
}

// Aplicar al cargar el script inicial
if (typeof window !== 'undefined') {
  applyThemeClass(getInitialTheme());
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: typeof window !== 'undefined' ? getInitialTheme() : 'light',

  toggleTheme: () => {
    set((state) => {
      const nextTheme: ThemeMode = state.theme === 'light' ? 'dark' : 'light';
      applyThemeClass(nextTheme);
      try {
        localStorage.setItem(THEME_KEY, nextTheme);
      } catch {}
      return { theme: nextTheme };
    });
  },

  setTheme: (newTheme) => {
    applyThemeClass(newTheme);
    try {
      localStorage.setItem(THEME_KEY, newTheme);
    } catch {}
    set({ theme: newTheme });
  },
}));

