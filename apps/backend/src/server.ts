import { createServer } from 'http';
import { Server } from 'socket.io';
import { createApp } from './app';
import { config, socketConfig } from './config/constants';
import { setupSocketHandlers } from './sockets/connection';
import { logger } from './utils/logger';
import {
  checkDatabaseConnection,
  disconnectDatabase,
  startPeriodicCleanup,
} from './config/database';

export async function startServer() {
  // Check database connection
  const dbConnected = await checkDatabaseConnection();

  if (!dbConnected) {
    logger.error('Failed to connect to database. Exiting...');
    process.exit(1);
  }

  // Create Express app
  const app = createApp();

  // Create HTTP server
  const httpServer = createServer(app);

  // Create Socket.IO server
  const io = new Server(httpServer, socketConfig);

  // Setup Socket.IO event handlers
  setupSocketHandlers(io);

  // Start periodic cleanup
  const cleanupInterval = startPeriodicCleanup(config.cleanup.intervalMs);

  // Start server
  const port = config.server.port;

  httpServer.listen(port, () => {
    logger.info(`🚀 Server started on port ${port}`);
    logger.info(`📡 Environment: ${config.server.nodeEnv}`);
    logger.info(`🔗 Frontend URL: ${config.server.frontendUrl}`);
    logger.info(`💾 Database connected`);
    logger.info(`🔌 Socket.IO server ready`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info(`${signal} received, shutting down gracefully...`);

    // Stop accepting new connections
    httpServer.close(async () => {
      logger.info('HTTP server closed');

      // Close Socket.IO connections
      io.close(() => {
        logger.info('Socket.IO server closed');
      });

      // Clear cleanup interval
      clearInterval(cleanupInterval);

      // Disconnect from database
      await disconnectDatabase();

      logger.info('Shutdown complete');
      process.exit(0);
    });

    // Force close after 10 seconds
    setTimeout(() => {
      logger.error('Forced shutdown due to timeout');
      process.exit(1);
    }, 10000);
  };

  // Handle shutdown signals
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception:', error);
    shutdown('UNCAUGHT_EXCEPTION');
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled rejection at:', promise, 'reason:', reason);
    shutdown('UNHANDLED_REJECTION');
  });

  return { app, httpServer, io };
}
