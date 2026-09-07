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
app.use(requestLogger);
app.use(metricsCollector);

// Endpoints
app.get('/health', healthCheck);
app.get('/metrics', (req, res) => res.json(getMetrics()));
app.use('/api/auth', authRoutes);

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
