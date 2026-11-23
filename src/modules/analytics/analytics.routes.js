import { Router } from 'express';
import * as analyticsController from './analytics.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/role.middleware.js';
import { ROLES } from '../../constants/roles.js';

const router = Router();

router.use(authenticate);

/**
 * Super Admin Sales & Revenue Analytics
 */
router.get(
  '/admin',
  authorize(ROLES.SUPER_ADMIN),
  analyticsController.getAdminAnalytics
);

/**
 * Dealer Performance Metrics & CSV Export
 */
router.get(
  '/dealer',
  authorize(ROLES.DEALER),
  analyticsController.getDealerAnalytics
);

router.get(
  '/dealer/export-csv',
  authorize(ROLES.DEALER),
  analyticsController.exportDealerSalesCSV
);

export default router;

