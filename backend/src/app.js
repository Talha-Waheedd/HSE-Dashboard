'use strict';

const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const hpp = require('hpp');
const swaggerUi = require('swagger-ui-express');

const corsOptions = require('./database/config/cors');
const swaggerSpec = require('./database/config/swagger');
const logger = require('./shared/utils/logger');
const requestIdMiddleware = require('./core/middleware/requestId.middleware');
const sanitizeMiddleware = require('./core/middleware/sanitize.middleware');
const { globalRateLimiter } = require('./core/middleware/rateLimiter.middleware');
const errorMiddleware = require('./core/middleware/error.middleware');
const ApiResponse = require('./shared/utils/ApiResponse');
const { HTTP_STATUS } = require('./shared/constants/httpStatus');
const v1Routes = require('./modules/core');

// ─── Register event handlers ─────────────────────────────────────────────────
require('./core/events/emitter');

const app = express();

// ─── Security Middleware ──────────────────────────────────────────────────────
app.use(helmet());
app.use(cors(corsOptions));
app.use(hpp());

// ─── Request Parsing ──────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(compression());

// ─── XSS Sanitization ────────────────────────────────────────────────────────
app.use(sanitizeMiddleware);

// ─── Correlation ID ───────────────────────────────────────────────────────────
app.use(requestIdMiddleware);

// ─── HTTP Access Logging ──────────────────────────────────────────────────────
app.use(
  morgan('combined', {
    stream: { write: (message) => logger.http(message.trim()) },
    skip: (req) => req.url === '/api/health',
  }),
);

// ─── Global Rate Limiter ──────────────────────────────────────────────────────
app.use(globalRateLimiter);

// ─── Static Files ─────────────────────────────────────────────────────────────
app.use('/public', express.static(path.resolve(process.cwd(), 'public')));

// ─── API Documentation ────────────────────────────────────────────────────────
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(HTTP_STATUS.OK).json(
    ApiResponse.success({
      status: 'ok',
      message: 'Server is healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV,
    }, 'Health check succeeded'),
  );
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/v1', v1Routes);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(HTTP_STATUS.NOT_FOUND).json(
    ApiResponse.error(`Route not found: ${req.method} ${req.originalUrl}`),
  );
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(errorMiddleware);

module.exports = app;
