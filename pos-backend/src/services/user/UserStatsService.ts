import { User } from '../../models/User';

export class UserStatsService {
  /**
   * Get user statistics
   */
  static async getUserStats() {
    const [
      totalUsers,
      activeUsers,
      inactiveUsers,
      pendingApprovals,
      usersByRole
    ] = await Promise.all([
      User.countDocuments({ role: { $ne: 'superadmin' } }),
      User.countDocuments({ role: { $ne: 'superadmin' }, status: 'active' }),
      User.countDocuments({ role: { $ne: 'superadmin' }, status: 'inactive' }),
      User.countDocuments({ isApproved: false }),
      User.aggregate([
        {
          $match: { role: { $ne: 'superadmin' } }
        },
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 },
            activeCount: {
              $sum: { $cond: ['$isActive', 1, 0] }
            }
          }
        }
      ])
    ]);

    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      pendingApprovals,
      usersByRole
    };
  }

  /**
   * Get approval statistics
   */
  static async getApprovalStats() {
    const [
      totalPending,
      pendingByRole,
      recentApprovals
    ] = await Promise.all([
      User.countDocuments({ isApproved: false }),
      User.aggregate([
        {
          $match: { isApproved: false }
        },
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 }
          }
        }
      ]),
      User.find({ isApproved: true })
        .populate('approvedBy', 'username firstName lastName')
        .sort({ approvedAt: -1 })
        .limit(10)
        .select('username firstName lastName role approvedAt approvedBy')
    ]);

    return {
      totalPending,
      pendingByRole,
      recentApprovals
    };
  }
}
