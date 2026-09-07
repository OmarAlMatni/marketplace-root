import { create } from 'zustand';

// Deliberately a different localStorage key from the storefront frontend's
// 'marketplace_auth', so both apps can be open in the same browser (even
// the same profile) without one logging the other out.
const STORAGE_KEY = 'marketplace_admin_auth';

function loadPersisted() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { user: null, token: null };
  } catch {
    return { user: null, token: null };
  }
}

export const useAdminAuthStore = create((set) => ({
  ...loadPersisted(),

  login: (user, token) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, token }));
    set({ user, token });
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ user: null, token: null });
  },
}));
