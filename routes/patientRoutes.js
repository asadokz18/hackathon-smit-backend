import express from 'express';
import {
  getPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient
} from '../controllers/patientController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getPatients)
  .post(protect, authorize('admin', 'receptionist'), createPatient);

router.route('/:id')
  .get(protect, getPatientById)
  .put(protect, authorize('admin', 'receptionist', 'doctor'), updatePatient)
  .delete(protect, authorize('admin', 'receptionist'), deletePatient);

export default router;
