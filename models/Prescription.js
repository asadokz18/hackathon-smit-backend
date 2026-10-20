import mongoose from 'mongoose';

const prescriptionSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: [true, 'Patient ID is required'],
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Doctor ID is required'],
  },
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: [true, 'Appointment ID is required'],
  },
  medicines: [
    {
      name: { type: String, required: true },
      dosage: { type: String, required: true },       // e.g. "1-0-1" or "5ml"
      duration: { type: String, required: true },     // e.g. "5 days"
      instructions: { type: String, default: '' },    // e.g. "After meals"
    }
  ],
  notes: {
    type: String,
    trim: true,
    default: '',
  }
}, {
  timestamps: true,
});

const Prescription = mongoose.model('Prescription', prescriptionSchema);
export default Prescription;
