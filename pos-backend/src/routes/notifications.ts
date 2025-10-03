import express from 'express';
import { authenticate, requireManager } from '../middleware/auth';
import { User } from '../models/User';
import { Product } from '../models/Product';
import SystemSettingsService from '../services/SystemSettingsService';

const router = express.Router();

// @desc    Get all notifications (pending approvals + low stock alerts)
// @route   GET /api/v1/notifications/all
// @access  Private (Manager/Superadmin only)
router.get('/all', authenticate, requireManager, async (req, res) => {
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

    res.json(response);
  } catch (error) {
    console.error('Error getting all notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while getting notifications.',
    });
  }
});

// @desc    Get pending approval count for notifications
// @route   GET /api/v1/notifications/pending-count
// @access  Private (Manager/Superadmin only)
router.get('/pending-count', authenticate, requireManager, async (req, res) => {
  try {
    const count = await User.countDocuments({
      isApproved: false,
      status: 'active'
    });
    
    res.json({
      success: true,
      data: { count },
    });
  } catch (error) {
    console.error('Error getting pending approval count:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while getting pending approval count.',
    });
  }
});

// @desc    Get pending users for notifications
// @route   GET /api/v1/notifications/pending-users
// @access  Private (Manager/Superadmin only)
router.get('/pending-users', authenticate, requireManager, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 5;
    const users = await User.find({
      isApproved: false,
      status: 'active'
    })
    .select('username email firstName lastName role createdAt')
    .sort({ createdAt: -1 })
    .limit(limit);
    
    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error('Error getting pending users:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while getting pending users.',
    });
  }
});

// @desc    Get low stock alerts count and products
// @route   GET /api/v1/notifications/low-stock
// @access  Private (Manager/Superadmin only)
router.get('/low-stock', authenticate, requireManager, async (req, res) => {
  try {
    const settings = await SystemSettingsService.getSettings();
    
    if (!settings.lowStockAlerts) {
      res.json({
        success: true,
        data: {
          count: 0,
          products: [],
          enabled: false
        }
      });
      return;
    }

    const lowStockProducts = await Product.find({
      $expr: { $lte: ['$stock', '$minStock'] },
      status: 'active'
    }).select('name stock minStock sku category').limit(10);

    res.json({
      success: true,
      data: {
        count: lowStockProducts.length,
        products: lowStockProducts,
        enabled: true
      }
    });
  } catch (error) {
    console.error('Error getting low stock alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while getting low stock alerts.',
    });
  }
});

export default router;

