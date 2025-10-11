import { EmailService } from '../email/EmailService';
import { SocketService } from '../SocketService';
import SystemSettingsService from '../SystemSettingsService';

export class NotificationDeliveryService {
  /**
   * Send email notification if enabled in settings
   */
  static async sendEmailNotification(
    to: string,
    subject: string,
    message: string
  ): Promise<boolean> {
    try {
      const settings = await SystemSettingsService.getSettings();
      
      if (!settings.emailNotifications) {
        console.log('Email notifications disabled in settings');
        return false;
      }

      await EmailService.sendEmail({
        to: to,
        subject: subject,
        html: message,
        text: message
      });
      
      console.log(`Email notification sent to: ${to}`);
      return true;
    } catch (error) {
      console.error('Failed to send email notification:', error);
      return false;
    }
  }

  /**
   * Send system alert notification if enabled in settings
   */
  static async sendSystemAlert(
    title: string,
    message: string,
    targetRoles: string[] = ['manager', 'superadmin'],
    data?: any
  ): Promise<boolean> {
    try {
      const settings = await SystemSettingsService.getSettings();
      
      if (!settings.systemAlerts) {
        console.log('System alerts disabled in settings');
        return false;
      }

      // Send via WebSocket to users with target roles
      await SocketService.broadcastToRoles(targetRoles, 'system_alert', {
        title,
        message,
        data,
        timestamp: new Date().toISOString()
      });

      console.log(`System alert sent to roles: ${targetRoles.join(', ')}`);
      return true;
    } catch (error) {
      console.error('Failed to send system alert:', error);
      return false;
    }
  }

  /**
   * Send real-time notification to specific user
   */
  static async sendUserNotification(
    userId: string,
    type: string,
    message: string,
    data?: any
  ): Promise<boolean> {
    try {
      await SocketService.emitToUser(userId, 'notification', {
        type,
        message,
        data,
        timestamp: new Date().toISOString()
      });

      console.log(`Notification sent to user: ${userId}`);
      return true;
    } catch (error) {
      console.error('Failed to send user notification:', error);
      return false;
    }
  }

  /**
   * Send broadcast notification to all users
   */
  static async sendBroadcastNotification(
    type: string,
    message: string,
    data?: any
  ): Promise<boolean> {
    try {
      await SocketService.broadcast('notification', {
        type,
        message,
        data,
        timestamp: new Date().toISOString()
      });

      console.log('Broadcast notification sent to all users');
      return true;
    } catch (error) {
      console.error('Failed to send broadcast notification:', error);
      return false;
    }
  }

  /**
   * Send notification to users by role
   */
  static async sendRoleNotification(
    roles: string[],
    type: string,
    message: string,
    data?: any
  ): Promise<boolean> {
    try {
      await SocketService.broadcastToRoles(roles, 'notification', {
        type,
        message,
        data,
        timestamp: new Date().toISOString()
      });

      console.log(`Role notification sent to: ${roles.join(', ')}`);
      return true;
    } catch (error) {
      console.error('Failed to send role notification:', error);
      return false;
    }
  }
}
