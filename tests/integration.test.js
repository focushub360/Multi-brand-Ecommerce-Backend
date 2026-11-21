import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { Category } from '../src/modules/categories/category.model.js';
import { Product } from '../src/modules/products/product.model.js';

describe('Phase 8 - Comprehensive Integration & E2E Route Tests', () => {
  describe('OpenAPI & Documentation Verification', () => {
    it('GET /api/v1/docs.json should serve valid OpenAPI 3.0 specification', async () => {
      const res = await request(app).get('/api/v1/docs.json');
      expect(res.status).toBe(200);
      expect(res.body.openapi).toBe('3.0.0');
      expect(res.body.info.title).toContain('GROVE');
      expect(res.body.components.securitySchemes.bearerAuth).toBeDefined();
    });
  });

  describe('Categories & Catalog Endpoints', () => {
    it('GET /api/v1/categories should return status 200 and success true', async () => {
      vi.spyOn(Category, 'find').mockReturnValue({
        sort: () => ({
          lean: async () => [
            {
              _id: 'cat_1',
              name: 'Agriculture & Farming',
              slug: 'agriculture-farming',
              commissionRate: 4.5
            }
          ]
        })
      });

      const res = await request(app).get('/api/v1/categories');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0].name).toBe('Agriculture & Farming');
    });

    it('GET /api/v1/products should support query filters and pagination', async () => {
      vi.spyOn(Product, 'find').mockReturnValue({
        populate: () => ({
          sort: () => ({
            skip: () => ({
              limit: () => ({
                lean: async () => [
                  {
                    _id: 'prod_1',
                    name: 'Mini Tractor 25 HP',
                    sku: 'AG-TRC-025',
                    price: 350000,
                    categoryName: 'Agriculture & Farming'
                  }
                ]
              })
            })
          })
        })
      });
      vi.spyOn(Product, 'countDocuments').mockResolvedValue(1);

      const res = await request(app).get('/api/v1/products?limit=5&page=1');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.limit).toBe(5);
      expect(res.body.data[0].sku).toBe('AG-TRC-025');
    });
  });

  describe('Geospatial Dealer Locations & Serviceability', () => {
    it('POST /api/v1/dealer-locations/check-serviceability should validate required dealerId', async () => {
      const res = await request(app)
        .post('/api/v1/dealer-locations/check-serviceability')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe('VALIDATION_FAILED');
    });
  });

  describe('Cart & Addresses Authorization Protection', () => {
    it('GET /api/v1/cart should reject unauthenticated requests with 401', async () => {
      const res = await request(app).get('/api/v1/cart');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('token missing');
    });

    it('GET /api/v1/addresses should reject unauthenticated requests with 401', async () => {
      const res = await request(app).get('/api/v1/addresses');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/v1/orders/checkout should reject unauthenticated checkout with 401', async () => {
      const res = await request(app)
        .post('/api/v1/orders/checkout')
        .send({ paymentMethod: 'upi' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Admin Routes Protection', () => {
    it('GET /api/v1/admin/audit-logs should reject unauthenticated access', async () => {
      const res = await request(app).get('/api/v1/admin/audit-logs');
      expect(res.status).toBe(401);
    });

    it('GET /api/v1/admin/settings should reject unauthenticated access', async () => {
      const res = await request(app).get('/api/v1/admin/settings');
      expect(res.status).toBe(401);
    });
  });
});
