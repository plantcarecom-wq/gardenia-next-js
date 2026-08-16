import mongoose, { Schema, Document } from 'mongoose';
import { generateId } from '@/shared/lib/generate-id';

export interface IPost extends Document<string> {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  coverImageMediaId?: string;
  isPublished: boolean;
  publishedAt?: Date;
  authorId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const postSchema = new Schema<IPost>(
  {
    _id: { type: String, default: generateId },
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    excerpt: { type: String, required: true },
    body: { type: String, required: true },
    coverImageMediaId: { type: String },
    isPublished: { type: Boolean, default: false, index: true },
    publishedAt: { type: Date },
    authorId: { type: String, ref: 'User' },
  },
  { timestamps: true }
);

export const PostModel = mongoose.models.Post || mongoose.model<IPost>('Post', postSchema);
