const express = require('express');
const router = express.Router();
const waterRoutes = require('../modules/Water/routes/water');

// Mount water routes at /api/water
router.use('/water', waterRoutes);

module.exports = router;
