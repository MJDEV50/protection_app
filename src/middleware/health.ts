import { Request, Response } from 'express';
import { query } from '../config/database';
import { getRedisClient } from '../config/redis';
import { logger } from '../utils/logger';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  database: 'ok' | 'error';
  redis: 'ok' | 'error';
  uptime: number;
}

export async function healthCheck(req: Request, res: Response) {
  try {
    const health: HealthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'ok',
      redis: 'ok',
      uptime: process.uptime(),
    };

    // Check database
    try {
      await query('SELECT NOW()');
    } catch (error) {
      logger.error('Database health check failed:', error);
      health.database = 'error';
      health.status = 'degraded';
    }

    // Check Redis
    try {
      const redisClient = getRedisClient();
      await redisClient.ping();
    } catch (error) {
      logger.error('Redis health check failed:', error);
      health.redis = 'error';
      health.status = 'degraded';
    }

    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    logger.error('Health check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
    });
  }
}

export async function readinessCheck(req: Request, res: Response) {
  try {
    // Check if app is ready to receive traffic
    await query('SELECT NOW()');
    res.status(200).json({ ready: true });
  } catch (error) {
    res.status(503).json({ ready: false, error: 'Not ready' });
  }
}

export async function livenessCheck(req: Request, res: Response) {
  res.status(200).json({ alive: true });
}
