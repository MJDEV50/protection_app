import bcryptjs from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/database';
import { generateAccessToken, generateRefreshToken } from '../middleware/auth';

export async function registerUser(
  email: string,
  password: string,
  firstName: string,
  lastName: string
) {
  try {
    // Check if user exists
    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      throw new Error('User already exists');
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Create user
    const result = await query(
      'INSERT INTO users (id, email, password_hash, first_name, last_name, is_active, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) RETURNING id, email, first_name, last_name',
      [uuidv4(), email, hashedPassword, firstName, lastName, true]
    );

    return result.rows[0];
  } catch (error: any) {
    throw new Error(error.message);
  }
}

export async function loginUser(email: string, password: string) {
  try {
    // Find user
    const result = await query(
      'SELECT id, email, password_hash, first_name, last_name FROM users WHERE email = $1 AND is_active = true',
      [email]
    );

    if (result.rows.length === 0) {
      throw new Error('Invalid email or password');
    }

    const user = result.rows[0];

    // Verify password
    const passwordMatch = await bcryptjs.compare(password, user.password_hash);
    if (!passwordMatch) {
      throw new Error('Invalid email or password');
    }

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id);

    // Return user and tokens
    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
      },
      accessToken,
      refreshToken,
    };
  } catch (error: any) {
    throw new Error(error.message);
  }
}

export async function getUserProfile(userId: string) {
  try {
    const result = await query(
      'SELECT id, email, first_name, last_name, avatar_url, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    return result.rows[0];
  } catch (error: any) {
    throw new Error(error.message);
  }
}
