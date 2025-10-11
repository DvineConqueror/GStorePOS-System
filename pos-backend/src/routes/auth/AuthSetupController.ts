import { Request, Response } from 'express';
import { User } from '../../models/User';
import { LoginService } from '../../services/auth/LoginService';
import { AuthService } from '../../services/auth/AuthService';
import { PasswordResetService } from '../../services/auth/PasswordResetService';
import { EmailService } from '../../services/email/EmailService';
import SystemSettingsService from '../../services/SystemSettingsService';
import NotificationService from '../../services/NotificationService';
import { ApiResponse } from '../../types';

export class AuthSetupController {
  /**
   * Setup initial admin user (Public - only works if no users exist)
   */
  static async setup(req: Request, res: Response): Promise<void> {
    try {
      // Check if any users exist
      const userCount = await User.countDocuments();
      
      if (userCount > 0) {
        res.status(403).json({
          success: false,
          message: 'Initial setup already completed. Use /register endpoint with admin authentication.',
        } as ApiResponse);
        return;
      }

      const { username, email, password, firstName, lastName } = req.body;

      // Validate required fields
      if (!username || !email || !password || !firstName || !lastName) {
        res.status(400).json({
          success: false,
          message: 'All fields are required: username, email, password, firstName, lastName',
        } as ApiResponse);
        return;
      }

      // Create initial manager user
      const user = new User({
        username,
        email,
        password,
        role: 'manager',
        firstName,
        lastName,
        status: 'active', // Initial manager is active
        isApproved: true, // Initial manager is auto-approved
        approvedBy: undefined, // System-created
        approvedAt: new Date(),
        createdBy: undefined, // System-created
      });

      await user.save();

      res.status(201).json({
        success: true,
        message: 'Initial admin user created successfully.',
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
      console.error('Setup error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during initial setup.',
      } as ApiResponse);
    }
  }
}
