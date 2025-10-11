import express from 'express';
import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';

export class ServerConfig {
  /**
   * Create HTTP server and Socket.IO instance
   */
  static createServer(app: express.Application): { server: any; io: SocketIOServer } {
    const server = createServer(app);
    const io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        methods: ["GET", "POST"]
      },
      pingTimeout: 60000, // 60 seconds
      pingInterval: 25000, // 25 seconds
      transports: ['websocket', 'polling']
    });

    return { server, io };
  }

  /**
   * Configure Socket.IO connection handling
   */
  static configureSocketIO(io: SocketIOServer): void {
    io.on('connection', (socket) => {
      // Join user to their role-based room for targeted notifications
      socket.on('join-role-room', (role: string) => {
        socket.join(`role-${role}`);
      });

      // Join user to their user-specific room for session termination events
      socket.on('join-user-room', (userId: string) => {
        socket.join(`user-${userId}`);
      });
    });
  }

  /**
   * Configure server timeout settings
   */
  static configureTimeouts(server: any): void {
    server.keepAliveTimeout = 65000;
    server.headersTimeout = 66000;
  }

  /**
   * Configure routes
   */
  static configureRoutes(app: express.Application): void {
    // Import routes
    const authRoutes = require('../../routes/auth');
    const productRoutes = require('../../routes/products');
    const transactionRoutes = require('../../routes/transactions');
    const userRoutes = require('../../routes/users');
    const analyticsRoutes = require('../../routes/analytics');
    const superadminRoutes = require('../../routes/superadmin');
    const databaseRoutes = require('../../routes/database');
    const notificationRoutes = require('../../routes/notifications');
    const imageRoutes = require('../../routes/images');
    const systemSettingsRoutes = require('../../routes/systemSettings');

    // API routes
    app.use('/api/v1/auth', authRoutes);
    app.use('/api/v1/products', productRoutes);
    app.use('/api/v1/transactions', transactionRoutes);
    app.use('/api/v1/users', userRoutes);
    app.use('/api/v1/analytics', analyticsRoutes);
    app.use('/api/v1/superadmin', superadminRoutes);
    app.use('/api/v1/database', databaseRoutes);
    app.use('/api/v1/notifications', notificationRoutes);
    app.use('/api/v1/images', imageRoutes);
    app.use('/api/v1/system-settings', systemSettingsRoutes);
  }

  /**
   * Configure error handling middleware
   */
  static configureErrorHandling(app: express.Application): void {
    const { errorHandler } = require('../../middleware/errorHandler');
    const { notFound } = require('../../middleware/notFound');

    app.use(notFound);
    app.use(errorHandler);
  }
}
