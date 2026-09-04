import { Server as SocketIOServer } from 'socket.io';
import { logger } from '../utils/logger';

export function initializeSocket(io: SocketIOServer): void {
  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);
    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });
}
