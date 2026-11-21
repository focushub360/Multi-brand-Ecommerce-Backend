/**
 * Higher-Order Function wrapper for Express route handlers.
 * Catches asynchronous errors and forwards them cleanly to the centralized error middleware.
 */
export const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};

