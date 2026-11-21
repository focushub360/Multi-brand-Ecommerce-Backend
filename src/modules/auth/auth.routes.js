import { Router } from 'express';
import * as authController from './auth.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authLimiter } from '../../middlewares/rate-limit.middleware.js';
import {
  loginSchema,
  registerSchema,
  changePasswordSchema,
  firstTimePasswordSchema,
  initialSetupPasswordSchema
} from './auth.validation.js';

const router = Router();

/**
 * Unified Single Login for all roles
 * POST /api/v1/auth/login
 */
router.post(
  '/login',
  authLimiter,
  validate(loginSchema),
  authController.login
);

/**
 * Customer Registration
 * POST /api/v1/auth/register
 */
router.post(
  '/register',
  authLimiter,
  validate(registerSchema),
  authController.register
);

/**
 * Refresh Access Token
 * POST /api/v1/auth/refresh-token
 */
router.post(
  '/refresh-token',
  authController.refreshToken
);

/**
 * Logout & Invalidate Session
 * POST /api/v1/auth/logout
 */
router.post(
  '/logout',
  authController.logout
);

/**
 * Current Authenticated Session Profile
 * GET /api/v1/auth/me
 */
router.get(
  '/me',
  authenticate,
  authController.getMe
);

/**
 * First-Time Password Setup for Authenticated Users (e.g. Approved Dealer first login)
 * POST /api/v1/auth/first-time-password
 */
router.post(
  '/first-time-password',
  authenticate,
  validate(firstTimePasswordSchema),
  authController.firstTimePassword
);

/**
 * First-Time Temporary Password Setup for Approved Dealers
 * POST /api/v1/auth/dealer/initial-setup-password
 */
router.post(
  '/dealer/initial-setup-password',
  validate(initialSetupPasswordSchema),
  authController.initialSetupPassword
);

/**
 * Authenticated User Password Change
 * POST /api/v1/auth/change-password
 */
router.post(
  '/change-password',
  authenticate,
  validate(changePasswordSchema),
  authController.changePassword
);

export default router;

