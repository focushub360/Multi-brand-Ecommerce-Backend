import { Router } from 'express';
import * as wishlistController from './wishlist.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', wishlistController.getWishlist);
router.post('/toggle', wishlistController.toggleWishlist);
router.delete('/:productId', wishlistController.removeFromWishlist);

export default router;

