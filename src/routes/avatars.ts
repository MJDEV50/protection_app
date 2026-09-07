import express, { Request, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { generateAvatar } from '../services/avatarService';
import multer from 'multer';
import { logger } from '../utils/logger';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      cb(new Error('Only JPEG, PNG, and WebP images allowed'));
    } else {
      cb(null, true);
    }
  },
});

// POST /api/avatars/generate
router.post(
  '/generate',
  authenticate,
  upload.single('photo'),
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const { vibeDescription } = req.body;

      if (!req.file) {
        return res.status(400).json({ error: 'Photo required' });
      }

      if (!vibeDescription || vibeDescription.length === 0) {
        return res.status(400).json({ error: 'Vibe description required (max 180 characters)' });
      }

      if (vibeDescription.length > 180) {
        return res.status(400).json({ error: 'Vibe description too long (max 180 characters)' });
      }

      logger.info(`Generating avatar for user ${userId}...`);

      const result = await generateAvatar(
        req.file.buffer,
        vibeDescription,
        userId
      );

      res.status(201).json({ data: result });
    } catch (error: any) {
      logger.error('Avatar generation error:', error);
      res.status(500).json({ error: error.message || 'Avatar generation failed' });
    }
  }
);

export default router;
