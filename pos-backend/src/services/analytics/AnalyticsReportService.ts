import { AnalyticsQueryService } from './AnalyticsQueryService';
import { AnalyticsCalculationService } from './AnalyticsCalculationService';

export class AnalyticsReportService {
  /**
   * Get dashboard analytics report
   */
  static async getDashboardAnalytics(period: number = 30) {
    const startDate = new Date(Date.now() - period * 24 * 60 * 60 * 1000);
    const endDate = new Date();

    // Get sales data
    const salesData = await AnalyticsQueryService.getSalesData(startDate, endDate);
    
    // Get sales by day
    const salesByDay = await AnalyticsQueryService.getSalesByDay(startDate, endDate);
    
    // Get calculated analytics
    const calculatedAnalytics = await AnalyticsCalculationService.calculateDashboardAnalytics(period);
    
    // Get user statistics
    const userStats = await AnalyticsQueryService.getUserStats();

    return {
      period: `${period} days`,
      sales: salesData[0] || {
        totalSales: 0,
        totalTransactions: 0,
        averageTransactionValue: 0
      },
      salesByDay,
      topProducts: calculatedAnalytics.topProducts,
      salesByCashier: calculatedAnalytics.salesByCashier,
      // inventory: calculatedAnalytics.inventory, // This property doesn't exist in the new structure
      users: userStats
    };
  }

  /**
   * Get sales analytics report
   */
  static async getSalesAnalytics(filters: {
    startDate?: Date;
    endDate?: Date;
    groupBy?: 'day' | 'week' | 'month';
  }) {
    const { 
      startDate, 
      endDate, 
      groupBy = 'day'
    } = filters;

    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate || new Date();

    // Get sales data by period
    const salesData = await AnalyticsQueryService.getSalesByPeriod(start, end, groupBy);
    
    // Get payment method breakdown
    const paymentMethodData = await AnalyticsQueryService.getPaymentMethodData(start, end);

    return {
      period: { start, end },
      groupBy,
      salesData,
      paymentMethodData
    };
  }

  /**
   * Get product analytics report
   */
  static async getProductAnalytics(filters: {
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }) {
    const { 
      startDate, 
      endDate, 
      limit = 20 
    } = filters;

    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate || new Date();

    // Get calculated product analytics
    const calculatedAnalytics = await AnalyticsCalculationService.calculateProductAnalytics();
    
    // Get category performance
    const categoryPerformance = await AnalyticsQueryService.getCategoryPerformance(start, end);
    
    // Get inventory value
    const inventoryValue = await AnalyticsQueryService.getInventoryValue();

    return {
      period: { start, end },
      topProducts: calculatedAnalytics.topProducts,
      categoryPerformance,
      inventory: inventoryValue[0] || {
        totalValue: 0,
        totalCost: 0,
        totalItems: 0,
        totalStock: 0
      }
    };
  }

  /**
   * Get cashier performance analytics report
   */
  static async getCashierAnalytics(filters: {
    startDate?: Date;
    endDate?: Date;
    cashierId?: string;
  }) {
    const { 
      startDate, 
      endDate,
      cashierId
    } = filters;

    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate || new Date();

    // Get calculated cashier analytics - using a placeholder for now
    const calculatedAnalytics = { performance: {} };
    
    // Get cashier activity by hour
    const cashierActivity = await AnalyticsQueryService.getCashierActivity(start, end);

    return {
      period: { start, end },
      cashierId,
      performance: calculatedAnalytics.performance,
      activity: cashierActivity
    };
  }

  /**
   * Get inventory analytics report
   */
  static async getInventoryAnalytics() {
    // Get inventory status
    const inventoryStatus = await AnalyticsQueryService.getInventoryStatus();
    
    // Get category distribution
    const categoryDistribution = await AnalyticsQueryService.getCategoryDistribution();
    
    // Get calculated inventory analytics
    const calculatedAnalytics = await AnalyticsCalculationService.calculateInventoryAnalytics();

    return {
      status: inventoryStatus[0] || {
        totalProducts: 0,
        totalStock: 0,
        totalValue: 0,
        lowStockCount: 0,
        outOfStockCount: 0
      },
      categoryDistribution,
      lowStockProducts: calculatedAnalytics.lowStockProducts,
      outOfStockProducts: calculatedAnalytics.outOfStockProducts
    };
  }

  /**
   * Get comprehensive analytics report
   */
  static async getComprehensiveAnalytics(period: number = 30) {
    const [
      dashboardAnalytics,
      salesAnalytics,
      productAnalytics,
      cashierAnalytics,
      inventoryAnalytics
    ] = await Promise.all([
      this.getDashboardAnalytics(period),
      this.getSalesAnalytics({ groupBy: 'day' }),
      this.getProductAnalytics({ limit: 10 }),
      this.getCashierAnalytics({}),
      this.getInventoryAnalytics()
    ]);

    return {
      dashboard: dashboardAnalytics,
      sales: salesAnalytics,
      products: productAnalytics,
      cashiers: cashierAnalytics,
      inventory: inventoryAnalytics,
      generatedAt: new Date()
    };
  }
}
