import { Router } from 'express';
import * as userController from './user.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/role.middleware.js';
import { ROLES } from '../../constants/roles.js';

const router = Router();

/**
 * Customer Update Own Profile
 * PATCH /api/v1/users/profile
 */
router.patch('/profile', authenticate, userController.updateProfile);

/**
 * Super Admin User Governance Routes
 * (Read and Delete only – creation and editing prohibited per specification)
 */
router.get(
  '/',
  authenticate,
  authorize(ROLES.SUPER_ADMIN),
  userController.getAllUsers
);

router.get(
  '/:id',
  authenticate,
  authorize(ROLES.SUPER_ADMIN),
  userController.getUserById
);

router.delete(
  '/:id',
  authenticate,
  authorize(ROLES.SUPER_ADMIN),
  userController.deleteUser
);

export default router;

