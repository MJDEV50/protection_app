import express, { Request, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { addGuardian, getGuardians, removeGuardian } from '../services/guardianService';
import { logger } from '../utils/logger';

const router = express.Router();

// POST /api/guardians - Add guardian
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { name, phone, email } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ error: 'Name and phone required' });
    }

    const guardian = await addGuardian(userId, name, phone, email || '');
    res.status(201).json({ data: guardian });
  } catch (error: any) {
    logger.error('Add guardian error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/guardians - List guardians
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const guardians = await getGuardians(userId);
    res.status(200).json({ data: guardians });
  } catch (error: any) {
    logger.error('Get guardians error:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/guardians/:id - Remove guardian
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await removeGuardian(id);
    res.status(200).json({ message: 'Guardian removed' });
  } catch (error: any) {
    logger.error('Remove guardian error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
