import { Router } from 'express';
import * as productController from './product.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize, requireApprovedDealer } from '../../middlewares/role.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { ROLES } from '../../constants/roles.js';
import {
  createProductSchema,
  updateProductSchema,
  queryProductSchema,
  adminProductIdParamsSchema
} from './product.validation.js';

const router = Router();

/**
 * Public Catalog Endpoints
 */
router.get(
  '/',
  validate(queryProductSchema),
  productController.queryProducts
);

/**
 * Dealer Product Management Endpoints
 */
router.get(
  '/dealer/my-products',
  authenticate,
  authorize(ROLES.DEALER),
  productController.getMyDealerProducts
);

router.post(
  '/',
  authenticate,
  authorize(ROLES.DEALER),
  requireApprovedDealer,
  validate(createProductSchema),
  productController.createDealerProduct
);

router.put(
  '/:id',
  authenticate,
  authorize(ROLES.DEALER),
  requireApprovedDealer,
  validate(updateProductSchema),
  productController.updateDealerProduct
);

router.delete(
  '/:id',
  authenticate,
  authorize(ROLES.DEALER),
  requireApprovedDealer,
  productController.deleteDealerProduct
);

/**
 * Super Admin Moderation Endpoints
 */
router.get(
  '/admin',
  authenticate,
  authorize(ROLES.SUPER_ADMIN),
  productController.getAdminProducts
);

router.put(
  '/admin/:id',
  authenticate,
  authorize(ROLES.SUPER_ADMIN),
  validate(adminProductIdParamsSchema),
  validate(updateProductSchema),
  productController.adminUpdateProduct
);

router.delete(
  '/admin/:id',
  authenticate,
  authorize(ROLES.SUPER_ADMIN),
  validate(adminProductIdParamsSchema),
  productController.adminDeleteProduct
);

/**
 * Single Product by ID or Slug (Placed last to prevent param collision)
 */
router.get('/:id', productController.getProductById);

export default router;

