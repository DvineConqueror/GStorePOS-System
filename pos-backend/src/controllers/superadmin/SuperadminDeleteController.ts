import { Request, Response } from 'express';
import { User } from '../../models/User';
import { ApiResponse } from '../../types';

export class SuperadminDeleteController {
  /**
   * Delete a user (soft delete - set status to 'deleted')
   */
  static async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found.',
        } as ApiResponse);
        return;
      }

      // Prevent deleting superadmin users
      if (user.role === 'superadmin') {
        res.status(400).json({
          success: false,
          message: 'Cannot delete superadmin users.',
        } as ApiResponse);
        return;
      }

      // Soft delete - set status to 'deleted'
      user.status = 'deleted';
      await user.save();

      res.json({
        success: true,
        message: 'User deleted successfully.',
        data: {
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            firstName: user.firstName,
            lastName: user.lastName,
            status: user.status,
          },
        },
      } as ApiResponse);
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while deleting user.',
      } as ApiResponse);
    }
  }

  /**
   * Bulk delete users (soft delete - set status to 'deleted')
   */
  static async bulkDeleteUsers(req: Request, res: Response): Promise<void> {
    try {
      const { userIds } = req.body;

      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        res.status(400).json({
          success: false,
          message: 'User IDs array is required.',
        } as ApiResponse);
        return;
      }

      const users = await User.find({ _id: { $in: userIds } });
      
      // Filter out superadmin users
      const deletableUsers = users.filter(user => user.role !== 'superadmin');
      const superadminUsers = users.filter(user => user.role === 'superadmin');

      if (deletableUsers.length === 0) {
        res.status(400).json({
          success: false,
          message: 'No valid users to delete.',
        } as ApiResponse);
        return;
      }

      // Soft delete - set status to 'deleted'
      const result = await User.updateMany(
        { _id: { $in: deletableUsers.map(u => u._id) } },
        { status: 'deleted' }
      );

      res.json({
        success: true,
        message: 'Bulk delete completed successfully.',
        data: {
          summary: {
            requested: userIds.length,
            successful: result.modifiedCount,
            failed: userIds.length - result.modifiedCount,
            superadminSkipped: superadminUsers.length,
          },
        },
      } as ApiResponse);
    } catch (error) {
      console.error('Bulk delete users error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while processing bulk delete.',
      } as ApiResponse);
    }
  }
}
