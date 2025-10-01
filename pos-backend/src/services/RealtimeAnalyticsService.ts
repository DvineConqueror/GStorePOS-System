import { Transaction } from '../models/Transaction';
import { SocketService } from './SocketService';
import {
  calculatePeriodWindow,
  calculateNetTotals,
  calculateGrowthDelta,
  normalizeKPI,
  getSalesByCategory,
  getHourlySales,
  getTopPerformer,
  getWeeklyTrend
} from '../utils/analytics';

export class RealtimeAnalyticsService {
  /**
   * Recalculate and broadcast analytics after transaction changes
   */
  static async recalculateAndBroadcastAnalytics(
    transactionId?: string,
    cashierId?: string,
    operation: 'create' | 'update' | 'void' | 'refund' = 'create'
  ): Promise<void> {
    try {
      console.log(`Recalculating analytics after transaction ${operation}:`, transactionId);
      
      // Get all transactions for analytics calculation
      const allTransactions = await Transaction.find({})
        .sort({ createdAt: -1 })
        .lean();
      
      // Calculate manager/superadmin analytics (all transactions)
      const managerAnalytics = this.getDashboardAnalytics(allTransactions, 30);
      const weeklyAnalytics = this.getDashboardAnalytics(allTransactions, 7);
      const dailyAnalytics = this.getDashboardAnalytics(allTransactions, 1);
      
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
        const cashierAnalytics = this.getCashierAnalytics(allTransactions, cashierId, 30);
        const cashierWeeklyAnalytics = this.getCashierAnalytics(allTransactions, cashierId, 7);
        const cashierDailyAnalytics = this.getCashierAnalytics(allTransactions, cashierId, 1);
        
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
      
      console.log('Analytics recalculated and broadcasted successfully');
    } catch (error) {
      console.error('Error recalculating analytics:', error);
    }
  }
  
  /**
   * Get comprehensive analytics for dashboard
   */
  static async getComprehensiveAnalytics(period: number = 30) {
    const allTransactions = await Transaction.find({})
      .sort({ createdAt: -1 })
      .lean();
    
    return this.getDashboardAnalytics(allTransactions, period);
  }
  
  /**
   * Get cashier performance analytics
   */
  static async getCashierPerformanceAnalytics(cashierId: string, period: number = 30) {
    const allTransactions = await Transaction.find({})
      .sort({ createdAt: -1 })
      .lean();
    
    return this.getCashierAnalytics(allTransactions, cashierId, period);
  }
  
  /**
   * Get dashboard analytics from transaction data
   */
  private static getDashboardAnalytics(transactions: any[], period: number) {
    const periodWindow = calculatePeriodWindow(period);
    const previousPeriodWindow = calculatePeriodWindow(period * 2);
    
    // Filter transactions for current period
    const currentPeriodTransactions = transactions.filter(t => 
      t.createdAt >= periodWindow.startDate && t.createdAt <= periodWindow.endDate
    );
    
    // Filter transactions for previous period
    const previousPeriodTransactions = transactions.filter(t => 
      t.createdAt >= previousPeriodWindow.startDate && 
      t.createdAt < periodWindow.startDate
    );
    
    // Calculate current period totals
    const currentTotals = calculateNetTotals(currentPeriodTransactions);
    
    // Calculate previous period totals
    const previousTotals = calculateNetTotals(previousPeriodTransactions);
    
    // Calculate growth delta
    const growthDelta = calculateGrowthDelta(currentTotals, previousTotals);
    
    // Get refunded transactions
    const refundedTransactions = transactions.filter(t => t.status === 'refunded');
    
    // Normalize KPI values
    const normalized = normalizeKPI(currentTotals, refundedTransactions);
    
    return {
      period: periodWindow.label,
      metrics: {
        totalSales: currentTotals.totalSales,
        totalTransactions: currentTotals.totalTransactions,
        averageTransactionValue: currentTotals.averageTransactionValue,
        refundedCount: currentTotals.refundedCount,
        refundedAmount: currentTotals.refundedAmount
      },
      summary: {
        period: periodWindow.label,
        startDate: periodWindow.startDate,
        endDate: periodWindow.endDate,
        totalSales: currentTotals.totalSales,
        totalTransactions: currentTotals.totalTransactions,
        averageTransactionValue: currentTotals.averageTransactionValue,
        refundedCount: currentTotals.refundedCount,
        refundedAmount: currentTotals.refundedAmount
      },
      normalized,
      growthDelta,
      formattedMetrics: {
        totalSales: {
          value: currentTotals.totalSales,
          formatted: `$${currentTotals.totalSales.toLocaleString()}`,
          trend: growthDelta.sales,
          trendFormatted: `${growthDelta.sales >= 0 ? '+' : ''}${growthDelta.sales.toFixed(1)}%`
        },
        totalTransactions: {
          value: currentTotals.totalTransactions,
          formatted: currentTotals.totalTransactions.toLocaleString(),
          trend: growthDelta.transactions,
          trendFormatted: `${growthDelta.transactions >= 0 ? '+' : ''}${growthDelta.transactions.toFixed(1)}%`
        },
        averageTransactionValue: {
          value: currentTotals.averageTransactionValue,
          formatted: `$${currentTotals.averageTransactionValue.toFixed(2)}`,
          trend: growthDelta.averageTransaction,
          trendFormatted: `${growthDelta.averageTransaction >= 0 ? '+' : ''}${growthDelta.averageTransaction.toFixed(1)}%`
        }
      }
    };
  }
  
