const Joi = require('joi');

// Validation schema for creating a cleaning request
const createCleaningRequestSchema = Joi.object({
  room: Joi.string().required().messages({
    'string.empty': 'Room number is required',
    'any.required': 'Room number is required'
  }),
  building: Joi.string().required().messages({
    'string.empty': 'Building name is required',
    'any.required': 'Building name is required'
  }),
  cleaningType: Joi.string().valid('REGULAR', 'DEEP', 'SPECIAL').required().messages({
    'string.empty': 'Cleaning type is required',
    'any.only': 'Invalid cleaning type. Must be REGULAR, DEEP, or SPECIAL',
    'any.required': 'Cleaning type is required'
  }),
  scheduledDate: Joi.date().iso().required().messages({
    'date.base': 'Please provide a valid date',
    'date.format': 'Date must be in ISO format (YYYY-MM-DD)',
    'any.required': 'Scheduled date is required'
  }),
  timeSlot: Joi.string().required().messages({
    'string.empty': 'Time slot is required',
    'any.required': 'Time slot is required'
  }),
  specialInstructions: Joi.string().allow('').optional()
});

// Validation schema for updating cleaning request status
const updateStatusSchema = Joi.object({
  status: Joi.string().valid('PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED').messages({
    'string.empty': 'Status is required',
    'any.only': 'Invalid status. Must be one of: PENDING, ASSIGNED, IN_PROGRESS, COMPLETED, CANCELLED'
  }),
  cleanerId: Joi.number().integer().positive().messages({
    'number.base': 'Cleaner ID must be a number',
    'number.integer': 'Cleaner ID must be an integer',
    'number.positive': 'Cleaner ID must be a positive number'
  })
}).or('status', 'cleanerId');

// Validation schema for submitting feedback
const submitFeedbackSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).required().messages({
    'number.base': 'Rating must be a number',
    'number.integer': 'Rating must be an integer',
    'number.min': 'Rating must be at least 1',
    'number.max': 'Rating cannot exceed 5',
    'any.required': 'Rating is required'
  }),
  feedback: Joi.string().allow('').optional()
});

// Validation schema for query parameters
const getRequestsQuerySchema = Joi.object({
  status: Joi.string().valid('PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED').messages({
    'string.empty': 'Status cannot be empty',
    'any.only': 'Invalid status. Must be one of: PENDING, ASSIGNED, IN_PROGRESS, COMPLETED, CANCELLED'
  }),
  cleanerId: Joi.number().integer().positive().messages({
    'number.base': 'Cleaner ID must be a number',
    'number.integer': 'Cleaner ID must be an integer',
    'number.positive': 'Cleaner ID must be a positive number'
  }),
  building: Joi.string().messages({
    'string.empty': 'Building name cannot be empty'
  })
});

module.exports = {
  createCleaningRequestSchema,
  updateStatusSchema,
  submitFeedbackSchema,
  getRequestsQuerySchema
};
