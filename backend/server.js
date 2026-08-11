'use strict';

// Local project settings must take precedence over inherited shell values.
// In particular, the dashboard preview API relies on PREVIEW_AUTH from .env.
require('dotenv').config({ override: true });

const http = require('http');
const app = require('./src/app');
const { sequelize } = require('./src/database/connection');
const logger = require('./src/shared/utils/logger');
const config = require('./src/database/config');

const PORT = config.port || 5000;
const server = http.createServer(app);

// ─── Socket.IO ───────────────────────────────────────────────────────────────
const { initSockets } = require('./src/core/sockets');
initSockets(server);

// ─── Cron Jobs ───────────────────────────────────────────────────────────────
const { initCron } = require('./src/core/cron/scheduler');

// ─── Graceful Shutdown ───────────────────────────────────────────────────────
const shutdown = async (signal) => {
  logger.info(`${signal} received — shutting down gracefully`);
  server.close(async () => {
    try {
      await sequelize.close();
      logger.info('MySQL connection pool closed');
      process.exit(0);
    } catch (err) {
      logger.error('Error during shutdown', err);
      process.exit(1);
    }
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason);
  process.exit(1);
});

// ─── Bootstrap ───────────────────────────────────────────────────────────────
const bootstrap = async () => {
  try {
    await sequelize.authenticate();
    logger.info('✅ MySQL connected successfully');

    server.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT} [${config.env}]`);
      logger.info(`📖 API Docs: http://localhost:${PORT}/api/docs`);
      logger.info(`❤️  Health:  http://localhost:${PORT}/api/health`);
    });

    initCron();
    logger.info('⏰ Cron jobs initialized');
  } catch (err) {
    logger.error('❌ Failed to start server:', err);
    process.exit(1);
  }
};

bootstrap();
