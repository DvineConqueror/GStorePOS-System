import express from 'express';
import { Transaction } from '../models/Transaction';
import { Product } from '../models/Product';
import { authenticate, requireCashier } from '../middleware/auth';
import { ApiResponse, TransactionFilters } from '../types';

const router = express.Router();

// @desc    Get all transactions with filtering and pagination
// @route   GET /api/v1/transactions
// @access  Private (Cashier, Admin)
router.get('/', authenticate, requireCashier, async (req, res): Promise<void> => {
  try {
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
      order = 'desc'
    } = req.query;

    const filters: any = {};

    // Apply filters
    if (startDate || endDate) {
      filters.createdAt = {};
      if (startDate) filters.createdAt.$gte = new Date(startDate as string);
      if (endDate) filters.createdAt.$lte = new Date(endDate as string);
    }

    if (cashierId) filters.cashierId = cashierId;
    if (paymentMethod) filters.paymentMethod = paymentMethod;
    if (status) filters.status = status;

    if (minAmount || maxAmount) {
      filters.total = {};
      if (minAmount) filters.total.$gte = parseFloat(minAmount as string);
      if (maxAmount) filters.total.$lte = parseFloat(maxAmount as string);
    }

    // If user is cashier (not admin), only show their transactions
    if (req.user?.role === 'cashier') {
      filters.cashierId = req.user._id;
    }

    const sortOrder = order === 'desc' ? -1 : 1;
    const sortObj: any = {};
    sortObj[sort as string] = sortOrder;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const transactions = await Transaction.find(filters)
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit as string));

    const total = await Transaction.countDocuments(filters);

    res.json({
      success: true,
      message: 'Transactions retrieved successfully.',
      data: transactions,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    } as ApiResponse);
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving transactions.',
    } as ApiResponse);
  }
});

// @desc    Get single transaction by ID
// @route   GET /api/v1/transactions/:id
// @access  Private (Cashier, Admin)
router.get('/:id', authenticate, requireCashier, async (req, res): Promise<void> => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      res.status(404).json({
        success: false,
        message: 'Transaction not found.',
      } as ApiResponse);
      return;
    }

    // If user is cashier, only allow access to their own transactions
    if (req.user?.role === 'cashier' && transaction.cashierId !== req.user._id) {
      res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own transactions.',
      } as ApiResponse);
      return;
    }

    res.json({
      success: true,
      message: 'Transaction retrieved successfully.',
      data: transaction,
    } as ApiResponse);
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving transaction.',
    } as ApiResponse);
  }
});

