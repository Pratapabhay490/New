import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

// Prisma client singleton
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Database connection health check
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    logger.info('Database connection successful');
    return true;
  } catch (error) {
    logger.error('Database connection failed:', error);
    return false;
  }
}

// Graceful shutdown
export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
    logger.info('Database disconnected successfully');
  } catch (error) {
    logger.error('Error disconnecting from database:', error);
  }
}

// Cleanup expired rooms periodically
export async function cleanupExpiredRooms(): Promise<void> {
  try {
    const result = await prisma.room.updateMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
        status: 'ACTIVE',
      },
      data: {
        status: 'EXPIRED',
      },
    });
    
    if (result.count > 0) {
      logger.info(`Cleaned up ${result.count} expired rooms`);
    }
  } catch (error) {
    logger.error('Error cleaning up expired rooms:', error);
  }
}

// Start periodic cleanup
export function startPeriodicCleanup(intervalMs: number = 3600000): NodeJS.Timeout {
  logger.info(`Starting periodic cleanup with interval: ${intervalMs}ms`);
  return setInterval(() => {
    cleanupExpiredRooms();
  }, intervalMs);
}
