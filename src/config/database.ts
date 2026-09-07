import { Pool } from 'pg';
import { logger } from '../utils/logger';

let pool: Pool | null = null;

export async function initializeDatabase() {
  try {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      logger.warn('DATABASE_URL not set - database initialization skipped');
      return;
    }

    logger.info('Connecting to PostgreSQL via DATABASE_URL');

    pool = new Pool({
      connectionString,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    const client = await pool.connect();
    logger.info('✓ Database connection successful');
    client.release();
  } catch (error) {
    logger.error('Database connection error:', error);
    logger.warn('Continuing without database - set DATABASE_URL to enable');
  }
}

export async function query(text: string, params?: any[]) {
  if (!pool) {
    throw new Error('Database not initialized');
  }
  return await pool.query(text, params);
}

export function getPool() {
  return pool;
}
