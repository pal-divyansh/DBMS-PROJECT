const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const {
  createCleaningRequest,
  getStudentCleaningRequests,
  updateCleaningRequestStatus,
  getAllCleaningRequests,
  submitFeedback
} = require('../controllers/cleaning.controller');
const {
  createCleaningRequestSchema,
  updateStatusSchema,
  submitFeedbackSchema,
  getRequestsQuerySchema
} = require('../validators/cleaning.validator');
const { authenticateToken, authorizeRole } = require('../../../routes/auth');

// Middleware for request validation
const validateRequest = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      error: error.details.map(err => ({
        field: err.path[0],
        message: err.message
      }))
    });
  }
  next();
};

// Middleware for query validation
const validateQuery = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.query, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      error: error.details.map(err => ({
        field: err.path[0],
        message: err.message
      }))
    });
  }
  next();
};

// Cleaner Management (Admin only)
router.get(
  '/cleaners',
  authenticateToken,
  authorizeRole(['ADMIN']),
  async (req, res) => {
    try {
      const cleaners = await prisma.user.findMany({
        where: { 
          role: 'CLEANER'
        },
        select: {
          id: true,
          name: true,
          email: true,
          roomNo: true,
          role: true,
          createdAt: true
        },
        orderBy: { name: 'asc' }
      });
      
      res.json({
        success: true,
        count: cleaners.length,
        data: cleaners
      });
    } catch (error) {
      console.error('Error fetching cleaners:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch cleaners',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// Student routes
router.post(
  '/requests',
  authenticateToken,
  authorizeRole(['STUDENT']),
  validateRequest(createCleaningRequestSchema),
  createCleaningRequest
);

router.get(
  '/my-requests',
  authenticateToken,
  authorizeRole(['STUDENT']),
  getStudentCleaningRequests
);

router.post(
  '/requests/:id/feedback',
  authenticateToken,
  authorizeRole(['STUDENT']),
  validateRequest(submitFeedbackSchema),
  submitFeedback
);

// Cleaner routes
router.patch(
  '/requests/:id/status',
  authenticateToken,
  authorizeRole(['CLEANER', 'ADMIN']),
  validateRequest(updateStatusSchema),
  updateCleaningRequestStatus
);

// Admin routes
router.get(
  '/requests',
  authenticateToken,
  authorizeRole(['ADMIN', 'CLEANER']),
  validateQuery(getRequestsQuerySchema),
  getAllCleaningRequests
);

module.exports = router;
