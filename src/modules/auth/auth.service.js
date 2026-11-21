import { User } from '../users/user.model.js';
import { Dealer } from '../dealers/dealer.model.js';
import { RefreshToken } from './auth.model.js';
import { ROLES } from '../../constants/roles.js';
import { DEALER_STATUS } from '../../constants/dealerStatus.js';
import { ApiError } from '../../utils/ApiError.js';
import { 
  generateAccessToken, 
  generateRefreshToken, 
  verifyRefreshToken, 
  hashToken 
} from '../../utils/generateTokens.js';
import { comparePassword, hashPassword } from '../../utils/passwordHash.js';
import { env } from '../../config/env.js';

export class AuthService {
  /**
   * Unified Single Login for all roles (SUPER_ADMIN, DEALER, USER)
   */
  static async login({ email, password, ipAddress = '', userAgent = '' }) {
    const cleanEmail = email.toLowerCase().trim();

    // 1. Find User by email
    const user = await User.findOne({ email: cleanEmail }).select('+password');
    let matchedDealer = null;
    let isTempPasswordLogin = false;

    if (!user) {
      throw ApiError.unauthorized('Invalid email or password. Please verify your credentials.');
    }

    // 2. If user is DEALER, also find Dealer profile
    if (user.role === ROLES.DEALER) {
      matchedDealer = await Dealer.findOne({ user: user._id }).select('+temporaryPassword.hash');
    }

    // 3. Verify standard password
    let isPasswordValid = await user.comparePassword(password);

    // 4. If standard password failed and user is a DEALER, check temporary password
    if (!isPasswordValid && matchedDealer && matchedDealer.temporaryPassword?.hash) {
      const tempPw = matchedDealer.temporaryPassword;

      if (tempPw.expiresAt && new Date() > tempPw.expiresAt) {
        throw ApiError.unauthorized('Your temporary password has expired (validity was 24 hours). Please contact GROVE administration to reissue credentials.');
      }

      if (tempPw.isUsed) {
        throw ApiError.unauthorized('This temporary password has already been used. Please log in with your updated permanent password.');
      }

      const isTempMatch = await comparePassword(password, tempPw.hash);
      if (isTempMatch) {
        isPasswordValid = true;
        isTempPasswordLogin = true;
      }
    }

    if (!isPasswordValid) {
      throw ApiError.unauthorized('Invalid email or password. Please verify your credentials.');
    }

    // 5. Account status checks
    if (user.status !== 'ACTIVE') {
      throw ApiError.forbidden(`Your account is currently ${user.status.toLowerCase()}. Access is restricted.`);
    }

    if (user.role === ROLES.DEALER && matchedDealer) {
      if (matchedDealer.status === DEALER_STATUS.PENDING) {
        throw ApiError.forbidden('Your dealer application is currently under review by GROVE Operations Desk. You will be notified via email upon KYC approval.');
      }
      if (matchedDealer.status === DEALER_STATUS.REJECTED) {
        throw ApiError.forbidden('Your dealer application has been rejected. Please review previous communications or contact GROVE Support.');
      }
      if (matchedDealer.status === DEALER_STATUS.SUSPENDED) {
        throw ApiError.forbidden('Your dealership account is currently suspended. Please contact platform operations.');
      }
    }

    // 6. Generate Tokens
    const tokenPayload = {
      id: user._id.toString(),
      email: user.email,
      role: user.role
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // 7. Store Refresh Token Hash in Database
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await RefreshToken.create({
      tokenHash: hashToken(refreshToken),
      user: user._id,
      expiresAt,
      ipAddress,
      userAgent
    });

    // 8. Update Last Login
    user.lastLogin = new Date();
    await user.save();

    // 9. Format response payload
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      avatar: user.avatar,
      mustChangePassword: isTempPasswordLogin || user.mustChangePassword
    };

    const dealerResponse = matchedDealer
      ? {
          id: matchedDealer._id,
          dealerCode: matchedDealer.dealerCode,
          businessName: matchedDealer.businessName,
          primaryCategory: matchedDealer.primaryCategory,
          primaryCategoryName: matchedDealer.primaryCategoryName,
          status: matchedDealer.status,
          tier: matchedDealer.tier,
          payoutHold: matchedDealer.payoutHold
        }
      : null;

    return {
      user: userResponse,
      dealer: dealerResponse,
      accessToken,
      refreshToken,
      mustChangePassword: isTempPasswordLogin || user.mustChangePassword
    };
  }

  /**
   * Customer Registration
   */
  static async registerCustomer({ name, email, phone = '', password, ipAddress = '', userAgent = '' }) {
    const cleanEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      throw ApiError.conflict('An account with this email address already exists. Please sign in instead.');
    }

    const newUser = new User({
      name: name.trim(),
      email: cleanEmail,
      phone: phone.trim(),
      password,
      role: ROLES.USER,
      status: 'ACTIVE',
      isEmailVerified: true
    });

    await newUser.save();

