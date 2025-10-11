import { AnalyticsOrchestratorService } from './analytics/AnalyticsOrchestratorService';

export class AnalyticsCacheService {
  /**
   * Initialize the analytics cache service with periodic refresh
   */
  static initialize() {
    return AnalyticsOrchestratorService.initialize();
  }

  /**
   * Stop the cache service
   */
  static stop() {
    return AnalyticsOrchestratorService.stop();
  }

  /**
   * Get cached analytics data
   */
  static getCachedAnalytics(key: string): any | null {
    return AnalyticsOrchestratorService.getAnalytics(key, () => Promise.resolve(null));
  }

  /**
   * Set cached analytics data
   */
  static setCachedAnalytics(key: string, data: any): void {
    // This method is now handled internally by the orchestrator
    console.log(`Cache set for key: ${key}`);
  }

  /**
   * Refresh all analytics cache
   */
  static async refreshCache(): Promise<void> {
    return AnalyticsOrchestratorService.refreshCache();
  }

  /**
   * Get dashboard analytics for specific period
   */
  static async getDashboardAnalytics(days: number) {
    return AnalyticsOrchestratorService.getDashboardAnalytics(days);
  }

  /**
   * Get sales analytics
   */
  static async getSalesAnalytics() {
    return AnalyticsOrchestratorService.getSalesAnalytics();
  }

  /**
   * Get product analytics
   */
  static async getProductAnalytics() {
    return AnalyticsOrchestratorService.getProductAnalytics();
  }

  /**
   * Get inventory analytics
   */
  static async getInventoryAnalytics() {
    return AnalyticsOrchestratorService.getInventoryAnalytics();
  }

  /**
   * Force refresh specific analytics
   */
  static async forceRefreshAnalytics(type: 'dashboard' | 'sales' | 'products' | 'inventory', days?: number): Promise<any> {
    return AnalyticsOrchestratorService.forceRefreshAnalytics(type, days);
  }

  /**
   * Get cache statistics
   */
  static getCacheStats() {
    return AnalyticsOrchestratorService.getCacheStats();
  }

  /**
   * Clear all cache
   */
  static clearAllCache(): void {
    AnalyticsOrchestratorService.clearAllCache();
  }
}
