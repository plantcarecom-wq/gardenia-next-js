import mongoose from 'mongoose';
import { env } from '@/config/env';

const MONGODB_URI = env.MONGODB_URI;

type GlobalMongoose = {
  mongoose: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
};

let cached = (global as unknown as GlobalMongoose).mongoose;

if (!cached) {
  cached = (global as unknown as GlobalMongoose).mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }
  
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

