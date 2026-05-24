import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { corsOptions, config } from './config/constants';
import { errorHandler, notFoundHandler } from './middleware/error';
import { apiLimiter } from './middleware/rate-limit';
import healthRouter from './routes/health';
import roomsRouter from './routes/rooms';
import { logger } from './utils/logger';

export function createApp(): Application {
  const app = express();

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: false, // Disable for WebRTC
    crossOriginEmbedderPolicy: false,
  }));

  // CORS
  app.use(cors(corsOptions));

  // Compression
  app.use(compression());

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Logging
  if (config.server.nodeEnv === 'development') {
    app.use(morgan('dev'));
  } else {
    app.use(morgan('combined', {
      stream: {
        write: (message) => logger.info(message.trim()),
      },
    }));
  }

  // Rate limiting
  app.use('/api', apiLimiter);

  // Routes
  app.use('/api/health', healthRouter);
  app.use('/api/rooms', roomsRouter);

  // Root endpoint
  app.get('/', (req, res) => {
    res.json({
      name: 'StudySync API',
      version: '1.0.0',
      status: 'running',
      endpoints: {
        health: '/api/health',
        rooms: '/api/rooms',
      },
    });
  });

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
