import express from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { authenticate } from '../middleware/auth';
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
      isActive: true,
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
      { expiresIn: process.env.JWT_EXPIRE || '7d' } as jwt.SignOptions
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
          isActive: user.isActive,
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
      isActive: true, // Active but not approved
      isApproved: false, // Requires manager/superadmin approval
    });

    await user.save();

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
          isActive: user.isActive,
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
      isActive: true,
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
      { expiresIn: process.env.JWT_EXPIRE || '7d' } as jwt.SignOptions
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
          isActive: user.isActive,
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
router.post('/login', async (req, res): Promise<void> => {
  try {
    const { emailOrUsername, password } = req.body;

    if (!emailOrUsername || !password) {
      res.status(400).json({
        success: false,
        message: 'Please provide email/username and password.',
      } as ApiResponse);
      return;
    }

    // Find user by email or username
    const user = await User.findOne({
      $or: [
        { email: emailOrUsername },
        { username: emailOrUsername }
      ],
      isActive: true
    }).select('+password');

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials.',
      } as ApiResponse);
      return;
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials.',
      } as ApiResponse);
      return;
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        username: user.username, 
        role: user.role 
      },
      process.env.JWT_SECRET as string,
      { expiresIn: process.env.JWT_EXPIRE || '7d' } as jwt.SignOptions
    );

    res.json({
      success: true,
      message: 'Login successful.',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          isActive: user.isActive,
          isApproved: user.isApproved,
          lastLogin: user.lastLogin,
        },
        token,
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
          isActive: user.isActive,
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
          isActive: user.isActive,
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

// @desc    Logout user (client-side token removal)
// @route   POST /api/v1/auth/logout
// @access  Private
router.post('/logout', authenticate, async (req, res): Promise<void> => {
  try {
    // In a stateless JWT system, logout is handled client-side
    // You could implement token blacklisting here if needed
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

export default router;