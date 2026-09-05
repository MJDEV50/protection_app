import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/database';

export async function startSafeWalk(
  userId: string,
  destinationLat?: number,
  destinationLng?: number
) {
  try {
    const result = await query(
      `INSERT INTO safe_walk_sessions (id, user_id, destination_latitude, destination_longitude, status, started_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING id, user_id, status, started_at`,
      [uuidv4(), userId, destinationLat || null, destinationLng || null, 'active']
    );

    return result.rows[0];
  } catch (error: any) {
    throw new Error(error.message);
  }
}

export async function endSafeWalk(sessionId: string) {
  try {
    const result = await query(
      'UPDATE safe_walk_sessions SET status = $1, ended_at = NOW() WHERE id = $2 RETURNING id, status, started_at, ended_at',
      ['completed', sessionId]
    );

    if (result.rows.length === 0) {
      throw new Error('Safe walk session not found');
    }

    const session = result.rows[0];
    
    // Calculate duration
    const startTime = new Date(session.started_at).getTime();
    const endTime = new Date(session.ended_at).getTime();
    const durationMinutes = Math.round((endTime - startTime) / 60000);

    return {
      ...session,
      durationMinutes,
    };
  } catch (error: any) {
    throw new Error(error.message);
  }
}

export async function getActiveSafeWalk(userId: string) {
  try {
    const result = await query(
      'SELECT id, user_id, destination_latitude, destination_longitude, status, started_at FROM safe_walk_sessions WHERE user_id = $1 AND status = $2',
      [userId, 'active']
    );

    return result.rows[0] || null;
  } catch (error: any) {
    throw new Error(error.message);
  }
}

export async function addSafeWalkWatcher(sessionId: string, guardianId: string) {
  try {
    const result = await query(
      `INSERT INTO safe_walk_watchers (id, session_id, guardian_id, watching_since)
       VALUES ($1, $2, $3, NOW())
       RETURNING id, guardian_id, watching_since`,
      [uuidv4(), sessionId, guardianId]
    );

    return result.rows[0];
  } catch (error: any) {
    throw new Error(error.message);
  }
}

export async function getSafeWalkWatchers(sessionId: string) {
  try {
    const result = await query(
      `SELECT sw.id, sw.guardian_id, sw.watching_since, g.name, g.phone
       FROM safe_walk_watchers sw
       JOIN guardians g ON sw.guardian_id = g.id
       WHERE sw.session_id = $1`,
      [sessionId]
    );

    return result.rows;
  } catch (error: any) {
    throw new Error(error.message);
  }
}

export async function getSafeWalkHistory(userId: string, limit: number = 20) {
  try {
    const result = await query(
      `SELECT id, destination_latitude, destination_longitude, status, started_at, ended_at
       FROM safe_walk_sessions
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, limit]
    );

    return result.rows;
  } catch (error: any) {
    throw new Error(error.message);
  }
}
