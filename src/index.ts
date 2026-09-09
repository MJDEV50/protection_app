import express from 'express';
import 'express-async-errors';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { metricsCollector, getMetrics } from './middleware/metrics';
import { healthCheck } from './middleware/health';

dotenv.config();

import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import guardianRoutes from './routes/guardians';
import sosRoutes from './routes/sos';
import locationRoutes from './routes/location';
import safeWalkRoutes from './routes/safeWalk';
import contactRoutes from './routes/contacts';
import settingsRoutes from './routes/settings';
import avatarRoutes from './routes/avatars';

import { initializeSocket } from './services/socketService';
import { initializeDatabase } from './config/database';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: { origin: '*' },
});

(app as any).io = io;

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(requestLogger);
app.use(metricsCollector);

// Health & Monitoring
app.get('/health', healthCheck);
app.get('/metrics', (req, res) => res.json(getMetrics()));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/guardians', guardianRoutes);
app.use('/api/sos', sosRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/safe-walk', safeWalkRoutes);
app.use('/api/avatars', avatarRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/settings', settingsRoutes);

app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use(errorHandler);

async function start() {
  try {
    await initializeDatabase();
    initializeSocket(io);
    
    const PORT = process.env.PORT || 3000;
    httpServer.listen(PORT, () => {
      logger.info(`✅ Server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Startup failed:', error);
    process.exit(1);
  }
}

start();

export { app, httpServer, io };
