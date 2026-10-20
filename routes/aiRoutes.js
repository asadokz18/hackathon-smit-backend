import express from 'express';
import { checkSymptoms, explainPrescriptionDetails, detectRiskCombinations } from '../controllers/aiController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/diagnose', protect, authorize('doctor'), checkSymptoms);
router.post('/explain', protect, explainPrescriptionDetails);
router.post('/risk', protect, authorize('doctor'), detectRiskCombinations);

export default router;
