import { Request, Response } from 'express';
import { User } from '../../models/User';
import { ApiResponse } from '../../types';

export class SuperadminStatsController {
  /**
   * Get system statistics (superadmin only)
   */
  static async getSystemStats(req: Request, res: Response): Promise<void> {
    try {
      // Get overview stats (excluding superadmin)
      const stats = await User.aggregate([
        {
          $match: {
            role: { $ne: 'superadmin' }, // Exclude superadmin from counts
            status: { $ne: 'deleted' } // Exclude deleted users from counts
          }
        },
        {
          $group: {
            _id: null,
            totalUsers: { $sum: 1 },
            activeUsers: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
            approvedUsers: { $sum: { $cond: [{ $or: ['$isApproved', { $eq: ['$isApproved', null] }] }, 1, 0] } },
            pendingApprovals: { $sum: { $cond: [{ $and: [{ $or: [{ $eq: ['$isApproved', false] }, { $eq: ['$isApproved', null] }] }, { $ne: ['$status', 'deleted'] }] }, 1, 0] } },
            managerCount: { $sum: { $cond: [{ $eq: ['$role', 'manager'] }, 1, 0] } },
            cashierCount: { $sum: { $cond: [{ $eq: ['$role', 'cashier'] }, 1, 0] } },
          }
        }
      ]);

      // Get role breakdown (excluding superadmin)
      const roleStats = await User.aggregate([
        {
          $match: {
            role: { $ne: 'superadmin' }, // Exclude superadmin from role stats
            status: { $ne: 'deleted' } // Exclude deleted users from role stats
          }
        },
        {
          $group: {
            _id: '$role',
            total: { $sum: 1 },
            active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
            approved: { $sum: { $cond: [{ $or: ['$isApproved', { $eq: ['$isApproved', null] }] }, 1, 0] } },
            pending: { $sum: { $cond: [{ $and: [{ $or: [{ $eq: ['$isApproved', false] }, { $eq: ['$isApproved', null] }] }, { $ne: ['$status', 'deleted'] }] }, 1, 0] } },
          }
        }
      ]);

      const recentUsers = await User.find({ 
        role: { $ne: 'superadmin' },
        status: { $ne: 'deleted' }
      })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('username email role firstName lastName status isApproved createdAt');

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
}
