import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/role.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { ROLES } from '../../constants/roles.js';
import * as dealerController from '../dealers/dealer.controller.js';
import * as adminController from './admin.controller.js';
import { dealerApprovalSchema, dealerRejectionSchema } from '../dealers/dealer.validation.js';

const router = Router();

// Protect all admin routes with authentication and strict SUPER_ADMIN authorization
router.use(authenticate, authorize(ROLES.SUPER_ADMIN));

/**
 * Dealer Governance Endpoints
 */
router.get('/dealers', dealerController.getAllDealers);
router.get('/dealers/:id', dealerController.getDealerById);
router.post(
  '/dealers/:id/approve',
  validate(dealerApprovalSchema),
  dealerController.approveDealer
);
router.patch('/dealers/:id/verify-kyc', dealerController.verifyKyc);
router.post(
  '/dealers/:id/reject',
  validate(dealerRejectionSchema),
  dealerController.rejectDealer
);
router.patch('/dealers/:id/status', dealerController.toggleDealerStatus);

/**
 * Platform Audit Trail & Governance Settings Endpoints
 */
router.get('/audit-logs', adminController.getAuditLogs);
router.get('/settings', adminController.getSettings);
router.put('/settings', adminController.updateSettings);

export default router;
