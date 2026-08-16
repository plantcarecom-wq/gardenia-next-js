import { create } from 'zustand';
import { createCartSlice, CartSlice } from './cart.slice';
import { createNotificationSlice, NotificationSlice } from './notification.slice';
import { createToastSlice, ToastSlice } from './toast.slice';
import { createWishlistSlice, WishlistSlice } from './wishlist.slice';

type StoreState = CartSlice & NotificationSlice & ToastSlice & WishlistSlice;

export const useStore = create<StoreState>()((...a) => ({
  ...createCartSlice(...a),
  ...createNotificationSlice(...a),
  ...createToastSlice(...a),
  ...createWishlistSlice(...a),
}));
