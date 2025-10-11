import { NotificationDeliveryService } from './notification/NotificationDeliveryService';
import { NotificationTemplateService } from './notification/NotificationTemplateService';
import { NotificationQueueService } from './notification/NotificationQueueService';
import { User } from '../models/User';
import { Product } from '../models/Product';

// Force TypeScript refresh - Updated for AuthLoginController

interface UserRegistrationData {
  username: string;
  firstName: string;
  lastName: string;
  role: string;
  email: string;
}

interface ProductData {
  name: string;
  sku: string;
  currentStock: number;
  minStock: number;
  category: string;
}

interface OutOfStockProductData {
  name: string;
  sku: string;
  category: string;
}

interface TransactionData {
  transactionNumber: string;
  total: number;
  cashierName: string;
  paymentMethod: string;
  itemCount: number;
}

interface MaintenanceData {
  type: string;
  scheduledDate: Date;
  duration: string;
  description: string;
}

interface SecurityData {
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedUser?: string;
}

class NotificationService {
  /**
   * Send email notification if enabled in settings
   */
  async sendEmailNotification(
    to: string,
    subject: string,
    message: string
  ): Promise<boolean> {
    return NotificationDeliveryService.sendEmailNotification(to, subject, message);
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
    return NotificationDeliveryService.sendSystemAlert(
      title, 
      message, 
      targetRoles, 
      data
    );
  }

  /**
   * Send real-time notification to specific user
   */
  async sendUserNotification(
    userId: string,
    type: string,
    message: string,
    data?: any
  ): Promise<boolean> {
    return NotificationDeliveryService.sendUserNotification(
      userId, 
      type, 
      message, 
      data
    );
  }

  /**
   * Send broadcast notification to all users
   */
  async sendBroadcastNotification(
    type: string,
    message: string,
    data?: any
  ): Promise<boolean> {
    return NotificationDeliveryService.sendBroadcastNotification(
      type, 
      message, 
      data
    );
  }

  /**
   * Send notification to users by role
   */
  async sendRoleNotification(
    roles: string[],
    type: string,
    message: string,
    data?: any
  ): Promise<boolean> {
    return NotificationDeliveryService.sendRoleNotification(
      roles, 
      type, 
      message, 
      data
    );
  }

  /**
   * Queue user registration notification
   */
  async queueUserRegistrationNotification(
    userData: UserRegistrationData
  ): Promise<string> {
    return NotificationQueueService.queueUserRegistrationNotification(userData);
  }

  /**
   * Queue low stock notification
   */
  async queueLowStockNotification(
    productData: ProductData
  ): Promise<string> {
    return NotificationQueueService.queueLowStockNotification(productData);
  }

  /**
   * Queue out of stock notification
   */
  async queueOutOfStockNotification(
    productData: OutOfStockProductData
  ): Promise<string> {
    return NotificationQueueService.queueOutOfStockNotification(productData);
  }

  /**
   * Queue notification
   */
  async queueNotification(
    type: string,
    target: { type: 'user' | 'role' | 'broadcast'; value: string | string[] },
    template: { subject: string; message: string; emailMessage?: string },
    data?: any,
    priority: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    scheduledAt?: Date
  ): Promise<string> {
    return NotificationQueueService.queueNotification(
      type, 
      target, 
      template, 
      data, 
      priority, 
      scheduledAt
    );
  }

  /**
   * Get queue status
   */
  getQueueStatus(): {
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    isProcessing: boolean;
  } {
    return NotificationQueueService.getQueueStatus();
  }

  /**
   * Clear completed notifications
   */
  clearCompletedNotifications(): number {
    return NotificationQueueService.clearCompletedNotifications();
  }

  /**
   * Notify managers about new user registration
   */
  async notifyNewUserRegistration(
    userData: UserRegistrationData
  ): Promise<void> {
    try {
      // Queue notification for managers and superadmins
      await this.queueUserRegistrationNotification(userData);

      // Also send immediate email notification
      const template = NotificationTemplateService.generateUserRegistrationTemplate(userData);
      await this.sendEmailNotification(
        'admin@grocerystore.com', // This should be configurable
        template.subject,
        template.emailMessage
      );

      console.log(`New user registration notification sent for: ${userData.username}`);
    } catch (error) {
      console.error('Error sending new user registration notification:', error);
    }
  }

  /**
   * Notify about low stock products
   */
  async notifyLowStock(productId: string): Promise<void> {
    try {
      const product = await Product.findById(productId);
      if (!product) {
        console.error('Product not found for low stock notification:', productId);
        return;
      }

      const productData: ProductData = {
        name: product.name,
        sku: product.sku,
        currentStock: product.stock,
        minStock: product.minStock,
        category: product.category
      };

      await this.queueLowStockNotification(productData);
      console.log(`Low stock notification sent for product: ${product.name}`);
    } catch (error) {
      console.error('Error sending low stock notification:', error);
    }
  }

  /**
   * Notify about out of stock products
   */
  async notifyOutOfStock(productId: string): Promise<void> {
    try {
      const product = await Product.findById(productId);
      if (!product) {
        console.error('Product not found for out of stock notification:', productId);
        return;
      }

      const productData: OutOfStockProductData = {
        name: product.name,
        sku: product.sku,
        category: product.category
      };

      await this.queueOutOfStockNotification(productData);
      console.log(`Out of stock notification sent for product: ${product.name}`);
    } catch (error) {
      console.error('Error sending out of stock notification:', error);
    }
  }

  /**
   * Notify about high-value transactions
   */
  async notifyHighValueTransaction(
    transactionData: TransactionData
  ): Promise<void> {
    try {
      const template = NotificationTemplateService.generateTransactionAlertTemplate(transactionData);
      
      await this.queueNotification(
        'high_value_transaction',
        { type: 'role', value: ['manager', 'superadmin'] },
        template,
        transactionData,
        'high'
      );

      console.log(`High value transaction notification sent: ${transactionData.transactionNumber}`);
    } catch (error) {
      console.error('Error sending high value transaction notification:', error);
    }
  }

  /**
   * Notify about system maintenance
   */
  async notifySystemMaintenance(
    maintenanceData: MaintenanceData
  ): Promise<void> {
    try {
      const template = NotificationTemplateService.generateMaintenanceTemplate(maintenanceData);
      
      await this.queueNotification(
        'system_maintenance',
        { type: 'broadcast', value: [] },
        template,
        maintenanceData,
        'high',
        maintenanceData.scheduledDate
      );

      console.log(`System maintenance notification scheduled: ${maintenanceData.type}`);
    } catch (error) {
      console.error('Error scheduling system maintenance notification:', error);
    }
  }

  /**
   * Notify about security alerts
   */
  async notifySecurityAlert(securityData: SecurityData): Promise<void> {
    try {
      const template = NotificationTemplateService.generateSecurityAlertTemplate(securityData);
      
      await this.queueNotification(
        'security_alert',
        { type: 'role', value: ['manager', 'superadmin'] },
        template,
        securityData,
        securityData.severity
      );

      console.log(`Security alert notification sent: ${securityData.type}`);
    } catch (error) {
      console.error('Error sending security alert notification:', error);
    }
  }
}

export default NotificationService;