import express, { Request, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { recordLocation, getLocationHistory, getLatestLocation, getAlertLocationTrail } from '../services/locationService';
import { logger } from '../utils/logger';

const router = express.Router();

// POST /api/location/update - Send location update
router.post('/update', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { latitude, longitude, accuracy, alertId } = req.body;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'Latitude and longitude required' });
    }

    const location = await recordLocation(userId, latitude, longitude, accuracy, alertId);
    res.status(201).json({ data: location });
  } catch (error: any) {
    logger.error('Location update error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/location/current - Get latest location
router.get('/current', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const location = await getLatestLocation(userId);
    res.status(200).json({ data: location });
  } catch (error: any) {
    logger.error('Get current location error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/location/history/:alertId - Get location trail for alert
router.get('/history/:alertId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { alertId } = req.params;
    const history = await getLocationHistory(alertId);
    res.status(200).json({ data: history });
  } catch (error: any) {
    logger.error('Get location history error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/location/trail/:alertId - Get full alert trail with map points
router.get('/trail/:alertId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { alertId } = req.params;
    const trail = await getAlertLocationTrail(alertId);
    res.status(200).json({ data: trail });
  } catch (error: any) {
    logger.error('Get trail error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
