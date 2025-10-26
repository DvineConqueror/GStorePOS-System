import { AnalyticsReportService } from './analytics/AnalyticsReportService';

/**
 * AnalyticsService - Facade Pattern
 * 
 * This service acts as a Facade that provides a simplified, unified interface
 * to the complex analytics subsystem.
 * 
 * Architecture:
 * - This class delegates to specialized analytics services for different concerns
 * - Controllers should only interact with this facade, not the underlying services
 * 
 * Delegates to:
 * - AnalyticsReportService: Generates comprehensive analytics reports
 * - AnalyticsQueryService: Executes complex database queries for analytics
 * - AnalyticsCalculationService: Performs calculations and aggregations
 * - AnalyticsCacheService: Manages caching for performance optimization
 * - SalesTrendService: Analyzes sales trends over time
 * - RealtimeAnalyticsBroadcastService: Broadcasts real-time updates via Socket.IO
 * 
 * Benefits:
 * - Single entry point for analytics operations
 * - Hides complexity of caching, calculation, and real-time updates
 * - Makes analytics queries consistent across controllers
 * - Easier to optimize performance without changing controller code
 */
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
    cashierId?: string;
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
