import { Transaction } from '../../models/Transaction';
import { Product } from '../../models/Product';
import { ITransaction } from '../../types';
import { RealtimeAnalyticsService } from '../RealtimeAnalyticsService';
import { TransactionValidationService } from './TransactionValidationService';
import { calculateVATFromInclusive } from '../../utils/vat';
import { calculateTransactionDiscount } from '../../utils/seniorPwdDiscount';
import SystemSettingsService from '../SystemSettingsService';

export class TransactionManagementService {
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
    customerType?: 'regular' | 'senior' | 'pwd';
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
      customerType = 'regular',
      notes,
      discount = 0,
      tax = 0,
      cashierId,
      cashierName
    } = transactionData;

    // Validate transaction data
    await TransactionValidationService.validateTransactionData(transactionData);

    // Validate and process items
    const processedItems = [];
    const itemsForDiscount = [];
    let subtotal = 0;

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        throw new Error(`Product with ID ${item.productId} not found`);
      }

      if (product.status !== 'available') {
        throw new Error(`Product ${product.name} is not available`);
      }

      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stock}`);
      }

      const unitPrice = item.unitPrice || product.price;
      
      // Collect items for discount calculation
      itemsForDiscount.push({
        productId: product._id.toString(),
        productName: product.name,
        price: unitPrice,
        quantity: item.quantity,
        isDiscountable: product.isDiscountable || true,
        isVatExemptable: product.isVatExemptable || true,
      });

      // Update product stock immediately
      product.stock -= item.quantity;
      await product.save();
    }

    // Calculate Senior/PWD discounts if applicable
    const discountResult = calculateTransactionDiscount(itemsForDiscount, customerType);

    // Map discount results to transaction items
    discountResult.items.forEach((discountedItem) => {
      processedItems.push({
        productId: discountedItem.productId,
        productName: discountedItem.productName,
        quantity: discountedItem.quantity,
        unitPrice: discountedItem.unitPrice,
        totalPrice: discountedItem.totalPrice,
        discount: discountedItem.discount || 0,
        vatExempt: discountedItem.vatExempt,
        discountApplied: discountedItem.discountApplied,
        discountAmount: discountedItem.discountAmount,
        finalPrice: discountedItem.finalPrice,
      });
    });

    subtotal = discountResult.subtotal;

    // Generate transaction number
    const transactionNumber = await this.generateTransactionNumber();

    // Use the amount due from discount calculation
    const total = discountResult.amountDue;

    // Get VAT rate from system settings
    const settings = await SystemSettingsService.getSettings();
    const vatRate = settings?.taxRate || 12; // Default to 12% if not set

    // Calculate VAT breakdown (for regular customers or final amount)
    const vatBreakdown = customerType === 'regular' 
      ? calculateVATFromInclusive(total, vatRate)
      : {
          total: discountResult.amountDue,
          vatAmount: discountResult.totalVatExempt,
          netSales: discountResult.amountDue - discountResult.totalVatExempt,
          vatRate: vatRate
        };

    // Create transaction
    const transaction = new Transaction({
      transactionNumber,
      items: processedItems,
      subtotal: discountResult.subtotal,
      tax,
      discount,
      total: discountResult.amountDue,
      vatAmount: vatBreakdown.vatAmount,
      netSales: vatBreakdown.netSales,
      vatRate: vatBreakdown.vatRate,
      customerType,
      totalVatExempt: discountResult.totalVatExempt,
      totalDiscountAmount: discountResult.totalDiscountAmount,
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
   * Update transaction status
   */
  static async updateTransactionStatus(transactionId: string, status: string): Promise<ITransaction> {
    const transaction = await Transaction.findByIdAndUpdate(
      transactionId,
      { status },
      { new: true }
    );

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    return transaction;
  }

  /**
   * Cancel transaction
   */
  static async cancelTransaction(transactionId: string, reason?: string): Promise<ITransaction> {
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    if (transaction.status !== 'completed') {
      throw new Error('Only completed transactions can be cancelled');
    }

    // Restore product stock
    for (const item of transaction.items) {
      const product = await Product.findById(item.productId);
      if (product) {
        product.stock += item.quantity;
        await product.save();
      }
    }

    // Update transaction status to refunded (since cancelled is not a valid status)
    transaction.status = 'refunded';
    if (reason) {
      transaction.notes = (transaction.notes || '') + `\nCancellation reason: ${reason}`;
    }
    await transaction.save();

    return transaction;
  }

  /**
   * Generate transaction number
   */
  private static async generateTransactionNumber(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const datePrefix = `TXN${year}${month}${day}`;

    // Find the highest transaction number for today
    const latestTransaction = await Transaction.findOne({
      transactionNumber: { $regex: `^${datePrefix}` }
    })
      .sort({ transactionNumber: -1 })
      .select('transactionNumber')
      .lean();

    let sequence = 1;
    if (latestTransaction && latestTransaction.transactionNumber) {
      // Extract the sequence number from the last transaction
      const lastSequence = parseInt(latestTransaction.transactionNumber.slice(-6));
      sequence = lastSequence + 1;
    }

    // Ensure uniqueness with retry logic (in case of race conditions)
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      const transactionNumber = `${datePrefix}${String(sequence).padStart(6, '0')}`;
      
      // Check if this number already exists
      const exists = await Transaction.exists({ transactionNumber });
      
      if (!exists) {
        return transactionNumber;
      }
      
      // If it exists, increment and try again
      sequence++;
      attempts++;
    }

    // Fallback: use timestamp-based unique identifier
    const timestamp = Date.now().toString().slice(-6);
    return `${datePrefix}${timestamp}`;
  }

  /**
   * Bulk refund transactions
   */
  static async bulkRefundTransactions(transactionIds: string[], reason?: string): Promise<ITransaction[]> {
    const results: ITransaction[] = [];
    
    for (const transactionId of transactionIds) {
      try {
        const transaction = await this.refundTransaction(transactionId, reason);
        results.push(transaction);
      } catch (error) {
        console.error(`Failed to refund transaction ${transactionId}:`, error);
        throw error;
      }
    }
    
    return results;
  }
}
