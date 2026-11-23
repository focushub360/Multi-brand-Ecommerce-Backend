import { Router } from 'express';
import * as settlementController from './settlement.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/role.middleware.js';
import { ROLES } from '../../constants/roles.js';

const router = Router();

router.use(authenticate);

/**
 * Dealer Payout History
 */
router.get(
  '/my-settlements', 
  authorize(ROLES.DEALER),
  settlementController.getMySettlements
);

/**
 * Super Admin Escrow Settlement Processing
 */
router.get(
  '/',
  authorize(ROLES.SUPER_ADMIN),
  settlementController.getSettlements
);

export default router;

