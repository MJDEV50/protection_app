import express, { Request, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { startSafeWalk, endSafeWalk, getActiveSafeWalk, addSafeWalkWatcher, getSafeWalkWatchers, getSafeWalkHistory } from '../services/safeWalkService';
import { logger } from '../utils/logger';

const router = express.Router();

// POST /api/safe-walk/start - Start a safe walk session
router.post('/start', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { destinationLat, destinationLng } = req.body;

    const session = await startSafeWalk(userId, destinationLat, destinationLng);
    
    // Emit via Socket.IO
    const io = (req.app as any).io;
    if (io) {
      io.emit('safe-walk:started', {
        userId,
        sessionId: session.id,
        destinationLat,
        destinationLng,
        timestamp: new Date().toISOString(),
      });
    }

    res.status(201).json({ data: session });
  } catch (error: any) {
    logger.error('Start safe walk error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/safe-walk/end - End safe walk session
router.post('/end', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID required' });
    }

    const session = await endSafeWalk(sessionId);
    
    // Emit via Socket.IO
    const io = (req.app as any).io;
    if (io) {
      io.to(`walk:${sessionId}`).emit('safe-walk:ended', {
        userId,
        sessionId,
        durationMinutes: session.durationMinutes,
        timestamp: new Date().toISOString(),
      });
    }

    res.status(200).json({ data: session });
  } catch (error: any) {
    logger.error('End safe walk error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/safe-walk/active - Get active safe walk session
router.get('/active', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const session = await getActiveSafeWalk(userId);
    res.status(200).json({ data: session });
  } catch (error: any) {
    logger.error('Get active safe walk error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/safe-walk/:id/add-watcher - Add guardian to watch safe walk
router.post('/:id/add-watcher', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { guardianId } = req.body;

    if (!guardianId) {
      return res.status(400).json({ error: 'Guardian ID required' });
    }

    const watcher = await addSafeWalkWatcher(id, guardianId);
    res.status(201).json({ data: watcher });
  } catch (error: any) {
    logger.error('Add watcher error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/safe-walk/:id/watchers - Get guardians watching safe walk
router.get('/:id/watchers', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const watchers = await getSafeWalkWatchers(id);
    res.status(200).json({ data: watchers });
  } catch (error: any) {
    logger.error('Get watchers error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/safe-walk/history - Get safe walk history
router.get('/history', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const history = await getSafeWalkHistory(userId);
    res.status(200).json({ data: history });
  } catch (error: any) {
    logger.error('Get history error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
