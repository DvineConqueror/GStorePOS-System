import express from 'express';
import SystemSettingsController from '../controllers/SystemSettingsController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

/**
 * @route   GET /api/v1/system-settings
 * @desc    Get system settings
 * @access  Private (All authenticated users)
 */
router.get('/', authenticate, SystemSettingsController.getSettings);

/**
 * @route   PUT /api/v1/system-settings
 * @desc    Update system settings
 * @access  Private (Superadmin only)
 */
router.put('/', authenticate, SystemSettingsController.updateSettings);

/**
 * @route   GET /api/v1/system-settings/maintenance
 * @desc    Get maintenance mode status
 * @access  Public
 */
router.get('/maintenance', SystemSettingsController.getMaintenanceStatus);

/**
 * @route   POST /api/v1/system-settings/maintenance/toggle
 * @desc    Toggle maintenance mode
 * @access  Private (Superadmin only)
 */
router.post('/maintenance/toggle', authenticate, SystemSettingsController.toggleMaintenanceMode);

export default router;

