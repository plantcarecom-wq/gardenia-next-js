import mongoose, { Schema, Document } from 'mongoose';
import { Role, Roles } from '@/shared/types/roles';
import { generateId } from '@/shared/lib/generate-id';

export interface IUser extends Document<string> {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  passwordHash: string;
  role: Role;
  status: 'pending' | 'active' | 'suspended';
  avatarMediaId?: string;
  resetToken?: string;
  resetTokenExpiry?: Date;
  emailVerified: boolean;
  emailVerifyToken?: string;
  emailVerifyTokenExpiry?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    _id: { type: String, default: generateId },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    phone: { type: String },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: Object.values(Roles), required: true, default: Roles.CUSTOMER },
    status: { type: String, enum: ['pending', 'active', 'suspended'], default: 'active' },
    avatarMediaId: { type: String },
    resetToken: { type: String },
    resetTokenExpiry: { type: Date },
    emailVerified: { type: Boolean, default: false },
    emailVerifyToken: { type: String },
    emailVerifyTokenExpiry: { type: Date },
  },
  { timestamps: true }
);

export const UserModel = mongoose.models.User || mongoose.model<IUser>('User', userSchema);
