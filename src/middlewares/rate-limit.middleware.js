import rateLimit from 'express-rate-limit';
import { ApiError } from '../utils/ApiError.js';

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 3000 : 10000, // Generous limit allowing SPA multi-tab navigation
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(new ApiError(429, 'Too many requests from this IP. Please try again after 15 minutes.', [], 'RATE_LIMIT_EXCEEDED'));
  }
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 30 : 100, // Prevent lockout during active testing
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(new ApiError(429, 'Too many authentication attempts. Please try again after 15 minutes.', [], 'AUTH_RATE_LIMIT_EXCEEDED'));
  }
});

