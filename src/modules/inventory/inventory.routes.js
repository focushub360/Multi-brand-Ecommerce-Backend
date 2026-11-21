import { Router } from 'express';
import * as inventoryController from './inventory.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize, requireApprovedDealer } from '../../middlewares/role.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { ROLES } from '../../constants/roles.js';
import { adjustStockSchema } from './inventory.validation.js';

const router = Router();

/**
 * Universal Inventory Listing (Role-based)
 */
router.get('/', authenticate, (req, res, next) => {
  if (req.user?.role === ROLES.SUPER_ADMIN) {
    return inventoryController.getGlobalInventory(req, res, next);
  }
  return inventoryController.getMyInventory(req, res, next);
});

/**
 * Dealer Inventory Routes
 */
router.get(
  '/my-inventory',
  authenticate,
  authorize(ROLES.DEALER),
  inventoryController.getMyInventory
);

router.patch(
  '/:productId/stock',
  authenticate,
  authorize(ROLES.DEALER),
  requireApprovedDealer,
  validate(adjustStockSchema),
  inventoryController.adjustStock
);

router.get(
  '/:productId/transactions',
  authenticate,
  authorize(ROLES.DEALER),
  inventoryController.getTransactions
);

/**
 * Super Admin Global Inventory Audit
 */
router.get(
  '/global',
  authenticate,
  authorize(ROLES.SUPER_ADMIN),
  inventoryController.getGlobalInventory
);

export default router;

