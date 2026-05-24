import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

// Environment variable validation schema
const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  PORT: z.string().transform(Number).default('3001'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),
  SESSION_SECRET: z.string().min(1),
  TURN_SERVER_URL: z.string().optional(),
  TURN_USERNAME: z.string().optional(),
  TURN_PASSWORD: z.string().optional(),
  DEFAULT_ROOM_EXPIRY: z.string().transform(Number).default('86400'),
  MAX_PARTICIPANTS_PER_ROOM: z.string().transform(Number).default('2'),
  CLEANUP_INTERVAL_MS: z.string().transform(Number).default('3600000'),
});

// Validate and export environment variables
let env: z.infer<typeof envSchema>;

try {
  env = envSchema.parse(process.env);
} catch (error) {
  console.error('❌ Invalid environment variables:', error);
  process.exit(1);
}

export const config = {
  database: {
    url: env.DATABASE_URL,
  },
  server: {
    port: env.PORT,
    nodeEnv: env.NODE_ENV,
    frontendUrl: env.FRONTEND_URL,
  },
  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
  },
  session: {
    secret: env.SESSION_SECRET,
  },
  webrtc: {
    turnServerUrl: env.TURN_SERVER_URL,
    turnUsername: env.TURN_USERNAME,
    turnPassword: env.TURN_PASSWORD,
  },
  room: {
    defaultExpiry: env.DEFAULT_ROOM_EXPIRY,
    maxParticipants: env.MAX_PARTICIPANTS_PER_ROOM,
  },
  cleanup: {
    intervalMs: env.CLEANUP_INTERVAL_MS,
  },
} as const;

// CORS configuration
export const corsOptions = {
  origin: env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Socket.IO configuration
export const socketConfig = {
  cors: corsOptions,
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling'],
};

// WebRTC ICE servers configuration
export const iceServers = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' },
  ...(env.TURN_SERVER_URL
    ? [
        {
          urls: env.TURN_SERVER_URL,
          username: env.TURN_USERNAME,
          credential: env.TURN_PASSWORD,
        },
      ]
    : []),
];
