const Joi = require('joi');

const createCompanySchema = Joi.object({
  name: Joi.string().trim().min(3).max(100).required().messages({
    'string.base': 'Company name must be a string.',
    'string.empty': 'Company name cannot be empty.',
    'string.min': 'Company name should have a minimum length of {#limit}.',
    'string.max': 'Company name should have a maximum length of {#limit}.',
    'any.required': 'Company name is required.'
  }),
  address: Joi.string().trim().max(255).optional().allow(null, '').messages({
    'string.base': 'Address must be a string.',
    'string.max': 'Address should have a maximum length of {#limit}.'
  }),
  phone: Joi.string().trim().min(7).max(20).optional().allow(null, '').pattern(/^[0-9+() -]+$/).messages({
    'string.base': 'Phone number must be a string.',
    'string.min': 'Phone number should have a minimum length of {#limit}.',
    'string.max': 'Phone number should have a maximum length of {#limit}.',
    'string.pattern.base': 'Phone number can only contain numbers, +, (), and -.'
  }),
  email: Joi.string().trim().email().optional().allow(null, '').messages({
    'string.base': 'Company email must be a string.',
    'string.email': 'Company email must be a valid email address.'
  }),
});

const updateCompanySchema = Joi.object({
  name: Joi.string().trim().min(3).max(100).optional().messages({
    'string.base': 'Company name must be a string.',
    'string.empty': 'Company name cannot be empty.',
    'string.min': 'Company name should have a minimum length of {#limit}.',
    'string.max': 'Company name should have a maximum length of {#limit}.'
  }),
  address: Joi.string().trim().max(255).optional().allow(null, '').messages({
    'string.base': 'Address must be a string.',
    'string.max': 'Address should have a maximum length of {#limit}.'
  }),
  phone: Joi.string().trim().min(7).max(20).optional().allow(null, '').pattern(/^[0-9+() -]+$/).messages({
    'string.base': 'Phone number must be a string.',
    'string.min': 'Phone number should have a minimum length of {#limit}.',
    'string.max': 'Phone number should have a maximum length of {#limit}.',
    'string.pattern.base': 'Phone number can only contain numbers, +, (), and -.'
  }),
  email: Joi.string().trim().email().optional().allow(null, '').messages({
    'string.base': 'Company email must be a string.',
    'string.email': 'Company email must be a valid email address.'
  }),
}).min(1).messages({ // At least one field is required for an update
  'object.min': 'At least one field (name, address, phone, or email) must be provided for update.'
});


module.exports = {
  createCompanySchema,
  updateCompanySchema
};