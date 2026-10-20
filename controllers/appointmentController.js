import Appointment from '../models/Appointment.js';
import Patient from '../models/Patient.js';
import User from '../models/User.js';

// @desc    Get all appointments
// @route   GET /api/appointments
// @access  Private
export const getAppointments = async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'doctor') {
      // Doctors only see their own appointments
      query.doctorId = req.user._id;
    } else if (req.user.role === 'patient') {
      // Find patient matching user's name
      const patient = await Patient.findOne({ name: req.user.name });
      if (!patient) {
        return res.json({ success: true, data: [] });
      }
      query.patientId = patient._id;
    }

    const appointments = await Appointment.find(query)
      .populate('patientId')
      .populate('doctorId', 'name email specialization contact')
      .sort({ date: 1 });

    res.json({ success: true, data: appointments });
  } catch (error) {
    console.error(`[Appointment Controller] getAppointments error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server appointments retrieval error' });
  }
};

// @desc    Book a new appointment
// @route   POST /api/appointments
// @access  Private (Admin, Receptionist, Doctor, Patient)
export const createAppointment = async (req, res) => {
  const { patientId, doctorId, date, reason } = req.body;

  try {
    // Basic verification
    const patientExists = await Patient.findById(patientId);
    if (!patientExists) {
      return res.status(404).json({ success: false, message: 'Selected Patient record not found' });
    }

    const doctorExists = await User.findById(doctorId);
    if (!doctorExists || doctorExists.role !== 'doctor') {
      return res.status(404).json({ success: false, message: 'Selected Doctor account not found' });
    }

    const appointment = await Appointment.create({
      patientId,
      doctorId,
      date,
      reason: reason || 'Routine Checkup',
      status: 'pending',
    });

    // Populate and send response
    const populated = await Appointment.findById(appointment._id)
      .populate('patientId')
      .populate('doctorId', 'name email specialization');

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    console.error(`[Appointment Controller] createAppointment error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server booking error' });
  }
};

// @desc    Update appointment status
// @route   PUT /api/appointments/:id
// @access  Private
export const updateAppointmentStatus = async (req, res) => {
  const { status } = req.body;

  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    // Guard: Doctor can update, Receptionist can update, Admin can update.
    // Patient can only "cancel" their own pending appointment
    if (req.user.role === 'patient') {
      const patient = await Patient.findOne({ name: req.user.name });
      if (!patient || appointment.patientId.toString() !== patient._id.toString()) {
        return res.status(403).json({ success: false, message: 'Unauthorized modification attempt' });
      }
      if (status !== 'cancelled') {
        return res.status(403).json({ success: false, message: 'Patients can only cancel appointments' });
      }
    }

    appointment.status = status;
    await appointment.save();

    const populated = await Appointment.findById(appointment._id)
      .populate('patientId')
      .populate('doctorId', 'name email specialization');

    res.json({ success: true, data: populated });
  } catch (error) {
    console.error(`[Appointment Controller] updateAppointmentStatus error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server status update error' });
  }
};

// @desc    Delete appointment
// @route   DELETE /api/appointments/:id
// @access  Private (Admin, Receptionist)
export const deleteAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    await Appointment.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Appointment successfully deleted' });
  } catch (error) {
    console.error(`[Appointment Controller] deleteAppointment error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server appointment deletion error' });
  }
};
