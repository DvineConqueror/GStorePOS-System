import express from 'express';
import { authenticate, requireManager } from '../middleware/auth';
import { NotificationService } from '../services/NotificationService';

const router = express.Router();

// @desc    Get pending approval count for notifications
// @route   GET /api/v1/notifications/pending-count
// @access  Private (Manager/Superadmin only)
router.get('/pending-count', authenticate, requireManager, async (req, res) => {
  try {
    const count = await NotificationService.getPendingApprovalCount(req.user!.role as 'superadmin' | 'manager');
    
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
    const users = await NotificationService.getPendingUsers(req.user!.role as 'superadmin' | 'manager', limit);
    
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

export default router;

