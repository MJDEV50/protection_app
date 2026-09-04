import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/database';

export async function addGuardian(
  userId: string,
  name: string,
  phone: string,
  email: string
) {
  try {
    const result = await query(
      `INSERT INTO guardians (id, user_id, name, phone, email, is_active, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING id, name, phone, email`,
      [uuidv4(), userId, name, phone, email, true]
    );

    return result.rows[0];
  } catch (error: any) {
    throw new Error(error.message);
  }
}

export async function getGuardians(userId: string) {
  try {
    const result = await query(
      'SELECT id, name, phone, email, is_active, created_at FROM guardians WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    return result.rows;
  } catch (error: any) {
    throw new Error(error.message);
  }
}

export async function removeGuardian(guardianId: string) {
  try {
    const result = await query(
      'UPDATE guardians SET is_active = false WHERE id = $1 RETURNING id',
      [guardianId]
    );

    if (result.rows.length === 0) {
      throw new Error('Guardian not found');
    }

    return result.rows[0];
  } catch (error: any) {
    throw new Error(error.message);
  }
}
