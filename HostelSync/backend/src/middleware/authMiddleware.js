const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Middleware to authenticate token
const authenticateToken = (req, res, next) => {
  try {
    console.log('Auth headers:', req.headers);
    
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    console.log('Token received:', token ? '***token-received***' : 'no-token');

    if (!token) {
      console.error('No token provided');
      return res.status(401).json({ 
        success: false,
        error: 'Access token is required',
        details: 'No authorization token found in request headers'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    console.log('Decoded token:', decoded);

    // Attach user to request
    req.user = { id: decoded.id, role: decoded.role };
    
    // Continue to next middleware
    next();
    
  } catch (error) {
    console.error('Authentication error:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ 
        success: false,
        error: 'Invalid token',
        details: error.message
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        error: 'Token expired',
        details: 'Please log in again'
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Authentication failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Middleware to check if user has required role
const authorizeRole = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        error: 'Authentication required',
        details: 'No user information found in request'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false,
        error: 'Access denied',
        details: `Required role: ${roles.join(' or ')}`
      });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  authorizeRole
};
