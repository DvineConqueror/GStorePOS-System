import { Request, Response } from 'express';
import { User } from '../../models/User';
import { UserQueryService } from '../../services/user/UserQueryService';
import { UserManagementService } from '../../services/user/UserManagementService';
import { ApiResponse } from '../../types';
import { hasPermission } from '../../constants/permissions';
import NotificationService from '../../services/NotificationService';

export class SuperadminUserController {
  /**
   * Get all users (superadmin can see all users)
   */
  static async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const {
        page = 1,
        limit = 20,
        role,
        status,
        isApproved,
        search,
        sort = 'createdAt',
        order = 'desc'
      } = req.query;

      const result = await UserQueryService.getAllUsersForSuperadmin({
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        role: role as string,
        status: status as string,
        isApproved: isApproved as string,
        search: search as string,
        sort: sort as string,
        order: order as 'asc' | 'desc'
      });

      res.json({
        success: true,
        message: 'All users retrieved successfully.',
        data: result.users,
        pagination: result.pagination,
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
          { role: { $ne: 'superadmin' } }, // Exclude superadmin from pending approvals
          { status: { $ne: 'deleted' } } // Exclude deleted users from pending approvals
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
        status: 'active', // Active and approved when created by superadmin
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
            status: manager.status,
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
}
