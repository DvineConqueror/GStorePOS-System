import express from 'express';
import { authenticate, requireManager } from '../middleware/auth';
import { UserController } from '../controllers/UserController';

const router = express.Router();

// @desc    Get all users (cashiers only for managers)
// @route   GET /api/v1/users
// @access  Private (Manager/Superadmin only)
router.get('/', authenticate, requireManager, UserController.getUsers);

// @desc    Get user statistics
// @route   GET /api/v1/users/stats
// @access  Private (Manager/Superadmin only)
router.get('/stats', authenticate, requireManager, UserController.getUserStats);

// @desc    Get single user by ID
// @route   GET /api/v1/users/:id
// @access  Private (Manager/Superadmin only)
router.get('/:id', authenticate, requireManager, UserController.getUserById);

// @desc    Update user
// @route   PUT /api/v1/users/:id
// @access  Private (Manager/Superadmin only)
router.put('/:id', authenticate, requireManager, UserController.updateUser);

// @desc    Deactivate user
// @route   DELETE /api/v1/users/:id
// @access  Private (Manager/Superadmin only)
router.delete('/:id', authenticate, requireManager, UserController.toggleUserStatus);

// @desc    Reactivate user
// @route   PATCH /api/v1/users/:id/reactivate
// @access  Private (Manager/Superadmin only)
router.patch('/:id/reactivate', authenticate, requireManager, UserController.toggleUserStatus);

// @desc    Reset user password (Manager/Superadmin only)
// @route   POST /api/v1/users/:id/reset-password
// @access  Private (Manager/Superadmin only)
router.post('/:id/reset-password', authenticate, requireManager, UserController.resetPassword);

export default router;
