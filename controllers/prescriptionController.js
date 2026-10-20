import Prescription from '../models/Prescription.js';
import Appointment from '../models/Appointment.js';
import Patient from '../models/Patient.js';

// @desc    Get all prescriptions
// @route   GET /api/prescriptions
// @access  Private
export const getPrescriptions = async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'doctor') {
      query.doctorId = req.user._id;
    } else if (req.user.role === 'patient') {
      const patient = await Patient.findOne({ name: req.user.name });
      if (!patient) {
        return res.json({ success: true, data: [] });
      }
      query.patientId = patient._id;
    }

    const prescriptions = await Prescription.find(query)
      .populate('patientId')
      .populate('doctorId', 'name email specialization contact')
      .populate('appointmentId')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: prescriptions });
  } catch (error) {
    console.error(`[Prescription Controller] getPrescriptions error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server prescriptions retrieval error' });
  }
};

// @desc    Get prescription by ID
// @route   GET /api/prescriptions/:id
// @access  Private
export const getPrescriptionById = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate('patientId')
      .populate('doctorId', 'name email specialization contact')
      .populate('appointmentId');

    if (!prescription) {
      return res.status(404).json({ success: false, message: 'Prescription record not found' });
    }

    // Guard: Patient can only read their own prescription
    if (req.user.role === 'patient') {
      const patient = await Patient.findOne({ name: req.user.name });
      if (!patient || prescription.patientId._id.toString() !== patient._id.toString()) {
        return res.status(403).json({ success: false, message: 'Unauthorized prescription access' });
      }
    }

    res.json({ success: true, data: prescription });
  } catch (error) {
    console.error(`[Prescription Controller] getPrescriptionById error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server prescription lookup error' });
  }
};

// @desc    Create new prescription
// @route   POST /api/prescriptions
// @access  Private (Doctor only)
export const createPrescription = async (req, res) => {
  const { patientId, appointmentId, medicines, notes } = req.body;

  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ success: false, message: 'Only Doctors can write prescriptions' });
    }

    // Verify appointment matches and patient exists
    const patientExists = await Patient.findById(patientId);
    if (!patientExists) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    const prescription = await Prescription.create({
      patientId,
      doctorId: req.user._id,
      appointmentId,
      medicines,
      notes: notes || '',
    });

    // Auto-mark appointment as "completed"
    appointment.status = 'completed';
    await appointment.save();

    const populated = await Prescription.findById(prescription._id)
      .populate('patientId')
      .populate('doctorId', 'name email specialization')
      .populate('appointmentId');

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    console.error(`[Prescription Controller] createPrescription error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server prescription creation error' });
  }
};
