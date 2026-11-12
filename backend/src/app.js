import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import morgan from 'morgan';
import mongoSanitize from 'express-mongo-sanitize';
import swaggerUi from 'swagger-ui-express';

import { corsOptions } from './config/cors.js';
import { env } from './config/env.js';
import { swaggerSpec } from './config/swagger.js';
import { globalLimiter } from './middlewares/rate-limit.middleware.js';
import { notFoundHandler } from './middlewares/not-found.middleware.js';
import { errorHandler } from './middlewares/error.middleware.js';
import apiRouter from './routes/index.js';

const app = express();

// Disable ETag generation to prevent 304 Not Modified responses on dynamic API resources
app.set('etag', false);

// Prevent caching on dynamic API routes to avoid stale/empty 304 responses
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// 1. Security Headers (Allow inline styles/scripts for Swagger UI)
app.use(
  helmet({
    contentSecurityPolicy: false
  })
);

// 2. Cross-Origin Resource Sharing
app.use(cors(corsOptions));

// 3. Rate Limiting for Public Endpoints
app.use(globalLimiter);

// 4. Request Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// 5. Response Compression
app.use(compression());

// 6. Data Sanitization against NoSQL Query Injection
app.use(mongoSanitize());

// 7. HTTP Request Logger
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// 8. Interactive Swagger / OpenAPI Documentation
app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api/v1/docs.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// 9. Root Welcome Route
app.get('/', (_req, res) => {
  res.status(200).json({
    name: 'GROVE Multi-Brand E-Commerce Platform API',
    version: '1.0.0',
    documentation: '/api/v1/docs',
    health: '/api/v1/health'
  });
});

// 10. API v1 Main Router
app.use('/api/v1', apiRouter);

// 11. 404 Route Not Found Handler
app.use(notFoundHandler);

// 12. Centralized Global Error Handler
app.use(errorHandler);

export default app;
