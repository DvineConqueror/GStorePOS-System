import { Transaction } from '../models/Transaction';
import { Product } from '../models/Product';
import { User } from '../models/User';
import { SocketService } from './SocketService';
import { RealtimeAnalyticsService } from './RealtimeAnalyticsService';

interface CachedAnalytics {
  data: any;
  timestamp: number;
  expiresAt: number;
}

export class AnalyticsCacheService {
  private static cache = new Map<string, CachedAnalytics>();
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private static readonly REFRESH_INTERVAL = 10 * 60 * 1000; // 10 minutes for background refresh
  private static refreshInterval: NodeJS.Timeout | null = null;
  private static isRefreshing = false;

  /**
   * Initialize the analytics cache service with periodic refresh
   */
  static initialize() {
    console.log('Initializing Analytics Cache Service...');
    
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
    this.cache.clear();
  }

  /**
   * Get cached analytics data
   */
  static getCachedAnalytics(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now > cached.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * Set cached analytics data
   */
  static setCachedAnalytics(key: string, data: any): void {
    const now = Date.now();
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + this.CACHE_DURATION
    });
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
        this.calculateDashboardAnalytics(30),
        this.calculateDashboardAnalytics(7),
        this.calculateDashboardAnalytics(1),
        this.calculateSalesAnalytics(),
        this.calculateProductAnalytics(),
        this.calculateInventoryAnalytics()
      ]);

      // Cache the results
      this.setCachedAnalytics('dashboard:30d', dashboardAnalytics30d);
      this.setCachedAnalytics('dashboard:7d', dashboardAnalytics7d);
      this.setCachedAnalytics('dashboard:1d', dashboardAnalytics1d);
      this.setCachedAnalytics('sales', salesAnalytics);
      this.setCachedAnalytics('products', productAnalytics);
      this.setCachedAnalytics('inventory', inventoryAnalytics);

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
   * Calculate dashboard analytics for a specific period
   */
  private static async calculateDashboardAnalytics(days: number) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const endDate = new Date();

    // Get previous period for comparison
    const prevStartDate = new Date(startDate.getTime() - days * 24 * 60 * 60 * 1000);
    const prevEndDate = new Date(startDate.getTime());

    const [currentData, previousData, salesByDay, topProducts, salesByCashier, userStats] = await Promise.all([
      // Current period data
      Transaction.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            status: 'completed'
          }
        },
        {
          $group: {
            _id: null,
            totalSales: { $sum: '$total' },
            totalTransactions: { $sum: 1 },
            averageTransactionValue: { $avg: '$total' }
          }
        }
      ]),
      // Previous period data for comparison
      Transaction.aggregate([
        {
          $match: {
            createdAt: { $gte: prevStartDate, $lte: prevEndDate },
            status: 'completed'
          }
        },
        {
          $group: {
            _id: null,
            totalSales: { $sum: '$total' },
            totalTransactions: { $sum: 1 },
            averageTransactionValue: { $avg: '$total' }
          }
        }
      ]),
      // Sales by day
      Transaction.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            status: 'completed'
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' }
            },
            sales: { $sum: '$total' },
            transactions: { $sum: 1 }
          }
        },
        {
          $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
        }
      ]),
      // Top products
      Transaction.getTopProducts(startDate, endDate, 5),
      // Sales by cashier
      Transaction.getSalesByCashier(startDate, endDate),
      // User statistics
      User.aggregate([
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 },
            activeCount: {
              $sum: { $cond: ['$isActive', 1, 0] }
            }
          }
        }
      ])
    ]);

    const current = currentData[0] || { totalSales: 0, totalTransactions: 0, averageTransactionValue: 0 };
    const previous = previousData[0] || { totalSales: 0, totalTransactions: 0, averageTransactionValue: 0 };

    // Calculate today's data for today's growth
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const [todayData, yesterdayData] = await Promise.all([
      Transaction.aggregate([
        {
          $match: {
            createdAt: { $gte: today },
            status: 'completed'
          }
        },
        {
          $group: {
            _id: null,
            totalSales: { $sum: '$total' },
            totalTransactions: { $sum: 1 }
          }
        }
      ]),
      Transaction.aggregate([
        {
          $match: {
            createdAt: { $gte: yesterday, $lt: today },
            status: 'completed'
          }
        },
        {
          $group: {
            _id: null,
            totalSales: { $sum: '$total' },
            totalTransactions: { $sum: 1 }
          }
        }
      ])
    ]);

    const todayStats = todayData[0] || { totalSales: 0, totalTransactions: 0 };
    const yesterdayStats = yesterdayData[0] || { totalSales: 0, totalTransactions: 0 };

    // Calculate percentage changes with fallback logic for new installations
    const salesGrowth = previous.totalSales > 0 
      ? ((current.totalSales - previous.totalSales) / previous.totalSales) * 100 
      : current.totalSales > 0 ? 100 : 0; // If no previous data but current sales exist, show 100% growth
    
    const transactionGrowth = previous.totalTransactions > 0 
      ? ((current.totalTransactions - previous.totalTransactions) / previous.totalTransactions) * 100 
      : current.totalTransactions > 0 ? 100 : 0; // If no previous data but current transactions exist, show 100% growth
    
    const avgTransactionGrowth = previous.averageTransactionValue > 0 
      ? ((current.averageTransactionValue - previous.averageTransactionValue) / previous.averageTransactionValue) * 100 
      : current.averageTransactionValue > 0 ? 100 : 0; // If no previous data but current avg exists, show 100% growth

    const todaySalesGrowth = yesterdayStats.totalSales > 0 
      ? ((todayStats.totalSales - yesterdayStats.totalSales) / yesterdayStats.totalSales) * 100 
      : todayStats.totalSales > 0 ? 100 : 0; // If no yesterday data but today sales exist, show 100% growth

    return {
      period: `${days} days`,
      sales: current,
      salesByDay,
      topProducts,
      salesByCashier,
      users: userStats,
      daily: {
        sales: todayStats
      },
      growth: {
        salesGrowth: Number(salesGrowth.toFixed(1)),
        transactionGrowth: Number(transactionGrowth.toFixed(1)),
        avgTransactionGrowth: Number(avgTransactionGrowth.toFixed(1)),
        todaySalesGrowth: Number(todaySalesGrowth.toFixed(1))
      }
    };
  }

  /**
   * Calculate sales analytics
   */
  private static async calculateSalesAnalytics() {
    const start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = new Date();

    const [salesData, paymentMethodData] = await Promise.all([
      Transaction.aggregate([
        {
          $match: {
            createdAt: { $gte: start, $lte: end },
            status: 'completed'
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' }
            },
            sales: { $sum: '$total' },
            transactions: { $sum: 1 },
            averageTransactionValue: { $avg: '$total' }
          }
        },
        {
          $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
        }
      ]),
      Transaction.aggregate([
        {
          $match: {
            createdAt: { $gte: start, $lte: end },
            status: 'completed'
          }
        },
        {
          $group: {
            _id: '$paymentMethod',
            sales: { $sum: '$total' },
            transactions: { $sum: 1 }
          }
        }
      ])
    ]);

    return {
      period: { start, end },
      salesData,
      paymentMethodData
    };
  }

  /**
   * Calculate product analytics
   */
  private static async calculateProductAnalytics() {
    const start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = new Date();

    const [topProducts, categoryPerformance, inventoryValue] = await Promise.all([
      Transaction.getTopProducts(start, end, 20),
      Transaction.aggregate([
        {
          $match: {
            createdAt: { $gte: start, $lte: end },
            status: 'completed'
          }
        },
        {
          $unwind: '$items'
        },
        {
          $lookup: {
            from: 'products',
            localField: 'items.productId',
            foreignField: '_id',
            as: 'product'
          }
        },
        {
          $unwind: '$product'
        },
        {
          $group: {
            _id: '$product.category',
            sales: { $sum: '$items.totalPrice' },
            quantitySold: { $sum: '$items.quantity' },
            transactions: { $addToSet: '$_id' }
          }
        },
        {
          $project: {
            category: '$_id',
            sales: 1,
            quantitySold: 1,
            transactionCount: { $size: '$transactions' }
          }
        },
        {
          $sort: { sales: -1 }
        }
      ]),
      Product.aggregate([
        {
          $match: { isActive: true }
        },
        {
          $group: {
            _id: null,
            totalValue: { $sum: { $multiply: ['$stock', '$price'] } },
            totalCost: { $sum: { $multiply: ['$stock', '$cost'] } },
            totalItems: { $sum: 1 },
            totalStock: { $sum: '$stock' }
          }
        }
      ])
    ]);

    return {
      period: { start, end },
      topProducts,
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
   * Calculate inventory analytics
   */
  private static async calculateInventoryAnalytics() {
    const [inventoryStatus, categoryDistribution, lowStockProducts, outOfStockProducts] = await Promise.all([
      Product.aggregate([
        {
          $match: { isActive: true }
        },
        {
          $group: {
            _id: null,
            totalProducts: { $sum: 1 },
            totalStock: { $sum: '$stock' },
            totalValue: { $sum: { $multiply: ['$stock', '$price'] } },
            lowStockCount: {
              $sum: {
                $cond: [{ $lte: ['$stock', '$minStock'] }, 1, 0]
              }
            },
            outOfStockCount: {
              $sum: {
                $cond: [{ $eq: ['$stock', 0] }, 1, 0]
              }
            }
          }
        }
      ]),
      Product.aggregate([
        {
          $match: { isActive: true }
        },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            totalStock: { $sum: '$stock' },
            totalValue: { $sum: { $multiply: ['$stock', '$price'] } }
          }
        },
        {
          $sort: { count: -1 }
        }
      ]),
      Product.findLowStock(),
      Product.findOutOfStock()
    ]);

    return {
      status: inventoryStatus[0] || {
        totalProducts: 0,
        totalStock: 0,
        totalValue: 0,
        lowStockCount: 0,
        outOfStockCount: 0
      },
      categoryDistribution,
      lowStockProducts,
      outOfStockProducts
    };
  }
}
