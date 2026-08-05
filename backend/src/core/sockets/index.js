'use strict';

const { Server } = require('socket.io');
const corsOptions = require('../../database/config/cors');
const logger = require('../../shared/utils/logger');
const { verifyToken } = require('../../shared/utils/tokenGenerator');
const TokenType = require('../../shared/enums/TokenType');

let io;

const initSockets = (httpServer) => {
  io = new Server(httpServer, {
    cors: corsOptions,
    path: '/socket.io',
  });

  // ─── Socket Auth Middleware ──────────────────────────────────────────────
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
    if (!token) return next(new Error('Authentication required'));
    try {
      const payload = verifyToken(token, TokenType.ACCESS);
      socket.userId = payload.sub;
      return next();
    } catch {
      return next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id} [user: ${socket.userId}]`);

    // Join user's personal room for targeted notifications
    socket.join(`user:${socket.userId}`);

    socket.on('disconnect', (reason) => {
      logger.info(`Socket disconnected: ${socket.id} [reason: ${reason}]`);
    });
  });

  logger.info('🔌 Socket.IO initialized');
  return io;
};

/**
 * Emit a notification to a specific user.
 * @param {string} userId
 * @param {string} event
 * @param {object} data
 */
const emitToUser = (userId, event, data) => {
  if (io) io.to(`user:${userId}`).emit(event, data);
};

/**
 * Broadcast to all connected clients.
 */
const broadcast = (event, data) => {
  if (io) io.emit(event, data);
};

module.exports = { initSockets, emitToUser, broadcast };
