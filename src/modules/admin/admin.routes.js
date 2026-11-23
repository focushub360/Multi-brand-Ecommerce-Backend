import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/role.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { ROLES } from '../../constants/roles.js';
import * as dealerController from '../dealers/dealer.controller.js';
import * as adminController from './controller/admin.controller.js';
import * as notificationController from './controller/adminNotification.controller.js';
import {
  dealerApprovalSchema,
  dealerRejectionSchema,
  adminDealerUpdateSchema,
  dealerStatusSchema,
  dealerIdParamsSchema,
  dealerVerifyKycSchema
} from '../dealers/dealer.validation.js';
import { updateSettingsSchema } from './admin.validation.js';

const router = Router();

// Protect all admin routes with authentication and strict SUPER_ADMIN authorization
router.use(authenticate, authorize(ROLES.SUPER_ADMIN));

/**
 * Dealer Governance Endpoints
 */
router.get('/dealers', dealerController.getAllDealers);
router.get('/dealers/:id', validate(dealerIdParamsSchema), dealerController.getDealerById);
router.put('/dealers/:id', validate(dealerIdParamsSchema), validate(adminDealerUpdateSchema), dealerController.updateAdminDealerDetails);
router.post('/dealers/:id/reset-credentials', validate(dealerIdParamsSchema), dealerController.resetDealerCredentials);
router.post(
  '/dealers/:id/approve',
  validate(dealerIdParamsSchema),
  validate(dealerApprovalSchema),
  dealerController.approveDealer
);
router.patch(
  '/dealers/:id/verify-kyc',
  validate(dealerIdParamsSchema),
  validate(dealerVerifyKycSchema),
  dealerController.verifyDealerKyc
);
router.post(
  '/dealers/:id/reject',
  validate(dealerIdParamsSchema),
  validate(dealerRejectionSchema),
  dealerController.rejectDealer
);
router.patch('/dealers/:id/status', validate(dealerIdParamsSchema), validate(dealerStatusSchema), dealerController.toggleDealerStatus);

/**
 * Platform Audit Trail & Governance Settings Endpoints
 */
router.get('/audit-logs', adminController.getAuditLogs);
router.get('/settings', adminController.getSettings);
router.put('/settings', validate(updateSettingsSchema), adminController.updateSettings);

/**
 * Admin Notification Endpoints (for Bell Icon & Notifications Drawer)
 * Available at: /api/v1/admin/notifications
 */
router.get('/notifications', notificationController.getNotifications);
router.get('/notifications/counts', notificationController.getUnreadCounts);
router.patch('/notifications/mark-all-read', notificationController.markAllAsRead);
router.patch('/notifications/:id/read', notificationController.markAsRead);
router.delete('/notifications/:id', notificationController.deleteNotification);
router.post('/notifications/simulate', notificationController.simulateNotification);

export default router;
