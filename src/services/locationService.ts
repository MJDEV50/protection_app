import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/database';

export async function recordLocation(
  userId: string,
  latitude: number,
  longitude: number,
  accuracy?: number,
  alertId?: string
) {
  try {
    const result = await query(
      `INSERT INTO location_history (id, user_id, alert_id, latitude, longitude, accuracy, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING id, latitude, longitude, accuracy, timestamp`,
      [uuidv4(), userId, alertId || null, latitude, longitude, accuracy || null]
    );

    return result.rows[0];
  } catch (error: any) {
    throw new Error(error.message);
  }
}

export async function getLocationHistory(alertId: string, limit: number = 100) {
  try {
    const result = await query(
      `SELECT id, latitude, longitude, accuracy, timestamp 
       FROM location_history 
       WHERE alert_id = $1 
       ORDER BY timestamp ASC 
       LIMIT $2`,
      [alertId, limit]
    );

    return result.rows;
  } catch (error: any) {
    throw new Error(error.message);
  }
}

export async function getLatestLocation(userId: string) {
  try {
    const result = await query(
      `SELECT latitude, longitude, accuracy, timestamp 
       FROM location_history 
       WHERE user_id = $1 
       ORDER BY timestamp DESC 
       LIMIT 1`,
      [userId]
    );

    return result.rows[0] || null;
  } catch (error: any) {
    throw new Error(error.message);
  }
}

export async function getAlertLocationTrail(alertId: string) {
  try {
    const result = await query(
      `SELECT 
        lh.latitude, lh.longitude, lh.accuracy, lh.timestamp,
        sa.started_at, sa.ended_at, sa.status
       FROM location_history lh
       JOIN sos_alerts sa ON lh.alert_id = sa.id
       WHERE lh.alert_id = $1
       ORDER BY lh.timestamp ASC`,
      [alertId]
    );

    return result.rows;
  } catch (error: any) {
    throw new Error(error.message);
  }
}
