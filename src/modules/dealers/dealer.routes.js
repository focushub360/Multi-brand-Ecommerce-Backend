import { Router } from 'express';
import * as dealerController from './dealer.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize, requireApprovedDealer } from '../../middlewares/role.middleware.js';
import { ROLES } from '../../constants/roles.js';
import { dealerApplicationSchema, dealerStoreSettingsSchema, bankVerificationSchema } from './dealer.validation.js';

const router = Router();

/**
 * Public Dealer Onboarding Application Form
 * POST /api/v1/dealers/apply
 */
router.post(
  '/apply',
  validate(dealerApplicationSchema),
  dealerController.apply
);

/**
 * Get Authenticated Dealer Profile
 * GET /api/v1/dealers/profile
 */
router.get(
  '/profile',
  authenticate,
  authorize(ROLES.DEALER),
  dealerController.getProfile
);

/**
 * Update Dealer Store Settings
 * PUT /api/v1/dealers/store-settings
 */
router.put(
  '/store-settings',
  authenticate,
  authorize(ROLES.DEALER),
  requireApprovedDealer,
  validate(dealerStoreSettingsSchema),
  dealerController.updateStoreSettings
);

/**
 * Submit Dealer Settlement Bank Details During Onboarding Wizard
 * PUT /api/v1/dealers/onboarding/bank-details
 */
router.put(
  '/onboarding/bank-details',
  authenticate,
  authorize(ROLES.DEALER),
  validate(bankVerificationSchema),
  dealerController.submitOnboardingBankDetails
);

/**
 * Super Admin Verifies Dealer KYC & Settlement Bank Account
 * PATCH /api/v1/dealers/:id/verify-kyc
 */
router.patch(
  '/:id/verify-kyc',
  authenticate,
  authorize(ROLES.SUPER_ADMIN),
  dealerController.verifyKyc
);

/**
 * Verify & Lock Dealer Settlement Bank Details
 * PUT /api/v1/dealers/bank-details/verify
 */
router.put(
  '/bank-details/verify',
  authenticate,
  authorize(ROLES.DEALER),
  requireApprovedDealer,
  validate(bankVerificationSchema),
  dealerController.verifyBankDetails
);

/**
 * Public dealer directory (approved dealers only; sensitive fields are excluded).
 */
router.get('/', dealerController.getAllDealers);
router.get('/:id', dealerController.getDealerById);
router.patch(
  '/:id/approve',
  authenticate,
  authorize(ROLES.SUPER_ADMIN),
  dealerController.approveDealer
);

router.patch(
  '/:id/reject',
  authenticate,
  authorize(ROLES.SUPER_ADMIN),
  dealerController.rejectDealer
);

router.patch(
  '/:id/status',
  authenticate,
  authorize(ROLES.SUPER_ADMIN),
  dealerController.toggleDealerStatus
);

export default router;

