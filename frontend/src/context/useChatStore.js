import { create } from 'zustand';

export const useChatStore = create((set) => ({
  peer: null,
  setPeer: (peer) => set({ peer }),
}));
