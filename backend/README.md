# GROVE Multi-Brand E-Commerce Backend

A modular and secure backend for the GROVE Multi-Brand Marketplace, supporting Agriculture, Electronics, Automotive, and Groceries.

Built with Node.js, Express.js, MongoDB, Mongoose, and JWT.

## Features

- Unified login for Super Admins, Dealers, and Customers.
- Role-Based Access Control (RBAC).
- Dealer onboarding and management.
- Category-based product restrictions.
- Product catalog management.
- Multi-depot inventory tracking.
- Customer cart and wishlist.
- Customer address management.
- Geospatial delivery serviceability.
- Multi-dealer order fulfillment.
- Payment and settlement documentation.
- Customer complaints and support.
- Analytics and reporting.
- Interactive Swagger API documentation.

## Technology Stack

| Technology | Purpose |
|---|---|
| Node.js | JavaScript runtime |
| Express.js | Backend framework |
| MongoDB | Database |
| Mongoose | Database modeling |
| JWT | Authentication |
| bcrypt | Password security |
| Nodemailer | Email services |
| Swagger / OpenAPI | API documentation |
| Vitest | Testing |
| Supertest | API testing |

## Project Structure

```text
backend/
├── data/
├── docs/
│   ├── API_DOCUMENTATION.md
│   ├── DATABASE_SCHEMA.md
│   └── RBAC_PERMISSION_MATRIX.md
├── src/
│   ├── config/
│   ├── constants/
│   ├── middlewares/
│   ├── modules/
│   │   ├── addresses/
│   │   ├── admin/
│   │   ├── analytics/
│   │   ├── auth/
│   │   ├── cart/
│   │   ├── categories/
│   │   ├── complaints/
│   │   ├── dealer-locations/
│   │   ├── dealers/
│   │   ├── inventory/
│   │   ├── orders/
│   │   ├── products/
│   │   ├── settlements/
│   │   ├── users/
│   │   └── wishlist/
│   ├── routes/
│   ├── utils/
│   ├── app.js
│   └── server.js
├── tests/
├── .env.example
├── package.json
└── seed.js
```

## Getting Started

### 1. Prerequisites

- Node.js v20 or later
- npm
- MongoDB (Local MongoDB or MongoDB Atlas)

### 2. Install Dependencies

From the repository root:

```bash
cd backend
npm install
```

### 3. Configure Environment Variables

Create a `.env` file inside the backend folder using `.env.example` as a reference.

Example:

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

MONGODB_URI=mongodb://127.0.0.1:27017/grove_ecommerce

JWT_ACCESS_SECRET=replace_with_a_secure_secret
JWT_REFRESH_SECRET=replace_with_another_secure_secret

JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=12
```

Configure SMTP credentials if email functionality is required.

**Security:** Use strong private secrets. Never commit your `.env` file or share passwords and secret keys.

### 4. Run Development Server

```bash
npm run dev
```

### 5. Start Production Server

```bash
npm start
```

### 6. Run Database Seed

```bash
npm run seed
```

### 7. Run Tests

```bash
npm test
```

## API Documentation

Swagger UI is available when the backend server is running:

```text
http://localhost:5000/api/v1/docs
```

Additional documentation:

- `docs/API_DOCUMENTATION.md`
- `docs/DATABASE_SCHEMA.md`
- `docs/RBAC_PERMISSION_MATRIX.md`

## API Base URL

```text
http://localhost:5000/api/v1
```

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm start` | Start production server |
| `npm run seed` | Run database seed script |
| `npm test` | Run automated tests |

## Security

- JWT authentication.
- Role-Based Access Control.
- Password hashing with bcrypt.
- Request rate limiting.
- Secure HTTP headers.
- MongoDB input sanitization.
- Environment-based configuration.

## Project

**GROVE Multi-Brand E-Commerce Marketplace**

Backend API for managing customers, dealers, administrators, products, inventory, orders, and marketplace operations.