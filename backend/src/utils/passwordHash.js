import bcrypt from 'bcrypt';
import { env } from '../config/env.js';

/**
 * Hashes a plaintext password using bcrypt with configured salt rounds.
 */
export const hashPassword = async (plaintextPassword) => {
  return await bcrypt.hash(plaintextPassword, env.BCRYPT_SALT_ROUNDS);
};

/**
 * Compares plaintext password against a stored bcrypt hash.
 */
export const comparePassword = async (plaintextPassword, hashedPassword) => {
  if (!plaintextPassword || !hashedPassword) return false;
  return await bcrypt.compare(plaintextPassword, hashedPassword);
};

