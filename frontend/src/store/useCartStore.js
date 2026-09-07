import { create } from 'zustand';

/**
 * Multi-Tab Global Cart Sync.
 *
 * The cart state lives in a Zustand store, but every mutation is also
 * broadcast over the native BroadcastChannel API so every other open tab
 * on the same origin updates instantly without a page reload or polling.
 */
const CHANNEL_NAME = 'marketplace_cart_channel';
const LEGACY_STORAGE_KEY = 'marketplace_cart';

const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(CHANNEL_NAME) : null;

function getInitialOwnerId() {
  try {
    const auth = JSON.parse(localStorage.getItem('marketplace_auth') || 'null');
    return auth?.user?.id || null;
  } catch {
    return null;
  }
}

function storageKey(ownerId) {
  return ownerId ? `marketplace_cart_${ownerId}` : LEGACY_STORAGE_KEY;
}

function loadPersisted(ownerId) {
  try {
    const raw = localStorage.getItem(storageKey(ownerId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persist(ownerId, items) {
  localStorage.setItem(storageKey(ownerId), JSON.stringify(items));
}

export const useCartStore = create((set, get) => {
  let ownerId = getInitialOwnerId();

  if (channel) {
    channel.onmessage = (event) => {
      if (event.data?.type === 'CART_SYNC' && event.data.ownerId === ownerId) {
        set({ items: event.data.items });
      }
    };
  }

  function broadcastAndPersist(items) {
    persist(ownerId, items);
    channel?.postMessage({ type: 'CART_SYNC', ownerId, items });
  }

  return {
    items: loadPersisted(ownerId),

    setOwner: (nextOwnerId) => {
      ownerId = nextOwnerId || null;
      const items = loadPersisted(ownerId);
      set({ items });
      channel?.postMessage({ type: 'CART_SYNC', ownerId, items });
    },

    addItem: (product, quantity = 1) => {
      const items = [...get().items];
      const existing = items.find((i) => i.productId === product.id);
      if (existing) {
        existing.quantity += quantity;
      } else {
        items.push({
          productId: product.id,
          title: product.title,
          price: product.price,
          imageUrl: product.image_url,
          quantity,
        });
      }
      set({ items });
      broadcastAndPersist(items);
    },

    updateQuantity: (productId, quantity) => {
      const items = get()
        .items.map((i) => (i.productId === productId ? { ...i, quantity } : i))
        .filter((i) => i.quantity > 0);
      set({ items });
      broadcastAndPersist(items);
    },

    removeItem: (productId) => {
      const items = get().items.filter((i) => i.productId !== productId);
      set({ items });
      broadcastAndPersist(items);
    },

    clearCart: () => {
      set({ items: [] });
      broadcastAndPersist([]);
    },

    total: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
  };
});
