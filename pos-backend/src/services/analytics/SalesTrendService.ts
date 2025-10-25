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
        // Get first day of current month for weekly breakdown
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
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
    if (period === 'weekly') {
      // Special handling for weekly - group by weeks of the month
      return this.groupByWeeksOfMonth(transactions, startDate, endDate);
    }

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
   * Group transactions by weeks of the current month (Week 1-4)
   */
  private static groupByWeeksOfMonth(
    transactions: ITransaction[],
    startDate: Date,
    endDate: Date
  ): Array<{ label: string; sales: number; transactions: number; date: Date }> {
    // Initialize 4 weeks
    const weeks = [
      { label: 'Week 1', sales: 0, transactions: 0, date: new Date(startDate) },
      { label: 'Week 2', sales: 0, transactions: 0, date: new Date(startDate) },
      { label: 'Week 3', sales: 0, transactions: 0, date: new Date(startDate) },
      { label: 'Week 4', sales: 0, transactions: 0, date: new Date(startDate) },
    ];

    // Group transactions into weeks
    transactions.forEach((transaction) => {
      const txDate = new Date(transaction.createdAt);
      const dayOfMonth = txDate.getDate();
      
      // Determine which week (1-7 = Week 1, 8-14 = Week 2, 15-21 = Week 3, 22+ = Week 4)
      let weekIndex = 0;
      if (dayOfMonth >= 1 && dayOfMonth <= 7) {
        weekIndex = 0;
      } else if (dayOfMonth >= 8 && dayOfMonth <= 14) {
        weekIndex = 1;
      } else if (dayOfMonth >= 15 && dayOfMonth <= 21) {
        weekIndex = 2;
      } else {
        weekIndex = 3; // 22 and above
      }

      weeks[weekIndex].sales += transaction.total;
      weeks[weekIndex].transactions += 1;
    });

    return weeks;
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
        case 'monthly':
          current.setMonth(current.getMonth() + 1);
          break;
        case 'annual':
          current.setFullYear(current.getFullYear() + 1);
          break;
        default:
          current.setDate(current.getDate() + 1);
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
      case 'monthly':
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
      case 'annual':
        return String(date.getFullYear()); // YYYY
      default:
        return date.toISOString().split('T')[0]; // YYYY-MM-DD
    }
  }

  /**
   * Format label for display
   */
  private static formatLabel(date: Date, period: 'weekly' | 'monthly' | 'annual'): string {
    switch (period) {
      case 'monthly':
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      case 'annual':
        return String(date.getFullYear());
      default:
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
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

