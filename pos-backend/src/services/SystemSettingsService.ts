import { SystemSettings, ISystemSettings } from '../models/SystemSettings';
import { SocketService } from './SocketService';

class SystemSettingsService {
  /**
   * Get system settings (creates default if doesn't exist)
   */
  async getSettings(): Promise<ISystemSettings> {
    let settings = await SystemSettings.findOne();
    
    if (!settings) {
      // Create default settings
      settings = new SystemSettings({});
      await settings.save();
    }
    
    return settings;
  }

  /**
   * Update system settings
   */
  async updateSettings(
    updates: Partial<ISystemSettings>,
    updatedBy: string
  ): Promise<ISystemSettings> {
    let settings = await SystemSettings.findOne();
    
    if (!settings) {
      settings = new SystemSettings(updates);
      settings.updatedBy = updatedBy as any;
      await settings.save();
    } else {
      Object.assign(settings, updates);
      settings.updatedBy = updatedBy as any;
      await settings.save();
    }

    // Emit real-time update for maintenance mode changes
    if (updates.maintenanceMode !== undefined) {
      SocketService.emitMaintenanceModeUpdate({
        maintenanceMode: settings.maintenanceMode,
        maintenanceMessage: settings.maintenanceMessage,
        updatedAt: settings.updatedAt,
      });
    }

    return settings;
  }

  /**
   * Check if maintenance mode is enabled
   */
  async isMaintenanceMode(): Promise<boolean> {
    const settings = await this.getSettings();
    return settings.maintenanceMode;
  }

  /**
   * Get maintenance message
   */
  async getMaintenanceMessage(): Promise<string | undefined> {
    const settings = await this.getSettings();
    return settings.maintenanceMessage;
  }

  /**
   * Toggle maintenance mode
   */
  async toggleMaintenanceMode(
    enabled: boolean,
    message: string | undefined,
    updatedBy: string
  ): Promise<ISystemSettings> {
    return await this.updateSettings(
      {
        maintenanceMode: enabled,
        maintenanceMessage: message || 'System is currently under maintenance. Some features may be unavailable.',
      },
      updatedBy
    );
  }
}

export default new SystemSettingsService();

