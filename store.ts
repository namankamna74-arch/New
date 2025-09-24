import { create } from 'zustand';
import { Theme } from './types';

interface AppState {
  theme: Theme;
  isMuted: boolean;
  setTheme: (theme: Theme) => void;
  toggleMute: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  theme: 'nova',
  isMuted: false,
  setTheme: (theme) => set({ theme }),
  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
}));