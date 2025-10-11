import { TransactionQueryService } from './transaction/TransactionQueryService';
import { TransactionManagementService } from './transaction/TransactionManagementService';

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
    return TransactionQueryService.getTransactions(filters);
  }

  /**
   * Get single transaction by ID
   */
  static async getTransactionById(id: string, userRole?: string, userId?: string) {
    return TransactionQueryService.getTransactionById(id, userRole, userId);
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
  }) {
    return TransactionManagementService.createTransaction(transactionData);
  }

  /**
   * Refund transaction
   */
  static async refundTransaction(transactionId: string, reason?: string) {
    return TransactionManagementService.refundTransaction(transactionId, reason);
  }

  /**
   * Get daily sales summary
   */
  static async getDailySales(date: Date) {
    return TransactionQueryService.getDailySales(date);
  }

  /**
   * Get sales by cashier
   */
  static async getSalesByCashier(startDate: Date, endDate: Date) {
    return TransactionQueryService.getSalesByCashier(startDate, endDate);
  }

  /**
   * Get top products
   */
  static async getTopProducts(startDate: Date, endDate: Date, limit: number = 10) {
    return TransactionQueryService.getTopProducts(startDate, endDate, limit);
  }
}