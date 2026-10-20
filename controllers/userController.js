import User from '../models/User.js';

// @desc    Get all clinical staff (Doctors and Receptionists)
// @route   GET /api/users/staff
// @access  Private (Admin only)
export const getStaffUsers = async (req, res) => {
  try {
    const staff = await User.find({ role: { $in: ['doctor', 'receptionist'] } }).select('-password');
    res.json({ success: true, data: staff });
  } catch (error) {
    console.error(`[User Controller] getStaffUsers error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server staff retrieval error' });
  }
};

// @desc    Toggle or update user SaaS subscription plan (Free <-> Pro)
// @route   PUT /api/users/:id/subscription
// @access  Private (Admin or Self-Upgrade)
export const updateSubscriptionPlan = async (req, res) => {
  const { plan } = req.body;

  try {
    if (!['free', 'pro'].includes(plan)) {
      return res.status(400).json({ success: false, message: 'Invalid plan selected. Must be free or pro' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Role guard: Only Admins can modify other users, but users can self-upgrade (for payment simulation)
    if (req.user.role !== 'admin' && req.user._id.toString() !== user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized subscription modification' });
    }

    user.subscriptionPlan = plan;
    await user.save();

    res.json({
      success: true,
      message: `Successfully updated subscription to ${plan.toUpperCase()}`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        subscriptionPlan: user.subscriptionPlan,
      }
    });
  } catch (error) {
    console.error(`[User Controller] updateSubscriptionPlan error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server subscription update error' });
  }
};

// @desc    Delete a staff member
// @route   DELETE /api/users/staff/:id
// @access  Private (Admin only)
export const deleteStaffUser = async (req, res) => {
  try {
    const staffMember = await User.findById(req.params.id);
    if (!staffMember) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }

    if (staffMember.role === 'admin') {
      return res.status(400).json({ success: false, message: 'Cannot delete admin accounts' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Staff member account successfully deactivated' });
  } catch (error) {
    console.error(`[User Controller] deleteStaffUser error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server staff deletion error' });
  }
};
