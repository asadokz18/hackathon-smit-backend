
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import User from './models/User.js';

dotenv.config();

async function createAdmin() {
  console.log('[Admin Setup] Starting...');

  try {
    const email = process.env.AUTHORIZED_ADMIN_EMAIL
      ?.trim()
      .toLowerCase();

    const password = process.env.AUTHORIZED_ADMIN_PASSWORD;

    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is missing in .env');
    }

    if (!email || !password) {
      throw new Error(
        'Admin email or password is missing in .env'
      );
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    await connectDB();
    console.log('[Admin Setup] MongoDB connected.');

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      // Only promote the intended existing account.
      existingUser.role = 'admin';
      existingUser.password = password;
      existingUser.subscriptionPlan = 'pro';

      await existingUser.save();

      console.log('[Admin Setup] Existing account updated to Admin.');
    } else {
      await User.create({
        name: 'Asad Ullah (Admin)',
        email,
        password,
        role: 'admin',
        subscriptionPlan: 'pro',
      });

      console.log('[Admin Setup] Admin account created.');
    }

    console.log('[Admin Setup] Completed successfully.');
  } catch (error) {
    console.error('[Admin Setup] Failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
}

createAdmin();
