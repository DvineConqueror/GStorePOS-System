import { Request, Response } from 'express';
import { PasswordResetService } from '../../services/auth/PasswordResetService';
import { EmailService } from '../../services/email/EmailService';
import { ApiResponse } from '../../types';

export class AuthPasswordController {
  /**
   * Request password reset
   */
  static async forgotPassword(req: Request, res: Response): Promise<void> {
    // Set a longer timeout for email operations
    req.setTimeout(30000); // 30 seconds
    
    try {
      console.log('FORGOT PASSWORD: Request received', {
        email: req.body?.email,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        origin: req.get('Origin')
      });

      const { email } = req.body;

      if (!email) {
        res.status(400).json({
          success: false,
          message: 'Email address is required.',
        } as ApiResponse);
        return;
      }

      // Check for recent reset attempts (rate limiting)
      const hasRecentAttempts = await PasswordResetService.hasRecentResetAttempts(email, 5);
      if (hasRecentAttempts) {
        res.status(429).json({
          success: false,
          message: 'Too many password reset attempts. Please wait 5 minutes before trying again.',
        } as ApiResponse);
        return;
      }

      // Get client info for security tracking
      const ipAddress = req.ip || req.connection.remoteAddress || 'Unknown';
      const userAgent = req.get('User-Agent') || 'Unknown';

      console.log('FORGOT PASSWORD: Starting email process for', email);

      // Create reset token and send email with timeout handling
      const result = await Promise.race([
        PasswordResetService.createResetToken(email, ipAddress, userAgent),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Password reset process timeout')), 25000)
        )
      ]) as any;

      if (result.success) {
        console.log('FORGOT PASSWORD: Success for', email);
        res.json({
          success: true,
          message: result.message,
          data: result.token ? { token: result.token } : undefined, // Only in development
        } as ApiResponse);
      } else {
        console.log('FORGOT PASSWORD: Failed for', email, result.message);
        res.status(500).json({
          success: false,
          message: result.message,
        } as ApiResponse);
      }
    } catch (error) {
      console.error('FORGOT PASSWORD ERROR:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        email: req.body?.email || 'No email provided'
      });
      
      const errorMessage = error instanceof Error && error.message.includes('timeout') 
        ? 'Email service is taking longer than expected. Please try again in a moment.'
        : 'Server error while processing password reset request.';
        
      res.status(500).json({
        success: false,
        message: errorMessage,
      } as ApiResponse);
    }
  }

  /**
   * Verify password reset token
   */
  static async verifyResetToken(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.params;

      if (!token) {
        res.status(400).json({
          success: false,
          message: 'Reset token is required.',
        } as ApiResponse);
        return;
      }

      const result = await PasswordResetService.verifyResetToken(token);

      if (result.success) {
        res.json({
          success: true,
          message: result.message,
          data: {
            user: {
              id: result.user?._id,
              email: result.user?.email,
              firstName: result.user?.firstName,
              lastName: result.user?.lastName,
            },
            expiresAt: result.resetToken?.expiresAt,
          },
        } as ApiResponse);
      } else {
        res.status(400).json({
          success: false,
          message: result.message,
        } as ApiResponse);
      }
    } catch (error) {
      console.error('Verify reset token error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while verifying reset token.',
      } as ApiResponse);
    }
  }

  /**
   * Reset password using token
   */
  static async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.params;
      const { newPassword } = req.body;

      if (!token || !newPassword) {
        res.status(400).json({
          success: false,
          message: 'Reset token and new password are required.',
        } as ApiResponse);
        return;
      }

      // Validate password strength
      if (newPassword.length < 6) {
        res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters long.',
        } as ApiResponse);
        return;
      }

      const result = await PasswordResetService.resetPassword(token, newPassword);

      if (result.success) {
        res.json({
          success: true,
          message: result.message,
          data: {
            user: {
              id: result.user?._id,
              email: result.user?.email,
              firstName: result.user?.firstName,
              lastName: result.user?.lastName,
            },
          },
        } as ApiResponse);
      } else {
        res.status(400).json({
          success: false,
          message: result.message,
        } as ApiResponse);
      }
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while resetting password.',
      } as ApiResponse);
    }
  }

  /**
   * Check email service health
   */
  static async emailHealth(req: Request, res: Response): Promise<void> {
    try {
      const emailConfig = {
        hasHost: !!process.env.EMAIL_HOST,
        hasPort: !!process.env.EMAIL_PORT,
        hasUser: !!process.env.EMAIL_USER,
        hasPass: !!process.env.EMAIL_PASS,
        hasStoreName: !!process.env.STORE_NAME,
        hasClientUrl: !!process.env.CLIENT_URL,
      };

      const isConfigured = Object.values(emailConfig).every(Boolean);
      const isInitialized = EmailService.isInitialized();

      // Test actual email connection if configured
      let connectionTest = null;
      if (isConfigured && isInitialized) {
        try {
          const testResult = await EmailService.testConnection();
          connectionTest = {
            success: testResult,
            message: testResult ? 'SMTP connection successful' : 'SMTP connection failed'
          };
        } catch (error) {
          connectionTest = {
            success: false,
            message: `SMTP connection error: ${error instanceof Error ? error.message : 'Unknown error'}`
          };
        }
      }

      res.json({
        success: true,
        data: {
          emailServiceConfigured: isConfigured,
          emailServiceInitialized: isInitialized,
          configuration: emailConfig,
          connectionTest,
          environment: process.env.NODE_ENV,
          message: isConfigured && isInitialized 
            ? 'Email service is properly configured and initialized' 
            : 'Email service configuration or initialization is incomplete'
        }
      } as ApiResponse);
    } catch (error) {
      console.error('Email health check error:', error);
      res.status(500).json({
        success: false,
        message: 'Error checking email service health',
      } as ApiResponse);
    }
  }
}
