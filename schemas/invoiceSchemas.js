// schemas/invoiceSchemas.js
const Joi = require('joi');

const invoiceItemSchema = Joi.object({
  description: Joi.string().trim().min(1).max(255).required().messages({
    'string.base': 'Item description must be a string.',
    'string.empty': 'Item description cannot be empty.',
    'string.min': 'Item description should have a minimum length of {#limit}.',
    'string.max': 'Item description should have a maximum length of {#limit}.',
    'any.required': 'Item description is required.'
  }),
  unitCost: Joi.number().precision(2).min(0).required().messages({
    'number.base': 'Unit cost must be a number.',
    'number.precision': 'Unit cost must have at most 2 decimal places.',
    'number.min': 'Unit cost cannot be negative.',
    'any.required': 'Unit cost is required.'
  }),
  quantity: Joi.number().integer().min(1).required().messages({
    'number.base': 'Quantity must be a number.',
    'number.integer': 'Quantity must be an integer.',
    'number.min': 'Quantity must be at least 1.',
    'any.required': 'Quantity is required.'
  }),
});

const createInvoiceSchema = Joi.object({
  companyId: Joi.string().guid({ version: ['uuidv4'] }).required().messages({
    'string.base': 'Company ID must be a string.',
    'string.empty': 'Company ID cannot be empty.',
    'string.guid': 'Company ID must be a valid UUIDv4.',
    'any.required': 'Company ID is required.'
  }),
  invoiceCode: Joi.string().trim().min(3).max(50).required().messages({
    'string.base': 'Invoice code must be a string.',
    'string.empty': 'Invoice code cannot be empty.',
    'string.min': 'Invoice code should have a minimum length of {#limit}.',
    'string.max': 'Invoice code should have a maximum length of {#limit}.',
    'any.required': 'Invoice code is required.'
  }),
  invoiceDate: Joi.date().iso().required().messages({
    'date.base': 'Invoice date must be a valid date.',
    'date.format': 'Invoice date must be in ISO 8601 format (YYYY-MM-DD).',
    'any.required': 'Invoice date is required.'
  }),
  dueDate: Joi.date().iso().greater(Joi.ref('invoiceDate')).required().messages({
    'date.base': 'Due date must be a valid date.',
    'date.format': 'Due date must be in ISO 8601 format (YYYY-MM-DD).',
    'date.greater': 'Due date must be after the invoice date.',
    'any.required': 'Due date is required.'
  }),
  to: Joi.string().trim().min(1).max(255).required().messages({
    'string.base': 'Recipient name must be a string.',
    'string.empty': 'Recipient name cannot be empty.',
    'string.min': 'Recipient name should have a minimum length of {#limit}.',
    'string.max': 'Recipient name should have a maximum length of {#limit}.',
    'any.required': 'Recipient name is required.'
  }),
  items: Joi.array().items(invoiceItemSchema).min(1).required().messages({
    'array.base': 'Invoice items must be an array.',
    'array.min': 'At least one invoice item is required.',
    'any.required': 'Invoice items are required.'
  }),
});

// New schema for updating invoice status
const updateInvoiceStatusSchema = Joi.object({
  status: Joi.string().valid('paid').required().messages({ // Only allow 'paid' status for this endpoint
    'any.only': 'Status can only be updated to "paid" via this endpoint.',
    'any.required': 'Status is required.'
  }),
  // Optionally, allow the balance to be explicitly set to 0.00
  balance: Joi.number().precision(2).valid(0.00).optional().messages({
      'number.base': 'Balance must be a number.',
      'number.precision': 'Balance must have at most 2 decimal places.',
      'any.only': 'Balance can only be set to 0.00 when marking as paid.'
  })
});


module.exports = {
  createInvoiceSchema,
  updateInvoiceStatusSchema
};