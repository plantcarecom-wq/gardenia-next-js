import mongoose, { Schema, Document } from 'mongoose';
import { generateId } from '@/shared/lib/generate-id';

export interface ICategoryType extends Document<string> {
  _id: string;
  name: string;
  categoryTypeCode: string;
  domain: 'PRODUCT' | 'SERVICE';
  iconMediaId?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const categoryTypeSchema = new Schema<ICategoryType>(
  {
    _id: { type: String, default: generateId },
    name: { type: String, required: true },
    categoryTypeCode: { type: String, required: true, unique: true, index: true },
    domain: { type: String, enum: ['PRODUCT', 'SERVICE'], required: true },
    iconMediaId: { type: String },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const CategoryTypeModel = mongoose.models.CategoryType || mongoose.model<ICategoryType>('CategoryType', categoryTypeSchema);
