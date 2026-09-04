import express, { Request, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { triggerSOSAlert, resolveSOSAlert, getActiveAlert, getAlertHistory } from '../services/sosService';
import { logger } from '../utils/logger';

const router = express.Router();

// POST /api/sos/trigger - Trigger emergency alert
router.post('/trigger', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { latitude, longitude, triggerType } = req.body;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'Latitude and longitude required' });
    }

    const alert = await triggerSOSAlert(userId, latitude, longitude, triggerType || 'manual');
    res.status(201).json({ data: alert });
  } catch (error: any) {
    logger.error('SOS trigger error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/sos/active - Get active alert
router.get('/active', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const alert = await getActiveAlert(userId);
    res.status(200).json({ data: alert });
  } catch (error: any) {
    logger.error('Get active alert error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/sos/:id/resolve - Resolve alert
router.post('/:id/resolve', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const alert = await resolveSOSAlert(id);
    res.status(200).json({ data: alert });
  } catch (error: any) {
    logger.error('Resolve alert error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/sos/history - Get alert history
router.get('/history', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const history = await getAlertHistory(userId);
    res.status(200).json({ data: history });
  } catch (error: any) {
    logger.error('Get history error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
