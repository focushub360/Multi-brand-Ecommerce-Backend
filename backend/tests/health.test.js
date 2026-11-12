import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

describe('Phase 1 - Server Health & Architecture Smoke Tests', () => {
  it('GET / should return 200 and platform metadata', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('GROVE Multi-Brand E-Commerce Platform API');
    expect(res.body.version).toBe('1.0.0');
  });

  it('GET /api/v1/health should return 200 and healthy status', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('UP');
    expect(res.body.data.service).toBe('GROVE E-Commerce Backend API');
  });

  it('GET /api/v1/undefined-endpoint should trigger 404 not found with ApiError structure', async () => {
    const res = await request(app).get('/api/v1/undefined-endpoint');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.errorCode).toBe('NOT_FOUND');
  });
});

