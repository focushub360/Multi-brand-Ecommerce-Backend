import { Router } from 'express';
import { ApiResponse } from '../utils/ApiResponse.js';

import authRoutes from '../modules/auth/auth.routes.js';
import dealerRoutes from '../modules/dealers/dealer.routes.js';
import categoryRoutes from '../modules/categories/category.routes.js';
import productRoutes from '../modules/products/product.routes.js';
import inventoryRoutes from '../modules/inventory/inventory.routes.js';
import dealerLocationRoutes from '../modules/dealer-locations/dealerLocation.routes.js';
import userRoutes from '../modules/users/user.routes.js';
import adminRoutes from '../modules/admin/admin.routes.js';
import addressRoutes from '../modules/addresses/address.routes.js';
import cartRoutes from '../modules/cart/cart.routes.js';
import wishlistRoutes from '../modules/wishlist/wishlist.routes.js';
import orderRoutes from '../modules/orders/order.routes.js';
import paymentRoutes from '../modules/payments/payment.routes.js';
import settlementRoutes from '../modules/settlements/settlement.routes.js';
import complaintRoutes from '../modules/complaints/complaint.routes.js';
import analyticsRoutes from '../modules/analytics/analytics.routes.js';

const router = Router();

/**
 * Health Check Endpoint
 * GET /api/v1/health
 */
router.get('/health', (_req, res) => {
  return res.status(200).json(
    ApiResponse.success(
      {
        status: 'UP',
        timestamp: new Date().toISOString(),
        service: 'GROVE E-Commerce Backend API',
        version: '1.0.0'
      },
      'GROVE API service is healthy and operational.'
    )
  );
});

// Mounted Phase 1-7 All Module Routers
router.use('/auth', authRoutes);
router.use('/dealers', dealerRoutes);
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/dealer-locations', dealerLocationRoutes);
router.use('/users', userRoutes);
router.use('/admin', adminRoutes);
router.use('/addresses', addressRoutes);
router.use('/cart', cartRoutes);
router.use('/wishlist', wishlistRoutes);
router.use('/orders', orderRoutes);
router.use('/payments', paymentRoutes);
router.use('/settlements', settlementRoutes);
router.use('/complaints', complaintRoutes);
router.use('/analytics', analyticsRoutes);

export default router;
