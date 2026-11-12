import mongoose from 'mongoose';
import { env } from './env.js';

let isConnected = false;

export const connectDB = async () => {
  if (isConnected) {
    console.log('MongoDB already connected.');
    return;
  }

  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      autoIndex: env.NODE_ENV !== 'production',
      serverSelectionTimeoutMS: 5000
    });

    isConnected = conn.connection.readyState === 1;
    console.log(`✅ MongoDB Connected Successfully: ${conn.connection.host}/${conn.connection.name}`);

    mongoose.connection.on('error', (err) => {
      console.error(`❌ MongoDB Runtime Connection Error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB connection lost. Reconnecting...');
      isConnected = false;
    });

    return conn;
  } catch (err) {
    console.error(`❌ MongoDB Initial Connection Error: ${err.message}`);
    // If running in development and local mongo isn't up, log guidance but don't crash dev tools prematurely
    if (env.NODE_ENV === 'development') {
      console.warn('💡 Tip: Ensure MongoDB Atlas URI or local MongoDB instance is configured in backend/.env');
    }
    throw err;
  }
};

export const disconnectDB = async () => {
  if (!isConnected) return;
  try {
    await mongoose.connection.close();
    isConnected = false;
    console.log('MongoDB connection gracefully closed.');
  } catch (err) {
    console.error('Error during MongoDB disconnection:', err.message);
  }
};

