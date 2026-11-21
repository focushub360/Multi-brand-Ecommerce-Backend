import { ApiError } from '../utils/ApiError.js';

/**
 * Role Authorization Middleware
 * Verifies that the authenticated user possesses one of the allowed roles.
 */
export const authorize = (...allowedRoles) => {
  return (req, _res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required.'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(
          `Access denied. Role '${req.user.role}' is not authorized to access this resource.`
        )
      );
    }

    next();
  };
};

/**
 * Dealer Approved Status Middleware
 * Enforces that a dealer account must have APPROVED status to perform actions.
 */
export const requireApprovedDealer = (req, _res, next) => {
  if (!req.dealer) {
    return next(ApiError.forbidden('Dealer identity required.'));
  }

  if (req.dealer.status !== 'APPROVED' && req.dealer.status !== 'PENDING_KYC') {
    return next(
      ApiError.forbidden(
        `Dealer account status is currently '${req.dealer.status}'. Operations are restricted until KYC approval.`
      )
    );
  }

  next();
};

