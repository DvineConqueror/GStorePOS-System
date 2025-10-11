import { Transaction } from '../../models/Transaction';
import {
  calculatePeriodWindow,
  calculateNetTotals,
  calculateGrowthDelta,
  normalizeKPI,
  getSalesByCategory,
  getHourlySales,
  getTopPerformer,
  getWeeklyTrend
} from '../../utils/analytics';

export class RealtimeAnalyticsCalculationService {
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
  static getDashboardAnalytics(transactions: any[], period: number) {
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
  static getCashierAnalytics(transactions: any[], cashierId: string, period: number) {
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
