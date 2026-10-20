import DiagnosisLog from '../models/DiagnosisLog.js';
import Patient from '../models/Patient.js';
import Prescription from '../models/Prescription.js';
import User from '../models/User.js';
import { diagnoseSymptoms, explainPrescription, detectPatientRisk } from '../utils/gemini.js';

// Helper to check if a user is upgraded to Pro
const checkProSubscription = async (userId) => {
  const user = await User.findById(userId);
  return user && user.subscriptionPlan === 'pro';
};

const PRO_UPGRADE_MSG = 'AI Smart Features are exclusive to the Pro Plan. Upgrade your clinic subscription to unlock unlimited patient files, instant AI symptom diagnostics, chronic risk scanners, and multi-language explanations.';

// @desc    Run AI symptom checker
// @route   POST /api/ai/diagnose
// @access  Private (Doctor only, SaaS Pro restriction)
export const checkSymptoms = async (req, res) => {
  const { patientId, symptoms } = req.body;

  try {
    // 1. SaaS Gate Check
    const isPro = await checkProSubscription(req.user._id);
    if (!isPro) {
      return res.status(403).json({
        success: false,
        aiBlocked: true,
        message: PRO_UPGRADE_MSG,
      });
    }

    // Fetch patient context
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    const historyStr = patient.medicalHistory.join(', ');

    // Call Gemini utility
    const aiResult = await diagnoseSymptoms(symptoms, patient.age, patient.gender, historyStr);

    // Save to DiagnosisLog
    const diagnosisLog = await DiagnosisLog.create({
      patientId,
      symptoms,
      aiResponse: aiResult,
      riskLevel: aiResult.riskLevel || 'low',
      createdBy: req.user._id,
    });

    res.json({
      success: true,
      data: diagnosisLog,
    });
  } catch (error) {
    console.error(`[AI Controller] checkSymptoms error: ${error.message}`);
    res.status(500).json({ success: false, message: 'AI diagnostics failed' });
  }
};

// @desc    Explain a prescription (in English and Urdu)
// @route   POST /api/ai/explain
// @access  Private (SaaS Pro restriction)
export const explainPrescriptionDetails = async (req, res) => {
  const { prescriptionId } = req.body;

  try {
    // 1. SaaS Gate Check
    const isPro = await checkProSubscription(req.user._id);
    if (!isPro) {
      return res.status(403).json({
        success: false,
        aiBlocked: true,
        message: PRO_UPGRADE_MSG,
      });
    }

    // Fetch Prescription
    const prescription = await Prescription.findById(prescriptionId).populate('patientId');
    if (!prescription) {
      return res.status(404).json({ success: false, message: 'Prescription record not found' });
    }

    // Call Gemini utility
    const explanation = await explainPrescription(prescription.medicines, prescription.notes);

    res.json({
      success: true,
      data: explanation,
    });
  } catch (error) {
    console.error(`[AI Controller] explainPrescription error: ${error.message}`);
    res.status(500).json({ success: false, message: 'AI prescription explanation failed' });
  }
};

// @desc    Analyze chronic risk and medical hazards
// @route   POST /api/ai/risk
// @access  Private (Doctor only, SaaS Pro restriction)
export const detectRiskCombinations = async (req, res) => {
  const { patientId, symptoms } = req.body;

  try {
    // 1. SaaS Gate Check
    const isPro = await checkProSubscription(req.user._id);
    if (!isPro) {
      return res.status(403).json({
        success: false,
        aiBlocked: true,
        message: PRO_UPGRADE_MSG,
      });
    }

    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    const historyStr = patient.medicalHistory.join(', ');

    // Call Gemini utility
    const riskAnalysis = await detectPatientRisk(symptoms, patient.age, patient.gender, historyStr);

    res.json({
      success: true,
      data: riskAnalysis,
    });
  } catch (error) {
    console.error(`[AI Controller] detectRisk error: ${error.message}`);
    res.status(500).json({ success: false, message: 'AI risk assessment failed' });
  }
};
