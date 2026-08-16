import mongoose, { Schema, Document } from 'mongoose';
import { generateId } from '@/shared/lib/generate-id';

export interface IWishlist extends Document<string> {
  _id: string;
  customerId: string;
  productIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

const wishlistSchema = new Schema<IWishlist>(
  {
    _id: { type: String, default: generateId },
    customerId: { type: String, ref: 'User', required: true, unique: true, index: true },
    productIds: [{ type: String, ref: 'Product' }],
  },
  { timestamps: true }
);

export const WishlistModel = mongoose.models.Wishlist || mongoose.model<IWishlist>('Wishlist', wishlistSchema);
