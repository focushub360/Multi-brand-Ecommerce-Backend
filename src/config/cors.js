import { env } from './env.js';

const configuredClientUrls = (env.CLIENT_URL || '')
  .split(',')
  .map((url) => url.trim().replace(/\/+$/, ''))
  .filter(Boolean);

const allowedOrigins = [
  ...configuredClientUrls,
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000'
];

export const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (such as mobile apps, Postman, curl, or server-to-server)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin) || env.NODE_ENV === 'development') {
      return callback(null, true);
    }

    return callback(new Error(`CORS Policy: Origin ${origin} not allowed by Access-Control-Allow-Origin.`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Set-Cookie'],
  maxAge: 86400 // 24 hours preflight cache
};

