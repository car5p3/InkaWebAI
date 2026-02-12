import mongoose from "mongoose";

if (!process.env.MONGO_URI) {
  throw new Error('Please define the MONGO_URI environment variable inside .env');
}

export const connectDB = async () => {
  try {
    const db = process.env.MONGO_URI;
    await mongoose.connect(db);
    // console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};