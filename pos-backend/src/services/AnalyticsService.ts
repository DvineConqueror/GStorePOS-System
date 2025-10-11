import { AnalyticsReportService } from './analytics/AnalyticsReportService';

export class AnalyticsService {
  /**
   * Get dashboard analytics
   */
  static async getDashboardAnalytics(period: number = 30) {
    return AnalyticsReportService.getDashboardAnalytics(period);
  }

  /**
   * Get sales analytics
   */
  static async getSalesAnalytics(filters: {
    startDate?: Date;
    endDate?: Date;
    groupBy?: 'day' | 'week' | 'month';
  }) {
    return AnalyticsReportService.getSalesAnalytics(filters);
  }

  /**
   * Get product analytics
   */
  static async getProductAnalytics(filters: {
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }) {
    return AnalyticsReportService.getProductAnalytics(filters);
  }

  /**
   * Get cashier performance analytics
   */
  static async getCashierAnalytics(filters: {
    startDate?: Date;
    endDate?: Date;
  }) {
    return AnalyticsReportService.getCashierAnalytics(filters);
  }

  /**
   * Get inventory analytics
   */
  static async getInventoryAnalytics() {
    return AnalyticsReportService.getInventoryAnalytics();
  }

  /**
   * Get comprehensive analytics report
   */
  static async getComprehensiveAnalytics(period: number = 30) {
    return AnalyticsReportService.getComprehensiveAnalytics(period);
  }
}
