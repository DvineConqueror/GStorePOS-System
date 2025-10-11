import { Request, Response } from 'express';
import { User } from '../../models/User';
import { LoginService } from '../../services/auth/LoginService';
import SystemSettingsService from '../../services/SystemSettingsService';
import NotificationService from '../../services/NotificationService';
import { ApiResponse } from '../../types';

export class AuthLoginController {
  /**
   * Register a new cashier (Public - but requires admin approval)
   */
  static async registerCashier(req: Request, res: Response): Promise<void> {
    try {
      const { username, email, password, firstName, lastName } = req.body;

      // Validate required fields
      if (!username || !email || !password || !firstName || !lastName) {
        res.status(400).json({
          success: false,
          message: 'All fields are required: username, email, password, firstName, lastName',
        } as ApiResponse);
        return;
      }

      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [{ email }, { username }]
      });

      if (existingUser) {
        res.status(400).json({
          success: false,
          message: 'User with this email or username already exists.',
        } as ApiResponse);
        return;
      }

      // Create new cashier user (inactive by default, requires admin approval)
      const user = new User({
        username,
        email,
        password,
        role: 'cashier',
        firstName,
        lastName,
        status: 'inactive', // Inactive until approved
        isApproved: false, // Requires manager/superadmin approval
      });

      await user.save();

      // Emit real-time notification for new user registration
      try {
        const { SocketService } = await import('../../services/SocketService');
        SocketService.emitNewUserRegistration({
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          status: user.status,
          createdAt: user.createdAt
        });

        // Send notification via NotificationService
        const notificationService = new NotificationService();
        await notificationService.notifyNewUserRegistration({
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          email: user.email
        });
      } catch (socketError) {
        console.error('Failed to emit new user registration notification:', socketError);
        // Don't fail the registration if socket notification fails
      }

      res.status(201).json({
        success: true,
        message: 'Cashier account created successfully. Please wait for admin approval.',
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
      console.error('Cashier registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during registration.',
      } as ApiResponse);
    }
  }

  /**
   * Login user
   */
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { emailOrUsername, password, loginMode } = req.body;

      if (!emailOrUsername || !password) {
        res.status(400).json({
          success: false,
          message: 'Please provide email/username and password.',
        } as ApiResponse);
        return;
      }

      // Validate login mode
      if (!loginMode || !['admin', 'cashier'].includes(loginMode)) {
        res.status(400).json({
          success: false,
          message: 'Valid login mode (admin/cashier) is required.',
        } as ApiResponse);
        return;
      }

      // Get device info for session tracking
      const deviceInfo = {
        userAgent: req.get('User-Agent') || 'Unknown',
        ip: req.ip || req.connection.remoteAddress || 'Unknown',
        platform: req.get('X-Platform') || 'Unknown'
      };

      // **ROLE VALIDATION BEFORE AUTHENTICATION**
      // First, find user by email/username to check their role (without password validation)
      const user = await User.findOne({
        $or: [
          { email: emailOrUsername },
          { username: emailOrUsername }
        ]
      }).select('role username email');

      if (user) {
        // Check if login mode matches user role
        if (loginMode === 'cashier' && (user.role === 'manager' || user.role === 'superadmin')) {
          res.status(403).json({
            success: false,
            message: 'Manager/Superadmin access required. Please use Manager Mode to login.',
            data: { errorType: 'role_mismatch' }
          } as ApiResponse);
          return;
        }
        
        if (loginMode === 'admin' && user.role === 'cashier') {
          res.status(403).json({
            success: false,
            message: 'Cashier access required. Please use Cashier Mode to login.',
            data: { errorType: 'role_mismatch' }
          } as ApiResponse);
          return;
        }
      }

      // Login using AuthService
      const result = await LoginService.loginUser(emailOrUsername, password, deviceInfo);

      // Handle login failures with specific error messages
      if (!result) {
        res.status(401).json({
          success: false,
          message: 'Invalid credentials. Please check your email/username and password.',
        } as ApiResponse);
        return;
      }

      // Check maintenance mode for non-superadmin users
      const maintenanceMode = await SystemSettingsService.isMaintenanceMode();
      const maintenanceMessage = await SystemSettingsService.getMaintenanceMessage();

      // Block cashiers during maintenance mode
      if (maintenanceMode && result.user.role === 'cashier') {
        res.status(403).json({
          success: false,
          message: maintenanceMessage || 'System is currently under maintenance. Please try again later.',
          data: {
            maintenanceMode: true,
            role: result.user.role,
          }
        } as ApiResponse);
        return;
      }

      res.json({
        success: true,
        message: 'Login successful.',
        data: {
          user: {
            id: result.user._id,
            username: result.user.username,
            email: result.user.email,
            role: result.user.role,
            firstName: result.user.firstName,
            lastName: result.user.lastName,
            status: result.user.status,
            isApproved: result.user.isApproved,
            lastLogin: result.user.lastLogin,
          },
          accessToken: result.tokens.accessToken,
          refreshToken: result.tokens.refreshToken,
          expiresIn: result.tokens.expiresIn,
          session: {
            sessionId: result.session.sessionId,
            deviceInfo: result.session.deviceInfo,
            createdAt: result.session.createdAt
          },
          maintenanceMode: maintenanceMode && result.user.role === 'manager',
          maintenanceMessage: maintenanceMode && result.user.role === 'manager' ? maintenanceMessage : undefined,
        },
      } as ApiResponse);
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during login.',
      } as ApiResponse);
    }
  }
}
