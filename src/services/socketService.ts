import { Server as SocketIOServer, Socket } from 'socket.io';
import { logger } from '../utils/logger';

export function initializeSocket(io: SocketIOServer) {
  io.on('connection', (socket: Socket) => {
    logger.info(`User connected: ${socket.id}`);

    socket.on('user:join', (data) => {
      logger.info(`User joined: ${data.userId}`);
      socket.join(`user:${data.userId}`);
      io.emit('user:joined', { userId: data.userId, socketId: socket.id });
    });

    socket.on('alert:watch', (data) => {
      socket.join(`alert:${data.alertId}`);
      io.to(`alert:${data.alertId}`).emit('alert:watching', data);
    });

    socket.on('alert:trigger', (data) => {
      io.emit('alert:triggered', data);
    });

    socket.on('location:send', (data) => {
      io.to(`alert:${data.alertId}`).emit('location:update', data);
    });

    socket.on('safe-walk:start', (data) => {
      socket.join(`walk:${data.sessionId}`);
      io.emit('safe-walk:started', data);
    });

    socket.on('walk:location', (data) => {
      io.to(`walk:${data.sessionId}`).emit('walk:location', data);
    });

    socket.on('safe-walk:end', (data) => {
      io.to(`walk:${data.sessionId}`).emit('safe-walk:ended', data);
    });

    socket.on('disconnect', () => {
      logger.info(`User disconnected: ${socket.id}`);
    });
  });
}