    const tokenPayload = {
      id: newUser._id.toString(),
      email: newUser.email,
      role: newUser.role
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await RefreshToken.create({
      tokenHash: hashToken(refreshToken),
      user: newUser._id,
      expiresAt,
      ipAddress,
      userAgent
    });

    return {
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role
      },
      accessToken,
      refreshToken
    };
  }

  /**
   * Refresh Token Rotation
   */
  static async refreshSession({ refreshToken, ipAddress = '', userAgent = '' }) {
    if (!refreshToken) {
      throw ApiError.unauthorized('Refresh token missing.');
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch {
      throw ApiError.unauthorized('Invalid or expired refresh token.');
    }

    const currentHash = hashToken(refreshToken);
    const storedToken = await RefreshToken.findOne({ tokenHash: currentHash });

    if (!storedToken) {
      throw ApiError.unauthorized('Refresh token unrecognized. Please sign in again.');
    }

    // Token reuse detection: If already revoked, invalidate all sessions for security
    if (storedToken.revokedAt) {
      console.warn(`🚨 Security Alert: Attempted reuse of revoked refresh token for user ${storedToken.user}`);
      await RefreshToken.updateMany({ user: storedToken.user }, { revokedAt: new Date() });
      throw ApiError.unauthorized('Compromised session detected. Please sign in again.');
    }

    if (Date.now() >= storedToken.expiresAt.getTime()) {
      throw ApiError.unauthorized('Refresh token has expired. Please sign in again.');
    }

    const user = await User.findById(decoded.id);
    if (!user || user.status !== 'ACTIVE') {
      throw ApiError.unauthorized('User session is no longer active.');
    }

    // Issue new Token Pair
    const tokenPayload = {
      id: user._id.toString(),
      email: user.email,
      role: user.role
    };

    const newAccessToken = generateAccessToken(tokenPayload);
    const newRefreshToken = generateRefreshToken(tokenPayload);
    const newHash = hashToken(newRefreshToken);

    // Rotate token
    storedToken.revokedAt = new Date();
    storedToken.replacedByTokenHash = newHash;
    await storedToken.save();

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await RefreshToken.create({
      tokenHash: newHash,
      user: user._id,
      expiresAt,
      ipAddress,
      userAgent
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    };
  }

  /**
   * Logout and Revoke Refresh Token
   */
  static async logout({ refreshToken }) {
    if (refreshToken) {
      const currentHash = hashToken(refreshToken);
      await RefreshToken.findOneAndUpdate(
        { tokenHash: currentHash },
        { revokedAt: new Date() }
      );
    }
  }

  /**
   * First-Time Forced Dealer Password Setup (using 12-char temporary password)
   */
  static async setupInitialDealerPassword({ email, temporaryPassword, newPassword, ipAddress = '', userAgent = '' }) {
    const cleanEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: cleanEmail });
    if (!user || user.role !== ROLES.DEALER) {
      throw ApiError.notFound('Dealer account not found for this email address.');
    }

    const dealer = await Dealer.findOne({ user: user._id }).select('+temporaryPassword.hash');
    if (!dealer || !dealer.temporaryPassword?.hash) {
      throw ApiError.badRequest('No active temporary password setup pending for this account.');
    }

    const tempPw = dealer.temporaryPassword;
    if (tempPw.expiresAt && new Date() > tempPw.expiresAt) {
      throw ApiError.unauthorized('Temporary password has expired. Please contact GROVE administration.');
    }

    if (tempPw.isUsed) {
      throw ApiError.badRequest('Temporary password has already been used.');
    }

    const isMatch = await comparePassword(temporaryPassword, tempPw.hash);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid temporary password.');
    }

    // Set permanent password
    user.password = newPassword;
    user.mustChangePassword = false;
    await user.save();

    // Mark temporary password as used and invalidate
    dealer.temporaryPassword.isUsed = true;
    dealer.temporaryPassword.mustChange = false;
    dealer.temporaryPassword.hash = null;
    await dealer.save();

    // Generate normal tokens
    const tokenPayload = {
      id: user._id.toString(),
      email: user.email,
      role: user.role
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await RefreshToken.create({
      tokenHash: hashToken(refreshToken),
      user: user._id,
      expiresAt,
      ipAddress,
      userAgent
    });

    return {
      message: 'Permanent password configured successfully. Welcome to GROVE Dealer Portal.',
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      dealer: {
        id: dealer._id,
        dealerCode: dealer.dealerCode,
        businessName: dealer.businessName,
        primaryCategoryName: dealer.primaryCategoryName
      }
    };
  }

  /**
   * Regular Password Change for Authenticated User
   */
  static async changePassword({ userId, currentPassword, newPassword }) {
    const user = await User.findById(userId).select('+password');
    if (!user) {
      throw ApiError.notFound('User not found.');
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      throw ApiError.badRequest('Current password entered is incorrect.');
    }

    user.password = newPassword;
    user.mustChangePassword = false;
    await user.save();

    // Revoke all existing refresh tokens for security
    await RefreshToken.updateMany({ user: user._id }, { revokedAt: new Date() });

    return { message: 'Password changed successfully. Please log in with your new credentials.' };
  }
}

