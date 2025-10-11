import { Transaction } from '../../models/Transaction';
import { Product } from '../../models/Product';

export class TransactionValidationService {
  /**
   * Validate transaction data
   */
  static async validateTransactionData(transactionData: {
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
  }): Promise<void> {
    const { items, paymentMethod, cashierId, cashierName } = transactionData;

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error('Transaction must have at least one item');
    }

    if (!paymentMethod) {
      throw new Error('Payment method is required');
    }

    if (!cashierId) {
      throw new Error('Cashier ID is required');
    }

    if (!cashierName) {
      throw new Error('Cashier name is required');
    }

    // Validate payment method
    if (!['cash', 'card', 'digital'].includes(paymentMethod)) {
      throw new Error('Invalid payment method');
    }

    // Validate items
    for (const item of items) {
      await this.validateTransactionItem(item);
    }

    // Validate discount and tax
    if (transactionData.discount !== undefined && transactionData.discount < 0) {
      throw new Error('Discount cannot be negative');
    }

    if (transactionData.tax !== undefined && transactionData.tax < 0) {
      throw new Error('Tax cannot be negative');
    }
  }

  /**
   * Validate transaction item
   */
  static async validateTransactionItem(item: {
    productId: string;
    quantity: number;
    unitPrice?: number;
    discount?: number;
  }): Promise<void> {
    const { productId, quantity, unitPrice, discount } = item;

    // Validate required fields
    if (!productId) {
      throw new Error('Product ID is required for each item');
    }

    if (!quantity || quantity <= 0) {
      throw new Error('Quantity must be greater than 0');
    }

    // Validate product exists and is active
    const product = await Product.findById(productId);
    if (!product) {
      throw new Error(`Product with ID ${productId} not found`);
    }

    if (product.status !== 'active') {
      throw new Error(`Product ${product.name} is not active`);
    }

    // Validate stock availability
    if (product.stock < quantity) {
      throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stock}`);
    }

    // Validate unit price
    if (unitPrice !== undefined && unitPrice < 0) {
      throw new Error('Unit price cannot be negative');
    }

    // Validate discount
    if (discount !== undefined && discount < 0) {
      throw new Error('Item discount cannot be negative');
    }
  }

  /**
   * Validate transaction exists
   */
  static async validateTransactionExists(transactionId: string): Promise<void> {
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      throw new Error('Transaction not found');
    }
  }

  /**
   * Validate transaction can be refunded
   */
  static async validateTransactionCanBeRefunded(transactionId: string): Promise<void> {
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    if (transaction.status !== 'completed') {
      throw new Error('Only completed transactions can be refunded');
    }
  }

  /**
   * Validate transaction can be cancelled
   */
  static async validateTransactionCanBeCancelled(transactionId: string): Promise<void> {
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    if (transaction.status !== 'completed') {
      throw new Error('Only completed transactions can be cancelled');
    }
  }

  /**
   * Validate user can access transaction
   */
  static validateUserCanAccessTransaction(transaction: any, userRole: string, userId: string): void {
    if (userRole === 'cashier' && transaction.cashierId !== userId) {
      throw new Error('Access denied. You can only view your own transactions');
    }
  }

  /**
   * Validate date range
   */
  static validateDateRange(startDate: Date, endDate: Date): void {
    if (startDate > endDate) {
      throw new Error('Start date cannot be after end date');
    }

    const now = new Date();
    if (startDate > now) {
      throw new Error('Start date cannot be in the future');
    }
  }

  /**
   * Validate amount range
   */
  static validateAmountRange(minAmount: number, maxAmount: number): void {
    if (minAmount < 0) {
      throw new Error('Minimum amount cannot be negative');
    }

    if (maxAmount < 0) {
      throw new Error('Maximum amount cannot be negative');
    }

    if (minAmount > maxAmount) {
      throw new Error('Minimum amount cannot be greater than maximum amount');
    }
  }

  /**
   * Validate transaction status
   */
  static validateTransactionStatus(status: string): void {
    const validStatuses = ['completed', 'refunded'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid transaction status. Must be one of: ${validStatuses.join(', ')}`);
    }
  }
}
