import { RealtimeAnalyticsCalculationService } from './analytics/RealtimeAnalyticsCalculationService';
import { RealtimeAnalyticsBroadcastService } from './analytics/RealtimeAnalyticsBroadcastService';

export class RealtimeAnalyticsService {
  /**
   * Recalculate and broadcast analytics after transaction changes
   */
  static async recalculateAndBroadcastAnalytics(
    transactionId?: string,
    cashierId?: string,
    operation: 'create' | 'update' | 'void' | 'refund' = 'create'
  ): Promise<void> {
    return RealtimeAnalyticsBroadcastService.recalculateAndBroadcastAnalytics(
      transactionId,
      cashierId,
      operation
    );
  }
  
  /**
   * Get comprehensive analytics for dashboard
   */
  static async getComprehensiveAnalytics(period: number = 30) {
    return RealtimeAnalyticsCalculationService.getComprehensiveAnalytics(period);
  }
  
  /**
   * Get cashier performance analytics
   */
  static async getCashierPerformanceAnalytics(cashierId: string, period: number = 30) {
    return RealtimeAnalyticsCalculationService.getCashierPerformanceAnalytics(cashierId, period);
  }

  /**
   * Broadcast manager analytics update
   */
  static async broadcastManagerAnalytics(analyticsData: any): Promise<void> {
    return RealtimeAnalyticsBroadcastService.broadcastManagerAnalytics(analyticsData);
  }

  /**
   * Broadcast cashier analytics update
   */
  static async broadcastCashierAnalytics(cashierId: string, analyticsData: any): Promise<void> {
    return RealtimeAnalyticsBroadcastService.broadcastCashierAnalytics(cashierId, analyticsData);
  }

  /**
   * Broadcast analytics update to all roles
   */
  static async broadcastAnalyticsUpdate(analyticsData: any): Promise<void> {
    return RealtimeAnalyticsBroadcastService.broadcastAnalyticsUpdate(analyticsData);
  }
}
