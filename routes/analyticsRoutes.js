import express from 'express';
import { getAdminAnalytics, getDoctorAnalytics } from '../controllers/analyticsController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/admin', protect, authorize('admin'), getAdminAnalytics);
router.get('/doctor', protect, authorize('doctor'), getDoctorAnalytics);

export default router;
