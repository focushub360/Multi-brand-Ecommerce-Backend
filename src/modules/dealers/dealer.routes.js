import { Router } from 'express';
import * as dealerController from './dealer.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize, requireApprovedDealer } from '../../middlewares/role.middleware.js';
import { ROLES } from '../../constants/roles.js';
import { dealerApplicationSchema, dealerStoreSettingsSchema, dealerBankDetailsSchema } from './dealer.validation.js';

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
 * Submit Dealer Settlement Bank Details During Onboarding
 * PUT /api/v1/dealers/onboarding/bank-details
 */
router.put(
  '/onboarding/bank-details',
  authenticate,
  authorize(ROLES.DEALER),
  validate(dealerBankDetailsSchema),
  dealerController.submitOnboardingBankDetails
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
 * Update Dealer Store Settings (Description & Hours only)
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
 * Public dealer directory (approved dealers only; sensitive fields are excluded).
 */
router.get('/', dealerController.getPublicDealers);
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

