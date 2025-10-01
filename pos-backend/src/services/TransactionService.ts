import { Transaction } from '../models/Transaction';
import { Product } from '../models/Product';
import { ITransaction } from '../types';
import { RealtimeAnalyticsService } from './RealtimeAnalyticsService';

export class TransactionService {
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
   * Create new transaction
   */
  static async createTransaction(transactionData: {
    items: Array<{
      productId: string;
      quantity: number;
      unitPrice?: number;
      discount?: number;
    }>;
    paymentMethod: 'cash' | 'card' | 'digital';
    customerId?: string;
    customerName?: string;
    notes?: string;
    discount?: number;
    tax?: number;
    cashierId: string;
    cashierName: string;
  }): Promise<ITransaction> {
    const {
      items,
      paymentMethod,
      customerId,
      customerName,
      notes,
      discount = 0,
      tax = 0,
      cashierId,
      cashierName
    } = transactionData;

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error('Transaction must have at least one item');
    }

    if (!paymentMethod) {
      throw new Error('Payment method is required');
    }

    // Validate and process items
    const processedItems = [];
    let subtotal = 0;

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        throw new Error(`Product with ID ${item.productId} not found`);
      }

      if (!product.isActive) {
        throw new Error(`Product ${product.name} is not active`);
      }

      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stock}`);
      }

      const unitPrice = item.unitPrice || product.price;
      const itemTotal = unitPrice * item.quantity;
      const itemDiscount = item.discount || 0;

      processedItems.push({
        productId: product._id,
        productName: product.name,
        quantity: item.quantity,
        unitPrice,
        totalPrice: itemTotal,
        discount: itemDiscount,
      });

      subtotal += itemTotal - itemDiscount;

      // Update product stock immediately
      product.stock -= item.quantity;
      await product.save();
    }

    // Generate transaction number
    const count = await Transaction.countDocuments();
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const sequence = String(count + 1).padStart(6, '0');
    const transactionNumber = `TXN${year}${month}${day}${sequence}`;

    // Create transaction
    const transaction = new Transaction({
      transactionNumber,
      items: processedItems,
      subtotal,
      tax,
      discount,
      total: subtotal + tax - discount,
      paymentMethod,
      cashierId,
      cashierName,
      customerId,
      customerName,
      notes,
    });

    await transaction.save();

    // Trigger real-time analytics update
    await RealtimeAnalyticsService.recalculateAndBroadcastAnalytics(
      transaction._id.toString(),
      cashierId,
      'create'
    );

    return transaction;
  }

  /**
   * Refund transaction
   */
  static async refundTransaction(transactionId: string, reason?: string): Promise<ITransaction> {
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    if (transaction.status !== 'completed') {
      throw new Error('Only completed transactions can be refunded');
    }

    // Restore product stock
    for (const item of transaction.items) {
      const product = await Product.findById(item.productId);
      if (product) {
        product.stock += item.quantity;
        await product.save();
      }
    }

    // Update transaction status
    transaction.status = 'refunded';
    if (reason) {
      transaction.notes = (transaction.notes || '') + `\nRefund reason: ${reason}`;
    }
    await transaction.save();

    // Trigger real-time analytics update
    await RealtimeAnalyticsService.recalculateAndBroadcastAnalytics(
      transaction._id.toString(),
      transaction.cashierId,
      'refund'
    );

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
}
