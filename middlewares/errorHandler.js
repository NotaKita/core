const { default: logger } = require("../utils/logger");

const errorHandler = (err, req, res, next) => {
  // Default error status and message
  let statusCode = err.statusCode || 500;
  let message = err.message || 'An unexpected error occurred.';
  let errors;

  // Handle specific error types
  switch (err.name) {
    case 'SequelizeUniqueConstraintError':
      statusCode = 409;
      message = 'Resource already exists.';
      errors = err.errors?.map(e => ({
        field: e.path,
        message: e.message
      }));
      break;
      
    case 'SequelizeValidationError':
      statusCode = 400;
      message = 'Validation failed.';
      errors = err.errors?.map(e => ({
        field: e.path,
        message: e.message,
        type: e.type
      }));
      break;
      
    case 'JsonWebTokenError':
      statusCode = 401;
      message = 'Invalid token.';
      break;
      
    case 'TokenExpiredError':
      statusCode = 401;
      message = 'Token expired.';
      break;
      
    case 'UnauthorizedError':
      statusCode = 401;
      message = 'Authentication required.';
      break;
      
    default:
      // Handle Joi validation errors
      if (err.isJoi) {
        statusCode = 422;
        message = 'Validation error.';
        errors = err.details?.map(d => ({
          field: d.context.key,
          message: d.message,
          type: d.type
        }));
      }
  }

  // Log the error with contextual information
  logger.error(`${statusCode} - ${message} - ${req.originalUrl} - ${req.method} - ${req.ip}`, {
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    errors,
    body: process.env.NODE_ENV === 'development' ? req.body : undefined
  });

  // Prepare response
  const response = {
    status: 'error',
    message,
    ...(errors && { errors }) // Only include errors if they exist
  };

  // Include additional debug info in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
    response.type = err.name;
  }

  // Send response
  res.status(statusCode).json(response);
};

module.exports = errorHandler;