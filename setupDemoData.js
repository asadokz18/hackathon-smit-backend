
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import User from './models/User.js';
import Patient from './models/Patient.js';

dotenv.config();

async function setupDemoData() {
  try {
    console.log('Connecting to MongoDB...');
    await connectDB();

    // Create or update demo login accounts.
    const demoUsers = [
      {
        name: 'Dr. Usman Farooq',
        email: 'doctor@medpulse.com',
        password: 'doctor123',
        role: 'doctor',
        subscriptionPlan: 'pro',
        specialization: 'Cardiology & General Health',
        contact: '+92 333-4567890',
      },
      {
        name: 'Demo Receptionist',
        email: 'receptionist@medpulse.com',
        password: 'recep123',
        role: 'receptionist',
        subscriptionPlan: 'free',
      },
      {
        name: 'Demo Patient',
        email: 'patient@medpulse.com',
        password: 'patient123',
        role: 'patient',
        subscriptionPlan: 'free',
      },
    ];

    const accounts = {};

    for (const data of demoUsers) {
      let user = await User.findOne({ email: data.email });

      if (!user) {
        user = new User(data);
      } else {
        user.name = data.name;
        user.password = data.password;
        user.role = data.role;
        user.subscriptionPlan = data.subscriptionPlan;
        user.specialization = data.specialization || '';
        user.contact = data.contact || '';
      }

      await user.save();
      accounts[data.role] = user;

      console.log(`Account ready: ${data.role} (${data.email})`);
    }

    // Use the existing receptionist account for sample patient records.
    const receptionist = accounts.receptionist;

    const samplePatients = [
      {
        name: 'Ahmed Hassan',
        age: 42,
        gender: 'male',
        contact: '+92 300-1234567',
        createdBy: receptionist._id,
        medicalHistory: ['Hypertension', 'Mild Dust Allergy'],
      },
      {
        name: 'Fatima Malik',
        age: 29,
        gender: 'female',
        contact: '+92 321-9876543',
        createdBy: receptionist._id,
        medicalHistory: ['Asthma'],
      },
      {
        name: 'Bilal Chaudhry',
        age: 38,
        gender: 'male',
        contact: '+92 345-1122334',
        createdBy: receptionist._id,
        medicalHistory: ['Insomnia', 'Chronic Joint Pain'],
      },
      {
        name: 'Sana Rehman',
        age: 26,
        gender: 'female',
        contact: '+92 312-5566778',
        createdBy: receptionist._id,
        medicalHistory: ['Anemia'],
      },
    ];

    for (const data of samplePatients) {
      const existingPatient = await Patient.findOne({
        contact: data.contact,
      });

      if (existingPatient) {
        console.log(`Patient already exists: ${data.name}`);
        continue;
      }

      await Patient.create(data);
      console.log(`Patient created: ${data.name}`);
    }

    console.log('\nDemo setup completed successfully.');
    console.log('Verify these accounts in your database before testing login.');
  } catch (error) {
    console.error('Demo setup failed:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

setupDemoData();
