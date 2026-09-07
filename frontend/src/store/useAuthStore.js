import { create } from 'zustand';
import { useCartStore } from './useCartStore';

const STORAGE_KEY = 'marketplace_auth';

function loadPersisted() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { user: null, token: null };
  } catch {
    return { user: null, token: null };
  }
}

export const useAuthStore = create((set) => ({
  ...loadPersisted(),

  login: (user, token) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, token }));
    useCartStore.getState().setOwner(user.id);
    set({ user, token });
  },

  updateUser: (user) => {
    const token = useAuthStore.getState().token;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, token }));
    set({ user });
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEY);
    useCartStore.getState().setOwner(null);
    set({ user: null, token: null });
  },
}));
