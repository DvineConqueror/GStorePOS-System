import { Transaction } from '../../models/Transaction';
import { Product } from '../../models/Product';
import { User } from '../../models/User';

export class AnalyticsQueryService {
  /**
   * Get sales data aggregation
   */
  static async getSalesData(startDate: Date, endDate: Date) {
    return await Transaction.aggregate([
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
  }

  /**
   * Get sales by day aggregation
   */
  static async getSalesByDay(startDate: Date, endDate: Date) {
    return await Transaction.aggregate([
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
  }

  /**
   * Get sales data grouped by time period
   */
  static async getSalesByPeriod(startDate: Date, endDate: Date, groupBy: 'day' | 'week' | 'month') {
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

    return await Transaction.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
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
  }

  /**
   * Get payment method breakdown
   */
  static async getPaymentMethodData(startDate: Date, endDate: Date) {
    return await Transaction.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
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
  }

  /**
   * Get category performance data
   */
  static async getCategoryPerformance(startDate: Date, endDate: Date) {
    return await Transaction.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
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
  }

  /**
   * Get cashier activity by hour
   */
  static async getCashierActivity(startDate: Date, endDate: Date) {
    return await Transaction.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
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
  }

  /**
   * Get inventory status aggregation
   */
  static async getInventoryStatus() {
    return await Product.aggregate([
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
  }

  /**
   * Get category distribution
   */
  static async getCategoryDistribution() {
    return await Product.aggregate([
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
  }

  /**
   * Get inventory value aggregation
   */
  static async getInventoryValue() {
    return await Product.aggregate([
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
  }

  /**
   * Get user statistics aggregation
   */
  static async getUserStats() {
    return await User.aggregate([
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
  }
}
