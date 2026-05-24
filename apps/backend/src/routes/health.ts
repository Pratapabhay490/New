import { Router } from 'express';
import { checkDatabaseConnection } from '../config/database';
import { asyncHandler } from '../middleware/error';

const router = Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const startTime = Date.now();
    const dbHealthy = await checkDatabaseConnection();
    const responseTime = Date.now() - startTime;

    const status = dbHealthy ? 'healthy' : 'unhealthy';

    res.status(dbHealthy ? 200 : 503).json({
      success: true,
      data: {
        status,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        services: {
          database: dbHealthy ? 'up' : 'down',
          socket: 'up',
        },
        responseTime: `${responseTime}ms`,
      },
    });
  })
);

export default router;
