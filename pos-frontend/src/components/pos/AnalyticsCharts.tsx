
import { useState } from 'react';
import { usePos } from '@/context/PosContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { SalesByCategory, SalesByDate } from '@/types';
import { formatCurrency } from '@/utils/format';

const COLORS = ['#64748b', '#475569', '#334155', '#1e293b', '#0f172a', '#7c3aed', '#a855f7'];

export function AnalyticsCharts() {
  const { state } = usePos();
  const { transactions } = state;
  const [timeFrame, setTimeFrame] = useState('today');

  // Add time frame filter function
  const filterTransactionsByTime = (transactions: any[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return transactions.filter(transaction => {
      const txDate = new Date(transaction.timestamp);
      switch (timeFrame) {
        case 'today':
          return txDate >= today;
        case 'week':
          const weekAgo = new Date(now.setDate(now.getDate() - 7));
          return txDate >= weekAgo;
        case 'month':
          const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
          return txDate >= monthAgo;
        default:
          return true;
      }
    });
  };

  // Update calculation functions to use filtered transactions
  const calculateSalesByCategory = (): SalesByCategory[] => {
    const salesMap = new Map<string, number>();
    const filteredTransactions = filterTransactionsByTime(transactions);
    
    filteredTransactions.forEach(transaction => {
      transaction.items.forEach(item => {
        const category = item.category;
        const amount = item.price * item.quantity;
        
        if (salesMap.has(category)) {
          salesMap.set(category, salesMap.get(category)! + amount);
        } else {
          salesMap.set(category, amount);
        }
      });
    });
    
    return Array.from(salesMap.entries()).map(([category, amount]) => ({
      category,
      amount,
    }));
  };

  // Calculate sales by date
  const calculateSalesByDate = (): SalesByDate[] => {
    const salesMap = new Map<string, number>();
    
    transactions.forEach(transaction => {
      const date = new Date(transaction.timestamp).toLocaleDateString();
      const amount = transaction.total;
      
      if (salesMap.has(date)) {
        salesMap.set(date, salesMap.get(date)! + amount);
      } else {
        salesMap.set(date, amount);
      }
    });
    
    return Array.from(salesMap.entries()).map(([date, amount]) => ({
      date,
      amount,
    }));
  };

  // Calculate total sales
  const calculateTotalSales = (): number => {
    return transactions.reduce((sum, transaction) => sum + transaction.total, 0);
  };

  // Calculate total number of transactions
  const calculateTotalTransactions = (): number => {
    return transactions.length;
  };

  // Calculate average transaction value
  const calculateAverageTransactionValue = (): number => {
    const total = calculateTotalSales();
    const count = calculateTotalTransactions();
    return count > 0 ? total / count : 0;
  };

  const salesByCategory = calculateSalesByCategory();
  const salesByDate = calculateSalesByDate();

  return (
    <Card className="bg-transparent border-0 shadow-none">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="text-xl sm:text-2xl font-bold text-white">Sales Analytics</CardTitle>
            <CardDescription className="text-sm text-slate-400">Overview of your store's performance</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTimeFrame('today')}
              className={`text-xs sm:text-sm border-slate-600 ${timeFrame === 'today' ? 'bg-slate-600 text-white border-slate-600' : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-600'}`}
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTimeFrame('week')}
              className={`text-xs sm:text-sm border-slate-600 ${timeFrame === 'week' ? 'bg-slate-600 text-white border-slate-600' : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-600'}`}
            >
              Week
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTimeFrame('month')}
              className={`text-xs sm:text-sm border-slate-600 ${timeFrame === 'month' ? 'bg-slate-600 text-white border-slate-600' : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-600'}`}
            >
              Month
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-2 sm:p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
          <Card className="bg-slate-800 border border-slate-700 p-3 sm:p-4 shadow-sm">
            <div className="text-xs sm:text-sm text-slate-400">Total Sales</div>
            <div className="text-lg sm:text-2xl font-bold text-white">{formatCurrency(calculateTotalSales())}</div>
          </Card>
          <Card className="bg-slate-800 border border-slate-700 p-3 sm:p-4 shadow-sm">
            <div className="text-xs sm:text-sm text-slate-400">Total Transactions</div>
            <div className="text-lg sm:text-2xl font-bold text-white">{calculateTotalTransactions()}</div>
          </Card>
          <Card className="bg-slate-800 border border-slate-700 p-3 sm:p-4 shadow-sm">
            <div className="text-xs sm:text-sm text-slate-400">Average Transaction</div>
            <div className="text-lg sm:text-2xl font-bold text-white">{formatCurrency(calculateAverageTransactionValue())}</div>
          </Card>
        </div>

        <Tabs defaultValue="category" className="w-full">
          <TabsList className="mb-4 bg-slate-800 p-1 rounded-lg border border-slate-700 w-full sm:w-auto">
            <TabsTrigger 
              value="category"
              className="text-xs sm:text-sm data-[state=active]:bg-slate-600 data-[state=active]:text-white text-slate-300"
            >
              Sales by Category
            </TabsTrigger>
            <TabsTrigger 
              value="timeline"
              className="text-xs sm:text-sm data-[state=active]:bg-slate-600 data-[state=active]:text-white text-slate-300"
            >
              Sales Timeline
            </TabsTrigger>
          </TabsList>

          <TabsContent value="category" className="space-y-2 sm:space-y-4">
            <div className="h-[250px] sm:h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={calculateSalesByCategory()}
                    dataKey="amount"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    label={({ category, percent }) => `${category} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {calculateSalesByCategory().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => formatCurrency(value as number)}
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #64748b',
                      borderRadius: '8px',
                      color: '#e2e8f0'
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="timeline" className="space-y-2 sm:space-y-4">
            <div className="h-[250px] sm:h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={calculateSalesByDate()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fill: '#e2e8f0' }}
                    axisLine={{ stroke: '#64748b' }}
                  />
                  <YAxis 
                    tick={{ fill: '#e2e8f0' }}
                    axisLine={{ stroke: '#64748b' }}
                    tickFormatter={(value) => formatCurrency(value)} 
                  />
                  <Tooltip 
                    formatter={(value) => formatCurrency(value as number)}
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #64748b',
                      borderRadius: '8px',
                      color: '#e2e8f0'
                    }}
                  />
                  <Bar dataKey="amount" fill="#64748b" radius={[4, 4, 0, 0]}>
                    {calculateSalesByDate().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
