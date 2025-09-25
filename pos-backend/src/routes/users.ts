import express from 'express';
import { User } from '../models/User';
import { authenticate, requireAdmin } from '../middleware/auth';
import { ApiResponse } from '../types';

const router = express.Router();

// @desc    Get all users
// @route   GET /api/v1/users
// @access  Private (Admin only)
router.get('/', authenticate, requireAdmin, async (req, res): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 20,
      role,
      isActive,
      search,
      sort = 'createdAt',
      order = 'desc'
    } = req.query;

    const filters: any = {
      role: 'cashier' // Only return cashiers, exclude admins/managers
    };

    if (isActive !== undefined) filters.isActive = isActive === 'true';
    if (search) {
      filters.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const sortOrder = order === 'desc' ? -1 : 1;
    const sortObj: any = {};
    sortObj[sort as string] = sortOrder;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const users = await User.find(filters)
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit as string));

    const total = await User.countDocuments(filters);

    res.json({
      success: true,
      message: 'Users retrieved successfully.',
      data: users,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    } as ApiResponse);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving users.',
    } as ApiResponse);
  }
});

// @desc    Get user statistics
// @route   GET /api/v1/users/stats
// @access  Private (Admin only)
router.get('/stats', authenticate, requireAdmin, async (req, res): Promise<void> => {
  try {
    console.log('Getting user stats...');
    console.log('User from req:', req.user);
    
    const totalUsers = await User.countDocuments();
    console.log('Total users:', totalUsers);
    
    const activeUsers = await User.countDocuments({ isActive: true });
    console.log('Active users:', activeUsers);
    
    const adminUsers = await User.countDocuments({ role: 'admin', isActive: true });
    console.log('Admin users:', adminUsers);
    
    const activeCashierUsers = await User.countDocuments({ role: 'cashier', isActive: true });
    console.log('Active cashier users:', activeCashierUsers);
    
    const totalCashierUsers = await User.countDocuments({ role: 'cashier' });
    console.log('Total cashier users:', totalCashierUsers);

    const stats = {
      totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
      adminUsers,
      cashierUsers: activeCashierUsers, // Keep for backward compatibility
      totalCashierUsers, // New field for total cashiers (active + inactive)
      activeCashierUsers, // New field for active cashiers only
    };
    
    console.log('Stats to return:', stats);

    res.json({
      success: true,
      message: 'User statistics retrieved successfully.',
      data: stats,
    } as ApiResponse);
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving user statistics.',
    } as ApiResponse);
  }
});

// @desc    Get single user by ID
// @route   GET /api/v1/users/:id
// @access  Private (Admin only)
router.get('/:id', authenticate, requireAdmin, async (req, res): Promise<void> => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found.',
      } as ApiResponse);
      return;
    }

    res.json({
      success: true,
      message: 'User retrieved successfully.',
      data: user,
    } as ApiResponse);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving user.',
    } as ApiResponse);
  }
});

// @desc    Update user
// @route   PUT /api/v1/users/:id
// @access  Private (Admin only)
router.put('/:id', authenticate, requireAdmin, async (req, res): Promise<void> => {
  try {
    const { username, email, role, firstName, lastName, isActive } = req.body;
    const userId = req.params.id;

    // Check if username is being changed and if it's already taken
    if (username) {
      const existingUser = await User.findOne({ 
        username, 
        _id: { $ne: userId } 
      });
      if (existingUser) {
        res.status(400).json({
          success: false,
          message: 'Username is already taken.',
        } as ApiResponse);
        return;
      }
    }

    // Check if email is being changed and if it's already taken
    if (email) {
      const existingUser = await User.findOne({ 
        email, 
        _id: { $ne: userId } 
      });
      if (existingUser) {
        res.status(400).json({
          success: false,
          message: 'Email is already taken.',
        } as ApiResponse);
        return;
      }
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { username, email, role, firstName, lastName, isActive },
      { new: true, runValidators: true }
    );

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found.',
      } as ApiResponse);
      return;
    }

    res.json({
      success: true,
      message: 'User updated successfully.',
      data: user,
    } as ApiResponse);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating user.',
    } as ApiResponse);
  }
});

// @desc    Deactivate user
// @route   DELETE /api/v1/users/:id
// @access  Private (Admin only)
router.delete('/:id', authenticate, requireAdmin, async (req, res): Promise<void> => {
  try {
    const userId = req.params.id;

    // Prevent admin from deactivating themselves
    if (userId === req.user?._id) {
      res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own account.',
      } as ApiResponse);
      return;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { isActive: false },
      { new: true }
    );

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found.',
      } as ApiResponse);
      return;
    }

    res.json({
      success: true,
      message: 'User deactivated successfully.',
      data: user,
    } as ApiResponse);
  } catch (error) {
    console.error('Deactivate user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deactivating user.',
    } as ApiResponse);
  }
});

// @desc    Reactivate user
// @route   PATCH /api/v1/users/:id/reactivate
// @access  Private (Admin only)
router.patch('/:id/reactivate', authenticate, requireAdmin, async (req, res): Promise<void> => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { new: true }
    );

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found.',
      } as ApiResponse);
      return;
    }

    res.json({
      success: true,
      message: 'User reactivated successfully.',
      data: user,
    } as ApiResponse);
  } catch (error) {
    console.error('Reactivate user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while reactivating user.',
    } as ApiResponse);
  }
});

// @desc    Reset user password (Admin only)
// @route   POST /api/v1/users/:id/reset-password
// @access  Private (Admin only)
router.post('/:id/reset-password', authenticate, requireAdmin, async (req, res): Promise<void> => {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.',
      } as ApiResponse);
      return;
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found.',
      } as ApiResponse);
      return;
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successfully.',
    } as ApiResponse);
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while resetting password.',
    } as ApiResponse);
  }
});

export default router;
