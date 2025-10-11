import { SocketConnectionService } from './SocketConnectionService';

export class SocketSystemService {
  /**
   * Emit maintenance mode update to all users
   */
  static emitMaintenanceModeUpdate(data: {
    maintenanceMode: boolean;
    maintenanceMessage?: string;
    updatedAt: Date;
  }) {
    // Emit to all connected clients
    SocketConnectionService.emitToAll('system:maintenance', {
      type: 'maintenance_mode_update',
      data,
      timestamp: new Date().toISOString(),
    });

    console.log(`Maintenance mode ${data.maintenanceMode ? 'enabled' : 'disabled'} - notification sent to all users`);
  }
}
