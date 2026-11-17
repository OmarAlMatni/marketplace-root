import { create } from 'zustand';

export const useNotificationStore = create((set) => ({
  count: 0,
  unreadMessages: 0, // Add this
  notifications: [],
  
  setCount: (count) => set({ count }),
  incrementCount: () => set((state) => ({ count: state.count + 1 })),
  incrementUnreadMessages: () => set((state) => ({ unreadMessages: state.unreadMessages + 1 })), // Add this
  resetUnreadMessages: () => set({ unreadMessages: 0 }), // Add this
  
  setNotifications: (notifications) => set({ notifications }),
  addNotification: (notification) => set((state) => ({ 
    notifications: [notification, ...state.notifications] 
  })),
  clearNotifications: () => set({ notifications: [] }),
}));