import { create } from 'zustand';

interface UIState {
  showConfetti: boolean;
  triggerConfetti: () => void;
  stopConfetti: () => void;
  activeGroupId: string | null;
  setActiveGroupId: (groupId: string | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  showConfetti: false,
  triggerConfetti: () => set({ showConfetti: true }),
  stopConfetti: () => set({ showConfetti: false }),
  activeGroupId: null,
  setActiveGroupId: (groupId) => set({ activeGroupId: groupId }),
}));
