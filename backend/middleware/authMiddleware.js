const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Authentication middleware
 * Verifies JWT token and adds user to request object
 */
const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access denied. No valid token provided.' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    // Get user from database
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ error: 'Invalid token. User not found.' });
    }

    if (!user.isActive) {
      return res.status(401).json({ error: 'Account is deactivated.' });
    }

    if (user.isLocked) {
      return res.status(401).json({ error: 'Account is temporarily locked due to too many failed login attempts.' });
    }

    // Add user to request object
    req.user = user;
    next();

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token.' });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired.' });
    }

    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

/**
 * Role-based authorization middleware
 * @param {string[]} roles - Array of allowed roles
 */
const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions.' });
    }

    next();
  };
};

/**
 * Officiant-only middleware
 */
const officiantOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  if (req.user.userType !== 'officiant') {
    return res.status(403).json({ error: 'Access denied. Officiant privileges required.' });
  }

  next();
};

/**
 * Ceremony participant middleware
 * Verifies user is a participant in the specified ceremony
 */
const ceremonyParticipant = async (req, res, next) => {
  try {
    const Ceremony = require('../models/Ceremony');

    // Get ceremony ID from params or body
    const ceremonyId = req.params.ceremonyId || req.body.ceremonyId;

    if (!ceremonyId) {
      return res.status(400).json({ error: 'Ceremony ID is required.' });
    }

    const ceremony = await Ceremony.findById(ceremonyId);

    if (!ceremony) {
      return res.status(404).json({ error: 'Ceremony not found.' });
    }

    if (!ceremony.isParticipant(req.user.id)) {
      return res.status(403).json({ error: 'Access denied. You are not a participant in this ceremony.' });
    }

    // Add ceremony to request object for use in route handlers
    req.ceremony = ceremony;
    next();

  } catch (error) {
    console.error('Ceremony participant middleware error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

/**
 * Rate limiting middleware for sensitive operations
 */
const rateLimitSensitive = require('express-rate-limit')({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  authMiddleware,
  authorize,
  officiantOnly,
  ceremonyParticipant,
  rateLimitSensitive
};
