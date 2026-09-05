import { Server as SocketIOServer, Socket } from 'socket.io';
import { logger } from '../utils/logger';
import { query } from '../config/database';

const activeUsers: Map<string, string> = new Map(); // userId -> socketId
const userAlerts: Map<string, string> = new Map(); // userId -> alertId
const alertGuardians: Map<string, Set<string>> = new Map(); // alertId -> set of guardianSocketIds

export function initializeSocket(io: SocketIOServer): void {
  io.on('connection', (socket: Socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    // User joins (authenticate socket with userId)
    socket.on('user:join', (userId: string) => {
      activeUsers.set(userId, socket.id);
      logger.info(`User ${userId} joined with socket ${socket.id}`);
      socket.emit('user:joined', { userId, socketId: socket.id });
    });

    // Guardian joins to watch an alert
    socket.on('alert:watch', (data: any) => {
      const { alertId, guardianId } = data;
      
      // Join socket to alert room
      socket.join(`alert:${alertId}`);
      
      // Track guardians watching this alert
      if (!alertGuardians.has(alertId)) {
        alertGuardians.set(alertId, new Set());
      }
      alertGuardians.get(alertId)?.add(socket.id);
      
      logger.info(`Guardian ${guardianId} watching alert ${alertId}`);
      socket.emit('alert:watching', { alertId, status: 'watching' });
    });

    // User sends location update during alert
    socket.on('location:send', (data: any) => {
      const { userId, alertId, latitude, longitude, accuracy } = data;
      
      logger.info(`Location update from ${userId}: ${latitude},${longitude}`);
      
      // Broadcast to all guardians watching this alert
      io.to(`alert:${alertId}`).emit('location:update', {
        userId,
        alertId,
        latitude,
        longitude,
        accuracy,
        timestamp: new Date().toISOString(),
      });
    });

    // SOS alert triggered
    socket.on('alert:trigger', (data: any) => {
      const { userId, alertId, latitude, longitude } = data;
      
      logger.info(`SOS triggered by ${userId}, alert ${alertId}`);
      
      // Store user's current alert
      userAlerts.set(userId, alertId);
      
      // Notify all connected clients of new alert
      io.emit('alert:triggered', {
        userId,
        alertId,
        latitude,
        longitude,
        timestamp: new Date().toISOString(),
      });
    });

    // Alert resolved
    socket.on('alert:resolve', (data: any) => {
      const { alertId, userId } = data;
      
      logger.info(`Alert ${alertId} resolved`);
      
      // Notify guardians watching this alert
      io.to(`alert:${alertId}`).emit('alert:resolved', {
        alertId,
        timestamp: new Date().toISOString(),
      });
      
      // Clean up
      userAlerts.delete(userId);
      alertGuardians.delete(alertId);
    });

    // Safe walk started
    socket.on('safe-walk:start', (data: any) => {
      const { userId, sessionId } = data;
      
      logger.info(`Safe walk started by ${userId}, session ${sessionId}`);
      
      // Join socket to safe walk room
      socket.join(`walk:${sessionId}`);
      
      io.to(`walk:${sessionId}`).emit('safe-walk:started', {
        userId,
        sessionId,
        timestamp: new Date().toISOString(),
      });
    });

    // Safe walk location update
    socket.on('walk:location', (data: any) => {
      const { userId, sessionId, latitude, longitude } = data;
      
      // Broadcast to all guardians watching this safe walk
      io.to(`walk:${sessionId}`).emit('walk:location', {
        userId,
        sessionId,
        latitude,
        longitude,
        timestamp: new Date().toISOString(),
      });
    });

    // Safe walk ended
    socket.on('safe-walk:end', (data: any) => {
      const { userId, sessionId } = data;
      
      logger.info(`Safe walk ended by ${userId}, session ${sessionId}`);
      
      io.to(`walk:${sessionId}`).emit('safe-walk:ended', {
        userId,
        sessionId,
        timestamp: new Date().toISOString(),
      });
      
      socket.leave(`walk:${sessionId}`);
    });

    // Get active users (for debugging)
    socket.on('users:active', () => {
      socket.emit('users:active', {
        count: activeUsers.size,
        users: Array.from(activeUsers.entries()).map(([userId, socketId]) => ({
          userId,
          socketId,
        })),
      });
    });

    // Disconnect
    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
      
      // Clean up user
      for (const [userId, socketId] of activeUsers.entries()) {
        if (socketId === socket.id) {
          activeUsers.delete(userId);
          userAlerts.delete(userId);
          break;
        }
      }
      
      // Clean up from alert guardians
      for (const [alertId, guardians] of alertGuardians.entries()) {
        guardians.delete(socket.id);
        if (guardians.size === 0) {
          alertGuardians.delete(alertId);
        }
      }
    });

    // Error handling
    socket.on('error', (error) => {
      logger.error('Socket error:', error);
    });
  });
}

export function getActiveUsersCount(): number {
  return activeUsers.size;
}
