import { Request, Response } from 'express';
import { User } from '../models/User';
import { Product } from '../models/Product';
import SystemSettingsService from '../services/SystemSettingsService';
import NotificationService from '../services/NotificationService';
import { ApiResponse } from '../types';

export class NotificationController {
  private static notificationService = new NotificationService();
  /**
   * Get all notifications (pending approvals + low stock alerts)
   */
  static async getAllNotifications(req: Request, res: Response): Promise<void> {
    try {
      // Get pending approvals
      const pendingUsersCount = await User.countDocuments({
        isApproved: false,
        status: 'active'
      });

      const pendingUsers = await User.find({
        isApproved: false,
        status: 'active'
      })
      .select('username email firstName lastName role createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

      // Get low stock products
      const lowStockProducts = await Product.find({
        $expr: { $lte: ['$stock', '$minStock'] },
        status: 'active'
      }).select('name stock minStock sku category');

      // Check if low stock alerts are enabled
      const settings = await SystemSettingsService.getSettings();
      const lowStockAlertEnabled = settings.lowStockAlerts;

      const response = {
        success: true,
        data: {
          pendingApprovals: {
            count: pendingUsersCount,
            users: pendingUsers,
            enabled: true // Always enabled for user management
          },
          lowStockAlerts: {
            count: lowStockAlertEnabled ? lowStockProducts.length : 0,
            products: lowStockAlertEnabled ? lowStockProducts : [],
            enabled: lowStockAlertEnabled
          },
          totalNotifications: pendingUsersCount + (lowStockAlertEnabled ? lowStockProducts.length : 0)
        }
      };

      res.json(response as ApiResponse);
    } catch (error) {
      console.error('Get notifications error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while retrieving notifications.',
      } as ApiResponse);
    }
  }

  /**
   * Get pending user approvals
   */
  static async getPendingApprovals(req: Request, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 10 } = req.query;
      
      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
      
      const pendingUsers = await User.find({
        isApproved: false,
        status: 'active'
      })
      .select('username email firstName lastName role createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit as string));

      const totalCount = await User.countDocuments({
        isApproved: false,
        status: 'active'
      });

      res.json({
        success: true,
        message: 'Pending approvals retrieved successfully.',
        data: {
          users: pendingUsers,
          pagination: {
            page: parseInt(page as string),
            limit: parseInt(limit as string),
            total: totalCount,
            pages: Math.ceil(totalCount / parseInt(limit as string))
          }
        }
      } as ApiResponse);
    } catch (error) {
      console.error('Get pending approvals error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while retrieving pending approvals.',
      } as ApiResponse);
    }
  }

  /**
   * Get low stock alerts
   */
  static async getLowStockAlerts(req: Request, res: Response): Promise<void> {
    try {
      // Check if low stock alerts are enabled
      const settings = await SystemSettingsService.getSettings();
      const lowStockAlertEnabled = settings.lowStockAlerts;

      if (!lowStockAlertEnabled) {
        res.json({
          success: true,
          message: 'Low stock alerts are disabled.',
          data: {
            enabled: false,
            products: [],
            count: 0
          }
        } as ApiResponse);
        return;
      }

      const lowStockProducts = await Product.find({
        $expr: { $lte: ['$stock', '$minStock'] },
        status: 'active'
      }).select('name stock minStock sku category');

      res.json({
        success: true,
        message: 'Low stock alerts retrieved successfully.',
        data: {
          enabled: true,
          products: lowStockProducts,
          count: lowStockProducts.length
        }
      } as ApiResponse);
    } catch (error) {
      console.error('Get low stock alerts error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while retrieving low stock alerts.',
      } as ApiResponse);
    }
  }

  /**
   * Send notification
   */
  static async sendNotification(req: Request, res: Response): Promise<void> {
    try {
      const { type, target, message, data } = req.body;

      if (!type || !target || !message) {
        res.status(400).json({
          success: false,
          message: 'Type, target, and message are required.',
        } as ApiResponse);
        return;
      }

      let result = false;

      switch (type) {
        case 'user':
          result = await this.notificationService.sendUserNotification(target, type, message, data);
          break;
        case 'role':
          result = await this.notificationService.sendRoleNotification([target], type, message, data);
          break;
        case 'broadcast':
          result = await this.notificationService.sendBroadcastNotification(type, message, data);
          break;
        default:
          res.status(400).json({
            success: false,
            message: 'Invalid notification type.',
          } as ApiResponse);
          return;
      }

      if (result) {
        res.json({
          success: true,
          message: 'Notification sent successfully.',
        } as ApiResponse);
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to send notification.',
        } as ApiResponse);
      }
    } catch (error) {
      console.error('Send notification error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while sending notification.',
      } as ApiResponse);
    }
  }

  /**
   * Get notification queue status
   */
  static async getQueueStatus(req: Request, res: Response): Promise<void> {
    try {
      const status = this.notificationService.getQueueStatus();

      res.json({
        success: true,
        message: 'Queue status retrieved successfully.',
        data: status
      } as ApiResponse);
    } catch (error) {
      console.error('Get queue status error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while retrieving queue status.',
      } as ApiResponse);
    }
  }

  /**
   * Clear completed notifications
   */
  static async clearCompletedNotifications(req: Request, res: Response): Promise<void> {
    try {
      const clearedCount = this.notificationService.clearCompletedNotifications();

      res.json({
        success: true,
        message: `Cleared ${clearedCount} completed notifications.`,
        data: { clearedCount }
      } as ApiResponse);
    } catch (error) {
      console.error('Clear completed notifications error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while clearing completed notifications.',
      } as ApiResponse);
    }
  }
}
