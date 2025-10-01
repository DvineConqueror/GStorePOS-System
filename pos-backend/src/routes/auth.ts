import express from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { AuthService } from '../services/AuthService';
import { PasswordResetService } from '../services/PasswordResetService';
import { authenticate } from '../middleware/auth';
import { authRateLimit, refreshRateLimit } from '../middleware/rateLimiter';
import { ApiResponse } from '../types';

const router = express.Router();

// @desc    Setup initial admin user (Public - only works if no users exist)
// @route   POST /api/v1/auth/setup
// @access  Public
router.post('/setup', async (req, res): Promise<void> => {
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

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        username: user.username, 
        role: user.role 
      },
      process.env.JWT_SECRET as string,
      { expiresIn: process.env.JWT_EXPIRE } as jwt.SignOptions
    );

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
        token,
      },
    } as ApiResponse);
  } catch (error) {
    console.error('Setup error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during initial setup.',
    } as ApiResponse);
  }
});

// @desc    Register a new cashier (Public - but requires admin approval)
// @route   POST /api/v1/auth/register-cashier
// @access  Public
router.post('/register-cashier', async (req, res): Promise<void> => {
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
      const { SocketService } = await import('../services/SocketService');
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
});

// @desc    Register a new user (Admin only) 
// @route   POST /api/v1/auth/register
// @access  Private (Admin)
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

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        username: user.username, 
        role: user.role 
      },
      process.env.JWT_SECRET as string,
      { expiresIn: process.env.JWT_EXPIRE } as jwt.SignOptions
    );

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
        token,
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

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
router.post('/login', authRateLimit, async (req, res): Promise<void> => {
  try {
    const { emailOrUsername, password } = req.body;

    if (!emailOrUsername || !password) {
      res.status(400).json({
        success: false,
        message: 'Please provide email/username and password.',
      } as ApiResponse);
      return;
    }

    // Get device info for session tracking
    const deviceInfo = {
      userAgent: req.get('User-Agent') || 'Unknown',
      ip: req.ip || req.connection.remoteAddress || 'Unknown',
      platform: req.get('X-Platform') || 'Unknown'
    };

    // Login using AuthService
    const result = await AuthService.loginUser(emailOrUsername, password, deviceInfo);

    if (!result) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials.',
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
        }
      },
    } as ApiResponse);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login.',
    } as ApiResponse);
  }
});

// @desc    Get current user profile
// @route   GET /api/v1/auth/me
// @access  Private
router.get('/me', authenticate, async (req, res): Promise<void> => {
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
});

// @desc    Update user profile
// @route   PUT /api/v1/auth/profile
// @access  Private
router.put('/profile', authenticate, async (req, res): Promise<void> => {
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
});

// @desc    Change password
// @route   PUT /api/v1/auth/change-password
// @access  Private
router.put('/change-password', authenticate, async (req, res): Promise<void> => {
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
});

// @desc    Refresh access token
// @route   POST /api/v1/auth/refresh
// @access  Public
router.post('/refresh', refreshRateLimit, async (req, res): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({
        success: false,
        message: 'Refresh token is required.',
      } as ApiResponse);
      return;
    }

    const result = await AuthService.refreshAccessToken(refreshToken);

    if (!result) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token.',
      } as ApiResponse);
      return;
    }

    res.json({
      success: true,
      message: 'Token refreshed successfully.',
      data: {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresIn: result.expiresIn
      },
    } as ApiResponse);
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during token refresh.',
    } as ApiResponse);
  }
});

// @desc    Logout user (proper session invalidation)
// @route   POST /api/v1/auth/logout
// @access  Private
router.post('/logout', authenticate, async (req, res): Promise<void> => {
  try {
    const accessToken = req.header('Authorization')?.replace('Bearer ', '');
    const { sessionId } = req.body;

    if (!sessionId) {
      res.status(400).json({
        success: false,
        message: 'Session ID is required.',
      } as ApiResponse);
      return;
    }

    const success = await AuthService.logoutUser(sessionId, accessToken);

    if (!success) {
      res.status(400).json({
        success: false,
        message: 'Failed to logout. Session not found.',
      } as ApiResponse);
      return;
    }

    res.json({
      success: true,
      message: 'Logged out successfully.',
    } as ApiResponse);
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during logout.',
    } as ApiResponse);
  }
});

// @desc    Logout from all devices
// @route   POST /api/v1/auth/logout-all
// @access  Private
router.post('/logout-all', authenticate, async (req, res): Promise<void> => {
  try {
    const count = await AuthService.logoutAllDevices(req.user!._id);

    res.json({
      success: true,
      message: `Logged out from ${count} devices successfully.`,
      data: { sessionsTerminated: count }
    } as ApiResponse);
  } catch (error) {
    console.error('Logout all error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during logout all.',
    } as ApiResponse);
  }
});

// @desc    Get active sessions
// @route   GET /api/v1/auth/sessions
// @access  Private
router.get('/sessions', authenticate, async (req, res): Promise<void> => {
  try {
    const sessions = AuthService.getUserSessions(req.user!._id);

    res.json({
      success: true,
      message: 'Active sessions retrieved successfully.',
      data: { sessions }
    } as ApiResponse);
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving sessions.',
    } as ApiResponse);
  }
});

// @desc    Request password reset
// @route   POST /api/v1/auth/forgot-password
// @access  Public
router.post('/forgot-password', authRateLimit, async (req, res): Promise<void> => {
  try {
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

    // Create reset token and send email
    const result = await PasswordResetService.createResetToken(email, ipAddress, userAgent);

    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        data: result.token ? { token: result.token } : undefined, // Only in development
      } as ApiResponse);
    } else {
      res.status(500).json({
        success: false,
        message: result.message,
      } as ApiResponse);
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while processing password reset request.',
    } as ApiResponse);
  }
});

// @desc    Verify password reset token
// @route   GET /api/v1/auth/verify-reset-token/:token
// @access  Public
router.get('/verify-reset-token/:token', async (req, res): Promise<void> => {
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
});

// @desc    Reset password using token
// @route   POST /api/v1/auth/reset-password/:token
// @access  Public
router.post('/reset-password/:token', authRateLimit, async (req, res): Promise<void> => {
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
});

export default router;