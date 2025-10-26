import { Request, Response } from 'express';
import { Transaction } from '../models/Transaction';
import { TransactionService } from '../services/TransactionService';
import { TransactionExportService } from '../services/transaction/TransactionExportService';
import { ApiResponse } from '../types';

export class TransactionController {
  /**
   * Get all transactions with filtering and pagination
   */
  static async getTransactions(req: Request, res: Response): Promise<void> {
    try {
      const {
        page = 1,
        limit = 20,
        startDate,
        endDate,
        cashierId,
        paymentMethod,
        status,
        minAmount,
        maxAmount,
        search,
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

      // Search functionality
      if (search) {
        const searchRegex = new RegExp(search as string, 'i');
        filters.$or = [
          { transactionNumber: searchRegex },
          { cashierName: searchRegex },
          { 'items.productName': searchRegex }
        ];
      }

      // If user is cashier (not admin), only show their transactions
      if (req.user?.role === 'cashier') {
        filters.cashierId = req.user._id;
      }

      const result = await TransactionService.getTransactions({
        ...filters,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        sort: sort as string,
        order: order as 'asc' | 'desc',
        userRole: req.user?.role,
        userId: req.user?._id
      });

      res.json({
        success: true,
        message: 'Transactions retrieved successfully.',
        data: result.transactions,
        pagination: result.pagination,
      } as ApiResponse);
    } catch (error) {
      console.error('Get transactions error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while retrieving transactions.',
      } as ApiResponse);
    }
  }

  /**
   * Get single transaction by ID
   */
  static async getTransactionById(req: Request, res: Response): Promise<void> {
    try {
      const transaction = await TransactionService.getTransactionById(
        req.params.id,
        req.user?.role,
        req.user?._id
      );

      res.json({
        success: true,
        message: 'Transaction retrieved successfully.',
        data: transaction,
      } as ApiResponse);
    } catch (error: any) {
      console.error('Get transaction error:', error);
      
      if (error.message === 'Transaction not found') {
        res.status(404).json({
          success: false,
          message: 'Transaction not found.',
        } as ApiResponse);
      } else if (error.message === 'Access denied. You can only view your own transactions') {
        res.status(403).json({
          success: false,
          message: 'Access denied. You can only view your own transactions.',
        } as ApiResponse);
      } else {
        res.status(500).json({
          success: false,
          message: 'Server error while retrieving transaction.',
        } as ApiResponse);
      }
    }
  }

