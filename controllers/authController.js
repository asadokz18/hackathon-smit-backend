import User from '../models/User.js';
import jwt from 'jsonwebtoken';

// Helper to generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback-super-secret-key-12345', {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public (Self-registration for Patients, Admin-only for staff)
export const registerUser = async (req, res) => {
  const { name, email, password, role, contact, specialization } = req.body;

  try {
    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already registered with this email' });
    }

    // Role-based creation guards
    // If trying to create admin/doctor/receptionist, require an admin to be the creator (if any users exist)
    const totalUsers = await User.countDocuments();
    if (totalUsers > 0 && (role === 'admin' || role === 'doctor' || role === 'receptionist')) {
      // Look for JWT token authorization
      let isAuthorizedAdmin = false;
      
      if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
          const token = req.headers.authorization.split(' ')[1];
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-super-secret-key-12345');
          const requestingUser = await User.findById(decoded.id);
          if (requestingUser && requestingUser.role === 'admin') {
            isAuthorizedAdmin = true;
          }
        } catch (err) {
          isAuthorizedAdmin = false;
        }
      }

      if (!isAuthorizedAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized. Staff accounts (Admins, Doctors, Receptionists) can only be registered by an Admin.',
        });
      }
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'patient',
      contact: contact || '',
      specialization: role === 'doctor' ? (specialization || 'General Practitioner') : '',
      subscriptionPlan: 'free', // Defaults to free SaaS tier
    });

    res.status(201).json({
      success: true,
      token: generateToken(user._id),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        subscriptionPlan: user.subscriptionPlan,
        specialization: user.specialization,
        contact: user.contact,
      },
    });
  } catch (error) {
    console.error(`[Auth Controller] Register error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server registration error' });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check for user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    res.json({
      success: true,
      token: generateToken(user._id),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        subscriptionPlan: user.subscriptionPlan,
        specialization: user.specialization,
        contact: user.contact,
      },
    });
  } catch (error) {
    console.error(`[Auth Controller] Login error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server login error' });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        subscriptionPlan: user.subscriptionPlan,
        specialization: user.specialization,
        contact: user.contact,
      },
    });
  } catch (error) {
    console.error(`[Auth Controller] getMe error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server session retrieval error' });
  }
};
