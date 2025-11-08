const Joi = require('joi');

const createRecurringMenuSchema = Joi.object({
  startDate: Joi.date().iso().required()
    .messages({
      'date.base': 'Start date must be a valid date',
      'date.format': 'Start date must be in ISO 8601 format (e.g., 2025-11-09)',
      'any.required': 'Start date is required'
    }),
    
  endDate: Joi.date().iso().greater(Joi.ref('startDate')).required()
    .messages({
      'date.base': 'End date must be a valid date',
      'date.format': 'End date must be in ISO 8601 format',
      'date.greater': 'End date must be after start date',
      'any.required': 'End date is required'
    }),
    
  mealType: Joi.string().valid('BREAKFAST', 'LUNCH', 'DINNER', 'SPECIAL').required()
    .messages({
      'string.base': 'Meal type must be a string',
      'any.only': 'Meal type must be one of: BREAKFAST, LUNCH, DINNER, SPECIAL',
      'any.required': 'Meal type is required'
    }),
    
  servingTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .messages({
      'string.pattern.base': 'Serving time must be in HH:MM format (24-hour)'
    }),
    
  items: Joi.array().min(1).items(
    Joi.object({
      name: Joi.string().required(),
      type: Joi.string().valid('VEG', 'NON_VEG', 'JAIN', 'SPECIAL').required()
    })
  ).required()
  .messages({
    'array.base': 'Items must be an array',
    'array.min': 'At least one menu item is required',
    'any.required': 'Menu items are required'
  }),
  
  frequency: Joi.string().valid('DAILY', 'WEEKLY', 'WEEKDAYS', 'WEEKENDS').required()
    .messages({
      'string.base': 'Frequency must be a string',
      'any.only': 'Frequency must be one of: DAILY, WEEKLY, WEEKDAYS, WEEKENDS',
      'any.required': 'Frequency is required'
    }),
    
  daysOfWeek: Joi.when('frequency', {
    is: 'WEEKLY',
    then: Joi.array().items(
      Joi.number().integer().min(0).max(6).message('Day of week must be 0-6 (0=Sunday)')
    ).min(1).required(),
    otherwise: Joi.optional()
  })
});

module.exports = {
  createRecurringMenuSchema
};
