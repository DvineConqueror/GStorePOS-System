/**
 * Session Cleanup Service
 * 
 * This service handles automatic cleanup of expired sessions and tokens
 * to prevent memory leaks and maintain system performance.
 */

import { AuthService } from './AuthService';

export class SessionCleanupService {
  private static cleanupInterval: NodeJS.Timeout | null = null;
  private static isRunning = false;

  /**
   * Start the session cleanup service
   */
  static start(): void {
    if (this.isRunning) {
      console.log('Session cleanup service is already running');
      return;
    }

    // Run cleanup every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.performCleanup();
    }, 5 * 60 * 1000);

    this.isRunning = true;
    console.log('Session cleanup service started');
  }

  /**
   * Stop the session cleanup service
   */
  static stop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.isRunning = false;
    console.log('Session cleanup service stopped');
  }

  /**
   * Perform cleanup of expired sessions
   */
  static performCleanup(): void {
    try {
      const cleanedCount = AuthService.cleanupExpiredSessions();
      
      if (cleanedCount > 0) {
        console.log(`Session cleanup: Removed ${cleanedCount} expired sessions`);
      }

      // Log session statistics
      const stats = AuthService.getSessionStats();
      console.log(`Session stats: ${stats.activeSessions} active, ${stats.expiredSessions} expired`);
    } catch (error) {
      console.error('Error during session cleanup:', error);
    }
  }

  /**
   * Get service status
   */
  static getStatus(): { isRunning: boolean; interval: number } {
    return {
      isRunning: this.isRunning,
      interval: 5 * 60 * 1000 // 5 minutes
    };
  }
}
