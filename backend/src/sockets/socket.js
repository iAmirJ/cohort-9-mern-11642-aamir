const { Server } = require('socket.io');
const jwtUtils = require('../utils/jwt');
const logger = require('../utils/logger');

let io = null;

/**
 * Attaches a Socket.IO server to the given HTTP server. Every connection must
 * present a valid access token (same JWT used for the REST API) in the
 * handshake; on success the socket joins a room scoped to that user, so all
 * of that user's open tabs/sessions can be reached with one emit.
 */
function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_ORIGIN || '*',
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const payload = jwtUtils.verifyAccessToken(token);
      socket.userId = payload.sub;
      next();
    } catch (err) {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(`user:${socket.userId}`);
    logger.info({ userId: socket.userId, socketId: socket.id }, 'Socket connected');

    socket.on('disconnect', () => {
      logger.info({ userId: socket.userId, socketId: socket.id }, 'Socket disconnected');
    });
  });

  return io;
}

/**
 * Emits `event` with `payload` to every socket belonging to `userId`
 * (i.e. all of that user's open tabs/sessions). No-op if sockets haven't
 * been initialised yet (e.g. during unit tests that require services
 * directly without booting server.js) - callers don't need to guard this.
 */
function broadcastToUser(userId, event, payload) {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, payload);
}

module.exports = { initSocket, broadcastToUser };