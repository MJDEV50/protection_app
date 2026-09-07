import { Pool } from 'pg';
import { logger } from '../utils/logger';

let pool: Pool;

export async function initializeDatabase() {
  try {
    // Log what we're using for debugging
    const host = process.env.PGHOST || process.env.DB_HOST || 'localhost';
    const port = process.env.PGPORT || process.env.DB_PORT || '5432';
    const user = process.env.PGUSER || process.env.DB_USER || 'postgres';
    const password = process.env.PGPASSWORD || process.env.DB_PASSWORD || 'postgres';
    const database = process.env.PGDATABASE || process.env.DB_NAME || 'refuge_dev';

    logger.info(`Connecting to PostgreSQL at ${host}:${port}`);

    pool = new Pool({
      host,
      port: parseInt(port),
      user,
      password,
      database,
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
