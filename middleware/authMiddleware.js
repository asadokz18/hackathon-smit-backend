import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const AUTHORIZED_ADMIN_EMAIL = process.env.AUTHORIZED_ADMIN_EMAIL || 'asadokz18@gmail.com';

// Protect routes - JWT validation
export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      // Decode token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-super-secret-key-12345');

      // Get user from token
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'User not found in system' });
      }

      next();
    } catch (error) {
      console.error(`[Auth Middleware] JWT Validation failed: ${error.message}`);
      return res.status(401).json({ success: false, message: 'Not authorized, token validation failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }
};

// Role authorization guard
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role unauthorized. Access denied for: ${req.user.role}`,
      });
    }

    // Special strict rule: Administrative data access restricted to authorized email only
    if (req.user.role === 'admin' && req.user.email !== AUTHORIZED_ADMIN_EMAIL) {
      return res.status(403).json({
        success: false,
        message: 'Administrative data access restricted to authorized email only.',
      });
    }
    
    next();
  };
};
