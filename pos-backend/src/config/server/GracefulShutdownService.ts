import mongoose from 'mongoose';
import { Server as SocketIOServer } from 'socket.io';

export class GracefulShutdownService {
  private static healthInterval: NodeJS.Timeout | null = null;

  /**
   * Set health monitoring interval
   */
  static setHealthInterval(interval: NodeJS.Timeout): void {
    this.healthInterval = interval;
  }

  /**
   * Handle graceful shutdown
   */
  static async gracefulShutdown(signal: string, io?: SocketIOServer, serverInstance?: any): Promise<void> {
    console.log(`${signal} received. Shutting down gracefully...`);
    
    // Set a timeout to force exit if graceful shutdown takes too long
    const forceExit = setTimeout(() => {
      process.exit(1);
    }, 5000);
    
    try {
      // Stop session cleanup service
      const { SessionCleanupService } = require('../../services/SessionCleanupService');
      SessionCleanupService.stop();
      
      // Clear health monitoring interval
      if (this.healthInterval) {
        clearInterval(this.healthInterval);
        this.healthInterval = null;
      }
      
      // Close Socket.IO server
      if (io) {
        io.close();
      }
      
      // Close HTTP server
      if (serverInstance) {
        await new Promise<void>((resolve) => {
          serverInstance.close((err: any) => {
            if (err) {
              console.error('Error closing server:', err);
            } else {
              console.log('HTTP server closed');
            }
            resolve();
          });
        });
      }
      
      // Close database connection
      await mongoose.connection.close();
      console.log('Database connection closed');
      
      // Clear any caches/intervals
      clearTimeout(forceExit);
      process.exit(0);
    } catch (error) {
      console.error('Error during shutdown:', error);
      clearTimeout(forceExit);
      process.exit(1);
    }
  }

  /**
   * Setup process event handlers
   */
  static setupProcessHandlers(io?: SocketIOServer, serverInstance?: any): void {
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err: Error) => {
      console.error('Unhandled Promise Rejection:', err.message);
      process.exit(1);
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (err: Error) => {
      console.error('Uncaught Exception:', err.message);
      process.exit(1);
    });

    // Handle graceful shutdown signals
    process.on('SIGTERM', () => this.gracefulShutdown('SIGTERM', io, serverInstance));
    process.on('SIGINT', () => this.gracefulShutdown('SIGINT', io, serverInstance));
  }
}
