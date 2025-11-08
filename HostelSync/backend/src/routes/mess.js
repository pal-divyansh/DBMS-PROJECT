const express = require('express');
const router = express.Router();

// Import validators
const { 
  createMenuSchema, 
  submitFeedbackSchema, 
  updateMenuSchema 
} = require('../modules/Mess/validators/mess_validator');

const { createRecurringMenuSchema } = require('../modules/Mess/validators/recurringMenuValidator');

// Import controllers
const { 
  getWeeklyMenu, 
  updateMenu, 
  submitFeedback, 
  getFeedback,
  deleteMenu 
} = require('../modules/Mess/controllers/mess_controller');

const { 
  createRecurringMenu,
  getRecurringSeries,
  deleteRecurringSeries
} = require('../modules/Mess/controllers/recurringMenuController');

const {
  exportMenusToCSV,
  getImportTemplate
} = require('../modules/Mess/controllers/menuImportExportController');

const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const fs = require('fs');
const path = require('path');

// Import middleware
const { authenticate, authorize } = require('../middleware/messAuth');

// Helper function to validate request using Joi schema
const validateRequest = (schema) => async (req, res, next) => {
  try {
    await schema.validateAsync(req.body, { abortEarly: false });
    next();
  } catch (error) {
    const errors = error.details.map(detail => ({
      field: detail.context.key,
      message: detail.message
    }));
    res.status(400).json({ errors });
  }
};

// ======================
// Public Routes
// ======================

/**
 * @route   GET /api/mess/menu
 * @desc    Get current week's mess menu
 * @access  Public
 */
router.get('/menu', getWeeklyMenu);

// ======================
// Student Routes
// ======================

/**
 * @route   POST /api/mess/feedback
 * @desc    Submit feedback for a menu
 * @access  Private (Student)
 */
router.post(
  '/feedback',
  authenticate,
  validateRequest(submitFeedbackSchema),
  submitFeedback
);

/**
 * @route   GET /api/mess/feedback
 * @desc    Get feedback (filtered by user for students, all for staff/admin)
 * @access  Private
 */
router.get(
  '/feedback',
  authenticate,
  getFeedback
);

// ======================
// Admin/Staff Routes
// ======================

/**
 * @route   POST /api/mess/menu
 * @desc    Create a new menu
 * @access  Private (Admin/Staff)
 */
router.post(
  '/menu',
  authenticate,
  authorize(['ADMIN', 'STAFF']),
  validateRequest(createMenuSchema),
  updateMenu
);

/**
 * @route   PUT /api/mess/menu/:id
 * @desc    Update an existing menu
 * @access  Private (Admin/Staff)
 */
router.put(
  '/menu/:id',
  authenticate,
  authorize(['ADMIN', 'STAFF']),
  validateRequest(updateMenuSchema),
  updateMenu
);

/**
 * @route   GET /api/mess/admin/feedback
 * @desc    Get all feedback (admin view)
 * @access  Private (Admin/Staff)
 */
router.get(
  '/admin/feedback',
  authenticate,
  authorize(['ADMIN', 'STAFF']),
  getFeedback
);

/**
 * @route   DELETE /api/mess/menu/:id
 * @desc    Delete a menu
 * @access  Private (Admin/Staff)
 */
router.delete(
  '/menu/:id',
  authenticate,
  authorize(['ADMIN', 'STAFF']),
  deleteMenu
);

// ======================
// Recurring Menu Routes
// ======================

/**
 * @route   POST /api/mess/menu/recurring
 * @desc    Create a recurring menu series
 * @access  Private (Admin/Staff)
 */
router.post(
  '/menu/recurring',
  authenticate,
  authorize(['ADMIN', 'STAFF']),
  validateRequest(createRecurringMenuSchema),
  createRecurringMenu
);

/**
 * @route   GET /api/mess/menu/recurring/:baseMenuId
 * @desc    Get all menus in a recurring series
 * @access  Private (Admin/Staff)
 */
router.get(
  '/menu/recurring/:baseMenuId',
  authenticate,
  authorize(['ADMIN', 'STAFF']),
  getRecurringSeries
);

/**
 * @route   DELETE /api/mess/menu/recurring/:baseMenuId
 * @desc    Delete an entire recurring menu series
 * @access  Private (Admin/Staff)
 */
router.delete(
  '/menu/recurring/:baseMenuId',
  authenticate,
  authorize(['ADMIN', 'STAFF']),
  deleteRecurringSeries
);

// ======================
// Import/Export Routes
// ======================

/**
 * @route   GET /api/mess/menus/export
 * @desc    Export menus to CSV
 * @access  Private (Admin/Staff)
 */
router.get(
  '/menus/export',
  authenticate,
  authorize(['ADMIN', 'STAFF']),
  async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      const result = await exportMenusToCSV(startDate, endDate);
      
      res.download(result.filePath, result.filename, (err) => {
        // Delete the file after download
        fs.unlink(result.filePath, (unlinkErr) => {
          if (unlinkErr) console.error('Error deleting export file:', unlinkErr);
        });
        
        if (err) {
          console.error('Error downloading file:', err);
          if (!res.headersSent) {
            res.status(500).json({
              success: false,
              error: 'Error downloading file'
            });
          }
        }
      });
    } catch (error) {
      console.error('Export error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to export menus',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
);

/**
 * @route   POST /api/mess/menus/import
 * @desc    Import menus from CSV
 * @access  Private (Admin/Staff)
 */
router.post(
  '/menus/import',
  authenticate,
  authorize(['ADMIN', 'STAFF']),
  upload.single('file'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No file uploaded'
        });
      }

      const result = await importMenusFromCSV(req.file.path);
      
      // Delete the uploaded file after processing
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting uploaded file:', err);
      });

      res.json({
        success: true,
        message: `Successfully imported ${result.imported} of ${result.total} menus`,
        ...(result.hasErrors && {
          warning: `${result.errors.length} errors occurred during import`,
          errors: result.errors
        })
      });
    } catch (error) {
      // Clean up the uploaded file if it exists
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Error cleaning up file:', err);
        });
      }
      
      console.error('Import error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to import menus',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
);

/**
 * @route   GET /api/mess/menus/import/template
 * @desc    Download menu import template
 * @access  Private (Admin/Staff)
 */
router.get(
  '/menus/import/template',
  authenticate,
  authorize(['ADMIN', 'STAFF']),
  (req, res) => {
    try {
      const { filename, filePath } = getImportTemplate();
      
      res.download(filePath, filename, (err) => {
        if (err) {
          console.error('Error downloading template:', err);
          if (!res.headersSent) {
            res.status(500).json({
              success: false,
              error: 'Error downloading template'
            });
          }
        }
      });
    } catch (error) {
      console.error('Template error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate template',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
);

module.exports = router;
