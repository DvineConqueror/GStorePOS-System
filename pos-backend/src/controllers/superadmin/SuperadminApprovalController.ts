import { Request, Response } from 'express';
import { User } from '../../models/User';
import { ApiResponse } from '../../types';
import { hasPermission } from '../../constants/permissions';
import NotificationService from '../../services/NotificationService';

export class SuperadminApprovalController {
  private static notificationService = new NotificationService();
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
        user.status = 'active'; // Set to active when approved
      } else {
        user.approvedBy = undefined;
        user.approvedAt = undefined;
        user.status = 'inactive'; // Set to inactive when rejected
      }

      await user.save();

      // Send email notification if user is approved
      if (approved) {
        try {
          const approver = await User.findById(req.user!._id);
          if (approver) {
            await this.notificationService.sendEmailNotification(
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

      // Emit real-time notification for user approval
      try {
        const { SocketService } = await import('../../services/SocketService');
        const approver = await User.findById(req.user!._id);
        if (approver) {
          SocketService.emitUserApproval({
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            firstName: user.firstName,
            lastName: user.lastName,
            isApproved: user.isApproved,
            status: user.status
          }, {
            id: approver._id,
            username: approver.username,
            firstName: approver.firstName,
            lastName: approver.lastName,
            role: approver.role
          });
        }
      } catch (socketError) {
        console.error('Failed to emit user approval notification:', socketError);
        // Don't fail the approval if socket notification fails
      }

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
            status: user.status,
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
            user.status = 'inactive';
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
