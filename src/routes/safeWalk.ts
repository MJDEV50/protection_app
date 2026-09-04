import express from 'express';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.post('/start', authenticate, async (req, res) => {
  res.status(201).json({ data: {} });
});

export default router;
