import { Transaction } from '../../models/Transaction';
import { Product } from '../../models/Product';

export class AnalyticsCalculationService {
  /**
   * Calculate dashboard analytics
   */
  static async calculateDashboardAnalytics(period: number = 30) {
    const startDate = new Date(Date.now() - period * 24 * 60 * 60 * 1000);
    const endDate = new Date();

    // Get top products
    const topProducts = await Transaction.getTopProducts(startDate, endDate, 5);

    // Get sales by cashier
    const salesByCashier = await Transaction.getSalesByCashier(startDate, endDate);

    // Get low stock products
    const lowStockProducts = await Product.findLowStock();

    // Get out of stock products
    const outOfStockProducts = await Product.findOutOfStock();

    return {
      period: `${period} days`,
      topProducts,
      salesByCashier,
      inventory: {
        lowStock: lowStockProducts.length,
        outOfStock: outOfStockProducts.length,
        lowStockProducts: lowStockProducts.slice(0, 5),
        outOfStockProducts: outOfStockProducts.slice(0, 5)
      }
    };
  }

  /**
   * Calculate sales analytics
   */
  static async calculateSalesAnalytics(filters: {
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

    return {
      period: { start, end },
      groupBy
    };
  }

  /**
   * Calculate product analytics
   */
  static async calculateProductAnalytics(filters: {
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

    // Get top selling products
    const topProducts = await Transaction.getTopProducts(start, end, limit);

    return {
      period: { start, end },
      topProducts
    };
  }

  /**
   * Calculate cashier performance analytics
   */
  static async calculateCashierAnalytics(filters: {
    startDate?: Date;
    endDate?: Date;
  }) {
    const { 
      startDate, 
      endDate 
    } = filters;

    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate || new Date();

    // Get cashier performance
    const cashierPerformance = await Transaction.getSalesByCashier(start, end);

    return {
      period: { start, end },
      performance: cashierPerformance
    };
  }

  /**
   * Calculate inventory analytics
   */
  static async calculateInventoryAnalytics() {
    // Get low stock products
    const lowStockProducts = await Product.findLowStock();

    // Get out of stock products
    const outOfStockProducts = await Product.findOutOfStock();

    return {
      lowStockProducts,
      outOfStockProducts
    };
  }

  /**
   * Format sales data for charts
   */
  static formatSalesDataForCharts(salesData: any[], groupBy: string) {
    return salesData.map(item => ({
      period: this.formatPeriodLabel(item._id, groupBy),
      sales: item.sales,
      transactions: item.transactions,
      averageTransactionValue: item.averageTransactionValue
    }));
  }

  /**
   * Format period label based on groupBy
   */
  private static formatPeriodLabel(periodId: any, groupBy: string): string {
    switch (groupBy) {
      case 'day':
        return `${periodId.year}-${String(periodId.month).padStart(2, '0')}-${String(periodId.day).padStart(2, '0')}`;
      case 'week':
        return `Week ${periodId.week}, ${periodId.year}`;
      case 'month':
        return `${periodId.year}-${String(periodId.month).padStart(2, '0')}`;
      default:
        return 'Unknown';
    }
  }

  /**
   * Calculate growth rate
   */
  static calculateGrowthRate(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  /**
   * Calculate percentage distribution
   */
  static calculatePercentageDistribution(data: any[], totalKey: string = 'sales'): any[] {
    const total = data.reduce((sum, item) => sum + (item[totalKey] || 0), 0);
    
    return data.map(item => ({
      ...item,
      percentage: total > 0 ? ((item[totalKey] || 0) / total) * 100 : 0
    }));
  }
}
