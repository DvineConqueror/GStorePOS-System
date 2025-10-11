import { SessionCleanupService } from '../../services/SessionCleanupService';
import { PasswordResetService } from '../../services/auth/PasswordResetService';
import { EmailConfigService } from '../../services/email/EmailConfigService';
import { SocketService } from '../../services/SocketService';
import { ImageService } from '../../services/ImageService';
import { AnalyticsCacheService } from '../../services/AnalyticsCacheService';
import { NotificationService } from '../../services/NotificationService';

export class ServiceInitializer {
  /**
   * Initialize all services
   */
  static async initializeServices(): Promise<void> {
    try {
      // Start session cleanup service
      SessionCleanupService.start();

      // Initialize email service
      EmailConfigService.initializeTransporter();
      console.log('Email service: SMTP transporter initialized');
      
      // Initialize analytics cache service
      AnalyticsCacheService.initialize();
      
      // Initialize notification service low stock checker
      // Note: Low stock checker will be implemented separately if needed
      
      // Start password reset token cleanup (every hour)
      setInterval(async () => {
        try {
          await PasswordResetService.cleanupExpiredTokens();
        } catch (error) {
          console.error('Error cleaning up expired password reset tokens:', error);
        }
      }, 60 * 60 * 1000); // 1 hour

      console.log('All services initialized successfully');
    } catch (error) {
      console.error('Error initializing services:', error);
      throw error;
    }
  }

  /**
   * Initialize GridFS bucket for image storage
   */
  static initializeImageStorage(): void {
    try {
      // Note: ImageService doesn't have initializeBucket method in the refactored version
      // The bucket is initialized automatically when needed
      console.log('Image storage service ready');
    } catch (error) {
      console.error('Error initializing image storage:', error);
    }
  }
}
