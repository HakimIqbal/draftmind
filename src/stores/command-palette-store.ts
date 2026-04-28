import { create } from 'zustand';

export const useCommandPaletteStore = create<{
  open: boolean;
  toggle: () => void;
  setOpen: (v: boolean) => void;
}>((set) => ({
  open: false,
  toggle: () => set((s) => ({ open: !s.open })),
  setOpen: (v) => set({ open: v }),
}));
