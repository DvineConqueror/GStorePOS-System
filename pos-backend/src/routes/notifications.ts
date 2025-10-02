import express from 'express';
import { authenticate, requireManager } from '../middleware/auth';
import { User } from '../models/User';

const router = express.Router();

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

export default router;

