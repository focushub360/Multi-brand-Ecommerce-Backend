import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env.js';

/**
 * Generates a short-lived access JWT token.
 */
export const generateAccessToken = (payload) => {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN
  });
};

/**
 * Generates a long-lived refresh JWT token.
 */
export const generateRefreshToken = (payload) => {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN
  });
};

/**
 * Verifies an access JWT token.
 */
export const verifyAccessToken = (token) => {
  return jwt.verify(token, env.JWT_ACCESS_SECRET);
};

/**
 * Verifies a refresh JWT token.
 */
export const verifyRefreshToken = (token) => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET);
};

/**
 * Hashes a token string using SHA-256 for secure database storage.
 */
export const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