  /**
   * Get cashier-specific analytics
   */
  private static getCashierAnalytics(transactions: any[], cashierId: string, period: number) {
    const periodWindow = calculatePeriodWindow(period);
    const previousPeriodWindow = calculatePeriodWindow(period * 2);
    
    // Filter transactions for specific cashier
    const cashierTransactions = transactions.filter(t => t.cashierId === cashierId);
    
    // Filter for current period
    const currentPeriodTransactions = cashierTransactions.filter(t => 
      t.createdAt >= periodWindow.startDate && t.createdAt <= periodWindow.endDate
    );
    
    // Filter for previous period
    const previousPeriodTransactions = cashierTransactions.filter(t => 
      t.createdAt >= previousPeriodWindow.startDate && 
      t.createdAt < periodWindow.startDate
    );
    
    // Calculate totals
    const currentTotals = calculateNetTotals(currentPeriodTransactions);
    const previousTotals = calculateNetTotals(previousPeriodTransactions);
    
    // Calculate growth delta
    const growthDelta = calculateGrowthDelta(currentTotals, previousTotals);
    
    // Get refunded transactions for this cashier
    const refundedTransactions = cashierTransactions.filter(t => t.status === 'refunded');
    
    // Normalize KPI values
    const normalized = normalizeKPI(currentTotals, refundedTransactions);
    
    return {
      period: periodWindow.label,
      cashierId,
      metrics: {
        totalSales: currentTotals.totalSales,
        totalTransactions: currentTotals.totalTransactions,
        averageTransactionValue: currentTotals.averageTransactionValue,
        refundedCount: currentTotals.refundedCount,
        refundedAmount: currentTotals.refundedAmount
      },
      summary: {
        period: periodWindow.label,
        startDate: periodWindow.startDate,
        endDate: periodWindow.endDate,
        totalSales: currentTotals.totalSales,
        totalTransactions: currentTotals.totalTransactions,
        averageTransactionValue: currentTotals.averageTransactionValue,
        refundedCount: currentTotals.refundedCount,
        refundedAmount: currentTotals.refundedAmount
      },
      normalized,
      growthDelta,
      formattedMetrics: {
        totalSales: {
          value: currentTotals.totalSales,
          formatted: `$${currentTotals.totalSales.toLocaleString()}`,
          trend: growthDelta.sales,
          trendFormatted: `${growthDelta.sales >= 0 ? '+' : ''}${growthDelta.sales.toFixed(1)}%`
        },
        totalTransactions: {
          value: currentTotals.totalTransactions,
          formatted: currentTotals.totalTransactions.toLocaleString(),
          trend: growthDelta.transactions,
          trendFormatted: `${growthDelta.transactions >= 0 ? '+' : ''}${growthDelta.transactions.toFixed(1)}%`
        },
        averageTransactionValue: {
          value: currentTotals.averageTransactionValue,
          formatted: `$${currentTotals.averageTransactionValue.toFixed(2)}`,
          trend: growthDelta.averageTransaction,
          trendFormatted: `${growthDelta.averageTransaction >= 0 ? '+' : ''}${growthDelta.averageTransaction.toFixed(1)}%`
        }
      }
    };
  }
}
