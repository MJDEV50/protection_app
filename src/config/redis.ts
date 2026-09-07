import { logger } from '../utils/logger';

let redisClient: any = null;

export async function initializeRedis() {
  logger.info('Redis initialization skipped (not required for MVP)');
  return;
}

export function getRedisClient() {
  return redisClient;
}

export function isRedisConnected() {
  return false;
}
