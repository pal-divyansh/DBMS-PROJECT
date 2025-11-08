const Joi = require('joi');

// Validation schema for reporting a water issue
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
  location: Joi.string().required().messages({
    'string.base': 'Location must be a string',
    'string.empty': 'Location is required',
    'any.required': 'Location is required',
  }),
  priority: Joi.string().valid('LOW', 'MEDIUM', 'HIGH', 'URGENT').messages({
    'string.base': 'Priority must be a string',
    'any.only': 'Priority must be one of: LOW, MEDIUM, HIGH, URGENT',
  }),
  images: Joi.array().items(Joi.string().uri()).messages({
    'array.base': 'Images must be an array of URLs',
    'string.uri': 'Each image must be a valid URL',
  }),
});

// Validation schema for updating issue status
const updateIssueStatusSchema = Joi.object({
  status: Joi.string()
    .valid('PENDING', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED')
    .required()
    .messages({
      'string.base': 'Status must be a string',
      'any.only':
        'Status must be one of: PENDING, IN_PROGRESS, RESOLVED, CANCELLED',
      'any.required': 'Status is required',
    }),
  plumberId: Joi.number().integer().positive().messages({
    'number.base': 'Plumber ID must be a number',
    'number.integer': 'Plumber ID must be an integer',
    'number.positive': 'Plumber ID must be a positive number',
  }),
});

module.exports = {
  reportIssueSchema,
  updateIssueStatusSchema,
};
