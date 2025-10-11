import { Request, Response } from 'express';
import { UserQueryService } from '../services/user/UserQueryService';
import { UserManagementService } from '../services/user/UserManagementService';
import { UserStatsService } from '../services/user/UserStatsService';
import { User } from '../models/User';
import { ApiResponse } from '../types';
import NotificationService from '../services/NotificationService';

export class UserController {
  /**
   * Get all users
   */
  static async getUsers(req: Request, res: Response): Promise<void> {
    try {
      const {
        page = 1,
        limit = 20,
        role,
        status,
        search,
        sort = 'createdAt',
        order = 'desc'
      } = req.query;

      const result = await UserQueryService.getUsers({
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        role: role as string,
        status: status as string,
        search: search as string,
        sort: sort as string,
        order: order as 'asc' | 'desc'
      });

      res.json({
        success: true,
        message: 'Users retrieved successfully.',
        data: result.users,
        pagination: result.pagination,
      } as ApiResponse);
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while retrieving users.',
      } as ApiResponse);
    }
  }

  /**
   * Get user statistics
   */
  static async getUserStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await UserStatsService.getUserStats();

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
  }

  /**
   * Get single user by ID
   */
  static async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const user = await UserQueryService.getUserById(req.params.id);

      res.json({
        success: true,
        message: 'User retrieved successfully.',
        data: user,
      } as ApiResponse);
    } catch (error) {
      console.error('Get user error:', error);
      if (error instanceof Error && error.message === 'User not found') {
        res.status(404).json({
          success: false,
          message: 'User not found.',
        } as ApiResponse);
      } else {
        res.status(500).json({
          success: false,
          message: 'Server error while retrieving user.',
        } as ApiResponse);
      }
    }
  }

  /**
   * Update user
   */
  static async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const { username, email, role, firstName, lastName, isActive } = req.body;
      const userId = req.params.id;

      const user = await UserManagementService.updateUser(userId, {
        username,
        email,
        role,
        firstName,
        lastName,
        isActive
      });

      res.json({
        success: true,
        message: 'User updated successfully.',
        data: user,
      } as ApiResponse);
    } catch (error) {
      console.error('Update user error:', error);
      if (error instanceof Error) {
        if (error.message === 'User not found') {
          res.status(404).json({
            success: false,
            message: 'User not found.',
          } as ApiResponse);
        } else if (error.message.includes('already taken')) {
          res.status(400).json({
            success: false,
            message: error.message,
          } as ApiResponse);
        } else {
          res.status(500).json({
            success: false,
            message: 'Server error while updating user.',
          } as ApiResponse);
        }
      } else {
        res.status(500).json({
          success: false,
          message: 'Server error while updating user.',
        } as ApiResponse);
      }
    }
  }

  /**
   * Toggle user status
   */
  static async toggleUserStatus(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.id;
      const currentUserId = req.user?._id;

      const user = await UserManagementService.toggleUserStatus(userId, currentUserId);

      // Send email notification if user is activated (approved)
      if (user.status === 'active' && user.isApproved) {
        try {
          const approver = await User.findById(currentUserId);
          
          if (approver) {
            const notificationService = new NotificationService();
            await notificationService.sendEmailNotification(
              user.email,
              'Account Approved - Grocery Store POS',
              `Your ${user.role} account has been approved by ${approver.firstName} ${approver.lastName}. You can now log in to the system.`
            );
          }
        } catch (emailError) {
          console.error('Failed to send approval notification email:', emailError);
          // Don't fail the approval if email fails
        }
      }

      res.json({
        success: true,
        message: `User ${user.status === 'active' ? 'activated' : 'deactivated'} successfully.`,
        data: user,
      } as ApiResponse);
    } catch (error) {
      console.error('Toggle user status error:', error);
      if (error instanceof Error && error.message === 'User not found') {
        res.status(404).json({
          success: false,
          message: 'User not found.',
        } as ApiResponse);
      } else if (error instanceof Error && error.message.includes('cannot deactivate')) {
        res.status(400).json({
          success: false,
          message: error.message,
        } as ApiResponse);
      } else {
        res.status(500).json({
          success: false,
          message: 'Server error while updating user status.',
        } as ApiResponse);
      }
    }
  }

  /**
   * Reset user password
   */
  static async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { newPassword } = req.body;

      if (!newPassword || newPassword.length < 6) {
        res.status(400).json({
          success: false,
          message: 'New password must be at least 6 characters long.',
        } as ApiResponse);
        return;
      }

      await UserManagementService.resetPassword(req.params.id, newPassword);

      res.json({
        success: true,
        message: 'Password reset successfully.',
      } as ApiResponse);
    } catch (error) {
      console.error('Reset password error:', error);
      if (error instanceof Error && error.message === 'User not found') {
        res.status(404).json({
          success: false,
          message: 'User not found.',
        } as ApiResponse);
      } else {
        res.status(500).json({
          success: false,
          message: 'Server error while resetting password.',
        } as ApiResponse);
      }
    }
  }
}
