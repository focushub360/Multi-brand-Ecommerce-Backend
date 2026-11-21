# GROVE Multi-Brand E-Commerce Backend

Production-ready, modular, and secure backend for the GROVE Multi-Brand Marketplace (Agriculture, Electronics, Automotive, Groceries) built with Node.js, Express.js (ES Modules), MongoDB Atlas, Mongoose, and JWT.

---

## Features
- **Unified Single Login:** One endpoint (`/api/v1/auth/login`) for Super Admin, Dealers, and Customers.
- **Strict Role-Based Access Control (RBAC):** Server-enforced permissions across 3 distinct personas.
- **Dealer Onboarding Lifecycle:** 12-character secure temporary password generation with 24-hour expiration and forced first-time password reset.
- **Category Lockdown:** Dealers can only create products matching their approved primary category.
- **Multi-Dealer Fulfillment:** Master customer orders are partitioned into independent dealer fulfillment suborders (`DealerOrder`).
- **Multi-Depot Inventory:** Real-time stock tracking with immutable movement ledger (`InventoryTransaction`).
- **Geospatial Proximity:** Delivery serviceability checks with MongoDB `2dsphere` index and Haversine distance calculations.
- **Address Management:** Customer addresses with a strict 5-address limit.
- **Interactive Documentation:** Swagger UI documentation available at `/api/v1/docs`.

---

## Technology Stack
- **Runtime:** Node.js v20+ (ES Modules)
- **Framework:** Express.js 4.21+
- **Database:** MongoDB Atlas / Local MongoDB with Mongoose 8.9+
- **Authentication:** JWT (Access Tokens + Refresh Token Rotation with SHA-256 Hashes)
- **Password Security:** bcrypt (12 salt rounds)
- **Email Service:** Nodemailer
- **Request Validation:** Zod
- **API Documentation:** Swagger / OpenAPI 3.0
- **Testing:** Vitest & Supertest

---

## Directory Structure
```
backend/
├── src/
│   ├── config/         # Database, env validation, mail, cors, swagger
│   ├── constants/      # Roles, permissions, order & dealer statuses
│   ├── middlewares/    # Auth, RBAC, Zod validator, rate limiting, error handler
│   ├── modules/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── dealers/
│   │   ├── categories/
│   │   ├── products/
│   │   ├── inventory/
│   │   ├── cart/
│   │   ├── wishlist/
│   │   ├── addresses/
│   │   ├── dealer-locations/
│   │   ├── orders/
│   │   ├── payments/
│   │   ├── settlements/
│   │   ├── complaints/
│   │   ├── analytics/
│   │   └── admin/
│   ├── routes/         # Central API route aggregator (/api/v1)
│   ├── utils/          # ApiError, ApiResponse, asyncHandler, crypto utils
│   ├── app.js          # Express app configuration
│   └── server.js       # Server bootstrap & DB connection
├── docs/               # Architecture, API & Schema Documentation
├── tests/              # Automated unit and integration test suite
├── .env                # Local environment variables
├── .env.example        # Environment variable template
└── package.json
```

---

## Quick Start

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env` and verify your MongoDB URI and JWT secrets:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb://127.0.0.1:27017/grove_ecommerce
JWT_ACCESS_SECRET=your_jwt_access_secret_key_minimum_32_characters_long
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_minimum_32_characters_long
ADMIN_EMAIL=admin@grove.com
ADMIN_PASSWORD=Admin@123
```

### 3. Start Development Server
```bash
npm run dev
```

### 4. Run Automated Tests
```bash
npm test
```

### 5. Access Interactive API Documentation
Open your browser and navigate to:
```
http://localhost:5000/api/v1/docs
```


backend connection,runing, db, 