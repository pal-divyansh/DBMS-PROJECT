const Joi = require('joi');

// Validation schema for reporting a network issue
const reportIssueSchema = Joi.object({
  title: Joi.string().required().min(5).max(100).messages({
    'string.base': 'Title must be a string',
    'string.empty': 'Title is required',
    'string.min': 'Title must be at least 5 characters long',
    'string.max': 'Title cannot be longer than 100 characters',
    'any.required': 'Title is required',
  }),
  description: Joi.string().required().min(10).messages({
    'string.base': 'Description must be a string',
    'string.empty': 'Description is required',
    'string.min': 'Description must be at least 10 characters long',
    'any.required': 'Description is required',
  }),
  issueType: Joi.string()
    .valid('CONNECTIVITY', 'SPEED', 'AUTHENTICATION', 'OTHER')
    .required()
    .messages({
      'string.base': 'Issue type must be a string',
      'any.only': 'Invalid issue type',
      'any.required': 'Issue type is required',
    }),
  priority: Joi.string()
    .valid('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')
    .default('MEDIUM')
    .messages({
      'string.base': 'Priority must be a string',
      'any.only': 'Priority must be one of: LOW, MEDIUM, HIGH, CRITICAL',
    }),
  ipAddress: Joi.string().ip().messages({
    'string.ip': 'Please provide a valid IP address',
  }),
  macAddress: Joi.string().pattern(
    /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/,
    'MAC address'
  ).messages({
    'string.pattern.base': 'Please provide a valid MAC address (format: XX:XX:XX:XX:XX:XX)',
  }),
  speedTest: Joi.string().messages({
    'string.base': 'Speed test must be a JSON string',
  }),
});

// Validation schema for updating issue status
const updateIssueStatusSchema = Joi.object({
  status: Joi.string()
    .valid('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED')
    .messages({
      'string.base': 'Status must be a string',
      'any.only':
        'Status must be one of: OPEN, IN_PROGRESS, RESOLVED, CANCELLED',
    }),
  assignedToId: Joi.number().integer().positive().messages({
    'number.base': 'Assigned user ID must be a number',
    'number.integer': 'Assigned user ID must be an integer',
    'number.positive': 'Assigned user ID must be a positive number',
  }),
}).or('status', 'assignedToId');

// Validation schema for adding a comment
const commentSchema = Joi.object({
  content: Joi.string().required().min(3).max(1000).messages({
    'string.base': 'Comment must be a string',
    'string.empty': 'Comment is required',
    'string.min': 'Comment must be at least 3 characters long',
    'string.max': 'Comment cannot be longer than 1000 characters',
    'any.required': 'Comment is required',
  }),
});

module.exports = {
  reportIssueSchema,
  updateIssueStatusSchema,
  commentSchema,
};
