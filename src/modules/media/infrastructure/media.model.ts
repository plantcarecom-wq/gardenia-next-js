import mongoose, { Schema, Document } from 'mongoose';
import { generateId } from '@/shared/lib/generate-id';

export interface IMedia extends Document<string> {
  _id: string;
  provider: 'cloudinary' | 'local';
  publicId?: string;
  path?: string;
  url: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  uploadedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const mediaSchema = new Schema<IMedia>(
  {
    _id: { type: String, default: generateId },
    provider: { type: String, enum: ['cloudinary', 'local'], required: true },
    publicId: { type: String },
    path: { type: String },
    url: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    width: { type: Number },
    height: { type: Number },
    uploadedBy: { type: String, ref: 'User', required: true, index: true },
  },
  { timestamps: true }
);

export const MediaModel = mongoose.models.Media || mongoose.model<IMedia>('Media', mediaSchema);
