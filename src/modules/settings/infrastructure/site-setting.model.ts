import mongoose, { Schema, Document } from 'mongoose';
import { generateId } from '@/shared/lib/generate-id';

export interface ISiteSetting extends Document<string> {
  _id: string;
  key: string;
  value: mongoose.Schema.Types.Mixed;
  description: string;
  updatedAt: Date;
}

const siteSettingSchema = new Schema<ISiteSetting>(
  {
    _id: { type: String, default: generateId },
    key: { type: String, required: true, unique: true, index: true },
    value: { type: Schema.Types.Mixed, required: true },
    description: { type: String, default: '' },
  },
  { timestamps: true }
);

export const SiteSettingModel =
  mongoose.models.SiteSetting || mongoose.model<ISiteSetting>('SiteSetting', siteSettingSchema);

/**
 * Retrieves a site setting by key, returning the fallback if not found.
 */
export async function getSiteSetting<T>(key: string, fallback: T): Promise<T> {
  const setting = await SiteSettingModel.findOne({ key }).lean();
  return setting ? (setting as any).value : fallback;
}

/**
 * Upserts a site setting by key.
 */
export async function setSiteSetting(key: string, value: unknown, description?: string): Promise<void> {
  await SiteSettingModel.findOneAndUpdate(
    { key },
    { value, ...(description ? { description } : {}) },
    { upsert: true }
  );
}
