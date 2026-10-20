import express from 'express';
import {
  getPrescriptions,
  getPrescriptionById,
  createPrescription
} from '../controllers/prescriptionController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getPrescriptions)
  .post(protect, authorize('doctor'), createPrescription);

router.route('/:id')
  .get(protect, getPrescriptionById);

export default router;
