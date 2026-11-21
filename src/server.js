import app from './app.js';
import { env } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import { bootstrapSuperAdminAndData } from './modules/auth/bootstrap.service.js';

let server;

const startServer = async () => {
  try {
    // Attempt Database Connection
    try {
      await connectDB();
      // Run bootstrap seeding
      await bootstrapSuperAdminAndData();
    } catch (dbErr) {
      console.warn(`⚠️ Warning: MongoDB failed to connect on startup (${dbErr.message}). Continuing in offline/setup mode.`);
    }

    // Start Express Listener
    server = app.listen(env.PORT, () => {
      console.log(`🚀 GROVE Server listening on port ${env.PORT} in [${env.NODE_ENV}] mode`);
      console.log(`📍 Health Check: http://localhost:${env.PORT}/api/v1/health`);
    });
  } catch (err) {
    console.error(`❌ Critical Server Startup Error: ${err.message}`);
    process.exit(1);
  }
};

// Graceful Termination Handler
const handleGracefulShutdown = async (signal) => {
  console.log(`\n🛑 Received ${signal}. Commencing graceful server shutdown...`);
  if (server) {
    server.close(async () => {
      console.log('HTTP server closed.');
      await disconnectDB();
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason, promise) => {
  console.error('🔥 Unhandled Promise Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception thrown:', err);
  process.exit(1);
});

startServer();
