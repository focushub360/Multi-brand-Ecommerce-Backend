import { Router } from 'express';
import * as addressController from './address.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { addressSchema } from './address.validation.js';

const router = Router();

// All customer address routes require authentication
router.use(authenticate);

router.get('/', addressController.getMyAddresses);
router.post('/', validate(addressSchema), addressController.addAddress);
router.put('/:id', validate(addressSchema), addressController.updateAddress);
router.delete('/:id', addressController.deleteAddress);
router.patch('/:id/default', addressController.setDefaultAddress);

export default router;

