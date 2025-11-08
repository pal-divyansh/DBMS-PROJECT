const Joi = require('joi');

// Schema for creating a new menu
const createMenuSchema = Joi.object({
  date: Joi.date().required().messages({
    'date.base': 'Date must be a valid date',
    'any.required': 'Date is required'
  }),
  
  mealType: Joi.string()
    .valid('BREAKFAST', 'LUNCH', 'DINNER', 'SPECIAL')
    .required()
    .messages({
      'string.base': 'Meal type must be a string',
      'any.required': 'Meal type is required',
      'any.only': 'Meal type must be one of: BREAKFAST, LUNCH, DINNER, or SPECIAL'
    }),
    
  servingTime: Joi.string()
    .pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .required()
    .messages({
      'string.pattern.base': 'Serving time must be in HH:MM format',
      'any.required': 'Serving time is required'
    }),
    
  items: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().required().messages({
          'string.base': 'Item name must be a string',
          'string.empty': 'Item name cannot be empty',
          'any.required': 'Item name is required'
        }),
        type: Joi.string()
          .valid('VEG', 'NON_VEG', 'JAIN', 'SPECIAL')
          .required()
          .messages({
            'string.base': 'Item type must be a string',
            'any.required': 'Item type is required',
            'any.only': 'Item type must be one of: VEG, NON_VEG, JAIN, or SPECIAL'
          })
      })
    )
    .min(1)
    .required()
    .messages({
      'array.base': 'Items must be an array',
      'array.min': 'At least one menu item is required',
      'any.required': 'Menu items are required'
    })
});

// Schema for submitting feedback
const submitFeedbackSchema = Joi.object({
  menuId: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'Menu ID must be a number',
      'number.integer': 'Menu ID must be an integer',
      'number.positive': 'Menu ID must be a positive number',
      'any.required': 'Menu ID is required'
    }),
    
  rating: Joi.number()
    .integer()
    .min(1)
    .max(5)
    .required()
    .messages({
      'number.base': 'Rating must be a number',
      'number.integer': 'Rating must be an integer',
      'number.min': 'Rating must be at least 1',
      'number.max': 'Rating cannot be more than 5',
      'any.required': 'Rating is required'
    }),
    
  comment: Joi.string()
    .allow('')
    .optional()
    .messages({
      'string.base': 'Comment must be a string'
    })
});

// Schema for updating a menu
const updateMenuSchema = Joi.object({
  date: Joi.date().optional().messages({
    'date.base': 'Date must be a valid date'
  }),
  
  mealType: Joi.string()
    .valid('BREAKFAST', 'LUNCH', 'DINNER', 'SPECIAL')
    .optional()
    .messages({
      'string.base': 'Meal type must be a string',
      'any.only': 'Meal type must be one of: BREAKFAST, LUNCH, DINNER, or SPECIAL'
    }),
    
  servingTime: Joi.string()
    .pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .optional()
    .messages({
      'string.pattern.base': 'Serving time must be in HH:MM format'
    }),
    
  items: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().required().messages({
          'string.base': 'Item name must be a string',
          'string.empty': 'Item name cannot be empty',
          'any.required': 'Item name is required'
        }),
        type: Joi.string()
          .valid('VEG', 'NON_VEG', 'JAIN', 'SPECIAL')
          .required()
          .messages({
            'string.base': 'Item type must be a string',
            'any.required': 'Item type is required',
            'any.only': 'Item type must be one of: VEG, NON_VEG, JAIN, or SPECIAL'
          })
      })
    )
    .min(1)
    .messages({
      'array.base': 'Items must be an array',
      'array.min': 'At least one menu item is required'
    })
});

module.exports = {
  createMenuSchema,
  submitFeedbackSchema,
  updateMenuSchema
};
