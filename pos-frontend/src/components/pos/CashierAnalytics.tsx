import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { transactionsAPI } from '@/lib/api';
import { formatCurrency } from '@/utils/format';

interface CashierSales {
  cashier_name: string;
  total_sales: number;
  items_sold: number;
}

export function CashierAnalytics() {
  const [cashierSales, setCashierSales] = useState<CashierSales[]>([]);

  const fetchCashierSales = async () => {
    try {
      // Get all completed transactions
      const response = await transactionsAPI.getTransactions();
      
      if (response.success) {
        const transactions = response.data.filter((t: any) => t.status === 'completed');
        
        // Aggregate sales using cashier_name
        const salesMap = new Map<string, CashierSales>();
        transactions.forEach((transaction: any) => {
          const cashierName = transaction.cashierName || 'Unknown';
          const totalSales = transaction.total;
          const itemsSold = transaction.items.reduce(
            (sum: number, item: any) => sum + item.quantity,
            0
          );

          if (salesMap.has(cashierName)) {
            const existing = salesMap.get(cashierName)!;
            salesMap.set(cashierName, {
              cashier_name: cashierName,
              total_sales: existing.total_sales + totalSales,
              items_sold: existing.items_sold + itemsSold
            });
          } else {
            salesMap.set(cashierName, {
              cashier_name: cashierName,
              total_sales: totalSales,
              items_sold: itemsSold
            });
          }
        });
      
        const sortedSales = Array.from(salesMap.values())
          .sort((a, b) => b.total_sales - a.total_sales);
      
        setCashierSales(sortedSales);
      }
    } catch (error) {
      console.error('Error fetching cashier sales:', error);
    }
  };

  useEffect(() => {
    fetchCashierSales();
  }, []);

  return (
    <Card className="bg-transparent border-0 shadow-none">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg sm:text-xl text-white">Employee Sales</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 sm:space-y-4">
          {cashierSales.map((cashier) => (
            <div key={cashier.cashier_name} className="flex justify-between items-center p-2 sm:p-4 border border-slate-700 rounded-lg bg-slate-800 shadow-sm">
              <div>
                <div className="text-sm sm:text-base font-medium text-white">{cashier.cashier_name}</div>
                <div className="text-xs sm:text-sm text-slate-400">
                  {cashier.items_sold} items sold
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm sm:text-base font-bold text-slate-300">{formatCurrency(cashier.total_sales)}</div>
                <div className="text-xs sm:text-sm text-slate-500">Total Sales</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}