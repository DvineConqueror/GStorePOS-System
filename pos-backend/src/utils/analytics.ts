import { ITransaction } from '../types';

/**
 * Analytics Utilities
 * Shared utility functions for analytics calculations
 */

export interface PeriodWindow {
  startDate: Date;
  endDate: Date;
  label: string;
}

export interface NetTotals {
  totalSales: number;
  totalTransactions: number;
  averageTransactionValue: number;
  refundedCount: number;
  refundedAmount: number;
}

export interface GrowthDelta {
  sales: number;
  transactions: number;
  averageTransaction: number;
}

export interface KPINormalized {
  sales: number;
  transactions: number;
  averageTransaction: number;
  refundedTransactions: number;
}

/**
 * Calculate period window for analytics
 */
export function calculatePeriodWindow(period: number): PeriodWindow {
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - period * 24 * 60 * 60 * 1000);
  
  let label = '';
  if (period === 1) label = 'Today';
  else if (period === 7) label = 'Last 7 days';
  else if (period === 30) label = 'Last 30 days';
  else label = `Last ${period} days`;
  
  return { startDate, endDate, label };
}

/**
 * Calculate net totals from transactions (excluding refunded)
 */
export function calculateNetTotals(transactions: ITransaction[]): NetTotals {
  const completedTransactions = transactions.filter(t => t.status === 'completed');
  const refundedTransactions = transactions.filter(t => t.status === 'refunded');
  
  const totalSales = completedTransactions.reduce((sum, t) => sum + t.total, 0);
  const totalTransactions = completedTransactions.length;
  const averageTransactionValue = totalTransactions > 0 ? totalSales / totalTransactions : 0;
  
  const refundedCount = refundedTransactions.length;
  const refundedAmount = refundedTransactions.reduce((sum, t) => sum + t.total, 0);
  
  return {
    totalSales,
    totalTransactions,
    averageTransactionValue,
    refundedCount,
    refundedAmount
  };
}

/**
 * Calculate growth delta between two periods
 */
export function calculateGrowthDelta(current: NetTotals, previous: NetTotals): GrowthDelta {
  const sales = previous.totalSales > 0 
    ? ((current.totalSales - previous.totalSales) / previous.totalSales) * 100 
    : current.totalSales > 0 ? 100 : 0;
    
  const transactions = previous.totalTransactions > 0 
    ? ((current.totalTransactions - previous.totalTransactions) / previous.totalTransactions) * 100 
    : current.totalTransactions > 0 ? 100 : 0;
    
  const averageTransaction = previous.averageTransactionValue > 0 
    ? ((current.averageTransactionValue - previous.averageTransactionValue) / previous.averageTransactionValue) * 100 
    : current.averageTransactionValue > 0 ? 100 : 0;
  
  return { sales, transactions, averageTransaction };
}

/**
 * Normalize KPI values for display
 */
export function normalizeKPI(totals: NetTotals, refundedTransactions: ITransaction[]): KPINormalized {
  return {
    sales: Math.round(totals.totalSales * 100) / 100,
    transactions: totals.totalTransactions,
    averageTransaction: Math.round(totals.averageTransactionValue * 100) / 100,
    refundedTransactions: refundedTransactions.length
  };
}

/**
 * Get sales by category from transactions
 */
export function getSalesByCategory(transactions: ITransaction[]) {
  const categoryMap = new Map<string, { amount: number; count: number }>();
  
  transactions
    .filter(t => t.status === 'completed')
    .forEach(transaction => {
      transaction.items.forEach(item => {
        // Infer category from product name if not available
        const category = inferCategoryFromProductName(item.productName);
        
        if (categoryMap.has(category)) {
          const existing = categoryMap.get(category)!;
          existing.amount += item.totalPrice;
          existing.count += item.quantity;
        } else {
          categoryMap.set(category, {
            amount: item.totalPrice,
            count: item.quantity
          });
        }
      });
    });
  
  return Array.from(categoryMap.entries())
    .map(([category, data]) => ({
      category,
      amount: data.amount,
      count: data.count
    }))
    .sort((a, b) => b.amount - a.amount);
}

/**
 * Infer category from product name
 */
export function inferCategoryFromProductName(productName: string): string {
  const name = productName.toLowerCase();
  
  if (name.includes('cracker') || name.includes('chips') || name.includes('snack')) {
    return 'Snacks';
  } else if (name.includes('milk') || name.includes('cheese') || name.includes('yogurt')) {
    return 'Dairy';
  } else if (name.includes('bread') || name.includes('cake') || name.includes('cookie')) {
    return 'Bakery';
  } else if (name.includes('apple') || name.includes('banana') || name.includes('fruit')) {
    return 'Fruits';
  } else if (name.includes('vegetable') || name.includes('carrot') || name.includes('lettuce')) {
    return 'Vegetables';
  } else if (name.includes('meat') || name.includes('chicken') || name.includes('beef')) {
    return 'Meat';
  } else if (name.includes('drink') || name.includes('juice') || name.includes('soda')) {
    return 'Beverages';
  } else if (name.includes('cereal') || name.includes('rice') || name.includes('pasta')) {
    return 'Grains';
  } else {
    return 'General';
  }
}

/**
 * Get hourly sales distribution
 */
export function getHourlySales(transactions: ITransaction[]) {
  const hourlyMap = new Map<number, { amount: number; count: number }>();
  
  // Initialize all hours with 0
  for (let i = 0; i < 24; i++) {
    hourlyMap.set(i, { amount: 0, count: 0 });
  }
  
  transactions
    .filter(t => t.status === 'completed')
    .forEach(transaction => {
      const hour = new Date(transaction.createdAt).getHours();
      const existing = hourlyMap.get(hour)!;
      existing.amount += transaction.total;
      existing.count += 1;
    });
  
  return Array.from(hourlyMap.entries())
    .map(([hour, data]) => ({
      hour,
      amount: data.amount,
      count: data.count
    }))
    .sort((a, b) => a.hour - b.hour);
}

/**
 * Get top performer (cashier with highest sales)
 */
export function getTopPerformer(transactions: ITransaction[]) {
  const cashierMap = new Map<string, { 
    name: string; 
    amount: number; 
    count: number; 
    average: number 
  }>();
  
  transactions
    .filter(t => t.status === 'completed')
    .forEach(transaction => {
      const cashierId = transaction.cashierId;
      const cashierName = transaction.cashierName;
      
      if (cashierMap.has(cashierId)) {
        const existing = cashierMap.get(cashierId)!;
        existing.amount += transaction.total;
        existing.count += 1;
        existing.average = existing.amount / existing.count;
      } else {
        cashierMap.set(cashierId, {
          name: cashierName,
          amount: transaction.total,
          count: 1,
          average: transaction.total
        });
      }
    });
  
  const performers = Array.from(cashierMap.values())
    .sort((a, b) => b.amount - a.amount);
  
  return performers.length > 0 ? performers[0] : null;
}

/**
 * Get weekly trend data
 */
export function getWeeklyTrend(transactions: ITransaction[]) {
  const weeklyData = [];
  const today = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);
    
    const dayTransactions = transactions.filter(t => 
      t.status === 'completed' &&
      t.createdAt >= dayStart &&
      t.createdAt <= dayEnd
    );
    
    const daySales = dayTransactions.reduce((sum, t) => sum + t.total, 0);
    const dayCount = dayTransactions.length;
    
    weeklyData.push({
      date: date.toISOString().split('T')[0],
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      sales: daySales,
      transactions: dayCount
    });
  }
  
  return weeklyData;
}
