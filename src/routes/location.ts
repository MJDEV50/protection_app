import express from 'express';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.post('/update', authenticate, async (req, res) => {
  res.status(200).json({ message: 'Location updated' });
});

export default router;
