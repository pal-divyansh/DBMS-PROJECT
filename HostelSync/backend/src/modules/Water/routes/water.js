const express = require("express");
const router = express.Router();
const { check } = require("express-validator");
const auth = require("../../../routes/auth");
const { authenticateToken: authenticate, authorizeRole: authorize } = auth;
const waterController = require("../controllers");
const {
  reportIssueSchema,
  updateIssueStatusSchema,
} = require("../validators/water.validator");

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

// Report a new water issue (Student)
router.post(
  "/issues",
  authenticate,
  validate(reportIssueSchema),
  waterController.reportIssue
);

// Get water issues (All roles, filtered by permissions)
router.get("/issues", authenticate, waterController.getIssues);

// Update issue status (Admin/Plumber)
router.patch(
  "/issues/:id",
  authenticate,
  authorize(["ADMIN", "PLUMBER"]),
  validate(updateIssueStatusSchema),
  waterController.updateIssueStatus
);

module.exports = router;
