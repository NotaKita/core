const Joi = require('joi');

const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Email must be a valid email address.',
    'string.empty': 'Email cannot be empty.',
    'any.required': 'Email is required.'
  }),
  password: Joi.string().min(8).required().messages({
    'string.min': 'Password must be at least 8 characters long.',
    'string.empty': 'Password cannot be empty.',
    'any.required': 'Password is required.'
  }),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Email must be a valid email address.',
    'string.empty': 'Email cannot be empty.',
    'any.required': 'Email is required.'
  }),
  password: Joi.string().required().messages({
    'string.empty': 'Password cannot be empty.',
    'any.required': 'Password is required.'
  }),
});

module.exports = { registerSchema, loginSchema };