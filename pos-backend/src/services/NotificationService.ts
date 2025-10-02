import { EmailService } from './EmailService';
import { SocketService } from './SocketService';
import SystemSettingsService from './SystemSettingsService';
import { User } from '../models/User';
import { Product } from '../models/Product';

class NotificationService {
  /**
   * Send email notification if enabled in settings
   */
  async sendEmailNotification(
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
  async sendSystemAlert(
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

      const notification = {
        type: 'system_alert',
        title,
        message,
        data,
        timestamp: new Date().toISOString(),
      };

      // Send to specified roles via WebSocket
      for (const role of targetRoles) {
        SocketService.emitToRole(role, 'system_alert', notification);
      }

      console.log(`System alert sent to roles: ${targetRoles.join(', ')}`);
      return true;
    } catch (error) {
      console.error('Failed to send system alert:', error);
      return false;
    }
  }

  /**
   * Check for low stock products and send alerts if enabled
   */
  async checkAndSendLowStockAlerts(): Promise<boolean> {
    try {
      const settings = await SystemSettingsService.getSettings();
      
      if (!settings.lowStockAlerts) {
        console.log('Low stock alerts disabled in settings');
        return false;
      }

      // Find products with low stock (stock <= minStock)
      const lowStockProducts = await Product.find({
        $expr: { $lte: ['$stock', '$minStock'] },
        status: 'active'
      }).select('name stock minStock sku');

      if (lowStockProducts.length === 0) {
        return true; // No low stock products
      }

      // Get all managers and superadmins for notification
      const adminUsers = await User.find({
        role: { $in: ['manager', 'superadmin'] },
        status: 'active',
        isApproved: true
      }).select('email firstName lastName');

      const productList = lowStockProducts.map(p => 
        `• ${p.name} (SKU: ${p.sku}) - Stock: ${p.stock}/${p.minStock}`
      ).join('\n');

      const message = `The following products are running low on stock:\n\n${productList}\n\nPlease restock these items soon.`;

      // Send system alert
      await this.sendSystemAlert(
        'Low Stock Alert',
        message,
        ['manager', 'superadmin'],
        { products: lowStockProducts }
      );

      // Send email notifications to admins
      if (settings.emailNotifications && adminUsers.length > 0) {
        for (const admin of adminUsers) {
          await this.sendEmailNotification(
            admin.email,
            'Low Stock Alert - Grocery Store POS',
            message
          );
        }
      }

      console.log(`Low stock alerts sent for ${lowStockProducts.length} products`);
      return true;
    } catch (error) {
      console.error('Failed to check and send low stock alerts:', error);
      return false;
    }
  }

  /**
   * Send user registration notification
   */
  async sendUserRegistrationNotification(userData: any): Promise<boolean> {
    try {
      const settings = await SystemSettingsService.getSettings();
      
      if (!settings.systemAlerts) {
        return false;
      }

      const message = `New ${userData.role} registration: ${userData.firstName} ${userData.lastName} (${userData.email})`;

      await this.sendSystemAlert(
        'New User Registration',
        message,
        ['manager', 'superadmin'],
        { user: userData }
      );

      // Send email notification to admins
      if (settings.emailNotifications) {
        const adminUsers = await User.find({
          role: { $in: ['manager', 'superadmin'] },
          status: 'active',
          isApproved: true
        }).select('email');

        if (adminUsers.length > 0) {
          for (const admin of adminUsers) {
            await this.sendEmailNotification(
              admin.email,
              'New User Registration - Grocery Store POS',
              message
            );
          }
        }
      }

      return true;
    } catch (error) {
      console.error('Failed to send user registration notification:', error);
      return false;
    }
  }

  /**
   * Initialize periodic low stock checking
   */
  static initializeLowStockChecker(): void {
    const notificationService = new NotificationService();
    
    // Check for low stock every 6 hours
    setInterval(async () => {
      try {
        await notificationService.checkAndSendLowStockAlerts();
      } catch (error) {
        console.error('Error in low stock checker:', error);
      }
    }, 6 * 60 * 60 * 1000); // 6 hours

    console.log('Low stock checker initialized (runs every 6 hours)');
  }
}

export default new NotificationService();