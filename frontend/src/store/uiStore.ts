import { create } from 'zustand';

interface UIState {
  showConfetti: boolean;
  triggerConfetti: () => void;
  stopConfetti: () => void;
  activeGroupId: string | null;
  setActiveGroupId: (groupId: string | null) => void;
}

const savedGroupId = typeof window !== 'undefined' ? localStorage.getItem('activeGroupId') : null;

export const useUIStore = create<UIState>((set) => ({
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
}));
