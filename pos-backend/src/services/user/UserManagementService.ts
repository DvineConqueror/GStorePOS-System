import { User } from '../../models/User';
import { IUser } from '../../types';
import bcrypt from 'bcryptjs';

export class UserManagementService {
  /**
   * Create new user
   */
  static async createUser(userData: {
    username: string;
    email: string;
    password: string;
    role: 'superadmin' | 'manager' | 'cashier';
    firstName: string;
    lastName: string;
  }): Promise<IUser> {
    // Check if username or email already exists
    const existingUser = await User.findOne({
      $or: [
        { username: userData.username },
        { email: userData.email.toLowerCase() }
      ]
    });

    if (existingUser) {
      throw new Error('Username or email already exists');
    }

    const user = new User({
      ...userData,
      email: userData.email.toLowerCase(),
      isApproved: userData.role === 'superadmin' // Auto-approve superadmins
    });

    await user.save();
    return user;
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
    // Check if username or email already exists (excluding current user)
    if (updateData.username || updateData.email) {
      const existingUser = await User.findOne({
        $and: [
          { _id: { $ne: userId } },
          {
            $or: [
              ...(updateData.username ? [{ username: updateData.username }] : []),
              ...(updateData.email ? [{ email: updateData.email.toLowerCase() }] : [])
            ]
          }
        ]
      });

      if (existingUser) {
        throw new Error('Username or email already exists');
      }
    }

    const user = await User.findByIdAndUpdate(
      userId,
      {
        ...updateData,
        ...(updateData.email && { email: updateData.email.toLowerCase() })
      },
      { new: true, runValidators: true }
    );

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  /**
   * Toggle user status
   */
  static async toggleUserStatus(userId: string, currentUserId?: string) {
    // Prevent admin from deactivating themselves
    if (userId === currentUserId) {
      throw new Error('You cannot deactivate your own account');
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    user.status = user.status === 'active' ? 'inactive' : 'active';
    await user.save();

    return user;
  }

  /**
   * Approve user
   */
  static async approveUser(userId: string, approvedBy: string): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    user.isApproved = true;
    user.approvedBy = approvedBy;
    user.approvedAt = new Date();
    await user.save();

    return user;
  }

  /**
   * Reject user
   */
  static async rejectUser(userId: string): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    user.isApproved = false;
    user.status = 'inactive';
    await user.save();

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
   * Update last login
   */
  static async updateLastLogin(userId: string): Promise<void> {
    await User.findByIdAndUpdate(userId, { lastLogin: new Date() });
  }
}
