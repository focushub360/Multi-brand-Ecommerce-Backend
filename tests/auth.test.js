import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { generateSecurePassword } from '../src/utils/generatePassword.js';
import { hashPassword, comparePassword } from '../src/utils/passwordHash.js';
import { 
  generateAccessToken, 
  generateRefreshToken, 
  verifyAccessToken, 
  hashToken 
} from '../src/utils/generateTokens.js';

describe('Phase 2 - Authentication & Security Unit & Integration Tests', () => {
  describe('Cryptographic & Utility Tests', () => {
    it('generateSecurePassword should generate exactly 12 characters by default', () => {
      const pwd = generateSecurePassword(12);
      expect(pwd).toHaveLength(12);
      expect(pwd).toMatch(/[A-Z]/); // at least one uppercase
      expect(pwd).toMatch(/[a-z]/); // at least one lowercase
      expect(pwd).toMatch(/[0-9]/); // at least one digit
      expect(pwd).toMatch(/[!@#$%^&*()_+]/); // at least one symbol
    });

    it('hashPassword and comparePassword should correctly hash and verify', async () => {
      const raw = 'TestPassword@123';
      const hash = await hashPassword(raw);
      expect(hash).not.toBe(raw);
      expect(await comparePassword(raw, hash)).toBe(true);
      expect(await comparePassword('WrongPassword', hash)).toBe(false);
    });

    it('generateAccessToken and verifyAccessToken should encode and decode payload', () => {
      const payload = { id: 'user_123', email: 'test@grove.com', role: 'USER' };
      const token = generateAccessToken(payload);
      expect(typeof token).toBe('string');
      const decoded = verifyAccessToken(token);
      expect(decoded.id).toBe('user_123');
      expect(decoded.role).toBe('USER');
    });

    it('hashToken should return deterministic 64-character SHA-256 hex string', () => {
      const token = 'sample_refresh_token_string';
      const hash1 = hashToken(token);
      const hash2 = hashToken(token);
      expect(hash1).toHaveLength(64);
      expect(hash1).toBe(hash2);
      expect(hash1).not.toBe(hashToken('different_token'));
    });
  });

  describe('HTTP Auth Validation & Route Tests', () => {
    it('POST /api/v1/auth/login should reject request with missing fields (400)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe('VALIDATION_FAILED');
      expect(res.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'body.email' }),
          expect.objectContaining({ field: 'body.password' })
        ])
      );
    });

    it('POST /api/v1/auth/register should reject invalid email format (400)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Demo User',
          email: 'invalid-email-format',
          password: 'Password123'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors[0].field).toBe('body.email');
    });

    it('POST /api/v1/auth/dealer/initial-setup-password should reject temp password not equal to 12 chars', async () => {
      const res = await request(app)
        .post('/api/v1/auth/dealer/initial-setup-password')
        .send({
          email: 'dealer@grove.com',
          temporaryPassword: 'short', // Not 12 chars
          newPassword: 'BrandNewPassword123'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors[0].message).toContain('12 characters');
    });

    it('POST /api/v1/dealers/apply should reject missing GSTIN or business category (400)', async () => {
      const res = await request(app)
        .post('/api/v1/dealers/apply')
        .send({
          businessName: 'My Agro Shop',
          ownerName: 'Ramesh Kumar',
          officialEmail: 'ramesh@agro.com',
          phone: '9820011223'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});

