import { create } from 'zustand';

/**
 * Live UI Notifications.
 * The socket handler in useWebSockets.js calls addNotification() whenever
 * a `new_notification` event arrives, which increments the navbar badge.
 */
export const useNotificationStore = create((set) => ({
  count: 0,
  notifications: [],

  addNotification: (notification) =>
    set((state) => ({
      count: state.count + 1,
      notifications: [notification, ...state.notifications].slice(0, 50),
    })),

  setCount: (count) => set({ count }),

  clear: () => set({ count: 0, notifications: [] }),
}));
