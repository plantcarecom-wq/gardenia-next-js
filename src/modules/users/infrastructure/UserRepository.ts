import { IUserRepository } from '../domain/IUserRepository';
import { UserModel, IUser } from './user.model';
import { connectDB } from '@/shared/lib/db';

export class UserRepository implements IUserRepository {
  async findById(id: string): Promise<IUser | null> {
    await connectDB();
    return UserModel.findById(id).lean();
  }

  async findByEmail(email: string): Promise<IUser | null> {
    await connectDB();
    return UserModel.findOne({ email }).lean();
  }

  async findAll(): Promise<IUser[]> {
    await connectDB();
    return UserModel.find().sort({ createdAt: -1 }).lean();
  }

  async create(data: Partial<IUser>): Promise<IUser> {
    await connectDB();
    const user = new UserModel(data);
    return user.save();
  }

  async update(id: string, data: Partial<IUser>): Promise<IUser | null> {
    await connectDB();
    return UserModel.findByIdAndUpdate(id, data, { new: true }).lean();
  }

  async updateStatus(id: string, status: IUser['status']): Promise<IUser | null> {
    await connectDB();
    return UserModel.findByIdAndUpdate(id, { status }, { new: true }).lean();
  }
}

export const userRepository = new UserRepository();
