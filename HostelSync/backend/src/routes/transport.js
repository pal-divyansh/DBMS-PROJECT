const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('./auth');
const { authenticateToken: authenticate, authorizeRole: authorize } = auth;
const {
  getAvailableVehicles,
  getRoutes,
  createBooking,
  getUserBookings,
  cancelBooking,
  addSchedule,
  deleteVehicle
} = require('../modules/Transport/controllers/transport.controller');
const {
  createBookingSchema,
  createRouteSchema,
  createScheduleSchema,
  createVehicleSchema
} = require('../modules/Transport/validators/transport.validator');

// Public routes
router.get('/vehicles', getAvailableVehicles);
router.get('/routes', getRoutes);

// Student routes (authenticated)
router.post(
  '/bookings',
  authenticate,
  [
    check('scheduleId').isInt().withMessage('Schedule ID must be an integer'),
    check('bookingDate').isISO8601().withMessage('Invalid date format. Use YYYY-MM-DD')
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  createBooking
);

router.get('/bookings/me', authenticate, getUserBookings);

router.delete(
  '/bookings/:id',
  authenticate,
  [check('id').isInt().withMessage('Invalid booking ID')],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  cancelBooking
);

// Admin routes
router.post(
  '/admin/routes',
  authenticate,
  authorize(['ADMIN', 'STAFF']),
  async (req, res, next) => {
    try {
      await createRouteSchema.validateAsync(req.body);
      next();
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  },
  // Add your route creation controller here
  (req, res) => res.status(501).json({ message: 'Not implemented' })
);

// In src/routes/transport.js
router.post(
  '/admin/schedules',
  authenticate,
  authorize(['ADMIN', 'STAFF']),
  async (req, res, next) => {
    try {
      await createScheduleSchema.validateAsync(req.body);
      next();
    } catch (error) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: error.details ? error.details.map(d => d.message) : error.message
      });
    }
  },

  addSchedule  // Make sure this is the controller function
);

// Create vehicle (Admin/Staff)
router.post(
  '/admin/vehicles',
  authenticate,
  authorize(['ADMIN', 'STAFF']),
  async (req, res, next) => {
    try {
      await createVehicleSchema.validateAsync(req.body);
      next();
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  },
  // Add your vehicle creation controller here
  (req, res) => res.status(501).json({ message: 'Not implemented' })
);

// Delete vehicle (Admin/Staff)
router.delete(
  '/admin/vehicles/:id',
  authenticate,
  authorize(['ADMIN', 'STAFF']),
  [
    check('id').isInt().withMessage('Invalid vehicle ID')
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  deleteVehicle
);

module.exports = router;




//student eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Miwicm9sZSI6IlNUVURFTlQiLCJpYXQiOjE3NjI1ODgxOTksImV4cCI6MTc2MzE5Mjk5OX0.6KLoKUsMuEQm1ID5qlsJxItHlo50qUX3KUeOnic8nNM


//admin eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6IkFETUlOIiwiaWF0IjoxNzYyNTg4NTQzLCJleHAiOjE3NjMxOTMzNDN9.B6Xg_GOD2HwjxPhnejQ4vD-GbOgFly_Gd2a8igeGt20