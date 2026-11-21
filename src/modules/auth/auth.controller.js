import { AuthService } from './auth.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { env } from '../../config/env.js';

// Cookie options for secure HTTP-only Refresh Token
const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || '';
  const userAgent = req.headers['user-agent'] || '';

  const result = await AuthService.login({
    email,
    password,
    ipAddress,
    userAgent
  });

  // Attach refresh token as HttpOnly cookie
  res.cookie('refreshToken', result.refreshToken, cookieOptions);

  return res.status(200).json(
    ApiResponse.success(
      {
        user: result.user,
        dealer: result.dealer,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        mustChangePassword: result.mustChangePassword
      },
      'Authentication successful'
    )
  );
});

export const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password } = req.body;
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || '';
  const userAgent = req.headers['user-agent'] || '';

  const result = await AuthService.registerCustomer({
    name,
    email,
    phone,
    password,
    ipAddress,
    userAgent
  });

  res.cookie('refreshToken', result.refreshToken, cookieOptions);

  return res.status(201).json(
    ApiResponse.created(
      {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken
      },
      'Customer registered successfully'
    )
  );
});

export const refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || '';
  const userAgent = req.headers['user-agent'] || '';

  const result = await AuthService.refreshSession({
    refreshToken: token,
    ipAddress,
    userAgent
  });

  res.cookie('refreshToken', result.refreshToken, cookieOptions);

  return res.status(200).json(
    ApiResponse.success(
      { 
        accessToken: result.accessToken,
        refreshToken: result.refreshToken 
      },
      'Token refreshed successfully'
    )
  );
});

export const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;
  await AuthService.logout({ refreshToken: token });

  res.clearCookie('refreshToken', cookieOptions);

  return res.status(200).json(
    ApiResponse.success(null, 'Logged out successfully')
  );
});

export const getMe = asyncHandler(async (req, res) => {
  return res.status(200).json(
    ApiResponse.success(
      {
        user: req.user,
        dealer: req.dealer || null
      },
      'User profile fetched successfully'
    )
  );
});

export const firstTimePassword = asyncHandler(async (req, res) => {
  const { newPassword } = req.body;
  const result = await AuthService.setFirstTimePassword({
    userId: req.user.id,
    newPassword
  });

  return res.status(200).json(
    ApiResponse.success(
      {
        user: result.user,
        dealer: result.dealer
      },
      result.message
    )
  );
});

export const initialSetupPassword = asyncHandler(async (req, res) => {
  const { email, temporaryPassword, newPassword } = req.body;
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || '';
  const userAgent = req.headers['user-agent'] || '';

  const result = await AuthService.setupInitialDealerPassword({
    email,
    temporaryPassword,
    newPassword,
    ipAddress,
    userAgent
  });

  res.cookie('refreshToken', result.refreshToken, cookieOptions);

  return res.status(200).json(
    ApiResponse.success(
      {
        user: result.user,
        dealer: result.dealer,
        accessToken: result.accessToken
      },
      result.message
    )
  );
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const result = await AuthService.changePassword({
    userId: req.user.id,
    currentPassword,
    newPassword
  });

  res.clearCookie('refreshToken', cookieOptions);

  return res.status(200).json(ApiResponse.success(null, result.message));
});

