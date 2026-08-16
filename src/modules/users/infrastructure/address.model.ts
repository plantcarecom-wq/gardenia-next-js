import mongoose, { Schema, Document } from 'mongoose';
import { generateId } from '@/shared/lib/generate-id';

export interface IAddress extends Document<string> {
  _id: string;
  userId: string;
  label: string;
  line1: string;
  line2?: string;
  city: string;
  region: string;
  postalCode?: string;
  country: string;
  lat?: number;
  lng?: number;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const addressSchema = new Schema<IAddress>(
  {
    _id: { type: String, default: generateId },
    userId: { type: String, ref: 'User', required: true, index: true },
    label: { type: String, required: true },
    line1: { type: String, required: true },
    line2: { type: String },
    city: { type: String, required: true },
    region: { type: String, required: true },
    postalCode: { type: String },
    country: { type: String, required: true },
    lat: { type: Number },
    lng: { type: Number },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const AddressModel = mongoose.models.Address || mongoose.model<IAddress>('Address', addressSchema);
