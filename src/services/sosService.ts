import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/database';

export async function triggerSOSAlert(
  userId: string,
  latitude: number,
  longitude: number,
  triggerType: string = 'manual'
) {
  try {
    // Create SOS alert
    const alertResult = await query(
      `INSERT INTO sos_alerts (id, user_id, latitude, longitude, trigger_type, status, started_at, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING id, user_id, status, started_at`,
      [uuidv4(), userId, latitude, longitude, triggerType, 'active']
    );

    const alert = alertResult.rows[0];

    // Get user's guardians
    const guardiansResult = await query(
      'SELECT id, name, phone, email FROM guardians WHERE user_id = $1 AND is_active = true',
      [userId]
    );

    const guardians = guardiansResult.rows;

    // Create alert_recipients records
    for (const guardian of guardians) {
      await query(
        `INSERT INTO alert_recipients (id, alert_id, guardian_id, notification_sent_at)
         VALUES ($1, $2, $3, NOW())`,
        [uuidv4(), alert.id, guardian.id]
      );
    }

    return {
      alertId: alert.id,
      status: alert.status,
      guardianCount: guardians.length,
      guardians: guardians.map(g => ({ id: g.id, name: g.name, phone: g.phone })),
    };
  } catch (error: any) {
    throw new Error(error.message);
  }
}

export async function resolveSOSAlert(alertId: string) {
  try {
    const result = await query(
      'UPDATE sos_alerts SET status = $1, ended_at = NOW() WHERE id = $2 RETURNING id, status',
      ['resolved', alertId]
    );

    if (result.rows.length === 0) {
      throw new Error('Alert not found');
    }

    return result.rows[0];
  } catch (error: any) {
    throw new Error(error.message);
  }
}

export async function getActiveAlert(userId: string) {
  try {
    const result = await query(
      'SELECT id, status, latitude, longitude, started_at FROM sos_alerts WHERE user_id = $1 AND status = $2 LIMIT 1',
      [userId, 'active']
    );

    return result.rows[0] || null;
  } catch (error: any) {
    throw new Error(error.message);
  }
}

export async function getAlertHistory(userId: string, limit: number = 10) {
  try {
    const result = await query(
      'SELECT id, status, latitude, longitude, started_at, ended_at FROM sos_alerts WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2',
      [userId, limit]
    );

    return result.rows;
  } catch (error: any) {
    throw new Error(error.message);
  }
}
