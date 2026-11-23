import { Router } from 'express';
import * as cartController from './cart.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { addToCartSchema, updateCartItemSchema } from './cart.validation.js';

const router = Router();

// Customer Shopping Cart Routes (Requires Customer Authentication)
router.use(authenticate);

router.get('/', cartController.getCart);
router.post('/', validate(addToCartSchema), cartController.addToCart);
router.post('/items', validate(addToCartSchema), cartController.addToCart);
router.patch('/items/:productId', validate(updateCartItemSchema), cartController.updateQuantity);
router.delete('/items/:productId', cartController.removeItem);
router.delete('/', cartController.clearCart);

export default router;

