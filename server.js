import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';

// Route Imports
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import patientRoutes from './routes/patientRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';
import prescriptionRoutes from './routes/prescriptionRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';

// Models for Auto-Seeding
import User from './models/User.js';
import Patient from './models/Patient.js';
import Appointment from './models/Appointment.js';
import Prescription from './models/Prescription.js';
import DiagnosisLog from './models/DiagnosisLog.js';

dotenv.config();

const app = express();
const AUTHORIZED_ADMIN_EMAIL = process.env.AUTHORIZED_ADMIN_EMAIL;
const AUTHORIZED_ADMIN_PASSWORD = process.env.AUTHORIZED_ADMIN_PASSWORD;

// Middlewares
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health check
// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'MedPulse AI Backend is running',
    health: '/api/health'
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date()
  });
});

// Port & Launch
const PORT = process.env.PORT || 5000;

// Auto-seeding function
const seedDatabase = async () => {
  try {
    const totalUsers = await User.countDocuments();
    if (totalUsers > 0) {
      console.log('[Seeder] Existing users detected. Skipping seed sequence to preserve data.');
      return;
    }

    console.log('[Seeder] Running auto-seeding sequence...');

    // 1. Create Staff Accounts
    const admin = await User.create({
      name: 'Asad Ullah (Admin)',
      email: AUTHORIZED_ADMIN_EMAIL,
      password: AUTHORIZED_ADMIN_PASSWORD,
      role: 'admin',
      subscriptionPlan: 'pro', // Admin is pro
      contact: '+923348761317',
    });

    const doctor = await User.create({
      name: 'Dr. Usman Farooq',
      email: 'doctor@medpulse.com',
      password: 'doctor123',
      role: 'doctor',
      subscriptionPlan: 'pro', // Upgraded to Pro by default for AI features
      specialization: 'Cardiology & General Health',
      contact: '+92 333-4567890',
    });

    const receptionist = await User.create({
      name: 'Zainab Iqbal',
      email: 'receptionist@medpulse.com',
      password: 'recep123',
      role: 'receptionist',
      subscriptionPlan: 'free',
      contact: '+92 311-7654321',
    });

    const patientUser = await User.create({
      name: 'Ahmed Hassan',
      email: 'patient@medpulse.com',
      password: 'patient123',
      role: 'patient',
      subscriptionPlan: 'free',
      contact: '+92 300-1234567',
    });

    console.log('[Seeder] Created default user accounts:');
    console.log(` - Admin: ${AUTHORIZED_ADMIN_EMAIL} / ${AUTHORIZED_ADMIN_PASSWORD}`);
    console.log(' - Doctor: doctor@medpulse.com / doctor123');
    console.log(' - Receptionist: receptionist@medpulse.com / recep123');
    console.log(' - Patient: patient@medpulse.com / patient123');

    // 2. Create Patients
    const patient1 = await Patient.create({
      name: 'Ahmed Hassan',
      age: 42,
      gender: 'male',
      contact: '+92 300-1234567',
      createdBy: receptionist._id,
      medicalHistory: ['Hypertension', 'Mild Dust Allergy'],
    });

    const patient2 = await Patient.create({
      name: 'Fatima Malik',
      age: 29,
      gender: 'female',
      contact: '+92 321-9876543',
      createdBy: receptionist._id,
      medicalHistory: ['Asthma'],
    });

    const patient3 = await Patient.create({
      name: 'Bilal Chaudhry',
      age: 38,
      gender: 'male',
      contact: '+92 345-1122334',
      createdBy: admin._id,
      medicalHistory: ['Insomnia', 'Chronic Joint Pain'],
    });

    const patient4 = await Patient.create({
      name: 'Sana Rehman',
      age: 26,
      gender: 'female',
      contact: '+92 312-5566778',
      createdBy: receptionist._id,
      medicalHistory: ['Anemia'],
    });

    console.log('[Seeder] Preloaded patient demographic profiles.');

    // 3. Create Sample Appointments
    // A completed one yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    // An upcoming one tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const appt1 = await Appointment.create({
      patientId: patient1._id,
      doctorId: doctor._id,
      date: yesterday,
      status: 'completed',
      reason: 'Chronic chest tightness and fatigue',
    });

    const appt2 = await Appointment.create({
      patientId: patient2._id,
      doctorId: doctor._id,
      date: tomorrow,
      status: 'confirmed',
      reason: 'Asthma follow-up checkup',
    });

    const appt3 = await Appointment.create({
      patientId: patient3._id,
      doctorId: doctor._id,
      date: new Date(), // Today
      status: 'pending',
      reason: 'Physical exam and stress assessment',
    });

    console.log('[Seeder] Booked baseline appointments.');

    // 4. Create Sample Prescription for Ahmed Hassan
    const prescription = await Prescription.create({
      patientId: patient1._id,
      doctorId: doctor._id,
      appointmentId: appt1._id,
      medicines: [
        { name: 'Amlodipine Besylate', dosage: '5mg - Once Daily', duration: '30 Days', instructions: 'Take in the morning with water' },
        { name: 'Multivitamin Formula', dosage: '1 Tablet - Daily', duration: '15 Days', instructions: 'Take after breakfast' }
      ],
      notes: 'Limit coffee intake to max 1 cup per day. Engage in 30 minutes of cardio. Return for blood pressure review in 4 weeks.',
    });

    console.log('[Seeder] Logged initial diagnostic prescriptions.');

    // 5. Create Sample Diagnosis Log for Ahmed Hassan
    await DiagnosisLog.create({
      patientId: patient1._id,
      symptoms: 'Chest tightness, elevated pulse rate, and afternoon exhaustion',
      aiResponse: {
        possibleDiseases: [
          { name: 'Hypertensive Cardiovascular Strain', probability: 75, description: 'Elevated circulatory load stressing cardiac pathways.' },
          { name: 'Generalized Anxiety Tension', probability: 40, description: 'Autonomic nervous stress mimicking mechanical chest tightness.' }
        ],
        riskLevel: 'high',
        suggestedTests: ['Electrocardiogram (ECG)', 'Ambulatory Blood Pressure Monitoring', 'Fasting Blood Glucose'],
        clinicalReasoning: 'Coexistence of chronic hypertension history and acute chest load flags a high-priority cardiovascular screening profile.'
      },
      riskLevel: 'high',
      createdBy: doctor._id,
    });

    console.log('[Seeder] Populated baseline AI Smart Diagnosis logs.');
    console.log('[Seeder] Seeding sequence successfully completed!');
  } catch (error) {
    console.error(`[Seeder Error] Failed to seed database: ${error.message}`);
  }
};


 // Local development
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, async () => {
    console.log(`[Server] API Target: http://localhost:${PORT}`);

    try {
      await connectDB();
      await seedDatabase();
    } catch (error) {
      console.error('[Server] Startup failed:', error.message);
    }
  });
}

// Vercel serverless handler (ES Modules)
export default async function handler(req, res) {
  try {
    await connectDB();
    return app(req, res);
  } catch (error) {
    console.error('[Server] Initialization failed:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Server initialization failed',
    });
  }
}

