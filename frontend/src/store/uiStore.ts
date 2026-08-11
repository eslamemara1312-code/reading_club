import { create } from 'zustand';

export type ThemeMode = 'dark' | 'light';

interface UIState {
  showConfetti: boolean;
  triggerConfetti: () => void;
  stopConfetti: () => void;
  activeGroupId: string | null;
  setActiveGroupId: (groupId: string | null) => void;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  initTheme: () => void;
}

const savedGroupId = typeof window !== 'undefined' ? localStorage.getItem('activeGroupId') : null;
const savedTheme = (typeof window !== 'undefined' ? localStorage.getItem('theme') as ThemeMode : null) || 'dark';

export const useUIStore = create<UIState>((set, get) => ({
  showConfetti: false,
  triggerConfetti: () => set({ showConfetti: true }),
  stopConfetti: () => set({ showConfetti: false }),
  activeGroupId: savedGroupId,
  setActiveGroupId: (groupId) => {
    if (groupId) {
      localStorage.setItem('activeGroupId', groupId);
    } else {
      localStorage.removeItem('activeGroupId');
    }
    set({ activeGroupId: groupId });
  },
  theme: savedTheme,
  setTheme: (theme) => {
    localStorage.setItem('theme', theme);
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('dark', 'light');
      document.documentElement.classList.add(theme);
    }
    set({ theme });
  },
  toggleTheme: () => {
    const currentTheme = get().theme;
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    get().setTheme(newTheme);
  },
  initTheme: () => {
    const theme = get().theme;
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('dark', 'light');
      document.documentElement.classList.add(theme);
    }
  },
}));
