import { Router } from 'express';
import * as orderController from './order.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize, requireApprovedDealer } from '../../middlewares/role.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { ROLES } from '../../constants/roles.js';
import { checkoutSchema, updateFulfillmentStatusSchema } from './order.validation.js';

const router = Router();

// All order endpoints require authentication
router.use(authenticate);

/**
 * Standard Root Endpoints (Routes based on role)
 */
router.get('/', (req, res, next) => {
  if (req.user?.role === ROLES.SUPER_ADMIN) {
    return orderController.getGlobalOrders(req, res, next);
  }
  return orderController.getMyOrders(req, res, next);
});

router.post('/', authorize(ROLES.USER), validate(checkoutSchema), orderController.checkout);

/**
 * Customer Shopping & Order Lifecycle Endpoints
 */
router.post('/checkout', authorize(ROLES.USER), validate(checkoutSchema), orderController.checkout);
router.get('/my-orders', orderController.getMyOrders);
router.get('/my-orders/:orderId', orderController.getMyOrderById);
router.post('/my-orders/:orderId/cancel', orderController.cancelMyOrder);

/**
 * Dealer Fulfillment Suborder Endpoints
 */
router.get(
  '/dealer/my-orders',
  authorize(ROLES.DEALER),
  orderController.getDealerOrders
);

router.get(
  '/dealer/my-orders/:id',
  authorize(ROLES.DEALER),
  orderController.getDealerOrderById
);

router.patch(
  '/dealer/my-orders/:id/status',
  authorize(ROLES.DEALER),
  requireApprovedDealer,
  validate(updateFulfillmentStatusSchema),
  orderController.updateFulfillmentStatus
);

/**
 * Super Admin Global Order Audit Endpoints (Read-Only)
 */
router.get(
  '/admin',
  authorize(ROLES.SUPER_ADMIN),
  orderController.getGlobalOrders
);

router.get(
  '/admin/:id',
  authorize(ROLES.SUPER_ADMIN),
  orderController.getAdminOrderById
);

export default router;

