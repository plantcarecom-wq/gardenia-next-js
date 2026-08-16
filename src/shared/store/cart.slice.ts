import { StateCreator } from 'zustand';

export interface CartItem {
  productId: {
    _id: string;
    name: string;
    slug: string;
    images?: string[];
    price: number;
  };
  qty: number;
  priceSnapshot: number;
}

export interface UpdateQtyResult {
  success: boolean;
  error?: string;
}

export interface CartSlice {
  items: CartItem[];
  cartLoading: boolean;
  fetchCart: () => Promise<void>;
  updateQty: (productId: string, qty: number) => Promise<UpdateQtyResult>;
  removeItem: (productId: string) => Promise<UpdateQtyResult>;
  clearCart: () => void;
}

export const createCartSlice: StateCreator<CartSlice> = (set, get) => ({
  items: [],
  cartLoading: false,
  fetchCart: async () => {
    set({ cartLoading: true });
    try {
      const res = await fetch('/api/v1/cart');
      if (res.ok) {
        const data = await res.json();
        set({ items: data.data.items || [] });
      }
    } catch (err) {
      console.error('Failed to fetch cart', err);
    } finally {
      set({ cartLoading: false });
    }
  },
  updateQty: async (productId: string, qty: number) => {
    try {
      // Optimistic update
      const prevItems = [...get().items];
      set((state) => {
        const item = state.items.find((i) => i.productId._id === productId);
        if (item) item.qty = qty;
        return { items: [...state.items] };
      });

      const res = await fetch('/api/v1/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, qty }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Revert on failure
        set({ items: prevItems });
        return { success: false, error: typeof data.error === 'string' ? data.error : 'Could not update cart' };
      }

      set({ items: data.data.items || [] });
      return { success: true };
    } catch (err) {
      console.error('Failed to update cart', err);
      await get().fetchCart();
      return { success: false, error: 'An unexpected error occurred' };
    }
  },
  removeItem: async (productId: string) => {
    return get().updateQty(productId, 0);
  },
  clearCart: () => set({ items: [] }),
});
