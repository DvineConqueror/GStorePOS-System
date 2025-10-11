import express from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { AuthSetupController } from './auth/AuthSetupController';
import { AuthLoginController } from './auth/AuthLoginController';
import { AuthProfileController } from './auth/AuthProfileController';
import { AuthSessionController } from './auth/AuthSessionController';
import { AuthPasswordController } from './auth/AuthPasswordController';
import { authenticate } from '../middleware/auth';
import { authRateLimit, refreshRateLimit, passwordResetRateLimit } from '../middleware/rateLimiter';
import { ApiResponse } from '../types';

const router = express.Router();

// Setup routes
router.post('/setup', AuthSetupController.setup);

// Registration routes
router.post('/register-cashier', AuthLoginController.registerCashier);

// Login routes
router.post('/login', authRateLimit, AuthLoginController.login);

// Profile routes
router.get('/me', authenticate, AuthProfileController.getProfile);
router.put('/profile', authenticate, AuthProfileController.updateProfile);
router.put('/change-password', authenticate, AuthProfileController.changePassword);

// Session management routes
router.post('/refresh', refreshRateLimit, AuthSessionController.refreshToken);
router.post('/logout', authenticate, AuthSessionController.logout);
router.post('/logout-all', authenticate, AuthSessionController.logoutAll);
router.get('/sessions', authenticate, AuthSessionController.getSessions);

// Password reset routes
router.post('/forgot-password', passwordResetRateLimit, AuthPasswordController.forgotPassword);
router.get('/verify-reset-token/:token', AuthPasswordController.verifyResetToken);
router.post('/reset-password/:token', passwordResetRateLimit, AuthPasswordController.resetPassword);

// Email health check
router.get('/email-health', AuthPasswordController.emailHealth);

// Admin registration route (requires authentication)
router.post('/register', authenticate, async (req, res): Promise<void> => {
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

    const user = new User({
      username,
      email,
      password,
      role: userRole,
      firstName,
      lastName,
      status: 'active', // New users are active
      isApproved: isAutoApproved,
      approvedBy: isAutoApproved ? req.user?._id : undefined,
      approvedAt: isAutoApproved ? new Date() : undefined,
      createdBy: req.user?._id,
    });

    await user.save();

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
});

export default router;