// @desc    Create new transaction
// @route   POST /api/v1/transactions
// @access  Private (Cashier, Admin)
router.post('/', authenticate, requireCashier, async (req, res): Promise<void> => {
  try {
    const {
      items,
      paymentMethod,
      customerId,
      customerName,
      notes,
      discount = 0,
      tax = 0
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Transaction must have at least one item.',
      } as ApiResponse);
      return;
    }

    if (!paymentMethod) {
      res.status(400).json({
        success: false,
        message: 'Payment method is required.',
      } as ApiResponse);
      return;
    }

    // Validate and process items
    const processedItems = [];
    let subtotal = 0;

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        res.status(400).json({
          success: false,
          message: `Product with ID ${item.productId} not found.`,
        } as ApiResponse);
        return;
      }

      if (!product.isActive) {
        res.status(400).json({
          success: false,
          message: `Product ${product.name} is not active.`,
        } as ApiResponse);
        return;
      }

      if (product.stock < item.quantity) {
        res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Available: ${product.stock}`,
        } as ApiResponse);
        return;
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

      // Update product stock
      product.stock -= item.quantity;
      await product.save();
    }

    // Create transaction
    const transaction = new Transaction({
      items: processedItems,
      subtotal,
      tax,
      discount,
      total: subtotal + tax - discount,
      paymentMethod,
      cashierId: req.user!._id,
      cashierName: `${req.user!.firstName} ${req.user!.lastName}`,
      customerId,
      customerName,
      notes,
    });

    await transaction.save();

    res.status(201).json({
      success: true,
      message: 'Transaction created successfully.',
      data: transaction,
    } as ApiResponse);
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating transaction.',
    } as ApiResponse);
  }
});

// @desc    Refund transaction
// @route   POST /api/v1/transactions/:id/refund
// @access  Private (Admin only)
router.post('/:id/refund', authenticate, async (req, res): Promise<void> => {
  try {
    // Only admin can process refunds
    if (req.user?.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required for refunds.',
      } as ApiResponse);
      return;
    }

    const { reason } = req.body;
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      res.status(404).json({
        success: false,
        message: 'Transaction not found.',
      } as ApiResponse);
      return;
    }

    if (transaction.status !== 'completed') {
      res.status(400).json({
        success: false,
        message: 'Only completed transactions can be refunded.',
      } as ApiResponse);
      return;
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

    res.json({
      success: true,
      message: 'Transaction refunded successfully.',
      data: transaction,
    } as ApiResponse);
  } catch (error) {
    console.error('Refund transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while refunding transaction.',
    } as ApiResponse);
  }
});

// @desc    Void transaction
// @route   POST /api/v1/transactions/:id/void
// @access  Private (Admin only)
router.post('/:id/void', authenticate, async (req, res): Promise<void> => {
  try {
    // Only admin can void transactions
    if (req.user?.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required to void transactions.',
      } as ApiResponse);
      return;
    }

    const { reason } = req.body;
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      res.status(404).json({
        success: false,
        message: 'Transaction not found.',
      } as ApiResponse);
      return;
    }

    if (transaction.status !== 'completed') {
      res.status(400).json({
        success: false,
        message: 'Only completed transactions can be voided.',
      } as ApiResponse);
      return;
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
    transaction.status = 'voided';
    if (reason) {
      transaction.notes = (transaction.notes || '') + `\nVoid reason: ${reason}`;
    }
    await transaction.save();

    res.json({
      success: true,
      message: 'Transaction voided successfully.',
      data: transaction,
    } as ApiResponse);
  } catch (error) {
    console.error('Void transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while voiding transaction.',
    } as ApiResponse);
  }
});

// @desc    Get daily sales summary
// @route   GET /api/v1/transactions/sales/daily
// @access  Private (Admin only)
router.get('/sales/daily', authenticate, async (req, res): Promise<void> => {
  try {
    if (req.user?.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.',
      } as ApiResponse);
      return;
    }

    const { date } = req.query;
    const targetDate = date ? new Date(date as string) : new Date();

    const salesData = await Transaction.getDailySales(targetDate);

    res.json({
      success: true,
      message: 'Daily sales data retrieved successfully.',
      data: salesData[0] || {
        totalSales: 0,
        totalTransactions: 0,
        averageTransactionValue: 0,
      },
    } as ApiResponse);
  } catch (error) {
    console.error('Get daily sales error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving daily sales.',
    } as ApiResponse);
  }
});

// @desc    Get sales by cashier
// @route   GET /api/v1/transactions/sales/by-cashier
// @access  Private (Admin only)
router.get('/sales/by-cashier', authenticate, async (req, res): Promise<void> => {
  try {
    if (req.user?.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.',
      } as ApiResponse);
      return;
    }

    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const end = endDate ? new Date(endDate as string) : new Date();

    const salesData = await Transaction.getSalesByCashier(start, end);

    res.json({
      success: true,
      message: 'Sales by cashier data retrieved successfully.',
      data: salesData,
    } as ApiResponse);
  } catch (error) {
    console.error('Get sales by cashier error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving sales by cashier.',
    } as ApiResponse);
  }
});

// @desc    Get top products
// @route   GET /api/v1/transactions/sales/top-products
// @access  Private (Admin only)
router.get('/sales/top-products', authenticate, async (req, res): Promise<void> => {
  try {
    if (req.user?.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.',
      } as ApiResponse);
      return;
    }

    const { startDate, endDate, limit = 10 } = req.query;
    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const end = endDate ? new Date(endDate as string) : new Date();

    const topProducts = await Transaction.getTopProducts(start, end, parseInt(limit as string));

    res.json({
      success: true,
      message: 'Top products data retrieved successfully.',
      data: topProducts,
    } as ApiResponse);
  } catch (error) {
    console.error('Get top products error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving top products.',
    } as ApiResponse);
  }
});

export default router;