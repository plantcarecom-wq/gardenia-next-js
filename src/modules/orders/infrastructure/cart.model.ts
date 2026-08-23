import mongoose, { Schema, Document } from 'mongoose';
import { generateId } from '@/shared/lib/generate-id';

export interface ICartItem {
  _id?: string;
  productId: string;
  qty: number;
  priceSnapshot: number; // Snapshot of the price at the time of adding to cart
}

export interface ICart extends Document<string> {
  _id: string;
  customerId?: string;
  sessionId?: string;
  items: ICartItem[];
  createdAt: Date;
  updatedAt: Date;
}

const cartItemSchema = new Schema<ICartItem>({
  _id: { type: String, default: generateId },
  productId: { type: String, ref: 'Product', required: true },
  qty: { type: Number, required: true, min: 1 },
  priceSnapshot: { type: Number, required: true, min: 0 },
});

const cartSchema = new Schema<ICart>(
  {
    _id: { type: String, default: generateId },
    customerId: { type: String, ref: 'User', unique: true, sparse: true },
    sessionId: { type: String, unique: true, sparse: true },
    items: [cartItemSchema],
  },
  { timestamps: true }
);

export const CartModel = mongoose.models.Cart || mongoose.model<ICart>('Cart', cartSchema);
