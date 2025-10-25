import express from 'express';
import { authenticate, requireManager } from '../middleware/auth';
import { NotificationController } from '../controllers/NotificationController';

const router = express.Router();

// @desc    Get all notifications (pending approvals + low stock alerts)
// @route   GET /api/v1/notifications/all
// @access  Private (Manager/Superadmin only)
router.get('/all', authenticate, requireManager, NotificationController.getAllNotifications);

// @desc    Get pending user approvals
// @route   GET /api/v1/notifications/pending-approvals
// @access  Private (Manager/Superadmin only)
router.get('/pending-approvals', authenticate, requireManager, NotificationController.getPendingApprovals);

// @desc    Get pending approval count for notifications
// @route   GET /api/v1/notifications/pending-count
// @access  Private (Manager/Superadmin only)
router.get('/pending-count', authenticate, requireManager, NotificationController.getPendingCount);

// @desc    Get pending users for notifications
// @route   GET /api/v1/notifications/pending-users
// @access  Private (Manager/Superadmin only)
router.get('/pending-users', authenticate, requireManager, NotificationController.getPendingUsers);

// @desc    Get low stock alerts
// @route   GET /api/v1/notifications/low-stock
// @access  Private (Manager/Superadmin only)
router.get('/low-stock', authenticate, requireManager, NotificationController.getLowStockAlerts);

// @desc    Send notification
// @route   POST /api/v1/notifications/send
// @access  Private (Manager/Superadmin only)
router.post('/send', authenticate, requireManager, NotificationController.sendNotification);

// @desc    Get notification queue status
// @route   GET /api/v1/notifications/queue-status
// @access  Private (Manager/Superadmin only)
router.get('/queue-status', authenticate, requireManager, NotificationController.getQueueStatus);

// @desc    Clear completed notifications
// @route   DELETE /api/v1/notifications/clear-completed
// @access  Private (Manager/Superadmin only)
router.delete('/clear-completed', authenticate, requireManager, NotificationController.clearCompletedNotifications);

// @desc    Notify all managers about low stock
// @route   POST /api/v1/notifications/notify-managers
// @access  Private (Superadmin only)
router.post('/notify-managers', authenticate, requireManager, NotificationController.notifyManagers);

export default router;