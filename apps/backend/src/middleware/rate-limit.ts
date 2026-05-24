import rateLimit from 'express-rate-limit';
import { config } from '../config/constants';

export const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const createRoomLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 room creations per 15 minutes
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many room creation attempts, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Socket rate limiter
export class SocketRateLimiter {
  private socketLimits: Map<string, { count: number; resetAt: number }> = new Map();
  private readonly maxEvents: number;
  private readonly windowMs: number;

  constructor(maxEvents: number = 100, windowMs: number = 1000) {
    this.maxEvents = maxEvents;
    this.windowMs = windowMs;
  }

  checkLimit(socketId: string): boolean {
    const now = Date.now();
    const limit = this.socketLimits.get(socketId);

    if (!limit || now > limit.resetAt) {
      this.socketLimits.set(socketId, {
        count: 1,
        resetAt: now + this.windowMs,
      });
      return true;
    }

    if (limit.count >= this.maxEvents) {
      return false;
    }

    limit.count++;
    return true;
  }

  cleanup(socketId: string): void {
    this.socketLimits.delete(socketId);
  }

  cleanupExpired(): void {
    const now = Date.now();
    for (const [socketId, limit] of this.socketLimits.entries()) {
      if (now > limit.resetAt) {
        this.socketLimits.delete(socketId);
      }
    }
  }
}

export const annotationRateLimiter = new SocketRateLimiter(200, 1000); // 200 events per second
export const signalingRateLimiter = new SocketRateLimiter(50, 1000); // 50 events per second
