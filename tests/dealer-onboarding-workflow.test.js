import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { User } from '../src/modules/users/user.model.js';
import { Dealer } from '../src/modules/dealers/dealer.model.js';
import { AdminService } from '../src/modules/admin/admin.service.js';
import { generateAccessToken } from '../src/utils/generateTokens.js';

describe('Dealer Approval, Rejection & Password Reset Workflow', () => {
  const fakeDealerId = '660000000000000000000001';
  const fakeAdminId = '660000000000000000000002';

  beforeEach(() => {
    vi.restoreAllMocks();

    // Mock AdminService.recordAuditLog to prevent unmocked DB calls in unit tests
    vi.spyOn(AdminService, 'recordAuditLog').mockResolvedValue(true);

    // Mock Dealer.findById for authenticate middleware (when role === DEALER)
    vi.spyOn(Dealer, 'findById').mockImplementation((id) => {
      const idStr = String(id);
      return Promise.resolve({
        _id: idStr,
        id: idStr,
        dealerCode: 'DEALER_001',
        ownerName: 'Demo Dealer',
        officialEmail: 'dealer@example.com',
        businessName: 'Agro Hub',
        status: 'APPROVED',
        mustChangePassword: true,
        primaryCategoryName: 'Bio Fertilizers',
        bankVerificationStatus: 'VERIFIED',
        payoutHold: false,
        save: vi.fn().mockResolvedValue(true)
      });
    });

    // Mock User.findById for authenticate middleware (for non-dealer roles like SUPER_ADMIN)
    vi.spyOn(User, 'findById').mockImplementation((id) => ({
      select: () => {
        const idStr = String(id);
        if (idStr === fakeAdminId) {
          return Promise.resolve({
            _id: fakeAdminId,
            id: fakeAdminId,
            name: 'Super Admin',
            email: 'admin@grove.com',
            role: 'SUPER_ADMIN',
            status: 'ACTIVE'
          });
        }
        return Promise.resolve(null);
      }
    }));

    // Mock Dealer.findOne for dealer queries
    vi.spyOn(Dealer, 'findOne').mockResolvedValue({
      _id: '660000000000000000000004',
      id: '660000000000000000000004',
      dealerCode: 'DEALER_001',
      businessName: 'Agro Hub',
      status: 'APPROVED'
    });
  });

  describe('Password Validation Policy', () => {
    it('POST /api/v1/auth/first-time-password requires valid JWT bearer token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/first-time-password')
        .send({
          newPassword: 'Password@123',
          confirmPassword: 'Password@123'
        });

      expect(res.status).toBe(401);
    });

    it('POST /api/v1/auth/first-time-password rejects password lacking special character', async () => {
      const fakeToken = generateAccessToken({
        id: fakeDealerId,
        email: 'dealer@example.com',
        role: 'DEALER'
      });

      const res = await request(app)
        .post('/api/v1/auth/first-time-password')
        .set('Authorization', `Bearer ${fakeToken}`)
        .send({
          newPassword: 'Password1234',
          confirmPassword: 'Password1234'
        });

      expect(res.status).toBe(400);
      expect(res.body.errors[0].message).toContain('special character');
    });

    it('POST /api/v1/auth/first-time-password rejects password lacking uppercase letter', async () => {
      const fakeToken = generateAccessToken({
        id: fakeDealerId,
        email: 'dealer@example.com',
        role: 'DEALER'
      });

      const res = await request(app)
        .post('/api/v1/auth/first-time-password')
        .set('Authorization', `Bearer ${fakeToken}`)
        .send({
          newPassword: 'password@123',
          confirmPassword: 'password@123'
        });

      expect(res.status).toBe(400);
      expect(res.body.errors[0].message).toContain('uppercase letter');
    });

    it('POST /api/v1/auth/first-time-password rejects password lacking digit', async () => {
      const fakeToken = generateAccessToken({
        id: fakeDealerId,
        email: 'dealer@example.com',
        role: 'DEALER'
      });

      const res = await request(app)
        .post('/api/v1/auth/first-time-password')
        .set('Authorization', `Bearer ${fakeToken}`)
        .send({
          newPassword: 'Password@!',
          confirmPassword: 'Password@!'
        });

      expect(res.status).toBe(400);
      expect(res.body.errors[0].message).toContain('digit');
    });

    it('POST /api/v1/auth/first-time-password rejects password with mismatched confirmPassword', async () => {
      const fakeToken = generateAccessToken({
        id: fakeDealerId,
        email: 'dealer@example.com',
        role: 'DEALER'
      });

      const res = await request(app)
        .post('/api/v1/auth/first-time-password')
        .set('Authorization', `Bearer ${fakeToken}`)
        .send({
          newPassword: 'ValidPassword@123',
          confirmPassword: 'DifferentPassword@123'
        });

      expect(res.status).toBe(400);
      expect(res.body.errors[0].message).toContain('match');
    });
  });

  describe('Dealer Rejection Policy & Reason Storage', () => {
    it('POST /api/v1/admin/dealers/:id/reject rejects empty or short reason (< 5 chars)', async () => {
      const adminToken = generateAccessToken({
        id: fakeAdminId,
        email: 'admin@grove.com',
        role: 'SUPER_ADMIN'
      });

      const res = await request(app)
        .post('/api/v1/admin/dealers/660000000000000000000003/reject')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reason: 'No'
        });

      expect(res.status).toBe(400);
      expect(res.body.errors[0].message).toContain('rejection reason');
    });
  });

  describe('Store Settings & Password Change Policies', () => {
    it('POST /api/v1/auth/change-password validates 5-rule password complexity', async () => {
      const dealerToken = generateAccessToken({
        id: fakeDealerId,
        email: 'dealer@example.com',
        role: 'DEALER'
      });

      const res = await request(app)
        .post('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${dealerToken}`)
        .send({
          currentPassword: 'OldPassword123!',
          newPassword: 'simplepassword'
        });

      expect(res.status).toBe(400);
      expect(res.body.errors[0].message).toContain('uppercase');
    });

    it('POST /api/v1/auth/change-password rejects when new password is same as current password', async () => {
      const dealerToken = generateAccessToken({
        id: fakeDealerId,
        email: 'dealer@example.com',
        role: 'DEALER'
      });

      const res = await request(app)
        .post('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${dealerToken}`)
        .send({
          currentPassword: 'OldPassword123!',
          newPassword: 'OldPassword123!'
        });

      expect(res.status).toBe(400);
      expect(res.body.errors[0].message).toContain('identical');
    });

    it('PUT /api/v1/dealers/bank-details/verify rejects invalid IFSC format', async () => {
      const dealerToken = generateAccessToken({
        id: fakeDealerId,
        email: 'dealer@example.com',
        role: 'DEALER'
      });

      const res = await request(app)
        .put('/api/v1/dealers/bank-details/verify')
        .set('Authorization', `Bearer ${dealerToken}`)
        .send({
          bankName: 'HDFC Bank',
          accountName: 'Agro Hub Trading',
          accountNumber: '123456789012',
          ifsc: 'INVALID_IFSC'
        });

      expect(res.status).toBe(400);
      expect(res.body.errors[0].message).toContain('IFSC');
    });

    it('PUT /api/v1/dealers/store-settings accepts editable store and warehouse fields', async () => {
      const dealerToken = generateAccessToken({
        id: fakeDealerId,
        email: 'dealer@example.com',
        role: 'DEALER'
      });

      // Mock Dealer.findById to return a mutable document
      vi.spyOn(Dealer, 'findById').mockResolvedValue({
        _id: '660000000000000000000004',
        status: 'APPROVED',
        dealerCode: 'DEALER_001',
        ownerName: 'Demo Dealer',
        officialEmail: 'dealer@example.com',
        businessName: 'Original Name',
        warehouseAddress: 'Original Warehouse',
        businessAddress: { city: 'Pune', state: 'Maharashtra', pincode: '412208' },
        storeSettings: { operatingHours: '9am - 5pm', isOpen: true },
        save: vi.fn().mockResolvedValue(true)
      });

      const res = await request(app)
        .put('/api/v1/dealers/store-settings')
        .set('Authorization', `Bearer ${dealerToken}`)
        .send({
          businessName: 'Updated Agri Depot',
          warehouseAddress: 'Plot 99, Bhosari MIDC, Pune',
          city: 'Pune',
          state: 'Maharashtra',
          pincode: '411026',
          operatingHours: 'Mon - Sat: 08:00 AM - 08:00 PM',
          isOpen: true
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('PUT /api/v1/dealers/onboarding/bank-details saves bank settlement details', async () => {
      const dealerToken = generateAccessToken({
        id: fakeDealerId,
        email: 'dealer@example.com',
        role: 'DEALER'
      });

      vi.spyOn(Dealer, 'findById').mockResolvedValue({
        _id: '660000000000000000000004',
        businessName: 'Agro Hub',
        status: 'PENDING_KYC',
        bankDetails: {},
        bankVerificationStatus: 'PENDING',
        approvalHistory: [],
        save: vi.fn().mockResolvedValue(true)
      });

      const res = await request(app)
        .put('/api/v1/dealers/onboarding/bank-details')
        .set('Authorization', `Bearer ${dealerToken}`)
        .send({
          bankName: 'State Bank of India',
          accountName: 'Agro Hub Trading Pvt Ltd',
          accountNumber: '12345678901234',
          ifsc: 'SBIN0001234',
          upiId: 'agrohub@oksbi'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.bankVerificationStatus).toBe('SUBMITTED');
    });

    it('PATCH /api/v1/admin/dealers/:id/verify-kyc transitions dealer to APPROVED and bankVerificationStatus to VERIFIED', async () => {
      const adminToken = generateAccessToken({
        id: fakeAdminId,
        email: 'admin@grove.com',
        role: 'SUPER_ADMIN'
      });

      vi.spyOn(Dealer, 'findById').mockResolvedValue({
        _id: '660000000000000000000004',
        businessName: 'Agro Hub',
        status: 'PENDING_KYC',
        bankVerificationStatus: 'SUBMITTED',
        kycDocuments: [],
        approvalHistory: [],
        save: vi.fn().mockResolvedValue(true)
      });

      const res = await request(app)
        .patch('/api/v1/admin/dealers/660000000000000000000004/verify-kyc')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          notes: 'KYC verified and approved'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('APPROVED');
      expect(res.body.data.bankVerificationStatus).toBe('VERIFIED');
    });
  });
});
