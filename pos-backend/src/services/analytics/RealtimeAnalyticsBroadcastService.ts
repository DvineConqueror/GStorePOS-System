import { Transaction } from '../../models/Transaction';
import { SocketService } from '../SocketService';
import { RealtimeAnalyticsCalculationService } from './RealtimeAnalyticsCalculationService';
import {
  getSalesByCategory,
  getHourlySales,
  getTopPerformer,
  getWeeklyTrend
} from '../../utils/analytics';

export class RealtimeAnalyticsBroadcastService {
  /**
   * Recalculate and broadcast analytics after transaction changes
   */
  static async recalculateAndBroadcastAnalytics(
    transactionId?: string,
    cashierId?: string,
    operation: 'create' | 'update' | 'void' | 'refund' = 'create'
  ): Promise<void> {
    try {
      
      // Get all transactions for analytics calculation
      const allTransactions = await Transaction.find({})
        .sort({ createdAt: -1 })
        .lean();
      
      // Calculate manager/superadmin analytics (all transactions)
      const managerAnalytics = RealtimeAnalyticsCalculationService.getDashboardAnalytics(allTransactions, 30);
      const weeklyAnalytics = RealtimeAnalyticsCalculationService.getDashboardAnalytics(allTransactions, 7);
      const dailyAnalytics = RealtimeAnalyticsCalculationService.getDashboardAnalytics(allTransactions, 1);
      
      // Get additional analytics data
      const salesByCategory = getSalesByCategory(allTransactions);
      const hourlySales = getHourlySales(allTransactions);
      
      // Get top performer (cashier with highest sales)
      const topPerformer = getTopPerformer(allTransactions);
      
      // Get weekly trend data
      const weeklyTrend = getWeeklyTrend(allTransactions);
      
      const managerAnalyticsData = {
        period: '30d',
        metrics: managerAnalytics.metrics,
        summary: managerAnalytics.summary,
        normalized: managerAnalytics.normalized,
        salesByCategory,
        hourlySales,
        topPerformer,
        weeklyTrend,
        weekly: weeklyAnalytics.summary,
        daily: dailyAnalytics.summary
      };
      
      // Broadcast to managers and superadmins
      SocketService.emitManagerAnalyticsUpdate(managerAnalyticsData);
      
      // If cashier-specific operation, calculate cashier analytics
      if (cashierId) {
        const cashierAnalytics = RealtimeAnalyticsCalculationService.getCashierAnalytics(allTransactions, cashierId, 30);
        const cashierWeeklyAnalytics = RealtimeAnalyticsCalculationService.getCashierAnalytics(allTransactions, cashierId, 7);
        const cashierDailyAnalytics = RealtimeAnalyticsCalculationService.getCashierAnalytics(allTransactions, cashierId, 1);
        
        const cashierAnalyticsData = {
          period: '30d',
          metrics: cashierAnalytics.metrics,
          summary: cashierAnalytics.summary,
          normalized: cashierAnalytics.normalized,
          weekly: cashierWeeklyAnalytics.summary,
          daily: cashierDailyAnalytics.summary
        };
        
        // Broadcast to specific cashier
        SocketService.emitCashierAnalyticsUpdate(cashierId, cashierAnalyticsData);
      }
      
    } catch (error) {
      console.error('Error recalculating analytics:', error);
    }
  }

  /**
   * Broadcast manager analytics update
   */
  static async broadcastManagerAnalytics(analyticsData: any): Promise<void> {
    try {
      SocketService.emitManagerAnalyticsUpdate(analyticsData);
    } catch (error) {
      console.error('Error broadcasting manager analytics:', error);
    }
  }

  /**
   * Broadcast cashier analytics update
   */
  static async broadcastCashierAnalytics(cashierId: string, analyticsData: any): Promise<void> {
    try {
      SocketService.emitCashierAnalyticsUpdate(cashierId, analyticsData);
    } catch (error) {
      console.error('Error broadcasting cashier analytics:', error);
    }
  }

  /**
   * Broadcast analytics update to all roles
   */
  static async broadcastAnalyticsUpdate(analyticsData: any): Promise<void> {
    try {
      SocketService.emitAnalyticsUpdate(analyticsData);
    } catch (error) {
      console.error('Error broadcasting analytics update:', error);
    }
  }
}
