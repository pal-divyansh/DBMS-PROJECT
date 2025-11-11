const express = require('express');
const router = express.Router();
const auth = require('../../../routes/auth');
const { authenticateToken } = auth;
const authorizeRole = auth.authorizeRole;
const {
  reportIssue,
  getIssues,
  updateIssueStatus,
  addComment,
  getComments,
  getItStaff,
} = require('../controllers/network.controller');
const {
  reportIssueSchema,
  updateIssueStatusSchema,
  commentSchema,
} = require('../validators/network.validator');

// Middleware to validate request body
const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      error: error.details.map((err) => ({
        field: err.path[0],
        message: err.message,
      })),
    });
  }
  next();
};

// Report a new network issue (Student/All users)
router.post(
  '/issues',
  authenticateToken,
  validate(reportIssueSchema),
  reportIssue
);

// Get network issues
router.get('/issues', authenticateToken, getIssues);

// Update issue status (IT staff/Admin only)
router.patch(
  '/issues/:id',
  authenticateToken,
  authorizeRole(['IT_STAFF', 'ADMIN']),
  validate(updateIssueStatusSchema),
  updateIssueStatus
);

// Add comment to issue
router.post(
  '/issues/:id/comments',
  authenticateToken,
  validate(commentSchema),
  addComment
);

// Get issue comments
router.get('/issues/:id/comments', authenticateToken, getComments);

// List IT staff (Admin only)
router.get('/it-staff', authenticateToken, authorizeRole(['ADMIN']), getItStaff);

module.exports = router;
