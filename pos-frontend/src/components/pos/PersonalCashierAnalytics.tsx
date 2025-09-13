import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { transactionsAPI } from '@/lib/api';
import { formatCurrency } from '@/utils/format';
import { TrendingUp, ShoppingCart, DollarSign, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface PersonalStats {
  totalSales: number;
  totalTransactions: number;
  totalItems: number;
  averageTransaction: number;
  todaySales: number;
  todayTransactions: number;
}

interface DailySales {
  date: string;
  sales: number;
  transactions: number;
}

export function PersonalCashierAnalytics() {
  const { user } = useAuth();
  const [stats, setStats] = useState<PersonalStats>({
    totalSales: 0,
    totalTransactions: 0,
    totalItems: 0,
    averageTransaction: 0,
    todaySales: 0,
    todayTransactions: 0
  });
  const [dailySales, setDailySales] = useState<DailySales[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPersonalAnalytics = async () => {
    try {
      setLoading(true);
      
      // Get all transactions
      const response = await transactionsAPI.getTransactions();
      
      if (response.success) {
        const transactions = response.data.filter((t: any) => 
          t.status === 'completed' && 
          t.cashierId === user?.id
        );
        
        // Calculate stats
        const totalSales = transactions.reduce((sum: number, t: any) => sum + t.total, 0);
        const totalTransactions = transactions.length;
        const totalItems = transactions.reduce((sum: number, t: any) => 
          sum + t.items.reduce((itemSum: number, item: any) => itemSum + item.quantity, 0), 0
        );
        const averageTransaction = totalTransactions > 0 ? totalSales / totalTransactions : 0;
        
        // Calculate today's stats
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayTransactions = transactions.filter((t: any) => {
          const txDate = new Date(t.createdAt || t.timestamp);
          return txDate >= today;
        });
        const todaySales = todayTransactions.reduce((sum: number, t: any) => sum + t.total, 0);
        
        setStats({
          totalSales,
          totalTransactions,
          totalItems,
          averageTransaction,
          todaySales,
          todayTransactions: todayTransactions.length
        });
        
        // Calculate daily sales for the last 7 days
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          date.setHours(0, 0, 0, 0);
          
          const dayTransactions = transactions.filter((t: any) => {
            const txDate = new Date(t.createdAt || t.timestamp);
            txDate.setHours(0, 0, 0, 0);
            return txDate.getTime() === date.getTime();
          });
          
          const daySales = dayTransactions.reduce((sum: number, t: any) => sum + t.total, 0);
          
          last7Days.push({
            date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
            sales: daySales,
            transactions: dayTransactions.length
          });
        }
        
        setDailySales(last7Days);
      }
    } catch (error) {
      console.error('Error fetching personal analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchPersonalAnalytics();
    }
  }, [user?.id]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">My Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="text-gray-500">Loading analytics...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-transparent border-0 shadow-none">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg sm:text-xl flex items-center gap-2 text-blue-800">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          My Performance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg border border-blue-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Total Sales</span>
            </div>
            <div className="text-2xl font-bold text-blue-900">{formatCurrency(stats.totalSales)}</div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-blue-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <ShoppingCart className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Total Transactions</span>
            </div>
            <div className="text-2xl font-bold text-blue-900">{stats.totalTransactions}</div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-blue-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Today's Sales</span>
            </div>
            <div className="text-2xl font-bold text-blue-900">{formatCurrency(stats.todaySales)}</div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-blue-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Avg Transaction</span>
            </div>
            <div className="text-2xl font-bold text-blue-900">{formatCurrency(stats.averageTransaction)}</div>
          </div>
        </div>
        
        {/* Daily Sales Chart */}
        <div>
          <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-blue-800">Last 7 Days Performance</h3>
          <div className="h-48 sm:h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailySales} margin={{ top: 20, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 10, fill: '#1e40af' }}
                  axisLine={{ stroke: '#3b82f6' }}
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: '#1e40af' }}
                  axisLine={{ stroke: '#3b82f6' }}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #3b82f6',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    fontSize: '12px'
                  }}
                  formatter={(value: number, name: string) => [
                    name === 'sales' ? formatCurrency(value) : value,
                    name === 'sales' ? 'Sales' : 'Transactions'
                  ]}
                  labelStyle={{ color: '#1e40af', fontWeight: 'bold' }}
                />
                <Bar 
                  dataKey="sales" 
                  fill="#3b82f6" 
                  radius={[4, 4, 0, 0]}
                  name="sales"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Additional Stats */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-blue-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-800">{stats.totalItems}</div>
            <div className="text-sm text-blue-600">Items Sold</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-800">{stats.todayTransactions}</div>
            <div className="text-sm text-blue-600">Today's Transactions</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
