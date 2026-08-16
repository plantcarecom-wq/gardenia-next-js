import mongoose, { Schema, Document } from 'mongoose';
import { generateId } from '@/shared/lib/generate-id';

export interface ICategory extends Document<string> {
  _id: string;
  categoryTypeId: string;
  name: string;
  categoryCode: string;
  parentCategoryId?: string;
  imageMediaId?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    _id: { type: String, default: generateId },
    categoryTypeId: { type: String, ref: 'CategoryType', required: true, index: true },
    name: { type: String, required: true },
    categoryCode: { type: String, required: true, unique: true, index: true },
    parentCategoryId: { type: String, ref: 'Category' },
    imageMediaId: { type: String },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const CategoryModel = mongoose.models.Category || mongoose.model<ICategory>('Category', categorySchema);
