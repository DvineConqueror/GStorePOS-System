/**
 * Transaction Export Service
 * 
 * Handles formatting transaction data for CSV/Excel export
 * Supports KPIs:
 * - KPI 1: Product performance per number of transactions
 * - KPI 2: Sales improvement over time (weekly/monthly)
 * - KPI 3: Category activity in sales
 */

import { Transaction } from '../../models/Transaction';
import { Product } from '../../models/Product';
import { ITransaction } from '../../types';

export interface ExportRow {
  transactionNumber: string;
  date: string;
  time: string;
  week: string;
  month: string;
  cashierName: string;
  productId: string;
  productName: string;
  category: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  totalTransactionValue: number;
  status: string;
}

export class TransactionExportService {
  /**
   * Get formatted transaction data for CSV export
   * 
   * @param filters - Date range and status filters
   * @returns Array of formatted export rows
   */
  static async getExportData(filters: {
    startDate?: Date;
    endDate?: Date;
    status?: string;
    cashierId?: string;
  }): Promise<ExportRow[]> {
    const { startDate, endDate, status, cashierId } = filters;

    // Build query
    const query: any = {};

    if (startDate && endDate) {
      query.createdAt = {
        $gte: startDate,
        $lte: endDate,
      };
    }

    if (status) {
      query.status = status;
    }

    if (cashierId) {
      query.cashierId = cashierId;
    }

    // Fetch transactions
    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .lean();

    // Format data into flat rows (one row per product per transaction)
    const exportRows: ExportRow[] = [];

    // Collect all product IDs to fetch in batch
    const productIds = new Set<string>();
    for (const transaction of transactions) {
      if (transaction.items) {
        for (const item of transaction.items) {
          if (item.productId) {
            productIds.add(item.productId.toString());
          }
        }
      }
    }

    // Fetch all products in one query
    const products = await Product.find({ _id: { $in: Array.from(productIds) } }).lean();
    const productMap = new Map(
      products.map(p => [p._id.toString(), p])
    );

    for (const transaction of transactions) {
      const transactionDate = new Date(transaction.createdAt);
      
      // Calculate week number (ISO week)
      const weekNumber = this.getWeekNumber(transactionDate);
      
      // Format date and time
      const date = transactionDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      
      const time = transactionDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
      
      const week = `Week ${weekNumber}`;
      
      const month = transactionDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
      });

      // Get transaction total
      const totalTransactionValue = transaction.total;

      // Map status
      const statusText = transaction.status === 'completed' ? 'Completed' : 'Refunded';

      // Create a row for each item in the transaction
      if (transaction.items && transaction.items.length > 0) {
        for (const item of transaction.items) {
          const productId = item.productId?.toString() || '';
          const product = productMap.get(productId);
          
          exportRows.push({
            transactionNumber: transaction.transactionNumber,
            date,
            time,
            week,
            month,
            cashierName: transaction.cashierName || 'Unknown',
            productId,
            productName: item.productName || 'Unknown Product',
            category: product?.category || 'Uncategorized',
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            lineTotal: item.totalPrice,
            totalTransactionValue,
            status: statusText,
          });
        }
      } else {
        // If no items, create a single row for the transaction
        exportRows.push({
          transactionNumber: transaction.transactionNumber,
          date,
          time,
          week,
          month,
          cashierName: transaction.cashierName || 'Unknown',
          productId: '',
          productName: 'No items',
          category: '',
          quantity: 0,
          unitPrice: 0,
          lineTotal: 0,
          totalTransactionValue,
          status: statusText,
        });
      }
    }

    return exportRows;
  }

  /**
   * Convert export rows to CSV string
   * 
   * @param rows - Array of export rows
   * @returns CSV string
   */
  static convertToCSV(rows: ExportRow[]): string {
    if (rows.length === 0) {
      return 'No data available';
    }

    // Define headers
    const headers = [
      'Transaction Number',
      'Date',
      'Time',
      'Week',
      'Month',
      'Cashier Name',
      'Product ID',
      'Product Name',
      'Category',
      'Quantity',
      'Unit Price',
      'Line Total',
      'Total Transaction Value',
      'Status',
    ];

    // Create CSV header row
    const csvRows: string[] = [headers.join(',')];

    // Add data rows
    for (const row of rows) {
      const values = [
        this.escapeCSV(row.transactionNumber),
        this.escapeCSV(row.date),
        this.escapeCSV(row.time),
        this.escapeCSV(row.week),
        this.escapeCSV(row.month),
        this.escapeCSV(row.cashierName),
        this.escapeCSV(row.productId),
        this.escapeCSV(row.productName),
        this.escapeCSV(row.category),
        row.quantity.toString(),
        row.unitPrice.toFixed(2),
        row.lineTotal.toFixed(2),
        row.totalTransactionValue.toFixed(2),
        this.escapeCSV(row.status),
      ];
      csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
  }

  /**
   * Escape CSV field (handle commas, quotes, newlines)
   * 
   * @param field - Field value to escape
   * @returns Escaped field value
   */
  private static escapeCSV(field: string): string {
    if (field === null || field === undefined) {
      return '';
    }

    const stringField = String(field);

    // If field contains comma, quote, or newline, wrap in quotes and escape quotes
    if (
      stringField.includes(',') ||
      stringField.includes('"') ||
      stringField.includes('\n')
    ) {
      return `"${stringField.replace(/"/g, '""')}"`;
    }

    return stringField;
  }

  /**
   * Get ISO week number for a date
   * 
   * @param date - Date to get week number for
   * @returns Week number (1-53)
   */
  private static getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }

  /**
   * Get export statistics
   * 
   * @param filters - Date range and status filters
   * @returns Export statistics
   */
  static async getExportStatistics(filters: {
    startDate?: Date;
    endDate?: Date;
    status?: string;
    cashierId?: string;
  }): Promise<{
    totalTransactions: number;
    totalRows: number;
    dateRange: { start: string; end: string };
  }> {
    const rows = await this.getExportData(filters);

    // Count unique transactions
    const uniqueTransactions = new Set(rows.map(row => row.transactionNumber));

    return {
      totalTransactions: uniqueTransactions.size,
      totalRows: rows.length,
      dateRange: {
        start: filters.startDate?.toISOString() || 'N/A',
        end: filters.endDate?.toISOString() || 'N/A',
      },
    };
  }
}

