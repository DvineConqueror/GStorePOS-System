import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { transactionsAPI } from '@/lib/api';
import { formatCurrency } from '@/utils/format';
import { TrendingUp, ShoppingCart, DollarSign, Calendar } from 'lucide-react';

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
    <Card>
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          My Performance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Total Sales</span>
            </div>
            <div className="text-2xl font-bold text-blue-900">{formatCurrency(stats.totalSales)}</div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <ShoppingCart className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">Total Transactions</span>
            </div>
            <div className="text-2xl font-bold text-green-900">{stats.totalTransactions}</div>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-800">Today's Sales</span>
            </div>
            <div className="text-2xl font-bold text-purple-900">{formatCurrency(stats.todaySales)}</div>
          </div>
          
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-800">Avg Transaction</span>
            </div>
            <div className="text-2xl font-bold text-orange-900">{formatCurrency(stats.averageTransaction)}</div>
          </div>
        </div>
        
        {/* Daily Sales Chart */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Last 7 Days Performance</h3>
          <div className="space-y-3">
            {dailySales.map((day, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="font-medium">{day.date}</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-blue-600">{formatCurrency(day.sales)}</div>
                  <div className="text-sm text-gray-500">{day.transactions} transactions</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Additional Stats */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-800">{stats.totalItems}</div>
            <div className="text-sm text-gray-600">Items Sold</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-800">{stats.todayTransactions}</div>
            <div className="text-sm text-gray-600">Today's Transactions</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
