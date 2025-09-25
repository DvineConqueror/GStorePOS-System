import { Request, Response } from 'express';
import { User } from '../models/User';
import { UserService } from '../services/UserService';
import { ApiResponse } from '../types';
import { hasPermission, shouldAutoApprove } from '../constants/permissions';

export class SuperadminController {
  /**
   * Get all users (superadmin can see all users)
   */
  static async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const {
        page = 1,
        limit = 20,
        role,
        isActive,
        isApproved,
        search,
        sort = 'createdAt',
        order = 'desc'
      } = req.query;

      const filters: any = {
        role: { $ne: 'superadmin' } // Exclude superadmin from all users list
      };

      if (role && role !== 'all') {
        filters.role = role; // Override with specific role filter
      }
      if (isActive !== undefined) filters.isActive = isActive === 'true';
      if (isApproved !== undefined) filters.isApproved = isApproved === 'true';
      if (search) {
        filters.$or = [
          { username: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
        ];
      }

      const sortOrder = order === 'desc' ? -1 : 1;
      const sortObj: any = {};
      sortObj[sort as string] = sortOrder;

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

      const users = await User.find(filters)
        .populate('createdBy', 'username firstName lastName')
        .populate('approvedBy', 'username firstName lastName')
        .sort(sortObj)
        .skip(skip)
        .limit(parseInt(limit as string));

      const total = await User.countDocuments(filters);

      res.json({
        success: true,
        message: 'All users retrieved successfully.',
        data: users,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          pages: Math.ceil(total / parseInt(limit as string)),
        },
      } as ApiResponse);
    } catch (error) {
      console.error('Get all users error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while retrieving users.',
      } as ApiResponse);
    }
  }

  /**
   * Get pending approvals (users waiting for approval)
   */
  static async getPendingApprovals(req: Request, res: Response): Promise<void> {
    try {
      const {
        page = 1,
        limit = 20,
        role
      } = req.query;

      const filters: any = {
        $and: [
          {
            $or: [
              { isApproved: false },
              { isApproved: { $exists: false } } // Handle users without isApproved field
            ]
          },
          { role: { $ne: 'superadmin' } } // Exclude superadmin from pending approvals
        ]
      };

      if (role && role !== 'all') {
        // Override the role filter with specific role
        filters.$and[1] = { role: role };
      }

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

      const pendingUsers = await User.find(filters)
        .populate('createdBy', 'username firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit as string));

      const total = await User.countDocuments(filters);

      res.json({
        success: true,
        message: 'Pending approvals retrieved successfully.',
        data: pendingUsers,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          pages: Math.ceil(total / parseInt(limit as string)),
        },
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
   * Approve or reject a user
   */
  static async approveUser(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { approved, reason } = req.body;

      if (typeof approved !== 'boolean') {
        res.status(400).json({
          success: false,
          message: 'Approval status must be a boolean value.',
        } as ApiResponse);
        return;
      }

      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found.',
        } as ApiResponse);
        return;
      }

      // Check if user has permission to approve this role
      if (!hasPermission(req.user!.role as any, 'approve', user.role as any)) {
        res.status(403).json({
          success: false,
          message: 'You do not have permission to approve users with this role.',
        } as ApiResponse);
        return;
      }

      // Update user approval status
      user.isApproved = approved;
      if (approved) {
        user.approvedBy = req.user!._id;
        user.approvedAt = new Date();
      } else {
        user.approvedBy = undefined;
        user.approvedAt = undefined;
        // Optionally deactivate the user if rejected
        user.isActive = false;
      }

      await user.save();

      const action = approved ? 'approved' : 'rejected';
      res.json({
        success: true,
        message: `User ${action} successfully.`,
        data: {
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            isApproved: user.isApproved,
            approvedBy: user.approvedBy,
            approvedAt: user.approvedAt,
            isActive: user.isActive,
          },
          reason: reason || null,
        },
      } as ApiResponse);
    } catch (error) {
      console.error('Approve user error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while processing approval.',
      } as ApiResponse);
    }
  }

  /**
   * Create a new manager (superadmin only)
   */
  static async createManager(req: Request, res: Response): Promise<void> {
    try {
      const { username, email, password, firstName, lastName } = req.body;

      // Validate required fields
      if (!username || !email || !password || !firstName || !lastName) {
        res.status(400).json({
          success: false,
          message: 'All fields are required: username, email, password, firstName, lastName',
        } as ApiResponse);
        return;
      }

      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [{ email }, { username }]
      });

      if (existingUser) {
        res.status(400).json({
          success: false,
          message: 'User with this email or username already exists.',
        } as ApiResponse);
        return;
      }

      // Create new manager (auto-approved when created by superadmin)
      const manager = new User({
        username,
        email,
        password,
        role: 'manager',
        firstName,
        lastName,
        isActive: true,
        isApproved: true, // Auto-approved when created by superadmin
        approvedBy: req.user!._id,
        approvedAt: new Date(),
        createdBy: req.user!._id,
      });

      await manager.save();

      res.status(201).json({
        success: true,
        message: 'Manager created successfully.',
        data: {
          user: {
            id: manager._id,
            username: manager.username,
            email: manager.email,
            role: manager.role,
            firstName: manager.firstName,
            lastName: manager.lastName,
            isActive: manager.isActive,
            isApproved: manager.isApproved,
            approvedBy: manager.approvedBy,
            approvedAt: manager.approvedAt,
            createdBy: manager.createdBy,
          },
        },
      } as ApiResponse);
    } catch (error) {
      console.error('Create manager error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while creating manager.',
      } as ApiResponse);
    }
  }

  /**
   * Get system statistics (superadmin only)
   */
  static async getSystemStats(req: Request, res: Response): Promise<void> {
    try {
      // Get overview stats (excluding superadmin)
      const stats = await User.aggregate([
        {
          $match: {
            role: { $ne: 'superadmin' } // Exclude superadmin from counts
          }
        },
        {
          $group: {
            _id: null,
            totalUsers: { $sum: 1 },
            activeUsers: { $sum: { $cond: ['$isActive', 1, 0] } },
            approvedUsers: { $sum: { $cond: [{ $or: ['$isApproved', { $eq: ['$isApproved', null] }] }, 1, 0] } },
            pendingApprovals: { $sum: { $cond: [{ $or: [{ $eq: ['$isApproved', false] }, { $eq: ['$isApproved', null] }] }, 1, 0] } },
            managerCount: { $sum: { $cond: [{ $eq: ['$role', 'manager'] }, 1, 0] } },
            cashierCount: { $sum: { $cond: [{ $eq: ['$role', 'cashier'] }, 1, 0] } },
          }
        }
      ]);

      // Get role breakdown (excluding superadmin)
      const roleStats = await User.aggregate([
        {
          $match: {
            role: { $ne: 'superadmin' } // Exclude superadmin from role stats
          }
        },
        {
          $group: {
            _id: '$role',
            total: { $sum: 1 },
            active: { $sum: { $cond: ['$isActive', 1, 0] } },
            approved: { $sum: { $cond: [{ $or: ['$isApproved', { $eq: ['$isApproved', null] }] }, 1, 0] } },
            pending: { $sum: { $cond: [{ $or: [{ $eq: ['$isApproved', false] }, { $eq: ['$isApproved', null] }] }, 1, 0] } },
          }
        }
      ]);

      const recentUsers = await User.find({ role: { $ne: 'superadmin' } })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('username email role firstName lastName isActive isApproved createdAt');

      res.json({
        success: true,
        message: 'System statistics retrieved successfully.',
        data: {
          overview: stats[0] || {
            totalUsers: 0,
            activeUsers: 0,
            approvedUsers: 0,
            pendingApprovals: 0,
            managerCount: 0,
            cashierCount: 0,
          },
          roleBreakdown: roleStats,
          recentUsers,
        },
      } as ApiResponse);
    } catch (error) {
      console.error('Get system stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while retrieving system statistics.',
      } as ApiResponse);
    }
  }

  /**
   * Bulk approve users
   */
  static async bulkApproveUsers(req: Request, res: Response): Promise<void> {
    try {
      const { userIds, approved, reason } = req.body;

      if (!Array.isArray(userIds) || userIds.length === 0) {
        res.status(400).json({
          success: false,
          message: 'User IDs array is required.',
        } as ApiResponse);
        return;
      }

      if (typeof approved !== 'boolean') {
        res.status(400).json({
          success: false,
          message: 'Approval status must be a boolean value.',
        } as ApiResponse);
        return;
      }

      const results = [];
      const errors = [];

      for (const userId of userIds) {
        try {
          const user = await User.findById(userId);
          if (!user) {
            errors.push({ userId, error: 'User not found' });
            continue;
          }

          // Check permission
          if (!hasPermission(req.user!.role as any, 'approve', user.role as any)) {
            errors.push({ userId, error: 'Insufficient permissions' });
            continue;
          }

          // Update user
          user.isApproved = approved;
          if (approved) {
            user.approvedBy = req.user!._id;
            user.approvedAt = new Date();
          } else {
            user.approvedBy = undefined;
            user.approvedAt = undefined;
            user.isActive = false;
          }

          await user.save();
          results.push({
            userId,
            username: user.username,
            role: user.role,
            approved,
          });
        } catch (error) {
          errors.push({ userId, error: error instanceof Error ? error.message : 'Unknown error' });
        }
      }

      res.json({
        success: true,
        message: `Bulk approval completed. ${results.length} users processed successfully.`,
        data: {
          results,
          errors,
          summary: {
            total: userIds.length,
            successful: results.length,
            failed: errors.length,
          },
        },
      } as ApiResponse);
    } catch (error) {
      console.error('Bulk approve users error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while processing bulk approval.',
      } as ApiResponse);
    }
  }
}
