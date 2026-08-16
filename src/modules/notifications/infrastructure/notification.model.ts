import mongoose, { Schema, Document } from 'mongoose';
import { env } from '@/config/env';
import { generateId } from '@/shared/lib/generate-id';

export interface INotification extends Document<string> {
  _id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  referenceType?: string;
  referenceId?: string;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    _id: { type: String, default: generateId },
    userId: { type: String, ref: 'User', required: true, index: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    referenceType: { type: String },
    referenceId: { type: String },
    isRead: { type: Boolean, default: false, index: true },
    readAt: { type: Date },
  },
  { timestamps: true }
);

// Compound index
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

// TTL index for automatic purge after retention days
// We set this index on `createdAt` but only where `isRead` is true (partial index).
// However, Mongoose TTL index is simply expireAfterSeconds.
// A more robust way is to run a cron job or set expireAfterSeconds on createdAt.
const retentionSeconds = (env.NOTIFICATION_RETENTION_DAYS || 90) * 24 * 60 * 60;
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: retentionSeconds });

export const NotificationModel = mongoose.models.Notification || mongoose.model<INotification>('Notification', notificationSchema);
