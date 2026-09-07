import { Pool } from 'pg';
import { logger } from '../utils/logger';

let pool: Pool;

export async function initializeDatabase() {
  try {
    // Use Railway's PostgreSQL variables
    const host = process.env.PGHOST || 'localhost';
    const port = process.env.PGPORT || '5432';
    const user = process.env.PGUSER || 'postgres';
    const password = process.env.PGPASSWORD || 'postgres';
    const database = process.env.PGDATABASE || 'refuge_dev';

    pool = new Pool({
      host,
      port: parseInt(port),
      user,
      password,
      database,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
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
