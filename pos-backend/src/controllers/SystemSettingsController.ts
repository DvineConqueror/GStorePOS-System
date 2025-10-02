import { Request, Response } from 'express';
import SystemSettingsService from '../services/SystemSettingsService';
import { ApiResponse } from '../types';

export class SystemSettingsController {
  /**
   * Get system settings
   */
  async getSettings(req: Request, res: Response): Promise<void> {
    try {
      const settings = await SystemSettingsService.getSettings();

      res.json({
        success: true,
        message: 'System settings retrieved successfully.',
        data: settings,
      } as ApiResponse);
    } catch (error) {
      console.error('Get settings error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while retrieving system settings.',
      } as ApiResponse);
    }
  }

  /**
   * Update system settings (Superadmin only)
   */
  async updateSettings(req: Request, res: Response): Promise<void> {
    try {
      // Check if user is superadmin
      if (req.user?.role !== 'superadmin') {
        res.status(403).json({
          success: false,
          message: 'Access denied. Superadmin role required.',
        } as ApiResponse);
        return;
      }

      const updates = req.body;
      const updatedBy = req.user._id;

      const settings = await SystemSettingsService.updateSettings(updates, updatedBy);

      res.json({
        success: true,
        message: 'System settings updated successfully.',
        data: settings,
      } as ApiResponse);
    } catch (error) {
      console.error('Update settings error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while updating system settings.',
      } as ApiResponse);
    }
  }

  /**
   * Get maintenance mode status (Public)
   */
  async getMaintenanceStatus(req: Request, res: Response): Promise<void> {
    try {
      const isMaintenanceMode = await SystemSettingsService.isMaintenanceMode();
      const message = await SystemSettingsService.getMaintenanceMessage();

      res.json({
        success: true,
        data: {
          maintenanceMode: isMaintenanceMode,
          maintenanceMessage: message,
        },
      } as ApiResponse);
    } catch (error) {
      console.error('Get maintenance status error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while retrieving maintenance status.',
      } as ApiResponse);
    }
  }

  /**
   * Toggle maintenance mode (Superadmin only)
   */
  async toggleMaintenanceMode(req: Request, res: Response): Promise<void> {
    try {
      // Check if user is superadmin
      if (req.user?.role !== 'superadmin') {
        res.status(403).json({
          success: false,
          message: 'Access denied. Superadmin role required.',
        } as ApiResponse);
        return;
      }

      const { enabled, message } = req.body;
      const updatedBy = req.user._id;

      const settings = await SystemSettingsService.toggleMaintenanceMode(
        enabled,
        message,
        updatedBy
      );

      res.json({
        success: true,
        message: `Maintenance mode ${enabled ? 'enabled' : 'disabled'} successfully.`,
        data: {
          maintenanceMode: settings.maintenanceMode,
          maintenanceMessage: settings.maintenanceMessage,
        },
      } as ApiResponse);
    } catch (error) {
      console.error('Toggle maintenance mode error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while toggling maintenance mode.',
      } as ApiResponse);
    }
  }
}

export default new SystemSettingsController();

