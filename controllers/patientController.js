import Patient from '../models/Patient.js';
import User from '../models/User.js';

// @desc    Get all patients
// @route   GET /api/patients
// @access  Private (Admins, Doctors, Receptionists can see all, Patients see only themselves)
export const getPatients = async (req, res) => {
  try {
    if (req.user.role === 'patient') {
      // Find patient matching the user's name
      const patient = await Patient.findOne({ name: req.user.name });
      if (!patient) {
        return res.json({ success: true, data: [] });
      }
      return res.json({ success: true, data: [patient] });
    }

    const patients = await Patient.find({}).sort({ createdAt: -1 });
    res.json({ success: true, data: patients });
  } catch (error) {
    console.error(`[Patient Controller] getPatients error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server patient retrieval error' });
  }
};

// @desc    Get patient by ID
// @route   GET /api/patients/:id
// @access  Private
export const getPatientById = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    // Role check: patient role can only see their own profile
    if (req.user.role === 'patient' && patient.name !== req.user.name) {
      return res.status(403).json({ success: false, message: 'Unauthorized profile access' });
    }

    res.json({ success: true, data: patient });
  } catch (error) {
    console.error(`[Patient Controller] getPatientById error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server patient lookup error' });
  }
};

// @desc    Create new patient
// @route   POST /api/patients
// @access  Private (Admin, Receptionist)
export const createPatient = async (req, res) => {
  const { name, age, gender, contact, medicalHistory } = req.body;

  try {
    // SaaS Check: Free subscription limit check
    // Find the logged-in user subscription plan
    const creator = await User.findById(req.user._id);
    const totalPatients = await Patient.countDocuments({});

    if (creator.subscriptionPlan === 'free' && totalPatients >= 5) {
      return res.status(403).json({
        success: false,
        limitReached: true,
        message: 'Patient limit reached (5 patients) for Free Tier. Upgrade to Pro Plan for unlimited patient records and advanced AI diagnostic capabilities.',
      });
    }

    const patient = await Patient.create({
      name,
      age,
      gender,
      contact,
      createdBy: req.user._id,
      medicalHistory: medicalHistory || [],
    });

    res.status(201).json({ success: true, data: patient });
  } catch (error) {
    console.error(`[Patient Controller] createPatient error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server patient creation error' });
  }
};

// @desc    Update patient details
// @route   PUT /api/patients/:id
// @access  Private (Admin, Receptionist, Doctor)
export const updatePatient = async (req, res) => {
  try {
    let patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    patient = await Patient.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({ success: true, data: patient });
  } catch (error) {
    console.error(`[Patient Controller] updatePatient error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server patient update error' });
  }
};

// @desc    Delete patient
// @route   DELETE /api/patients/:id
// @access  Private (Admin, Receptionist)
export const deletePatient = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    await Patient.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Patient record successfully removed' });
  } catch (error) {
    console.error(`[Patient Controller] deletePatient error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server patient deletion error' });
  }
};
