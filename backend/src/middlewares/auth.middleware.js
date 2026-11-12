import { ApiError } from '../utils/ApiError.js';
import { verifyAccessToken } from '../utils/generateTokens.js';
import { User } from '../modules/users/user.model.js';
import { Dealer } from '../modules/dealers/dealer.model.js';
import { ROLES } from '../constants/roles.js';

/**
 * Authentication Middleware
 * Validates JWT access token, checks user active status, and populates req.user (and req.dealer if applicable).
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

    // 4. Fetch User from DB
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

    // 5. If role is DEALER, populate req.dealer
    if (user.role === ROLES.DEALER) {
      const dealer = await Dealer.findOne({ user: user._id });
      if (!dealer) {
        return next(ApiError.forbidden('Dealer profile not found for this account.'));
      }
      req.dealer = {
        id: dealer._id.toString(),
        dealerCode: dealer.dealerCode,
        businessName: dealer.businessName,
        status: dealer.status,
        primaryCategory: dealer.primaryCategory.toString(),
        primaryCategoryName: dealer.primaryCategoryName,
        payoutHold: dealer.payoutHold
      };
    }

    next();
  } catch (err) {
    next(err);
  }
};

