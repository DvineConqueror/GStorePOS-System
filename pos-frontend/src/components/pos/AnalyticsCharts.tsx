
import { useState, useMemo } from 'react';
import { usePos } from '@/context/PosContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  LineChart,
  Line,
  AreaChart,
  Area,
} from 'recharts';
import { SalesByCategory, SalesByDate } from '@/types';
import { formatCurrency } from '@/utils/format';
import { TrendingUp, TrendingDown, Users, ShoppingCart, DollarSign, Clock, Target, AlertTriangle } from 'lucide-react';

const COLORS = ['#64748b', '#475569', '#334155', '#1e293b', '#0f172a', '#7c3aed', '#a855f7'];

export function AnalyticsCharts() {
  const { state } = usePos();
  const { transactions } = state;
  const [timeFrame, setTimeFrame] = useState('today');

  // Enhanced time frame filter function
  const filterTransactionsByTime = (transactions: any[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return transactions.filter(transaction => {
      const txDate = new Date(transaction.timestamp);
      switch (timeFrame) {
        case 'today':
          return txDate >= today;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return txDate >= weekAgo;
        case 'month':
          const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
          return txDate >= monthAgo;
        default:
          return true;
      }
    });
  };

  // Enhanced analytics calculations
  const analytics = useMemo(() => {
    const filteredTransactions = filterTransactionsByTime(transactions);
    const completedTransactions = filteredTransactions.filter(t => t.status === 'completed');
    
    // Basic metrics
    const totalSales = completedTransactions.reduce((sum, t) => sum + t.total, 0);
    const totalTransactions = completedTransactions.length;
    const avgTransaction = totalTransactions > 0 ? totalSales / totalTransactions : 0;
    
    // Performance metrics
    const totalItems = completedTransactions.reduce((sum, t) => 
      sum + t.items.reduce((itemSum: number, item: any) => itemSum + item.quantity, 0), 0
    );
    
    // Peak hours analysis
    const hourlySales = new Map();
    completedTransactions.forEach(t => {
      const hour = new Date(t.timestamp).getHours();
      const current = hourlySales.get(hour) || { sales: 0, count: 0 };
      hourlySales.set(hour, { sales: current.sales + t.total, count: current.count + 1 });
    });
    
    const peakHour = Array.from(hourlySales.entries())
      .sort(([,a], [,b]) => b.sales - a.sales)[0];
    
    // Top performing cashiers
    const cashierPerformance = new Map();
    completedTransactions.forEach(t => {
      const cashier = t.cashierName || 'Unknown';
      const current = cashierPerformance.get(cashier) || { sales: 0, transactions: 0, items: 0 };
      const items = t.items.reduce((sum: number, item: any) => sum + item.quantity, 0);
      cashierPerformance.set(cashier, {
        sales: current.sales + t.total,
        transactions: current.transactions + 1,
        items: current.items + items
      });
    });
    
    const topCashier = Array.from(cashierPerformance.entries())
      .sort(([,a], [,b]) => b.sales - a.sales)[0];
    
    // Category performance
    const categorySales = new Map();
    completedTransactions.forEach(t => {
      t.items.forEach((item: any) => {
        const category = item.category || 'Others';
        const current = categorySales.get(category) || 0;
        categorySales.set(category, current + (item.price * item.quantity));
      });
    });
    
    const topCategory = Array.from(categorySales.entries())
      .sort(([,a], [,b]) => b - a)[0];
    
    // Growth metrics (compare with previous period)
    const previousPeriodTransactions = filterTransactionsByTime(
      transactions.filter(t => {
        const txDate = new Date(t.timestamp);
        const now = new Date();
        const periodLength = timeFrame === 'today' ? 1 : timeFrame === 'week' ? 7 : 30;
        const previousStart = new Date(now.getTime() - (periodLength * 2) * 24 * 60 * 60 * 1000);
        const previousEnd = new Date(now.getTime() - periodLength * 24 * 60 * 60 * 1000);
        return txDate >= previousStart && txDate < previousEnd;
      })
    );
    
    const previousSales = previousPeriodTransactions
      .filter(t => t.status === 'completed')
      .reduce((sum, t) => sum + t.total, 0);
    
    const salesGrowth = previousSales > 0 ? ((totalSales - previousSales) / previousSales) * 100 : 0;
    
    return {
      totalSales,
      totalTransactions,
      avgTransaction,
      totalItems,
      peakHour: peakHour ? { hour: peakHour[0], sales: peakHour[1].sales } : null,
      topCashier: topCashier ? { name: topCashier[0], ...topCashier[1] } : null,
      topCategory: topCategory ? { name: topCategory[0], sales: topCategory[1] } : null,
      salesGrowth,
      hourlyData: Array.from(hourlySales.entries())
        .map(([hour, data]) => ({ hour: `${hour}:00`, sales: data.sales, transactions: data.count }))
        .sort((a, b) => parseInt(a.hour) - parseInt(b.hour))
    };
  }, [transactions, timeFrame]);

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
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader className="pb-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <CardTitle className="text-2xl font-bold text-white flex items-center gap-2">
              <Target className="h-6 w-6 text-slate-400" />
              Sales Analytics
            </CardTitle>
            <CardDescription className="text-slate-400 mt-1">
              Overview of your store's performance
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTimeFrame('today')}
              className={`text-sm border-slate-600 ${timeFrame === 'today' ? 'bg-slate-600 text-white border-slate-600' : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-600'}`}
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTimeFrame('week')}
              className={`text-sm border-slate-600 ${timeFrame === 'week' ? 'bg-slate-600 text-white border-slate-600' : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-600'}`}
            >
              Week
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTimeFrame('month')}
              className={`text-sm border-slate-600 ${timeFrame === 'month' ? 'bg-slate-600 text-white border-slate-600' : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-600'}`}
            >
              Month
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {/* Compact KPI Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-700/50 border border-slate-600 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <DollarSign className="h-6 w-6 text-slate-400" />
              <div>
                <p className="text-sm text-slate-300">Total Sales</p>
                <p className="text-xl font-bold text-white">{formatCurrency(analytics.totalSales)}</p>
                <div className="flex items-center gap-1 mt-1">
                  {analytics.salesGrowth >= 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-400" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-400" />
                  )}
                  <span className={`text-xs ${analytics.salesGrowth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {Math.abs(analytics.salesGrowth).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-700/50 border border-slate-600 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <ShoppingCart className="h-6 w-6 text-slate-400" />
              <div>
                <p className="text-sm text-slate-300">Transactions</p>
                <p className="text-xl font-bold text-white">{analytics.totalTransactions}</p>
                <p className="text-xs text-slate-500 mt-1">{analytics.totalItems} items</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-700/50 border border-slate-600 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <Target className="h-6 w-6 text-slate-400" />
              <div>
                <p className="text-sm text-slate-300">Avg Transaction</p>
                <p className="text-xl font-bold text-white">{formatCurrency(analytics.avgTransaction)}</p>
                <p className="text-xs text-slate-500 mt-1">per transaction</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-700/50 border border-slate-600 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <Clock className="h-6 w-6 text-slate-400" />
              <div>
                <p className="text-sm text-slate-300">Peak Hour</p>
                <p className="text-xl font-bold text-white">
                  {analytics.peakHour ? `${analytics.peakHour.hour}:00` : 'N/A'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {analytics.peakHour ? formatCurrency(analytics.peakHour.sales) : 'No data'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Highlights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Top Performer */}
          <div className="bg-slate-700/30 border border-slate-600 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-5 w-5 text-slate-400" />
              <h3 className="font-semibold text-white">Top Performer</h3>
            </div>
            {analytics.topCashier ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-white">{analytics.topCashier.name}</p>
                    <p className="text-sm text-slate-400">Leading cashier</p>
                  </div>
                  <Badge variant="secondary" className="bg-green-600 text-white text-xs">
                    #1
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-lg font-bold text-white">{formatCurrency(analytics.topCashier.sales)}</p>
                    <p className="text-xs text-slate-400">Sales</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-white">{analytics.topCashier.transactions}</p>
                    <p className="text-xs text-slate-400">Transactions</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-white">{analytics.topCashier.items}</p>
                    <p className="text-xs text-slate-400">Items</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-slate-400 text-sm">No performance data available</p>
            )}
          </div>

          {/* Top Category */}
          <div className="bg-slate-700/30 border border-slate-600 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Target className="h-5 w-5 text-slate-400" />
              <h3 className="font-semibold text-white">Top Category</h3>
            </div>
            {analytics.topCategory ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-white">{analytics.topCategory.name}</p>
                    <p className="text-sm text-slate-400">Best selling category</p>
                  </div>
                  <Badge variant="secondary" className="bg-blue-600 text-white text-xs">
                    Top
                  </Badge>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">{formatCurrency(analytics.topCategory.sales)}</p>
                  <p className="text-sm text-slate-400">Total sales</p>
                </div>
              </div>
            ) : (
              <p className="text-slate-400 text-sm">No category data available</p>
            )}
          </div>
        </div>

        {/* Compact Charts */}
        <Tabs defaultValue="hourly" className="w-full">
          <TabsList className="mb-4 bg-slate-700 p-1 rounded-lg border border-slate-600 w-full md:w-auto">
            <TabsTrigger 
              value="hourly"
              className="text-sm data-[state=active]:bg-slate-600 data-[state=active]:text-white data-[state=active]:shadow-sm text-slate-300"
            >
              Hourly Sales
            </TabsTrigger>
            <TabsTrigger 
              value="category"
              className="text-sm data-[state=active]:bg-slate-600 data-[state=active]:text-white data-[state=active]:shadow-sm text-slate-300"
            >
              Categories
            </TabsTrigger>
          </TabsList>

          <TabsContent value="hourly" className="space-y-4">
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.hourlyData} margin={{ top: 20, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="hour" 
                    tick={{ fill: '#e2e8f0', fontSize: 10 }}
                    axisLine={{ stroke: '#64748b' }}
                    tickLine={{ stroke: '#64748b' }}
                  />
                  <YAxis 
                    tick={{ fill: '#e2e8f0', fontSize: 10 }}
                    axisLine={{ stroke: '#64748b' }}
                    tickLine={{ stroke: '#64748b' }}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip 
                    formatter={(value) => formatCurrency(value as number)}
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #64748b',
                      borderRadius: '8px',
                      color: '#e2e8f0',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
                    }}
                    labelStyle={{ color: '#f1f5f9', fontWeight: 'bold' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="sales" 
                    stroke="#64748b" 
                    fill="#64748b" 
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="category" className="space-y-4">
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={calculateSalesByCategory()}
                    dataKey="amount"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    innerRadius={20}
                    fill="#8884d8"
                    paddingAngle={2}
                    label={({ category, percent }) => `${category} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
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
                      color: '#e2e8f0',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
                    }}
                    labelStyle={{ color: '#f1f5f9', fontWeight: 'bold' }}
                  />
                  <Legend 
                    wrapperStyle={{ 
                      paddingTop: '20px',
                      fontSize: '12px',
                      color: '#e2e8f0'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
