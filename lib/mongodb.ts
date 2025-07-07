import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable in .env.local');
}

// Add this for TypeScript global type safety
declare global {
  // eslint-disable-next-line no-var
  var mongoose: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } | undefined;
}

if (!global.mongoose) {
  global.mongoose = { conn: null, promise: null };
}
const cached = global.mongoose as { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4
    };

    cached.promise = mongoose.connect(MONGODB_URI as string, opts).then((mongoose) => {
      console.log('Connected to MongoDB Atlas');
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
    
    // Import all models to ensure they're registered
    await import('@/lib/models');
    
  } catch (e) {
    cached.promise = null;
    console.error('MongoDB connection error:', e);
    throw e;
  }

  return cached.conn;
}

export default connectDB;