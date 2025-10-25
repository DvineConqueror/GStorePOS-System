import { Transaction } from '../../models/Transaction';
import { ITransaction } from '../../types';

export class SalesTrendService {
  /**
   * Get sales trends with different grouping periods
   */
  static async getSalesTrends(
    period: 'weekly' | 'monthly' | 'annual',
    cashierId?: string,
    daysBack: number = 30
  ): Promise<Array<{ label: string; sales: number; transactions: number; date: Date }>> {
    const endDate = new Date();
    const startDate = new Date();

    // Calculate start date based on period
    switch (period) {
      case 'weekly':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'monthly':
        startDate.setMonth(endDate.getMonth() - 12); // Last 12 months
        break;
      case 'annual':
        startDate.setFullYear(endDate.getFullYear() - 5); // Last 5 years
        break;
    }

    // Build query
    const query: any = {
      status: 'completed',
      createdAt: { $gte: startDate, $lte: endDate }
    };

    if (cashierId) {
      query.cashierId = cashierId;
    }

    // Fetch transactions
    const transactions = await Transaction.find(query)
      .select('total createdAt status')
      .sort({ createdAt: 1 })
      .lean();

    // Group transactions by period
    return this.groupTransactionsByPeriod(transactions as ITransaction[], period, startDate, endDate);
  }

  /**
   * Group transactions by period (weekly, monthly, annual)
   */
  private static groupTransactionsByPeriod(
    transactions: ITransaction[],
    period: 'weekly' | 'monthly' | 'annual',
    startDate: Date,
    endDate: Date
  ): Array<{ label: string; sales: number; transactions: number; date: Date }> {
    const grouped = new Map<string, { sales: number; transactions: number; date: Date }>();

    // Initialize periods
    const periods = this.generatePeriods(period, startDate, endDate);
    periods.forEach(({ key, label, date }) => {
      grouped.set(key, { sales: 0, transactions: 0, date });
    });

    // Group transactions
    transactions.forEach((transaction) => {
      const key = this.getGroupKey(new Date(transaction.createdAt), period);
      const existing = grouped.get(key);
      if (existing) {
        existing.sales += transaction.total;
        existing.transactions += 1;
      }
    });

    // Convert to array with labels
    return Array.from(grouped.entries()).map(([key, data]) => {
      const label = this.formatLabel(data.date, period);
      return { label, ...data };
    });
  }

  /**
   * Generate all periods in the date range
   */
  private static generatePeriods(
    period: 'weekly' | 'monthly' | 'annual',
    startDate: Date,
    endDate: Date
  ): Array<{ key: string; label: string; date: Date }> {
    const periods: Array<{ key: string; label: string; date: Date }> = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      const date = new Date(current);
      const key = this.getGroupKey(date, period);
      const label = this.formatLabel(date, period);
      periods.push({ key, label, date });

      // Increment based on period
      switch (period) {
        case 'weekly':
          current.setDate(current.getDate() + 1);
          break;
        case 'monthly':
          current.setMonth(current.getMonth() + 1);
          break;
        case 'annual':
          current.setFullYear(current.getFullYear() + 1);
          break;
      }
    }

    return periods;
  }

  /**
   * Get group key for a date based on period
   */
  private static getGroupKey(date: Date, period: 'weekly' | 'monthly' | 'annual'): string {
    switch (period) {
      case 'weekly':
        return date.toISOString().split('T')[0]; // YYYY-MM-DD
      case 'monthly':
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
      case 'annual':
        return String(date.getFullYear()); // YYYY
    }
  }

  /**
   * Format label for display
   */
  private static formatLabel(date: Date, period: 'weekly' | 'monthly' | 'annual'): string {
    switch (period) {
      case 'weekly':
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      case 'monthly':
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      case 'annual':
        return String(date.getFullYear());
    }
  }

  /**
   * Get sales trends for manager (all transactions)
   */
  static async getManagerSalesTrends(
    period: 'weekly' | 'monthly' | 'annual'
  ): Promise<Array<{ label: string; sales: number; transactions: number }>> {
    const trends = await this.getSalesTrends(period);
    return trends.map(({ label, sales, transactions }) => ({ label, sales, transactions }));
  }

  /**
   * Get sales trends for cashier (only their transactions)
   */
  static async getCashierSalesTrends(
    cashierId: string,
    period: 'weekly' | 'monthly' | 'annual'
  ): Promise<Array<{ label: string; sales: number; transactions: number }>> {
    const trends = await this.getSalesTrends(period, cashierId);
    return trends.map(({ label, sales, transactions }) => ({ label, sales, transactions }));
  }
}

