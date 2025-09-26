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
    <Card className="bg-white border border-blue-200 shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-bold text-blue-900 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-blue-600" />
          </div>
          My Performance Analytics
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {/* Compact KPI Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <DollarSign className="h-6 w-6 text-blue-600" />
              <div>
                <p className="text-sm text-blue-600">Total Sales</p>
                <p className="text-xl font-bold text-blue-900">{formatCurrency(stats.totalSales)}</p>
                <p className="text-xs text-blue-500 mt-1">{stats.totalTransactions} transactions</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <Calendar className="h-6 w-6 text-blue-600" />
              <div>
                <p className="text-sm text-blue-600">Today's Sales</p>
                <p className="text-xl font-bold text-blue-900">{formatCurrency(stats.todaySales)}</p>
                <p className="text-xs text-blue-500 mt-1">{stats.todayTransactions} transactions</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-6 w-6 text-blue-600" />
              <div>
                <p className="text-sm text-blue-600">Avg Transaction</p>
                <p className="text-xl font-bold text-blue-900">{formatCurrency(stats.averageTransaction)}</p>
                <p className="text-xs text-blue-500 mt-1">per transaction</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <ShoppingCart className="h-6 w-6 text-blue-600" />
              <div>
                <p className="text-sm text-blue-600">Items Sold</p>
                <p className="text-xl font-bold text-blue-900">{stats.totalItems}</p>
                <p className="text-xs text-blue-500 mt-1">total items</p>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Chart */}
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-4 text-blue-900 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Last 7 Days Performance
          </h3>
          <div className="h-48 w-full">
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
      </CardContent>
    </Card>
  );
}
