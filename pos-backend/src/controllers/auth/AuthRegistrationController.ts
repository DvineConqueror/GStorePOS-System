import { Request, Response } from 'express';
import { User } from '../../models/User';
import { UserManagementService } from '../../services/user/UserManagementService';
import { ApiResponse } from '../../types';

export class AuthRegistrationController {
  /**
   * Register a new user (admin/manager/cashier)
   * Requires authentication and appropriate role permissions
   */
  static async registerUser(req: Request, res: Response): Promise<void> {
    try {
      // Check if user is manager or superadmin
      if (req.user?.role !== 'manager' && req.user?.role !== 'superadmin') {
        res.status(403).json({
          success: false,
          message: 'Access denied. Manager or Superadmin role required.',
        } as ApiResponse);
        return;
      }

      const { username, email, password, role, firstName, lastName } = req.body;

      // Validate required fields
      if (!username || !email || !password || !firstName || !lastName) {
        res.status(400).json({
          success: false,
          message: 'All fields are required.',
        } as ApiResponse);
        return;
      }

      // Check if trying to create superadmin and superadmin already exists
      if (role === 'superadmin') {
        const existingSuperadmin = await User.findOne({ role: 'superadmin' });
        if (existingSuperadmin) {
          res.status(400).json({
            success: false,
            message: 'Superadmin account already exists. Only one superadmin account is allowed.',
          } as ApiResponse);
          return;
        }
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

      // Create new user with approval logic
      const userRole = role || 'cashier';
      const isAutoApproved = (req.user?.role === 'superadmin' && userRole === 'manager') || 
                            (req.user?.role === 'manager' && userRole === 'cashier') ||
                            (req.user?.role === 'superadmin' && userRole === 'cashier');

      const userData = {
        username,
        email,
        password,
        role: userRole,
        firstName,
        lastName,
        status: 'active' as const,
        isApproved: isAutoApproved,
        approvedBy: isAutoApproved ? req.user?._id : undefined,
        approvedAt: isAutoApproved ? new Date() : undefined,
        createdBy: req.user?._id,
      };

      const user = await UserManagementService.createUser(userData);

      res.status(201).json({
        success: true,
        message: 'User registered successfully.',
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
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during registration.',
      } as ApiResponse);
    }
  }
}
