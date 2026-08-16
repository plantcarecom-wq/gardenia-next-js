import mongoose, { Schema, Document } from 'mongoose';
import { generateId } from '@/shared/lib/generate-id';

export interface IReview extends Document<string> {
  _id: string;
  targetType: 'PRODUCT' | 'GARDENER';
  targetId: string;
  customerId: string;
  rating: number; // 1-5
  comment?: string;
  imageMediaIds?: string[];
  isHidden: boolean;
  reportedBy: string[];
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    _id: { type: String, default: generateId },
    targetType: { type: String, enum: ['PRODUCT', 'GARDENER'], required: true },
    targetId: { type: String, required: true, index: true },
    customerId: { type: String, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String },
    imageMediaIds: [{ type: String }],
    isHidden: { type: Boolean, default: false },
    reportedBy: [{ type: String, ref: 'User' }],
  },
  { timestamps: true }
);

// One review per customer per target
reviewSchema.index({ targetType: 1, targetId: 1, customerId: 1 }, { unique: true });

export const ReviewModel = mongoose.models.Review || mongoose.model<IReview>('Review', reviewSchema);
