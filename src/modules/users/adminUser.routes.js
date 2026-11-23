
import { Router } from 'express';
import * as userController from './user.controller.js';

import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/role.middleware.js';
import { ROLES } from '../../constants/roles.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { updateAdminUserStatusSchema, userIdParamsSchema } from './user.validation.js';

const router = Router();

// All routes require authentication and admin authorization
router.use(authenticate);
router.use(authorize(ROLES.SUPER_ADMIN));

// GET /api/v1/admin/users/stats
router.get('/stats', userController.getUserStats);

// GET /api/v1/admin/users
router.get('/', userController.getAllUsers);

// GET /api/v1/admin/users/:id
router.get('/:id', validate(userIdParamsSchema), userController.getUserById);

// PATCH /api/v1/admin/users/:id/status
router.patch('/:id/status', validate(userIdParamsSchema), validate(updateAdminUserStatusSchema), userController.updateUserStatus);
router.delete('/:id', validate(userIdParamsSchema), userController.deleteUser);

export default router;
