import { Transaction } from '../models/Transaction';
import { Product } from '../models/Product';
import { User } from '../models/User';

export class AnalyticsService {
  /**
   * Get dashboard analytics
   */
  static async getDashboardAnalytics(period: number = 30) {
    const startDate = new Date(Date.now() - period * 24 * 60 * 60 * 1000);
    const endDate = new Date();

    // Get sales data
    const salesData = await Transaction.aggregate([
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
    ]);

    // Get sales by day
    const salesByDay = await Transaction.aggregate([
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
    ]);

    // Get top products
    const topProducts = await Transaction.getTopProducts(startDate, endDate, 5);

    // Get sales by cashier
    const salesByCashier = await Transaction.getSalesByCashier(startDate, endDate);

    // Get low stock products
    const lowStockProducts = await Product.findLowStock();

    // Get out of stock products
    const outOfStockProducts = await Product.findOutOfStock();

    // Get user statistics
    const userStats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          activeCount: {
            $sum: { $cond: ['$isActive', 1, 0] }
          }
        }
      }
    ]);

    return {
      period: `${period} days`,
      sales: salesData[0] || {
        totalSales: 0,
        totalTransactions: 0,
        averageTransactionValue: 0
      },
      salesByDay,
      topProducts,
      salesByCashier,
      inventory: {
        lowStock: lowStockProducts.length,
        outOfStock: outOfStockProducts.length,
        lowStockProducts: lowStockProducts.slice(0, 5),
        outOfStockProducts: outOfStockProducts.slice(0, 5)
      },
      users: userStats
    };
  }

  /**
   * Get sales analytics
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

    let groupFormat: any = {};
    switch (groupBy) {
      case 'day':
        groupFormat = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        };
        break;
      case 'week':
        groupFormat = {
          year: { $year: '$createdAt' },
          week: { $week: '$createdAt' }
        };
        break;
      case 'month':
        groupFormat = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        };
        break;
    }

    const salesData = await Transaction.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: groupFormat,
          sales: { $sum: '$total' },
          transactions: { $sum: 1 },
          averageTransactionValue: { $avg: '$total' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    // Get payment method breakdown
    const paymentMethodData = await Transaction.aggregate([
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
    ]);

    return {
      period: { start, end },
      groupBy,
      salesData,
      paymentMethodData
    };
  }

  /**
   * Get product analytics
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

    // Get top selling products
    const topProducts = await Transaction.getTopProducts(start, end, limit);

    // Get category performance
    const categoryPerformance = await Transaction.aggregate([
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
    ]);

    // Get inventory value
    const inventoryValue = await Product.aggregate([
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
   * Get cashier performance analytics
   */
  static async getCashierAnalytics(filters: {
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

    // Get cashier activity by hour
    const cashierActivity = await Transaction.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: {
            cashierId: '$cashierId',
            cashierName: '$cashierName',
            hour: { $hour: '$createdAt' }
          },
          sales: { $sum: '$total' },
          transactions: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.cashierId',
          cashierName: { $first: '$_id.cashierName' },
          hourlyActivity: {
            $push: {
              hour: '$_id.hour',
              sales: '$sales',
              transactions: '$transactions'
            }
          }
        }
      }
    ]);

    return {
      period: { start, end },
      performance: cashierPerformance,
      activity: cashierActivity
    };
  }

  /**
   * Get inventory analytics
   */
  static async getInventoryAnalytics() {
    // Get inventory status
    const inventoryStatus = await Product.aggregate([
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
    ]);

    // Get category distribution
    const categoryDistribution = await Product.aggregate([
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
    ]);

    // Get low stock products
    const lowStockProducts = await Product.findLowStock();

    // Get out of stock products
    const outOfStockProducts = await Product.findOutOfStock();

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
