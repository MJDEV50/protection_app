import { query } from '../config/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

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
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    // Insert user
    const result = await query(
      `INSERT INTO users (id, email, password_hash, first_name, last_name, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING id, email, first_name, last_name`,
      [userId, email, hashedPassword, firstName, lastName]
    );

    const user = result.rows[0];
    
    // Generate tokens
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'dev-secret',
      { expiresIn: '24h' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'dev-secret',
      { expiresIn: '7d' }
    );

    return {
      user,
      accessToken,
      refreshToken,
    };
  } catch (error: any) {
    logger.error('Registration error:', error);
    throw error;
  }
}

export async function loginUser(email: string, password: string) {
  try {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      throw new Error('Invalid password');
    }

    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'dev-secret',
      { expiresIn: '24h' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'dev-secret',
      { expiresIn: '7d' }
    );

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
    logger.error('Login error:', error);
    throw error;
  }
}

export async function getUserProfile(userId: string) {
  try {
    const result = await query(
      'SELECT id, email, first_name, last_name, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    return result.rows[0];
  } catch (error: any) {
    logger.error('Get profile error:', error);
    throw error;
  }
}
