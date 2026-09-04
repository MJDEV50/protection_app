import { createClient } from 'redis';
import { logger } from '../utils/logger';

let redisClient: any;

export async function initializeRedis(): Promise<void> {
  redisClient = createClient({
    socket: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      reconnectStrategy: (retries: number) => Math.min(retries * 50, 500),
    },
    password: process.env.REDIS_PASSWORD || undefined,
  });

  redisClient.on('error', (err: any) => logger.error('Redis Client Error', err));
  redisClient.on('connect', () => logger.info('✓ Redis connected'));

  await redisClient.connect();
}

export function getRedisClient(): any {
  return redisClient;
}

export async function set(key: string, value: string): Promise<void> {
  await redisClient.set(key, value);
}

export async function get(key: string): Promise<string | null> {
  return redisClient.get(key);
}

export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
  }
}
