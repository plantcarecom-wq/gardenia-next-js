import mongoose, { Schema, Document } from 'mongoose';
import { generateId } from '@/shared/lib/generate-id';

export interface ISubscriptionPackage extends Document<string> {
  _id: string;
  name: string;
  packageCode: string;
  price: number;
  billingCycle: 'monthly' | 'yearly';
  commissionPercent: number;
  platformItemDiscountPercent: number;
  perks: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const subscriptionPackageSchema = new Schema<ISubscriptionPackage>(
  {
    _id: { type: String, default: generateId },
    name: { type: String, required: true },
    packageCode: { type: String, required: true, unique: true, index: true },
    price: { type: Number, required: true, min: 0 },
    billingCycle: { type: String, enum: ['monthly', 'yearly'], required: true },
    commissionPercent: { type: Number, required: true, min: 0, max: 100 },
    platformItemDiscountPercent: { type: Number, required: true, min: 0, max: 100 },
    perks: [{ type: String }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const SubscriptionPackageModel = mongoose.models.SubscriptionPackage || mongoose.model<ISubscriptionPackage>('SubscriptionPackage', subscriptionPackageSchema);

export interface IGardenerSubscription extends Document<string> {
  _id: string;
  gardenerId: string;
  packageId: string;
  status: 'pending' | 'active' | 'cancelled' | 'expired';
  startDate?: Date;
  nextRenewalDate?: Date;
  autoRenew: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const gardenerSubscriptionSchema = new Schema<IGardenerSubscription>(
  {
    _id: { type: String, default: generateId },
    gardenerId: { type: String, ref: 'User', required: true, index: true },
    packageId: { type: String, ref: 'SubscriptionPackage', required: true, index: true },
    status: { type: String, enum: ['pending', 'active', 'cancelled', 'expired'], default: 'pending', index: true },
    startDate: { type: Date },
    nextRenewalDate: { type: Date },
    autoRenew: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const GardenerSubscriptionModel = mongoose.models.GardenerSubscription || mongoose.model<IGardenerSubscription>('GardenerSubscription', gardenerSubscriptionSchema);
