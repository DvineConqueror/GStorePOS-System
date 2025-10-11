import { Request, Response } from 'express';
import { User } from '../../models/User';
import { AuthService } from '../../services/auth/AuthService';
import { LoginService } from '../../services/auth/LoginService';
import { PasswordResetService } from '../../services/auth/PasswordResetService';
import { EmailService } from '../../services/email/EmailService';
import { ApiResponse } from '../../types';

export class AuthProfileController {
  /**
   * Get current user profile
   */
  static async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const user = await User.findById(req.user?._id);
      
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found.',
        } as ApiResponse);
        return;
      }

      res.json({
        success: true,
        message: 'User profile retrieved successfully.',
        data: {
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            firstName: user.firstName,
            lastName: user.lastName,
            status: user.status,
            isApproved: user.isApproved,
            lastLogin: user.lastLogin,
            createdAt: user.createdAt,
          },
        },
      } as ApiResponse);
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while retrieving profile.',
      } as ApiResponse);
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const { firstName, lastName, email } = req.body;
      const userId = req.user?._id;

      // Check if email is being changed and if it's already taken
      if (email && email !== req.user?.email) {
        const existingUser = await User.findOne({ email, _id: { $ne: userId } });
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
        { firstName, lastName, email },
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
        message: 'Profile updated successfully.',
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
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while updating profile.',
      } as ApiResponse);
    }
  }

  /**
   * Change password
   */
  static async changePassword(req: Request, res: Response): Promise<void> {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user?._id;

      if (!currentPassword || !newPassword) {
        res.status(400).json({
          success: false,
          message: 'Please provide current password and new password.',
        } as ApiResponse);
        return;
      }

      const user = await User.findById(userId).select('+password');
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found.',
        } as ApiResponse);
        return;
      }

      // Verify current password
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        res.status(400).json({
          success: false,
          message: 'Current password is incorrect.',
        } as ApiResponse);
        return;
      }

      // Update password
      user.password = newPassword;
      await user.save();

      res.json({
        success: true,
        message: 'Password changed successfully.',
      } as ApiResponse);
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while changing password.',
      } as ApiResponse);
    }
  }
}
