import { Router } from 'express';
import * as categoryController from './category.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/role.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { ROLES } from '../../constants/roles.js';
import {
  createCategorySchema,
  updateCategorySchema,
  addSubcategorySchema,
  categoryIdParamsSchema
} from './category.validation.js';

const router = Router();

/**
 * Public Endpoints: Browse Categories
 */
router.get('/', categoryController.getAllCategories);
router.get('/admin/all', authenticate, authorize(ROLES.SUPER_ADMIN), categoryController.getAllCategories);
router.get('/:slug', categoryController.getCategoryBySlug);

/**
 * Super Admin Protected Endpoints: Category Taxonomy Governance
 */
router.post(
  '/',
  authenticate,
  authorize(ROLES.SUPER_ADMIN),
  validate(createCategorySchema),
  categoryController.createCategory
);

router.put(
  '/:id',
  authenticate,
  authorize(ROLES.SUPER_ADMIN),
  validate(categoryIdParamsSchema),
  validate(updateCategorySchema),
  categoryController.updateCategory
);

router.delete(
  '/:id',
  authenticate,
  authorize(ROLES.SUPER_ADMIN),
  validate(categoryIdParamsSchema),
  categoryController.deleteCategory
);

router.post(
  '/:id/subcategories',
  authenticate,
  authorize(ROLES.SUPER_ADMIN),
  validate(categoryIdParamsSchema),
  validate(addSubcategorySchema),
  categoryController.addSubcategory
);

export default router;

