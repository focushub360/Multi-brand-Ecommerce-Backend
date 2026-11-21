import { ApiError } from '../utils/ApiError.js';
import { verifyAccessToken } from '../utils/generateTokens.js';
import { User } from '../modules/users/user.model.js';
import { Dealer } from '../modules/dealers/dealer.model.js';
import { ROLES } from '../constants/roles.js';
import { DEALER_STATUS } from '../constants/dealerStatus.js';

/**
 * Authentication Middleware
 * Validates JWT access token, checks active status, and populates req.user and req.dealer.
 * Dealers authenticate directly against Dealer collection; customers/admins against User collection.
 */
export const authenticate = async (req, _res, next) => {
  try {
    let token = null;

    // 1. Check Authorization Bearer header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies?.accessToken) {
      // 2. Check Cookie fallback
      token = req.cookies.accessToken;
    }

    if (!token) {
      return next(ApiError.unauthorized('Authentication token missing. Please sign in.'));
    }

    // 3. Verify JWT
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return next(new ApiError(401, 'Access token has expired. Please refresh your token.', [], 'TOKEN_EXPIRED'));
      }
      return next(ApiError.unauthorized('Invalid authentication token.'));
    }

    // 4. Role-based Identity Retrieval
    if (decoded.role === ROLES.DEALER) {
      const dealer = await Dealer.findById(decoded.id);
      if (!dealer) {
        return next(ApiError.unauthorized('Dealer account no longer exists.'));
      }

      if (dealer.status === DEALER_STATUS.SUSPENDED || dealer.status === DEALER_STATUS.REJECTED) {
        return next(ApiError.forbidden(`Your dealership account is currently ${dealer.status.toLowerCase()}. Please contact GROVE administration.`));
      }

      req.user = {
        id: dealer._id.toString(),
        name: dealer.ownerName,
        email: dealer.officialEmail,
        role: ROLES.DEALER,
        mustChangePassword: dealer.mustChangePassword
      };

      req.dealer = {
        id: dealer._id.toString(),
        dealerCode: dealer.dealerCode,
        businessName: dealer.businessName,
        status: dealer.status,
        primaryCategory: dealer.primaryCategory?.toString() || '',
        primaryCategoryName: dealer.primaryCategoryName,
        payoutHold: dealer.payoutHold
      };

      return next();
    }

    // Non-dealer accounts (Customers, Admins)
    const user = await User.findById(decoded.id).select('+password');
    if (!user) {
      return next(ApiError.unauthorized('User account no longer exists.'));
    }

    if (user.status !== 'ACTIVE') {
      return next(ApiError.forbidden(`Your account is currently ${user.status.toLowerCase()}. Please contact GROVE administration.`));
    }

    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      mustChangePassword: user.mustChangePassword
    };

    next();
  } catch (err) {
    next(err);
  }
};

