import express, { Request, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { registerUser, loginUser, getUserProfile } from '../services/authService';
import { logger } from '../utils/logger';

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await registerUser(email, password, firstName, lastName);
    res.status(201).json({ data: result });
  } catch (error: any) {
    logger.error('Registration error:', error);
    res.status(400).json({ error: error.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const result = await loginUser(email, password);
    res.status(200).json({ data: result });
  } catch (error: any) {
    logger.error('Login error:', error);
    res.status(401).json({ error: error.message });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await getUserProfile(userId);
    res.status(200).json({ data: user });
  } catch (error: any) {
    logger.error('Get profile error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
