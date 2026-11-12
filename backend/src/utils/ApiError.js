/**
 * Custom Operational Application Error
 * Encapsulates HTTP status codes, structured validation errors, and stack traces.
 */
export class ApiError extends Error {
  constructor(
    statusCode = 500,
    message = 'Something went wrong',
    errors = [],
    errorCode = null,
    stack = ''
  ) {
    super(message);
    this.statusCode = statusCode;
    this.data = null;
    this.message = message;
    this.success = false;
    this.errors = errors;
    this.errorCode = errorCode;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  static badRequest(message, errors = [], errorCode = 'BAD_REQUEST') {
    return new ApiError(400, message, errors, errorCode);
  }

  static unauthorized(message = 'Unauthorized access. Authentication required.', errorCode = 'UNAUTHORIZED') {
    return new ApiError(401, message, [], errorCode);
  }

  static forbidden(message = 'Forbidden. Insufficient permissions for this action.', errorCode = 'FORBIDDEN') {
    return new ApiError(403, message, [], errorCode);
  }

  static notFound(message = 'Requested resource not found.', errorCode = 'NOT_FOUND') {
    return new ApiError(404, message, [], errorCode);
  }

  static conflict(message, errors = [], errorCode = 'CONFLICT') {
    return new ApiError(409, message, errors, errorCode);
  }

  static unprocessableEntity(message, errors = [], errorCode = 'VALIDATION_FAILED') {
    return new ApiError(422, message, errors, errorCode);
  }

  static internal(message = 'Internal server error occurred.', errors = []) {
    return new ApiError(500, message, errors, 'INTERNAL_SERVER_ERROR');
  }
}

