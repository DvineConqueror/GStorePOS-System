import { SocketConnectionService } from './SocketConnectionService';

export class SocketAnalyticsService {
  /**
   * Emit analytics update to managers and superadmins
   */
  static emitAnalyticsUpdate(analyticsData: any) {
    // Emit to managers and superadmins
    SocketConnectionService.emitToRole('manager', 'analytics:update', analyticsData);
    SocketConnectionService.emitToRole('superadmin', 'analytics:update', analyticsData);
  }

  /**
   * Emit cashier-specific analytics update
   */
  static emitCashierAnalyticsUpdate(cashierId: string, analyticsData: any) {
    // Emit to specific cashier
    SocketConnectionService.emitToUser(cashierId, 'analytics:update', analyticsData);
    
    // Also emit to managers and superadmins for oversight
    SocketConnectionService.emitToRole('manager', 'cashier:analytics:update', {
      cashierId,
      ...analyticsData
    });
    SocketConnectionService.emitToRole('superadmin', 'cashier:analytics:update', {
      cashierId,
      ...analyticsData
    });
  }

  /**
   * Emit manager analytics update
   */
  static emitManagerAnalyticsUpdate(analyticsData: any) {
    // Emit to managers and superadmins
    SocketConnectionService.emitToRole('manager', 'manager:analytics:update', analyticsData);
    SocketConnectionService.emitToRole('superadmin', 'manager:analytics:update', analyticsData);
  }
}
