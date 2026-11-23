import { Router } from 'express';
import * as paymentController from './payment.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/role.middleware.js';
import { ROLES } from '../../constants/roles.js';

const router = Router();

// Super Admin Escrow & Payments Governance
router.use(authenticate, authorize(ROLES.SUPER_ADMIN));

router.get('/', paymentController.getPayments);
router.get('/:id', paymentController.getPaymentById);

export default router;

