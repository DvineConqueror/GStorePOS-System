import crypto from 'crypto';
import { User } from '../models/User';
import { PasswordResetToken } from '../models/PasswordResetToken';
import { EmailService } from './EmailService';
import { IUser, IPasswordResetToken } from '../types';

export class PasswordResetService {
  private static readonly TOKEN_EXPIRY_MINUTES = 15;
  private static readonly TOKEN_LENGTH = 32;

  /**
   * Generate a secure random token
   */
  static generateResetToken(): string {
    return crypto.randomBytes(this.TOKEN_LENGTH).toString('hex');
  }

  /**
   * Create a password reset token for a user
   */
  static async createResetToken(
    email: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ success: boolean; message: string; token?: string }> {
    try {
      // Find user by email
      const user = await User.findOne({ 
        email: email.toLowerCase(),
        status: 'active' // Only allow active users to reset password
      });

      if (!user) {
        // Don't reveal if email exists or not for security
        return {
          success: true,
          message: 'If an account with that email exists, a password reset link has been sent.',
        };
      }

      // Invalidate any existing reset tokens for this user
      await PasswordResetToken.updateMany(
        { userId: user._id, used: false },
        { used: true, usedAt: new Date() }
      );

      // Generate new reset token
      const token = this.generateResetToken();
      const expiresAt = new Date(Date.now() + this.TOKEN_EXPIRY_MINUTES * 60 * 1000);

      // Create reset token record
      const resetToken = new PasswordResetToken({
        userId: user._id,
        token,
        expiresAt,
        ipAddress,
        userAgent,
      });

      await resetToken.save();

      // Send password reset email
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
      console.log('Password reset - CLIENT_URL:', process.env.CLIENT_URL);
      console.log('Password reset - FRONTEND_URL:', process.env.FRONTEND_URL);
      console.log('Password reset - Using clientUrl:', clientUrl);
      
      const emailSent = await EmailService.sendPasswordResetEmail({
        user,
        resetToken: token,
        clientUrl,
      });

      if (!emailSent) {
        // If email fails, clean up the token
        await PasswordResetToken.findByIdAndDelete(resetToken._id);
        return {
          success: false,
          message: 'Failed to send password reset email. Please try again later.',
        };
      }

      return {
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.',
        token: process.env.NODE_ENV === 'development' ? token : undefined, // Only return token in development
      };
    } catch (error) {
      console.error('Error creating password reset token:', error);
      return {
        success: false,
        message: 'An error occurred while processing your request. Please try again later.',
      };
    }
  }

  /**
   * Verify and get reset token
   */
  static async verifyResetToken(token: string): Promise<{
    success: boolean;
    message: string;
    user?: IUser;
    resetToken?: IPasswordResetToken;
  }> {
    try {
      const resetToken = await PasswordResetToken.findValidToken(token);

      if (!resetToken) {
        return {
          success: false,
          message: 'Invalid or expired reset token. Please request a new password reset.',
        };
      }

      // Get user details since userId is just a string reference
      const user = await User.findById(resetToken.userId);
      if (!user) {
        return {
          success: false,
          message: 'User associated with this token not found.',
        };
      }

      return {
        success: true,
        message: 'Reset token is valid.',
        user,
        resetToken,
      };
    } catch (error) {
      console.error('Error verifying reset token:', error);
      return {
        success: false,
        message: 'An error occurred while verifying the reset token.',
      };
    }
  }

  /**
   * Reset password using token
   */
  static async resetPassword(
    token: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string; user?: IUser }> {
    try {
      // Verify the reset token
      const tokenVerification = await this.verifyResetToken(token);
      
      if (!tokenVerification.success || !tokenVerification.user || !tokenVerification.resetToken) {
        return {
          success: false,
          message: tokenVerification.message,
        };
      }

      const { user, resetToken } = tokenVerification;

      // Validate new password
      if (!newPassword || newPassword.length < 6) {
        return {
          success: false,
          message: 'Password must be at least 6 characters long.',
        };
      }

      // Update user password
      user.password = newPassword;
      await user.save();

      // Invalidate the reset token
      await PasswordResetToken.invalidateToken(token);

      // Clean up expired tokens for this user
      await PasswordResetToken.updateMany(
        { userId: user._id, used: false },
        { used: true, usedAt: new Date() }
      );

      return {
        success: true,
        message: 'Password has been reset successfully. You can now log in with your new password.',
        user,
      };
    } catch (error) {
      console.error('Error resetting password:', error);
      return {
        success: false,
        message: 'An error occurred while resetting your password. Please try again.',
      };
    }
  }

  /**
   * Clean up expired tokens (should be called periodically)
   */
  static async cleanupExpiredTokens(): Promise<number> {
    try {
      const result = await PasswordResetToken.cleanupExpiredTokens();
      console.log(`Cleaned up ${result.deletedCount} expired password reset tokens`);
      return result.deletedCount || 0;
    } catch (error) {
      console.error('Error cleaning up expired tokens:', error);
      return 0;
    }
  }

  /**
   * Get reset token statistics
   */
  static async getTokenStats(): Promise<{
    totalTokens: number;
    activeTokens: number;
    expiredTokens: number;
    usedTokens: number;
  }> {
    try {
      const now = new Date();
      
      const [total, active, expired, used] = await Promise.all([
        PasswordResetToken.countDocuments(),
        PasswordResetToken.countDocuments({ used: false, expiresAt: { $gt: now } }),
        PasswordResetToken.countDocuments({ expiresAt: { $lt: now } }),
        PasswordResetToken.countDocuments({ used: true }),
      ]);

      return {
        totalTokens: total,
        activeTokens: active,
        expiredTokens: expired,
        usedTokens: used,
      };
    } catch (error) {
      console.error('Error getting token stats:', error);
      return {
        totalTokens: 0,
        activeTokens: 0,
        expiredTokens: 0,
        usedTokens: 0,
      };
    }
  }

  /**
   * Check if user has recent reset attempts (rate limiting)
   */
  static async hasRecentResetAttempts(email: string, minutes: number = 5): Promise<boolean> {
    try {
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) return false;

      const recentAttempts = await PasswordResetToken.countDocuments({
        userId: user._id,
        createdAt: { $gte: new Date(Date.now() - minutes * 60 * 1000) },
      });

      return recentAttempts > 0;
    } catch (error) {
      console.error('Error checking recent reset attempts:', error);
      return false;
    }
  }

  /**
   * Get user's recent reset attempts
   */
  static async getUserResetHistory(userId: string, limit: number = 10): Promise<IPasswordResetToken[]> {
    try {
      return await PasswordResetToken.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .select('-token'); // Don't return the actual token for security
    } catch (error) {
      console.error('Error getting user reset history:', error);
      return [];
    }
  }
}
