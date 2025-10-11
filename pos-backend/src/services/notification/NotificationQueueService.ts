import { NotificationDeliveryService } from './NotificationDeliveryService';
import { NotificationTemplateService } from './NotificationTemplateService';
import { User } from '../../models/User';
import { Product } from '../../models/Product';

interface NotificationQueueItem {
  id: string;
  type: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  target: {
    type: 'user' | 'role' | 'broadcast';
    value: string | string[];
  };
  template: {
    subject: string;
    message: string;
    emailMessage?: string;
  };
  data?: any;
  scheduledAt?: Date;
  attempts: number;
  maxAttempts: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

export class NotificationQueueService {
  private static queue: NotificationQueueItem[] = [];
  private static processing = false;

  /**
   * Add notification to queue
   */
  static async queueNotification(
    type: string,
    target: { type: 'user' | 'role' | 'broadcast'; value: string | string[] },
    template: { subject: string; message: string; emailMessage?: string },
    data?: any,
    priority: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    scheduledAt?: Date
  ): Promise<string> {
    const notificationId = this.generateNotificationId();
    
    const queueItem: NotificationQueueItem = {
      id: notificationId,
      type,
      priority,
      target,
      template,
      data,
      scheduledAt: scheduledAt || new Date(),
      attempts: 0,
      maxAttempts: 3,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.queue.push(queueItem);
    
    // Sort queue by priority and scheduled time
    this.queue.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority];
      const bPriority = priorityOrder[b.priority];
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      return a.scheduledAt!.getTime() - b.scheduledAt!.getTime();
    });

    console.log(`Notification queued: ${notificationId} (${type})`);
    
    // Start processing if not already running
    if (!this.processing) {
      this.processQueue();
    }

    return notificationId;
  }

  /**
   * Process notification queue
   */
  private static async processQueue(): Promise<void> {
    if (this.processing) return;
    
    this.processing = true;
    console.log('Starting notification queue processing...');

    while (this.queue.length > 0) {
      const notification = this.queue.shift();
      if (!notification) break;

      // Check if notification is scheduled for future
      if (notification.scheduledAt! > new Date()) {
        this.queue.unshift(notification); // Put back at front
        await this.sleep(1000); // Wait 1 second
        continue;
      }

      try {
        notification.status = 'processing';
        notification.attempts++;

        let success = false;

        // Send notification based on target type
        switch (notification.target.type) {
          case 'user':
            success = await NotificationDeliveryService.sendUserNotification(
              notification.target.value as string,
              notification.type,
              notification.template.message,
              notification.data
            );
            break;

          case 'role':
            success = await NotificationDeliveryService.sendRoleNotification(
              notification.target.value as string[],
              notification.type,
              notification.template.message,
              notification.data
            );
            break;

          case 'broadcast':
            success = await NotificationDeliveryService.sendBroadcastNotification(
              notification.type,
              notification.template.message,
              notification.data
            );
            break;
        }

        if (success) {
          notification.status = 'completed';
          console.log(`Notification sent successfully: ${notification.id}`);
        } else {
          throw new Error('Notification delivery failed');
        }

      } catch (error) {
        console.error(`Notification failed (attempt ${notification.attempts}):`, error);
        
        if (notification.attempts >= notification.maxAttempts) {
          notification.status = 'failed';
          console.error(`Notification permanently failed: ${notification.id}`);
        } else {
          notification.status = 'pending';
          notification.scheduledAt = new Date(Date.now() + (notification.attempts * 60000)); // Exponential backoff
          this.queue.unshift(notification); // Put back for retry
        }
      }

      notification.updatedAt = new Date();
      
      // Small delay between notifications
      await this.sleep(100);
    }

    this.processing = false;
    console.log('Notification queue processing completed');
  }

  /**
   * Queue user registration notification
   */
  static async queueUserRegistrationNotification(userData: {
    username: string;
    firstName: string;
    lastName: string;
    role: string;
    email: string;
  }): Promise<string> {
    const template = NotificationTemplateService.generateUserRegistrationTemplate(userData);
    
    return this.queueNotification(
      'user_registration',
      { type: 'role', value: ['manager', 'superadmin'] },
      template,
      userData,
      'medium'
    );
  }

  /**
   * Queue low stock notification
   */
  static async queueLowStockNotification(productData: {
    name: string;
    sku: string;
    currentStock: number;
    minStock: number;
    category: string;
  }): Promise<string> {
    const template = NotificationTemplateService.generateLowStockTemplate(productData);
    
    return this.queueNotification(
      'low_stock',
      { type: 'role', value: ['manager', 'superadmin'] },
      template,
      productData,
      'high'
    );
  }

  /**
   * Queue out of stock notification
   */
  static async queueOutOfStockNotification(productData: {
    name: string;
    sku: string;
    category: string;
  }): Promise<string> {
    const template = NotificationTemplateService.generateOutOfStockTemplate(productData);
    
    return this.queueNotification(
      'out_of_stock',
      { type: 'role', value: ['manager', 'superadmin'] },
      template,
      productData,
      'critical'
    );
  }

  /**
   * Get queue status
   */
  static getQueueStatus(): {
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    isProcessing: boolean;
  } {
    const status = {
      total: this.queue.length,
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      isProcessing: this.processing
    };

    for (const notification of this.queue) {
      switch (notification.status) {
        case 'pending':
          status.pending++;
          break;
        case 'processing':
          status.processing++;
          break;
        case 'completed':
          status.completed++;
          break;
        case 'failed':
          status.failed++;
          break;
      }
    }

    return status;
  }

  /**
   * Clear completed notifications
   */
  static clearCompletedNotifications(): number {
    const initialLength = this.queue.length;
    this.queue = this.queue.filter(notification => notification.status !== 'completed');
    const clearedCount = initialLength - this.queue.length;
    
    console.log(`Cleared ${clearedCount} completed notifications`);
    return clearedCount;
  }

  /**
   * Generate unique notification ID
   */
  private static generateNotificationId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Sleep utility
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
