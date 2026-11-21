import swaggerJsDoc from 'swagger-jsdoc';
import { env } from './env.js';

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'GROVE Multi-Brand E-Commerce Platform REST API',
      version: '1.0.0',
      description: `
### Production-Grade Enterprise E-Commerce Backend

This API powers the GROVE Multi-Brand Marketplace across 3 distinct personas:
1. **Super Admin**: Platform governance, KYC onboarding, categories, global inventory and settlements.
2. **Authorized Dealers**: Category-restricted merchant catalogs, inventory ledgers, multi-dealer fulfillment suborders, and CSV analytics.
3. **Customers (Users)**: Product discovery across Agriculture, Electronics, Automotive and Groceries, shopping cart, wishlist, address management (max 5), checkout, and order tracking.

#### Core Security Architecture
- **Authentication:** Unified single login endpoint (\`/api/v1/auth/login\`) with JWT access tokens and HttpOnly refresh token rotation.
- **Role-Based Access Control:** Strict RBAC enforced on every sensitive endpoint.
- **Category Lockdown:** Dealers can only manage products within their approved primary category.
      `,
      contact: {
        name: 'GROVE Platform Engineering Team',
        email: 'operations@grove.com'
      }
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}/api/v1`,
        description: 'Local Development Server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Provide your JWT access token in the format: Bearer <token>'
        }
      }
    }
  },
  apis: ['./src/modules/**/*.routes.js', './src/routes/*.js']
};

export const swaggerSpec = swaggerJsDoc(swaggerOptions);

