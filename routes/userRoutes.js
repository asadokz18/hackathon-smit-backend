import express from 'express';
import { getStaffUsers, updateSubscriptionPlan, deleteStaffUser } from '../controllers/userController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/staff', protect, authorize('admin'), getStaffUsers);
router.put('/:id/subscription', protect, updateSubscriptionPlan);
router.delete('/staff/:id', protect, authorize('admin'), deleteStaffUser);

export default router;
