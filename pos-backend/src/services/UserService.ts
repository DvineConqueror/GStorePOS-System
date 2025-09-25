import { User } from '../models/User';
import { IUser } from '../types';
import bcrypt from 'bcryptjs';

export class UserService {
  /**
   * Create a new user
   */
  static async createUser(userData: {
    username: string;
    email: string;
    password: string;
    role: 'superadmin' | 'manager' | 'cashier';
    firstName: string;
    lastName: string;
  }): Promise<IUser> {
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email: userData.email }, { username: userData.username }]
    });

    if (existingUser) {
      throw new Error('User with this email or username already exists');
    }

    const user = new User(userData);
    await user.save();
    return user;
  }

  /**
   * Find user by credentials (email or username)
   */
  static async findByCredentials(emailOrUsername: string, password: string): Promise<IUser> {
    const user = await User.findOne({
      $or: [
        { email: emailOrUsername },
        { username: emailOrUsername }
      ],
      isActive: true
    }).select('+password');

    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }

    return user;
  }

  /**
   * Get all users with filtering and pagination
   */
  static async getUsers(filters: {
    page?: number;
    limit?: number;
    role?: string;
    isActive?: boolean;
    search?: string;
    sort?: string;
    order?: 'asc' | 'desc';
  }) {
    const {
      page = 1,
      limit = 20,
      role,
      isActive,
      search,
      sort = 'createdAt',
      order = 'desc'
    } = filters;

    const query: any = {
      role: 'cashier' // Only return cashiers, exclude managers/superadmins
    };

    if (isActive !== undefined) query.isActive = isActive;
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const sortOrder = order === 'desc' ? -1 : 1;
    const sortObj: any = {};
    sortObj[sort] = sortOrder;

    const skip = (page - 1) * limit;

    const users = await User.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      }
    };
  }

  /**
   * Get single user by ID
   */
  static async getUserById(id: string): Promise<IUser> {
    const user = await User.findById(id);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  /**
   * Get user statistics
   */
  static async getUserStats() {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const managerUsers = await User.countDocuments({ role: 'manager', isActive: true });
    const activeCashierUsers = await User.countDocuments({ role: 'cashier', isActive: true });
    const totalCashierUsers = await User.countDocuments({ role: 'cashier' });

    return {
      totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
      managerUsers,
      cashierUsers: activeCashierUsers, // Keep for backward compatibility
      totalCashierUsers, // New field for total cashiers (active + inactive)
      activeCashierUsers, // New field for active cashiers only
    };
  }

  /**
   * Update user
   */
  static async updateUser(userId: string, updateData: {
    username?: string;
    email?: string;
    role?: string;
    firstName?: string;
    lastName?: string;
    isActive?: boolean;
    isApproved?: boolean;
  }): Promise<IUser> {
    // Check for duplicate username/email if being updated
    if (updateData.username) {
      const existingUser = await User.findOne({ 
        username: updateData.username, 
        _id: { $ne: userId } 
      });
      if (existingUser) {
        throw new Error('Username is already taken');
      }
    }

    if (updateData.email) {
      const existingUser = await User.findOne({ 
        email: updateData.email, 
        _id: { $ne: userId } 
      });
      if (existingUser) {
        throw new Error('Email is already taken');
      }
    }

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  /**
   * Toggle user active status
   */
  static async toggleUserStatus(userId: string, currentStatus: boolean): Promise<IUser> {
    const user = await User.findByIdAndUpdate(
      userId,
      { isActive: !currentStatus },
      { new: true }
    );

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  /**
   * Reset user password
   */
  static async resetPassword(userId: string, newPassword: string): Promise<void> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    user.password = newPassword;
    await user.save();
  }

  /**
   * Update last login timestamp
   */
  static async updateLastLogin(userId: string): Promise<void> {
    await User.findByIdAndUpdate(userId, { lastLogin: new Date() });
  }

  /**
   * Approve a user
   */
  static async approveUser(userId: string, approvedBy: string): Promise<IUser> {
    const user = await User.findByIdAndUpdate(
      userId,
      {
        isApproved: true,
        approvedBy,
        approvedAt: new Date(),
      },
      { new: true }
    );

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  /**
   * Reject a user (deactivate and remove approval)
   */
  static async rejectUser(userId: string): Promise<IUser> {
    const user = await User.findByIdAndUpdate(
      userId,
      {
        isApproved: false,
        isActive: false,
        approvedBy: undefined,
        approvedAt: undefined,
      },
      { new: true }
    );

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  /**
   * Get pending approvals
   */
  static async getPendingApprovals(filters: {
    role?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const { role, page = 1, limit = 20 } = filters;

    const query: any = {
      isApproved: false,
      isActive: true,
    };

    if (role) query.role = role;

    const skip = (page - 1) * limit;

    const users = await User.find(query)
      .populate('createdBy', 'username firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get users by role with approval status
   */
  static async getUsersByRole(role: string, includeInactive: boolean = false) {
    const query: any = { role };
    
    if (!includeInactive) {
      query.isActive = true;
    }

    return await User.find(query)
      .populate('createdBy', 'username firstName lastName')
      .populate('approvedBy', 'username firstName lastName')
      .sort({ createdAt: -1 });
  }

  /**
   * Get approval statistics
   */
  static async getApprovalStats() {
    const stats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          activeUsers: { $sum: { $cond: ['$isActive', 1, 0] } },
          approvedUsers: { $sum: { $cond: ['$isApproved', 1, 0] } },
          pendingApprovals: { 
            $sum: { 
              $cond: [
                { $and: ['$isActive', { $not: '$isApproved' }] }, 
                1, 
                0
              ] 
            } 
          },
          superadminCount: { $sum: { $cond: [{ $eq: ['$role', 'superadmin'] }, 1, 0] } },
          managerCount: { $sum: { $cond: [{ $eq: ['$role', 'manager'] }, 1, 0] } },
          cashierCount: { $sum: { $cond: [{ $eq: ['$role', 'cashier'] }, 1, 0] } },
        }
      }
    ]);

    return stats[0] || {
      totalUsers: 0,
      activeUsers: 0,
      approvedUsers: 0,
      pendingApprovals: 0,
      superadminCount: 0,
      managerCount: 0,
      cashierCount: 0,
    };
  }
}
