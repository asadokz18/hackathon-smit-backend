import mongoose from 'mongoose';

const diagnosisLogSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: [true, 'Patient ID is required'],
  },
  symptoms: {
    type: String,
    required: [true, 'Symptoms input is required'],
    trim: true,
  },
  aiResponse: {
    type: Object, // Stores structured diagnostic output (diseases, tests, reasoning)
    required: true,
  },
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high'],
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  }
}, {
  timestamps: true,
});

const DiagnosisLog = mongoose.model('DiagnosisLog', diagnosisLogSchema);
export default DiagnosisLog;
