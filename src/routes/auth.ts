import express, { Request, Response } from 'express';
import { 
  validateRegister, 
  validateLogin, 
  handleValidationErrors 
} from '../middleware/validation';
import { authenticate, AuthRequest } from '../middleware/auth';
import { registerUser, loginUser, getUserProfile } from '../services/authService';
import { logger } from '../utils/logger';

const router = express.Router();

// POST /api/auth/register
router.post(
  '/register',
  validateRegister,
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const result = await registerUser(
        req.body.email,
        req.body.password,
        req.body.firstName,
        req.body.lastName
      );
      res.status(201).json({ data: result });
    } catch (error: any) {
      logger.error('Registration error:', error);
      res.status(400).json({ error: error.message });
    }
  }
);

// POST /api/auth/login
router.post(
  '/login',
  validateLogin,
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const result = await loginUser(req.body.email, req.body.password);
      res.status(200).json({ data: result });
    } catch (error: any) {
      logger.error('Login error:', error);
      res.status(401).json({ error: error.message });
    }
  }
);

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
