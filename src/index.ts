import express from 'express';
import 'express-async-errors';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import guardianRoutes from './routes/guardians';
import sosRoutes from './routes/sos';
import locationRoutes from './routes/location';
import safeWalkRoutes from './routes/safeWalk';
import contactRoutes from './routes/contacts';
import settingsRoutes from './routes/settings';

// Import services
import { initializeSocket } from './services/socketService';
import { initializeDatabase } from './config/database';
import { initializeRedis } from './config/redis';

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}
app.use(requestLogger);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/guardians', guardianRoutes);
app.use('/api/sos', sosRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/safe-walk', safeWalkRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/settings', settingsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler (must be last)
app.use(errorHandler);

// Initialize services
async function startServer() {
  try {
    logger.info('Initializing database...');
    await initializeDatabase();
    logger.info('✓ Database initialized');

    logger.info('Initializing Redis...');
    await initializeRedis();
    logger.info('✓ Redis initialized');

    logger.info('Initializing Socket.IO...');
    initializeSocket(io);
    logger.info('✓ Socket.IO initialized');

    const PORT = process.env.PORT || 3000;
    httpServer.listen(PORT, () => {
      logger.info(`🛡️ Refuge server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  httpServer.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

startServer();

export { app, httpServer, io };
