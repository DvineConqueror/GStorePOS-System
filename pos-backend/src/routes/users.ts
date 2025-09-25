import express from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import { UserController } from '../controllers/UserController';

const router = express.Router();

// @desc    Get all users
// @route   GET /api/v1/users
// @access  Private (Admin only)
router.get('/', authenticate, requireAdmin, UserController.getUsers);

// @desc    Get user statistics
// @route   GET /api/v1/users/stats
// @access  Private (Admin only)
router.get('/stats', authenticate, requireAdmin, UserController.getUserStats);

// @desc    Get single user by ID
// @route   GET /api/v1/users/:id
// @access  Private (Admin only)
router.get('/:id', authenticate, requireAdmin, UserController.getUserById);

// @desc    Update user
// @route   PUT /api/v1/users/:id
// @access  Private (Admin only)
router.put('/:id', authenticate, requireAdmin, UserController.updateUser);

// @desc    Deactivate user
// @route   DELETE /api/v1/users/:id
// @access  Private (Admin only)
router.delete('/:id', authenticate, requireAdmin, UserController.toggleUserStatus);

// @desc    Reactivate user
// @route   PATCH /api/v1/users/:id/reactivate
// @access  Private (Admin only)
router.patch('/:id/reactivate', authenticate, requireAdmin, UserController.toggleUserStatus);

// @desc    Reset user password (Admin only)
// @route   POST /api/v1/users/:id/reset-password
// @access  Private (Admin only)
router.post('/:id/reset-password', authenticate, requireAdmin, UserController.resetPassword);

export default router;
