import express from 'express';
import { Transaction } from '../models/Transaction';
import { Product } from '../models/Product';
import { User } from '../models/User';
import { authenticate, requireAdmin } from '../middleware/auth';
import { ApiResponse } from '../types';

const router = express.Router();

// @desc    Get dashboard analytics
// @route   GET /api/v1/analytics/dashboard
// @access  Private (Admin only)
router.get('/dashboard', authenticate, requireAdmin, async (req, res): Promise<void> => {
  try {
    const { period = '30' } = req.query; // days
    const days = parseInt(period as string);
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
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

    res.json({
      success: true,
      message: 'Dashboard analytics retrieved successfully.',
      data: {
        period: `${days} days`,
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
      }
    } as ApiResponse);
  } catch (error) {
    console.error('Get dashboard analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving dashboard analytics.',
    } as ApiResponse);
  }
});

// @desc    Get sales analytics
// @route   GET /api/v1/analytics/sales
// @access  Private (Admin only)
router.get('/sales', authenticate, requireAdmin, async (req, res): Promise<void> => {
  try {
    const { 
      startDate, 
      endDate, 
      groupBy = 'day' // day, week, month
    } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

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

    res.json({
      success: true,
      message: 'Sales analytics retrieved successfully.',
      data: {
        period: { start, end },
        groupBy,
        salesData,
        paymentMethodData
      }
    } as ApiResponse);
  } catch (error) {
    console.error('Get sales analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving sales analytics.',
    } as ApiResponse);
  }
});

// @desc    Get product analytics
// @route   GET /api/v1/analytics/products
// @access  Private (Admin only)
router.get('/products', authenticate, requireAdmin, async (req, res): Promise<void> => {
  try {
    const { 
      startDate, 
      endDate, 
      limit = 20 
    } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    // Get top selling products
    const topProducts = await Transaction.getTopProducts(start, end, parseInt(limit as string));

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

    res.json({
      success: true,
      message: 'Product analytics retrieved successfully.',
      data: {
        period: { start, end },
        topProducts,
        categoryPerformance,
        inventory: inventoryValue[0] || {
          totalValue: 0,
          totalCost: 0,
          totalItems: 0,
          totalStock: 0
        }
      }
    } as ApiResponse);
  } catch (error) {
    console.error('Get product analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving product analytics.',
    } as ApiResponse);
  }
});

// @desc    Get cashier performance
// @route   GET /api/v1/analytics/cashiers
// @access  Private (Admin only)
router.get('/cashiers', authenticate, requireAdmin, async (req, res): Promise<void> => {
  try {
    const { 
      startDate, 
      endDate 
    } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

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

    res.json({
      success: true,
      message: 'Cashier analytics retrieved successfully.',
      data: {
        period: { start, end },
        performance: cashierPerformance,
        activity: cashierActivity
      }
    } as ApiResponse);
  } catch (error) {
    console.error('Get cashier analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving cashier analytics.',
    } as ApiResponse);
  }
});

// @desc    Get inventory analytics
// @route   GET /api/v1/analytics/inventory
// @access  Private (Admin only)
router.get('/inventory', authenticate, requireAdmin, async (req, res): Promise<void> => {
  try {
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

    res.json({
      success: true,
      message: 'Inventory analytics retrieved successfully.',
      data: {
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
      }
    } as ApiResponse);
  } catch (error) {
    console.error('Get inventory analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving inventory analytics.',
    } as ApiResponse);
  }
});

export default router;
