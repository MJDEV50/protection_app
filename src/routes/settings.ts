import express from 'express';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  res.status(200).json({ data: {} });
});

export default router;
