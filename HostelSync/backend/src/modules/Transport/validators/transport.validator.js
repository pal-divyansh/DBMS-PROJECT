// In src/modules/Transport/validators/transport.validator.js
const Joi = require('joi');

// Validation schema for creating a booking
const createBookingSchema = Joi.object({
  scheduleId: Joi.number().integer().positive().required()
    .messages({
      'number.base': 'Schedule ID must be a number',
      'number.integer': 'Schedule ID must be an integer',
      'number.positive': 'Schedule ID must be a positive number',
      'any.required': 'Schedule ID is required'
    }),
  bookingDate: Joi.date().iso().required()
    .messages({
      'date.base': 'Booking date must be a valid date',
      'date.format': 'Booking date must be in ISO format (YYYY-MM-DD)',
      'any.required': 'Booking date is required'
    })
});

// Validation schema for route creation (admin)
const createRouteSchema = Joi.object({
  name: Joi.string().required().min(3).max(100)
    .messages({
      'string.base': 'Route name must be a string',
      'string.empty': 'Route name cannot be empty',
      'string.min': 'Route name must be at least 3 characters long',
      'string.max': 'Route name cannot be longer than 100 characters',
      'any.required': 'Route name is required'
    }),
  description: Joi.string().allow('').optional(),
  startPoint: Joi.string().required()
    .messages({
      'string.base': 'Start point must be a string',
      'string.empty': 'Start point cannot be empty',
      'any.required': 'Start point is required'
    }),
  endPoint: Joi.string().required()
    .messages({
      'string.base': 'End point must be a string',
      'string.empty': 'End point cannot be empty',
      'any.required': 'End point is required'
    }),
  stops: Joi.array().items(Joi.string())
    .messages({
      'array.base': 'Stops must be an array of strings'
    })
});

// Validation schema for schedule creation (admin)
const createScheduleSchema = Joi.object({
  routeId: Joi.number().integer().positive().required()
    .messages({
      'number.base': 'Route ID must be a number',
      'number.integer': 'Route ID must be an integer',
      'number.positive': 'Route ID must be a positive number',
      'any.required': 'Route ID is required'
    }),
  vehicleId: Joi.number().integer().positive().required()
    .messages({
      'number.base': 'Vehicle ID must be a number',
      'number.integer': 'Vehicle ID must be an integer',
      'number.positive': 'Vehicle ID must be a positive number',
      'any.required': 'Vehicle ID is required'
    }),
  day: Joi.string().valid(
    'MONDAY', 'TUESDAY', 'WEDNESDAY', 
    'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'
  ).required()
    .messages({
      'string.base': 'Day must be a string',
      'any.only': 'Day must be a valid day of the week (e.g., MONDAY, TUESDAY)',
      'any.required': 'Day is required'
    }),
  startTime: Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d$/)
    .required()
    .messages({
      'string.pattern.base': 'Start time must be in HH:MM format (24-hour)',
      'any.required': 'Start time is required'
    }),
  endTime: Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d$/)
    .required()
    .messages({
      'string.pattern.base': 'End time must be in HH:MM format (24-hour)',
      'any.required': 'End time is required'
    }),
  startDate: Joi.date().iso().required()
    .messages({
      'date.base': 'Start date must be a valid date',
      'date.format': 'Start date must be in ISO format (YYYY-MM-DD)',
      'any.required': 'Start date is required'
    }),
  endDate: Joi.date().iso().min(Joi.ref('startDate')).required()
    .messages({
      'date.base': 'End date must be a valid date',
      'date.format': 'End date must be in ISO format (YYYY-MM-DD)',
      'date.min': 'End date must be after or equal to start date',
      'any.required': 'End date is required'
    }),
  maxCapacity: Joi.number().integer().min(1).required()
    .messages({
      'number.base': 'Max capacity must be a number',
      'number.integer': 'Max capacity must be an integer',
      'number.min': 'Max capacity must be at least 1',
      'any.required': 'Max capacity is required'
    }),
  price: Joi.number().min(0).required()
    .messages({
      'number.base': 'Price must be a number',
      'number.min': 'Price cannot be negative',
      'any.required': 'Price is required'
    })
});

// Validation schema for vehicle creation (admin)
const createVehicleSchema = Joi.object({
  type: Joi.string().valid('Bus', 'Van', 'Car', 'Minibus').required()
    .messages({
      'string.base': 'Vehicle type must be a string',
      'any.only': 'Vehicle type must be one of: Bus, Van, Car, Minibus',
      'any.required': 'Vehicle type is required'
    }),
  number: Joi.string().required()
    .messages({
      'string.base': 'Vehicle number must be a string',
      'string.empty': 'Vehicle number cannot be empty',
      'any.required': 'Vehicle number is required'
    }),
  capacity: Joi.number().integer().min(1).required()
    .messages({
      'number.base': 'Capacity must be a number',
      'number.integer': 'Capacity must be an integer',
      'number.min': 'Capacity must be at least 1',
      'any.required': 'Capacity is required'
    }),
  driverId: Joi.number().integer().positive().optional()
    .messages({
      'number.base': 'Driver ID must be a number',
      'number.integer': 'Driver ID must be an integer',
      'number.positive': 'Driver ID must be a positive number'
    })
});

module.exports = {
  createBookingSchema,
  createRouteSchema,
  createScheduleSchema,
  createVehicleSchema
};