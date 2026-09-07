import { Pool } from 'pg';
import { logger } from '../utils/logger';

let pool: Pool;

export async function initializeDatabase() {
  try {
    // Use DATABASE_URL from Railway (auto-injected when linked)
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error('DATABASE_URL not set - services not linked in Railway');
    }

    logger.info('Connecting to PostgreSQL via DATABASE_URL');

    pool = new Pool({
      connectionString,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    // Test connection
    const client = await pool.connect();
    logger.info('✓ Database connection successful');
    client.release();
  } catch (error) {
    logger.error('Failed to connect to PostgreSQL:', error);
    throw error;
  }
}

export async function query(text: string, params?: any[]) {
  try {
    return await pool.query(text, params);
  } catch (error) {
    logger.error('Database query error:', error);
    throw error;
  }
}

export function getPool() {
  return pool;
}
