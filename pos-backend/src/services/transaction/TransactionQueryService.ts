import { Transaction } from '../../models/Transaction';
import { ITransaction } from '../../types';

export class TransactionQueryService {
  /**
   * Get all transactions with filtering and pagination
   */
  static async getTransactions(filters: {
    page?: number;
    limit?: number;
    startDate?: Date;
    endDate?: Date;
    cashierId?: string;
    paymentMethod?: string;
    status?: string;
    minAmount?: number;
    maxAmount?: number;
    sort?: string;
    order?: 'asc' | 'desc';
    userRole?: string;
    userId?: string;
  }) {
    const {
      page = 1,
      limit = 20,
      startDate,
      endDate,
      cashierId,
      paymentMethod,
      status = 'completed',
      minAmount,
      maxAmount,
      sort = 'createdAt',
      order = 'desc',
      userRole,
      userId
    } = filters;

    const query: any = {};

    // Apply filters
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = startDate;
      if (endDate) query.createdAt.$lte = endDate;
    }

    if (cashierId) query.cashierId = cashierId;
    if (paymentMethod) query.paymentMethod = paymentMethod;
    if (status) query.status = status;

    if (minAmount || maxAmount) {
      query.total = {};
      if (minAmount) query.total.$gte = minAmount;
      if (maxAmount) query.total.$lte = maxAmount;
    }

    // If user is cashier (not admin), only show their transactions
    if (userRole === 'cashier' && userId) {
      query.cashierId = userId;
    }

    const sortOrder = order === 'desc' ? -1 : 1;
    const sortObj: any = {};
    sortObj[sort] = sortOrder;

    const skip = (page - 1) * limit;

    const transactions = await Transaction.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(limit);

    const total = await Transaction.countDocuments(query);

    return {
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      }
    };
  }

  /**
   * Get single transaction by ID
   */
  static async getTransactionById(id: string, userRole?: string, userId?: string): Promise<ITransaction> {
    const transaction = await Transaction.findById(id);
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    // If user is cashier, only allow access to their own transactions
    if (userRole === 'cashier' && transaction.cashierId !== userId) {
      throw new Error('Access denied. You can only view your own transactions');
    }

    return transaction;
  }

  /**
   * Get daily sales summary
   */
  static async getDailySales(date: Date) {
    return await Transaction.getDailySales(date);
  }

  /**
   * Get sales by cashier
   */
  static async getSalesByCashier(startDate: Date, endDate: Date) {
    return await Transaction.getSalesByCashier(startDate, endDate);
  }

  /**
   * Get top products
   */
  static async getTopProducts(startDate: Date, endDate: Date, limit: number = 10) {
    return await Transaction.getTopProducts(startDate, endDate, limit);
  }

  /**
   * Get transactions by date range
   */
  static async getTransactionsByDateRange(startDate: Date, endDate: Date, filters: any = {}) {
    const query: any = {
      createdAt: { $gte: startDate, $lte: endDate },
      ...filters
    };

    return await Transaction.find(query).sort({ createdAt: -1 });
  }

  /**
   * Get transactions by cashier
   */
  static async getTransactionsByCashier(cashierId: string, filters: any = {}) {
    const query: any = {
      cashierId,
      ...filters
    };

    return await Transaction.find(query).sort({ createdAt: -1 });
  }

  /**
   * Get transactions by payment method
   */
  static async getTransactionsByPaymentMethod(paymentMethod: string, filters: any = {}) {
    const query: any = {
      paymentMethod,
      ...filters
    };

    return await Transaction.find(query).sort({ createdAt: -1 });
  }

  /**
   * Get transaction statistics
   */
  static async getTransactionStats(filters: any = {}) {
    const stats = await Transaction.aggregate([
      { $match: filters },
      {
        $group: {
          _id: null,
          totalTransactions: { $sum: 1 },
          totalSales: { $sum: '$total' },
          averageTransactionValue: { $avg: '$total' },
          totalTax: { $sum: '$tax' },
          totalDiscount: { $sum: '$discount' }
        }
      }
    ]);

    return stats[0] || {
      totalTransactions: 0,
      totalSales: 0,
      averageTransactionValue: 0,
      totalTax: 0,
      totalDiscount: 0
    };
  }
}
