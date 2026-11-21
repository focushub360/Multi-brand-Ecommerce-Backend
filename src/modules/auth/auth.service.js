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
   * Autonomous routing: Dealers authenticate against Dealer collection;
   * Customers & Admins authenticate against User collection.
   */
  static async login({ email, password, ipAddress = '', userAgent = '' }) {
    const cleanEmail = email.toLowerCase().trim();

    // 1. Check if email belongs to a Dealer
    const dealer = await Dealer.findOne({ officialEmail: cleanEmail }).select('+password +temporaryPassword.hash');

    if (dealer) {
      if (dealer.status === DEALER_STATUS.PENDING) {
        throw ApiError.forbidden('Your dealer application is currently under review by GROVE Operations Desk. You will be notified via email upon KYC approval.');
      }
      if (dealer.status === DEALER_STATUS.REJECTED) {
        const reasonMsg = dealer.rejectionReason ? ` Reason: ${dealer.rejectionReason}` : '';
        throw ApiError.forbidden(`Your dealer application has been rejected.${reasonMsg} Please contact GROVE Support.`);
      }
      if (dealer.status === DEALER_STATUS.SUSPENDED) {
        throw ApiError.forbidden('Your dealership account is currently suspended. Please contact platform operations.');
      }

      let isPasswordValid = await dealer.comparePassword(password);
      let isTempPasswordLogin = false;

      if (!isPasswordValid && dealer.temporaryPassword?.hash) {
        const tempPw = dealer.temporaryPassword;
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
      } else if (isPasswordValid && dealer.temporaryPassword?.mustChange) {
        const tempPw = dealer.temporaryPassword;
        if (tempPw?.expiresAt && new Date() > tempPw.expiresAt) {
          throw ApiError.unauthorized('Your temporary password has expired (validity was 24 hours). Please contact GROVE administration to reissue credentials.');
        }
        if (tempPw?.isUsed) {
          throw ApiError.unauthorized('This temporary password has already been used. Please log in with your updated permanent password.');
        }
        isTempPasswordLogin = true;
      }

      if (!isPasswordValid) {
        throw ApiError.unauthorized('Invalid email or password. Please verify your credentials.');
      }

      const tokenPayload = {
        id: dealer._id.toString(),
        email: dealer.officialEmail,
        role: ROLES.DEALER
      };

      const accessToken = generateAccessToken(tokenPayload);
      const refreshToken = generateRefreshToken(tokenPayload);

      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      await RefreshToken.create({
        tokenHash: hashToken(refreshToken),
        user: dealer._id,
        expiresAt,
        ipAddress,
        userAgent
      });

      dealer.lastLogin = new Date();
      await dealer.save();

      const needsPasswordChange = Boolean(
        isTempPasswordLogin || 
        dealer.mustChangePassword || 
        dealer.temporaryPassword?.mustChange
      );

      return {
        user: {
          id: dealer._id,
          name: dealer.ownerName,
          email: dealer.officialEmail,
          role: ROLES.DEALER,
          phone: dealer.phone,
          avatar: '',
          mustChangePassword: needsPasswordChange
        },
        dealer: {
          id: dealer._id,
          dealerCode: dealer.dealerCode,
          businessName: dealer.businessName,
          primaryCategory: dealer.primaryCategory,
          primaryCategoryName: dealer.primaryCategoryName,
          status: dealer.status,
          bankVerificationStatus: dealer.bankVerificationStatus,
          tier: dealer.tier,
          payoutHold: dealer.payoutHold,
          rejectionReason: dealer.rejectionReason || ''
        },
        accessToken,
        refreshToken,
        mustChangePassword: needsPasswordChange
      };
    }

    // 2. Check User collection for Customers and Admins
    const user = await User.findOne({ email: cleanEmail }).select('+password');
    if (!user || user.role === ROLES.DEALER) {
      throw ApiError.unauthorized('Invalid email or password. Please verify your credentials.');
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw ApiError.unauthorized('Invalid email or password. Please verify your credentials.');
    }

    if (user.status !== 'ACTIVE') {
      throw ApiError.forbidden(`Your account is currently ${user.status.toLowerCase()}. Access is restricted.`);
    }

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

    user.lastLogin = new Date();
    await user.save();

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar,
        mustChangePassword: Boolean(user.mustChangePassword)
      },
      dealer: null,
      accessToken,
      refreshToken,
      mustChangePassword: Boolean(user.mustChangePassword)
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

    let tokenPayload;
    if (decoded.role === ROLES.DEALER) {
      const dealer = await Dealer.findById(decoded.id);
      if (!dealer || dealer.status === DEALER_STATUS.SUSPENDED || dealer.status === DEALER_STATUS.REJECTED) {
        throw ApiError.unauthorized('Dealer session is no longer active.');
      }
      tokenPayload = {
        id: dealer._id.toString(),
        email: dealer.officialEmail,
        role: ROLES.DEALER
      };
    } else {
      const user = await User.findById(decoded.id);
      if (!user || user.status !== 'ACTIVE') {
        throw ApiError.unauthorized('User session is no longer active.');
      }
      tokenPayload = {
        id: user._id.toString(),
        email: user.email,
        role: user.role
      };
    }

    // Issue new Token Pair
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
      user: decoded.id,
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
   * First-Time Password Reset for Authenticated Dealer (using Bearer token)
   */
  static async setFirstTimePassword({ userId, newPassword }) {
    // 1. Check Dealer first
    const dealer = await Dealer.findById(userId).select('+password');
    if (dealer) {
      dealer.password = newPassword;
      dealer.mustChangePassword = false;
      if (dealer.temporaryPassword) {
        dealer.temporaryPassword.isUsed = true;
        dealer.temporaryPassword.mustChange = false;
        dealer.temporaryPassword.hash = null;
      }
      await dealer.save();

      return {
        message: 'Permanent password configured successfully. Welcome to GROVE Dealer Portal.',
        user: {
          id: dealer._id,
          name: dealer.ownerName,
          email: dealer.officialEmail,
          role: ROLES.DEALER,
          mustChangePassword: false
        },
        dealer: {
          id: dealer._id,
          dealerCode: dealer.dealerCode,
          businessName: dealer.businessName,
          status: dealer.status,
          mustChangePassword: false
        }
      };
    }

    // 2. Fall back to User
    const user = await User.findById(userId).select('+password');
    if (!user) {
      throw ApiError.notFound('Account not found.');
    }

    user.password = newPassword;
    user.mustChangePassword = false;
    await user.save();

    return {
      message: 'Permanent password configured successfully.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        mustChangePassword: false
      },
      dealer: null
    };
  }

  /**
   * First-Time Forced Dealer Password Setup (using 12-char temporary password)
   */
  static async setupInitialDealerPassword({ email, temporaryPassword, newPassword, ipAddress = '', userAgent = '' }) {
    const cleanEmail = email.toLowerCase().trim();

    const dealer = await Dealer.findOne({ officialEmail: cleanEmail }).select('+password +temporaryPassword.hash');
    if (!dealer) {
      throw ApiError.notFound('Dealer account not found for this email address.');
    }

    if (!dealer.temporaryPassword?.hash) {
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
    dealer.password = newPassword;
    dealer.mustChangePassword = false;

    // Mark temporary password as used and invalidate
    dealer.temporaryPassword.isUsed = true;
    dealer.temporaryPassword.mustChange = false;
    dealer.temporaryPassword.hash = null;
    await dealer.save();

    // Generate normal tokens
    const tokenPayload = {
      id: dealer._id.toString(),
      email: dealer.officialEmail,
      role: ROLES.DEALER
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await RefreshToken.create({
      tokenHash: hashToken(refreshToken),
      user: dealer._id,
      expiresAt,
      ipAddress,
      userAgent
    });

    return {
      message: 'Permanent password configured successfully. Welcome to GROVE Dealer Portal.',
      accessToken,
      refreshToken,
      user: {
        id: dealer._id,
        name: dealer.ownerName,
        email: dealer.officialEmail,
        role: ROLES.DEALER
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
    // 1. Check Dealer first
    const dealer = await Dealer.findById(userId).select('+password');
    if (dealer) {
      const isMatch = await dealer.comparePassword(currentPassword);
      if (!isMatch) {
        throw ApiError.badRequest('Current password entered is incorrect.');
      }

      dealer.password = newPassword;
      dealer.mustChangePassword = false;
      await dealer.save();

      await RefreshToken.updateMany({ user: dealer._id }, { revokedAt: new Date() });
      return { message: 'Password changed successfully. Please log in with your new credentials.' };
    }

    // 2. Check User
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

