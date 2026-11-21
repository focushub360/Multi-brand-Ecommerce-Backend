import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';
import { ZodError } from 'zod';

export const errorHandler = (err, req, res, _next) => {
  let error = err;

  // Handle Zod Validation Errors
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message
    }));
    error = new ApiError(400, 'Validation Failed', formattedErrors, 'VALIDATION_FAILED');
  }
  // Handle Mongoose Bad ObjectId (CastError)
  else if (err.name === 'CastError') {
    const message = `Invalid resource identifier: ${err.value}`;
    error = new ApiError(400, message, [], 'INVALID_ID');
  }
  // Handle MongoDB Duplicate Key (E11000)
  else if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const val = err.keyValue ? err.keyValue[field] : '';
    const message = `Duplicate value '${val}' entered for unique field '${field}'.`;
    error = new ApiError(409, message, [], 'DUPLICATE_KEY');
  }
  // Handle Mongoose Schema Validation Error
  else if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors || {}).map((val) => ({
      field: val.path,
      message: val.message
    }));
    error = new ApiError(400, 'Database Validation Failed', errors, 'SCHEMA_VALIDATION_ERROR');
  }
  // Handle JWT Malformed / Invalid
  else if (err.name === 'JsonWebTokenError') {
    error = new ApiError(401, 'Invalid authentication token. Please log in again.', [], 'INVALID_TOKEN');
  }
  // Handle JWT Expired
  else if (err.name === 'TokenExpiredError') {
    error = new ApiError(401, 'Authentication token has expired. Please refresh your session.', [], 'TOKEN_EXPIRED');
  }
  // Fallback to standard ApiError if not already an instance
  else if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';
    error = new ApiError(statusCode, message, [], 'INTERNAL_ERROR', err.stack);
  }

  // Response payload
  const response = {
    success: false,
    message: error.message,
    errorCode: error.errorCode || 'UNKNOWN_ERROR',
    errors: error.errors?.length ? error.errors : null,
    ...(env.NODE_ENV === 'development' && { stack: error.stack })
  };

  // Log server errors
  if (error.statusCode >= 500) {
    console.error('🔥 Server Error:', {
      method: req.method,
      path: req.originalUrl,
      message: error.message,
      stack: error.stack
    });
  }

  return res.status(error.statusCode).json(response);
};

