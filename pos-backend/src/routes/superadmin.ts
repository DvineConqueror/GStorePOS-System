import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { SuperadminController } from '../controllers/SuperadminController';

const router = express.Router();

// Middleware to ensure only superadmin can access these routes
const requireSuperadmin = authorize('superadmin');

// Apply authentication and superadmin authorization to all routes
router.use(authenticate);
router.use(requireSuperadmin);

// @desc    Get all users in the system
// @route   GET /api/v1/superadmin/users
// @access  Private (Superadmin only)
router.get('/users', SuperadminController.getAllUsers);

// @desc    Get pending user approvals
// @route   GET /api/v1/superadmin/approvals
// @access  Private (Superadmin only)
router.get('/approvals', SuperadminController.getPendingApprovals);

// @desc    Approve or reject a user
// @route   POST /api/v1/superadmin/approve/:userId
// @access  Private (Superadmin only)
router.post('/approve/:userId', SuperadminController.approveUser);

// @desc    Bulk approve or reject users
// @route   POST /api/v1/superadmin/bulk-approve
// @access  Private (Superadmin only)
router.post('/bulk-approve', SuperadminController.bulkApproveUsers);

// @desc    Create a new manager
// @route   POST /api/v1/superadmin/create-manager
// @access  Private (Superadmin only)
router.post('/create-manager', SuperadminController.createManager);

// @desc    Get system statistics
// @route   GET /api/v1/superadmin/stats
// @access  Private (Superadmin only)
router.get('/stats', SuperadminController.getSystemStats);

export default router;
