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
  static async configureRoutes(app: express.Application): Promise<void> {
    try {
      // Import routes using dynamic imports to handle ES modules
      const { default: authRoutes } = await import('../../routes/auth');
      const { default: productRoutes } = await import('../../routes/products');
      const { default: transactionRoutes } = await import('../../routes/transactions');
      const { default: userRoutes } = await import('../../routes/users');
      const { default: analyticsRoutes } = await import('../../routes/analytics');
      const { default: superadminRoutes } = await import('../../routes/superadmin');
      const { default: databaseRoutes } = await import('../../routes/database');
      const { default: notificationRoutes } = await import('../../routes/notifications');
      const { default: imageRoutes } = await import('../../routes/images');
      const { default: systemSettingsRoutes } = await import('../../routes/systemSettings');

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
    } catch (error) {
      console.error('Error configuring routes:', error);
      throw error;
    }
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
