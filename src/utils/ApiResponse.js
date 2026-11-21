/**
 * Standardized API Response Structure
 * Guarantees predictable JSON responses across all controllers.
 */
export class ApiResponse {
  constructor(statusCode, data, message = 'Success', pagination = null) {
    this.statusCode = statusCode;
    this.success = statusCode < 400;
    this.message = message;
    this.data = data;
    if (pagination) {
      this.pagination = pagination;
    }
  }

  static success(data = {}, message = 'Operation successful', statusCode = 200, pagination = null) {
    return new ApiResponse(statusCode, data, message, pagination);
  }

  static created(data = {}, message = 'Resource created successfully') {
    return new ApiResponse(201, data, message);
  }
}

