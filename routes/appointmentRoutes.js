import express from 'express';
import {
  getAppointments,
  createAppointment,
  updateAppointmentStatus,
  deleteAppointment
} from '../controllers/appointmentController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getAppointments)
  .post(protect, createAppointment);

router.route('/:id')
  .put(protect, updateAppointmentStatus)
  .delete(protect, authorize('admin', 'receptionist'), deleteAppointment);

export default router;
