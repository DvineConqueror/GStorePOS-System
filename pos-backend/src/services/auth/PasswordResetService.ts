import crypto from 'crypto';
import { User } from '../../models/User';
import { PasswordResetToken } from '../../models/PasswordResetToken';
import { EmailService } from '../email/EmailService';
import { PasswordResetEmailTemplate } from '../email/PasswordResetEmailTemplate';
import { IUser, IPasswordResetToken } from '../../types';
import { SessionService } from './SessionService';
import { SocketService } from '../SocketService';

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
   * Create a password reset token for a user and send email via SMTP
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
        status: 'active'
      });

      if (!user) {
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

      // Send password reset email via SMTP
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
      
      const emailSent = await EmailService.sendEmail({
        to: user.email,
        subject: 'SmartGrocery Password Reset',
        html: PasswordResetEmailTemplate.generatePasswordResetEmail({
          user: {
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
          },
          resetToken: token,
          clientUrl: clientUrl,
        }),
        text: PasswordResetEmailTemplate.generatePasswordResetEmailText({
          user: {
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
          },
          resetToken: token,
          clientUrl: clientUrl,
        }),
      });

      if (!emailSent) {
        console.error('Failed to send password reset email for user:', user.email);
        return {
          success: false,
          message: 'Failed to send password reset email. Please try again later.',
        };
      }

      console.log('PASSWORD RESET EMAIL SENT:', {
        userId: user._id,
        email: user.email,
        token: token.substring(0, 8) + '...',
        expiresAt: expiresAt
      });

      return {
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.',
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

      // Select password field explicitly since it's excluded by default
      const user = await User.findById(resetToken.userId).select('+password');
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

      // Check if new password is the same as the old password
      const isSamePassword = await user.comparePassword(newPassword);
      if (isSamePassword) {
        return {
          success: false,
          message: 'New password cannot be the same as your current password. Please choose a different password.',
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

      console.log(`PASSWORD RESET: Terminating all sessions for user ${user._id}`);
      const terminatedCount = await SessionService.deactivateAllUserSessions(user._id.toString());
      console.log(`PASSWORD RESET: ${terminatedCount} sessions terminated`);

      SocketService.emitToUser(user._id.toString(), 'session_terminated', {
        type: 'password_reset',
        message: 'Your password has been reset. Please log in again with your new password.',
        timestamp: new Date().toISOString(),
      });

      return {
        success: true,
        message: 'Password has been reset successfully. All devices have been logged out. You can now log in with your new password.',
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
   * Clean up expired tokens
   */
  static async cleanupExpiredTokens(): Promise<number> {
    try {
      const result = await PasswordResetToken.cleanupExpiredTokens();
      return result.deletedCount || 0;
    } catch (error) {
      console.error('Error cleaning up expired tokens:', error);
      return 0;
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
}
