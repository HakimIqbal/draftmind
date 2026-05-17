import { create } from 'zustand';

interface UserState {
  name: string;
  email: string;
  avatarUrl: string | null;
  openTicketCount: number | null;
  setName: (name: string) => void;
  setAvatarUrl: (url: string | null) => void;
  setUser: (user: { name: string; email: string; avatarUrl: string | null }) => void;
  setOpenTicketCount: (count: number) => void;
}

export const useUserStore = create<UserState>((set) => ({
  name: '',
  email: '',
  avatarUrl: null,
  openTicketCount: null,
  setName: (name) => set({ name }),
  setAvatarUrl: (avatarUrl) => set({ avatarUrl }),
  setUser: (user) => set(user),
  setOpenTicketCount: (openTicketCount) => set({ openTicketCount }),
}));
