import dns from 'dns';
import mongoose from 'mongoose';
import { env } from '@/config/env';

// Windows sometimes registers a loopback DNS server (via WSL/Docker virtual
// adapters) that Node's resolver picks up instead of the OS default, which
// breaks the SRV lookup used by mongodb+srv:// URIs with ECONNREFUSED.
if (process.platform === 'win32' && dns.getServers().every((s) => s === '127.0.0.1')) {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
}

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

