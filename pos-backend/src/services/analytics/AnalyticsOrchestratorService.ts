import { AnalyticsCalculationService } from './AnalyticsCalculationService';
import { AnalyticsCacheService } from './AnalyticsCacheService';
import { SocketService } from '../SocketService';

export class AnalyticsOrchestratorService {
  private static readonly REFRESH_INTERVAL = 10 * 60 * 1000; // 10 minutes for background refresh
  private static refreshInterval: NodeJS.Timeout | null = null;
  private static isRefreshing = false;

  /**
   * Initialize the analytics cache service with periodic refresh
   */
  static initialize() {
    console.log('Initializing Analytics Orchestrator Service...');
    
    // Initial cache population
    this.refreshCache();
    
    // Set up periodic refresh every 10 minutes (less frequent)
    this.refreshInterval = setInterval(() => {
      this.refreshCache();
    }, this.REFRESH_INTERVAL);
  }

  /**
   * Stop the cache service
   */
  static stop() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
    AnalyticsCacheService.clearAllCache();
  }

  /**
   * Get cached analytics or calculate if not available
   */
  static async getAnalytics(key: string, calculationMethod: () => Promise<any>): Promise<any> {
    // Try to get from cache first
    const cached = AnalyticsCacheService.getCachedAnalytics(key);
    if (cached) {
      return cached;
    }

    // Calculate and cache if not available
    const data = await calculationMethod();
    AnalyticsCacheService.setCachedAnalytics(key, data);
    return data;
  }

  /**
   * Get dashboard analytics for specific period
   */
  static async getDashboardAnalytics(days: number) {
    return this.getAnalytics(
      `dashboard:${days}d`,
      () => AnalyticsCalculationService.calculateDashboardAnalytics(days)
    );
  }

  /**
   * Get sales analytics
   */
  static async getSalesAnalytics() {
    return this.getAnalytics(
      'sales',
      () => AnalyticsCalculationService.calculateSalesAnalytics()
    );
  }

  /**
   * Get product analytics
   */
  static async getProductAnalytics() {
    return this.getAnalytics(
      'products',
      () => AnalyticsCalculationService.calculateProductAnalytics()
    );
  }

  /**
   * Get inventory analytics
   */
  static async getInventoryAnalytics() {
    return this.getAnalytics(
      'inventory',
      () => AnalyticsCalculationService.calculateInventoryAnalytics()
    );
  }

  /**
   * Refresh all analytics cache
   */
  static async refreshCache(): Promise<void> {
    // Prevent multiple simultaneous refresh operations
    if (this.isRefreshing) {
      console.log('Cache refresh already in progress, skipping...');
      return;
    }

    try {
      this.isRefreshing = true;
      console.log('Refreshing analytics cache...');
      
      // Calculate analytics for different periods in parallel
      const [
        dashboardAnalytics30d,
        dashboardAnalytics7d,
        dashboardAnalytics1d,
        salesAnalytics,
        productAnalytics,
        inventoryAnalytics
      ] = await Promise.all([
        AnalyticsCalculationService.calculateDashboardAnalytics(30),
        AnalyticsCalculationService.calculateDashboardAnalytics(7),
        AnalyticsCalculationService.calculateDashboardAnalytics(1),
        AnalyticsCalculationService.calculateSalesAnalytics(),
        AnalyticsCalculationService.calculateProductAnalytics(),
        AnalyticsCalculationService.calculateInventoryAnalytics()
      ]);

      // Cache the results
      AnalyticsCacheService.setCachedAnalytics('dashboard:30d', dashboardAnalytics30d);
      AnalyticsCacheService.setCachedAnalytics('dashboard:7d', dashboardAnalytics7d);
      AnalyticsCacheService.setCachedAnalytics('dashboard:1d', dashboardAnalytics1d);
      AnalyticsCacheService.setCachedAnalytics('sales', salesAnalytics);
      AnalyticsCacheService.setCachedAnalytics('products', productAnalytics);
      AnalyticsCacheService.setCachedAnalytics('inventory', inventoryAnalytics);

      // Only broadcast updates if there are connected clients (don't force refresh if no one is watching)
      if (SocketService.hasConnectedClients()) {
        SocketService.emitManagerAnalyticsUpdate({
          ...dashboardAnalytics30d,
          weekly: dashboardAnalytics7d,
          daily: dashboardAnalytics1d,
          lastUpdated: new Date().toISOString(),
          backgroundUpdate: true, // Flag to indicate this is a background update
          cacheRefreshed: true
        });
      }

      console.log('Analytics cache refreshed successfully');
    } catch (error) {
      console.error('Error refreshing analytics cache:', error);
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * Force refresh specific analytics
   */
  static async forceRefreshAnalytics(type: 'dashboard' | 'sales' | 'products' | 'inventory', days?: number): Promise<any> {
    let data;
    
    switch (type) {
      case 'dashboard':
        if (!days) throw new Error('Days parameter required for dashboard analytics');
        data = await AnalyticsCalculationService.calculateDashboardAnalytics(days);
        AnalyticsCacheService.setCachedAnalytics(`dashboard:${days}d`, data);
        break;
      case 'sales':
        data = await AnalyticsCalculationService.calculateSalesAnalytics();
        AnalyticsCacheService.setCachedAnalytics('sales', data);
        break;
      case 'products':
        data = await AnalyticsCalculationService.calculateProductAnalytics();
        AnalyticsCacheService.setCachedAnalytics('products', data);
        break;
      case 'inventory':
        data = await AnalyticsCalculationService.calculateInventoryAnalytics();
        AnalyticsCacheService.setCachedAnalytics('inventory', data);
        break;
    }

    return data;
  }

  /**
   * Get cache statistics
   */
  static getCacheStats() {
    return AnalyticsCacheService.getCacheStats();
  }

  /**
   * Clear all cache
   */
  static clearAllCache(): void {
    AnalyticsCacheService.clearAllCache();
  }
}
