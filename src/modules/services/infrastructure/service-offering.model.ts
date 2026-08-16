import mongoose, { Schema, Document } from 'mongoose';
import { generateId } from '@/shared/lib/generate-id';

export interface IServiceOffering extends Document<string> {
  _id: string;
  gardenerId: string;
  categoryId: string;
  title: string;
  description: string;
  priceType: 'fixed' | 'hourly' | 'variable';
  price: number;
  imageMediaIds: string[];
  serviceAreaCities: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const serviceOfferingSchema = new Schema<IServiceOffering>(
  {
    _id: { type: String, default: generateId },
    gardenerId: { type: String, ref: 'User', required: true, index: true },
    categoryId: { type: String, ref: 'Category', required: true, index: true }, // Domain must be SERVICE
    title: { type: String, required: true },
    description: { type: String, required: true },
    priceType: { type: String, enum: ['fixed', 'hourly', 'variable'], required: true },
    price: { type: Number, required: true, min: 0 },
    imageMediaIds: [{ type: String }],
    serviceAreaCities: [{ type: String }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const ServiceOfferingModel = mongoose.models.ServiceOffering || mongoose.model<IServiceOffering>('ServiceOffering', serviceOfferingSchema);