  /**
   * Create new transaction
   */
  static async createTransaction(req: Request, res: Response): Promise<void> {
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

      const transaction = await TransactionService.createTransaction({
        items,
        paymentMethod,
        customerId,
        customerName,
        notes,
        discount,
        tax,
        cashierId: req.user!._id,
        cashierName: `${req.user!.firstName} ${req.user!.lastName}`
      });

      res.status(201).json({
        success: true,
        message: 'Transaction created successfully.',
        data: transaction,
      } as ApiResponse);
    } catch (error: any) {
      console.error('Create transaction error:', error);
      
      if (error.message.includes('not found') || 
          error.message.includes('not active') || 
          error.message.includes('Insufficient stock')) {
        res.status(400).json({
          success: false,
          message: error.message,
        } as ApiResponse);
      } else {
        res.status(500).json({
          success: false,
          message: 'Server error while creating transaction.',
        } as ApiResponse);
      }
    }
  }

  /**
   * Refund transaction
   */
  static async refundTransaction(req: Request, res: Response): Promise<void> {
    try {
      // Only manager or superadmin can process refunds
      if (req.user?.role !== 'manager' && req.user?.role !== 'superadmin') {
        res.status(403).json({
          success: false,
          message: 'Access denied. Manager or Superadmin role required for refunds.',
        } as ApiResponse);
        return;
      }

      const { reason } = req.body;
      const transaction = await TransactionService.refundTransaction(req.params.id, reason);

      res.json({
        success: true,
        message: 'Transaction refunded successfully.',
        data: transaction,
      } as ApiResponse);
    } catch (error: any) {
      console.error('Refund transaction error:', error);
      
      if (error.message === 'Transaction not found') {
        res.status(404).json({
          success: false,
          message: 'Transaction not found.',
        } as ApiResponse);
      } else if (error.message === 'Only completed transactions can be refunded') {
        res.status(400).json({
          success: false,
          message: 'Only completed transactions can be refunded.',
        } as ApiResponse);
      } else {
        res.status(500).json({
          success: false,
          message: 'Server error while refunding transaction.',
        } as ApiResponse);
      }
    }
  }

  /**
   * Get daily sales summary
   */
  static async getDailySales(req: Request, res: Response): Promise<void> {
    try {
      if (req.user?.role !== 'manager' && req.user?.role !== 'superadmin') {
        res.status(403).json({
          success: false,
          message: 'Access denied. Manager or Superadmin role required.',
        } as ApiResponse);
        return;
      }

      const { date } = req.query;
      const targetDate = date ? new Date(date as string) : new Date();

      const salesData = await TransactionService.getDailySales(targetDate);

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
  }

  /**
   * Get sales by cashier
   */
  static async getSalesByCashier(req: Request, res: Response): Promise<void> {
    try {
      if (req.user?.role !== 'manager' && req.user?.role !== 'superadmin') {
        res.status(403).json({
          success: false,
          message: 'Access denied. Manager or Superadmin role required.',
        } as ApiResponse);
        return;
      }

      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      const end = endDate ? new Date(endDate as string) : new Date();

      const salesData = await TransactionService.getSalesByCashier(start, end);

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
  }

  /**
   * Get top products
   */
  static async getTopProducts(req: Request, res: Response): Promise<void> {
    try {
      if (req.user?.role !== 'manager' && req.user?.role !== 'superadmin') {
        res.status(403).json({
          success: false,
          message: 'Access denied. Manager or Superadmin role required.',
        } as ApiResponse);
        return;
      }

      const { startDate, endDate, limit = 10 } = req.query;
      const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      const end = endDate ? new Date(endDate as string) : new Date();

      const topProducts = await TransactionService.getTopProducts(start, end, parseInt(limit as string));

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
  }

  /**
   * Export transactions to CSV
   * GET /api/v1/transactions/export
   */
  static async exportTransactions(req: Request, res: Response): Promise<void> {
    try {
      const {
        startDate,
        endDate,
        status,
        cashierId,
      } = req.query;

      // Build filters
      const filters: any = {};

      if (startDate) {
        filters.startDate = new Date(startDate as string);
      }

      if (endDate) {
        filters.endDate = new Date(endDate as string);
      }

      if (status) {
        filters.status = status as string;
      }

      if (cashierId) {
        filters.cashierId = cashierId as string;
      }

      // Get export data
      const exportRows = await TransactionExportService.getExportData(filters);

      // Convert to CSV
      const csvData = TransactionExportService.convertToCSV(exportRows);

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const filename = `transactions_export_${timestamp}.csv`;

      // Set headers for CSV download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Pragma', 'no-cache');

      // Send CSV data
      res.status(200).send(csvData);
    } catch (error: any) {
      console.error('Export transactions error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while exporting transactions.',
        error: error.message,
      } as ApiResponse);
    }
  }

  /**
   * Get export statistics (preview before downloading)
   * GET /api/v1/transactions/export/stats
   */
  static async getExportStatistics(req: Request, res: Response): Promise<void> {
    try {
      const {
        startDate,
        endDate,
        status,
        cashierId,
      } = req.query;

      // Build filters
      const filters: any = {};

      if (startDate) {
        filters.startDate = new Date(startDate as string);
      }

      if (endDate) {
        filters.endDate = new Date(endDate as string);
      }

      if (status) {
        filters.status = status as string;
      }

      if (cashierId) {
        filters.cashierId = cashierId as string;
      }

      // Get statistics
      const stats = await TransactionExportService.getExportStatistics(filters);

      res.status(200).json({
        success: true,
        data: stats,
      } as ApiResponse);
    } catch (error: any) {
      console.error('Get export statistics error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while getting export statistics.',
        error: error.message,
      } as ApiResponse);
    }
  }
}
