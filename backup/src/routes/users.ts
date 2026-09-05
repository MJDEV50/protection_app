import express, { Request, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { getUserProfile } from '../services/authService';
import { logger } from '../utils/logger';

const router = express.Router();

// GET /api/users/me
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await getUserProfile(userId);
    res.status(200).json({ data: user });
  } catch (error: any) {
    logger.error('Get profile error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
