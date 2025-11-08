const express = require('express');
const router = express.Router();
const userRoutes = require('./user.routes');

// User management routes
router.use('/users', userRoutes);

// Dashboard statistics (to be implemented)
router.get('/stats', (req, res) => {
  res.json({ message: 'Dashboard statistics will be implemented here' });
});

module.exports = router;
