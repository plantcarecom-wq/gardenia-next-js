import mongoose, { Schema, Document } from 'mongoose';
import { generateId } from '@/shared/lib/generate-id';

export interface IProduct extends Document<string> {
  _id: string;
  name: string;
  slug: string;
  sku?: string;
  categoryId: string;
  description: string;
  imageMediaIds: string[];
  price: number;
  discountPrice?: number;
  stockQty: number;
  unit?: string;
  attributes: Record<string, string>;
  isActive: boolean;
  isFeatured: boolean;
  ratingAverage: number;
  ratingCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    _id: { type: String, default: generateId },
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    sku: { type: String },
    categoryId: { type: String, ref: 'Category', required: true, index: true },
    description: { type: String, required: true },
    imageMediaIds: [{ type: String }],
    price: { type: Number, required: true, min: 0 },
    discountPrice: { type: Number, min: 0 },
    stockQty: { type: Number, required: true, min: 0, default: 0 },
    unit: { type: String },
    attributes: { type: Map, of: String, default: {} },
    isActive: { type: Boolean, default: true, index: true },
    isFeatured: { type: Boolean, default: false },
    ratingAverage: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Compound index for category filtering of active products
productSchema.index({ categoryId: 1, isActive: 1 });

export const ProductModel = mongoose.models.Product || mongoose.model<IProduct>('Product', productSchema);
