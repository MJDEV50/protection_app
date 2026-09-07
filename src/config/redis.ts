import { logger } from '../utils/logger';

export async function initializeRedis() {
  logger.info('Redis disabled for MVP');
}

export function getRedisClient() {
  return null;
}
