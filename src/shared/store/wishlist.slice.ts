import { StateCreator } from 'zustand';

export interface WishlistProduct {
  _id: string;
  name: string;
  slug: string;
  images?: string[];
  price: number;
  discountPrice?: number;
  stockQty: number;
  ratingAverage: number;
  ratingCount: number;
}

export interface WishlistSlice {
  wishlistIds: string[];
  wishlistProducts: WishlistProduct[];
  wishlistLoading: boolean;
  fetchWishlist: () => Promise<void>;
  toggleWishlist: (productId: string) => Promise<boolean>;
  isWishlisted: (productId: string) => boolean;
}

export const createWishlistSlice: StateCreator<WishlistSlice> = (set, get) => ({
  wishlistIds: [],
  wishlistProducts: [],
  wishlistLoading: false,
  fetchWishlist: async () => {
    set({ wishlistLoading: true });
    try {
      const res = await fetch('/api/v1/wishlist');
      if (res.ok) {
        const data = await res.json();
        const products: WishlistProduct[] = data.data.productIds || [];
        set({ wishlistProducts: products, wishlistIds: products.map((p) => p._id) });
      }
    } catch (err) {
      console.error('Failed to fetch wishlist', err);
    } finally {
      set({ wishlistLoading: false });
    }
  },
  toggleWishlist: async (productId: string) => {
    const prevIds = [...get().wishlistIds];
    const willAdd = !prevIds.includes(productId);
    set({
      wishlistIds: willAdd ? [...prevIds, productId] : prevIds.filter((id) => id !== productId),
    });
    try {
      const res = await fetch('/api/v1/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });
      if (!res.ok) {
        set({ wishlistIds: prevIds });
        return !willAdd;
      }
      const data = await res.json();
      return !!data.data.inWishlist;
    } catch (err) {
      console.error('Failed to update wishlist', err);
      set({ wishlistIds: prevIds });
      return !willAdd;
    }
  },
  isWishlisted: (productId: string) => get().wishlistIds.includes(productId),
});
