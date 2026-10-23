
import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const connStr = process.env.MONGODB_URI;

    if (!connStr) {
      throw new Error('MONGODB_URI environment variable is missing');
    }

    if (mongoose.connection.readyState === 1) {
      return mongoose.connection;
    }

    await mongoose.connect(connStr);

    console.log(
      `[MongoDB] Connected successfully to host: ${mongoose.connection.host}`
    );

    return mongoose.connection;
  } catch (error) {
    console.error(`[MongoDB] Connection error: ${error.message}`);
    throw error;
  }
};

export default connectDB;
