import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { transactionsAPI } from '@/lib/api';
import { formatCurrency } from '@/utils/format';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer,
  Tooltip,
  LineChart,
  Line
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Target, 
  DollarSign, 
  ShoppingCart, 
  Calendar,
  Activity,
  BarChart3,
  Star,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  Zap
} from 'lucide-react';

interface RawAnalyticsData {
  transactions: any[];
}

interface CashierAnalyticsData {
  totalSales: number;
  todaySales: number;
  avgTransaction: number;
  itemsSold: number;
  totalTransactions: number;
  todayTransactions: number;
  weeklyTrend: Array<{ day: string; sales: number; transactions: number }>;
  recentTransactions: Array<{ id: string; total: number; items: number; time: string }>;
  hourlyPerformance: Array<{ hour: string; sales: number }>;
  topCategories: Array<{ category: string; sales: number; percentage: number }>;
  growthMetrics: {
    salesGrowth: number;
    transactionGrowth: number;
    avgTransactionGrowth: number;
  };
}

const CATEGORY_COLORS = ['#3b82f6', '#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

export function ModernCashierAnalyticsV2() {
  const { user } = useAuth();
  const [analyticsData, setAnalyticsData] = useState<RawAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const analytics = useMemo(() => {
    if (!analyticsData || !user?.id) return null;

    const { transactions } = analyticsData;
    const userTransactions = transactions.filter((t: any) => 
      t.status === 'completed' && t.cashierId === user.id
    );

    // Core metrics
    const totalSales = userTransactions.reduce((sum: number, t: any) => sum + t.total, 0);
    const totalTransactions = userTransactions.length;
    const avgTransaction = totalTransactions > 0 ? totalSales / totalTransactions : 0;
    const itemsSold = userTransactions.reduce((sum: number, t: any) => 
      sum + t.items.reduce((itemSum: number, item: any) => itemSum + item.quantity, 0), 0
    );

    // Today's metrics
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTransactions = userTransactions.filter((t: any) => {
      const txDate = new Date(t.createdAt || t.timestamp);
      return txDate >= today;
    });
    const todaySales = todayTransactions.reduce((sum: number, t: any) => sum + t.total, 0);

    // Weekly trend (last 7 days)
    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayTransactions = userTransactions.filter((t: any) => {
        const txDate = new Date(t.createdAt || t.timestamp);
        return txDate.toDateString() === date.toDateString();
      });
      const daySales = dayTransactions.reduce((sum: number, t: any) => sum + t.total, 0);
      weeklyData.push({
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        sales: daySales,
        transactions: dayTransactions.length
      });
    }

    // Recent transactions (last 5)
    const recentTransactions = userTransactions
      .sort((a: any, b: any) => new Date(b.createdAt || b.timestamp).getTime() - new Date(a.createdAt || a.timestamp).getTime())
      .slice(0, 5)
      .map((t: any) => ({
        id: t.id,
        total: t.total,
        items: t.items.reduce((sum: number, item: any) => sum + item.quantity, 0),
        time: new Date(t.createdAt || t.timestamp).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      }));

    // Hourly performance
    const hourlySales = new Map();
    userTransactions.forEach((t: any) => {
      const hour = new Date(t.createdAt || t.timestamp).getHours();
      const current = hourlySales.get(hour) || 0;
      hourlySales.set(hour, current + t.total);
    });
    const hourlyPerformance = Array.from(hourlySales.entries())
      .map(([hour, sales]) => ({ hour: `${hour}:00`, sales }))
      .sort((a, b) => parseInt(a.hour) - parseInt(b.hour));

    // Top categories
    const categorySales = new Map();
    userTransactions.forEach((t: any) => {
      t.items.forEach((item: any) => {
        const category = item.category || 'Others';
        const current = categorySales.get(category) || 0;
        categorySales.set(category, current + (item.price * item.quantity));
      });
    });
    const topCategories = Array.from(categorySales.entries())
      .map(([category, sales]) => ({
        category,
        sales,
        percentage: (sales / totalSales) * 100
      }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 6);

    // Growth calculations (mock data for demo)
    const growthMetrics = {
      salesGrowth: Math.random() * 20 - 10, // -10% to +10%
      transactionGrowth: Math.random() * 15 - 7.5,
      avgTransactionGrowth: Math.random() * 12 - 6
    };

    return {
      totalSales,
      todaySales,
      avgTransaction,
      itemsSold,
      totalTransactions,
      todayTransactions: todayTransactions.length,
      weeklyTrend: weeklyData,
      recentTransactions,
      hourlyPerformance,
      topCategories,
      growthMetrics
    };
  }, [analyticsData, user]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await transactionsAPI.getTransactions();
      
      if (response.success) {
        setAnalyticsData({
          transactions: response.data
        });
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchAnalytics();
    }
  }, [user?.id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-blue-100 animate-pulse rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-blue-100 animate-pulse rounded-xl" />
          <div className="h-80 bg-blue-100 animate-pulse rounded-xl" />
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <Activity className="h-12 w-12 text-blue-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-blue-900 mb-2">No Data Available</h3>
        <p className="text-blue-600">No analytics data available at the moment.</p>
      </div>
    );
  }

  const GrowthIndicator = ({ value, label }: { value: number; label: string }) => {
    const isPositive = value >= 0;
    const Icon = isPositive ? ArrowUpRight : ArrowDownRight;
    
    return (
      <div className="flex items-center gap-1">
        <Icon className={`h-3 w-3 ${isPositive ? 'text-emerald-500' : 'text-red-500'}`} />
        <span className={`text-xs font-medium ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
          {Math.abs(value).toFixed(1)}%
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales */}
        <Card className="relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <DollarSign className="h-6 w-6 text-blue-500" />
              <GrowthIndicator value={analytics.growthMetrics.salesGrowth} label="Sales" />
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-blue-700">Total Sales</h3>
              <div className="text-3xl font-bold text-blue-900">
                {formatCurrency(analytics.totalSales)}
              </div>
              <div className="text-xs text-blue-600">
                {analytics.totalTransactions} transactions
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Today's Sales */}
        <Card className="relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Calendar className="h-6 w-6 text-blue-500" />
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                <Star className="h-3 w-3 text-blue-500" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-blue-700">Today's Sales</h3>
              <div className="text-3xl font-bold text-blue-900">
                {formatCurrency(analytics.todaySales)}
              </div>
              <div className="text-xs text-blue-600">
                {analytics.todayTransactions} transactions
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Average Transaction */}
        <Card className="relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Target className="h-6 w-6 text-blue-500" />
              <GrowthIndicator value={analytics.growthMetrics.avgTransactionGrowth} label="Avg" />
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-blue-700">Avg Transaction</h3>
              <div className="text-3xl font-bold text-blue-900">
                {formatCurrency(analytics.avgTransaction)}
              </div>
              <div className="text-xs text-blue-600">
                per transaction
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Items Sold */}
        <Card className="relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <ShoppingCart className="h-6 w-6 text-blue-500" />
              <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                Total
              </Badge>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-blue-700">Items Sold</h3>
              <div className="text-3xl font-bold text-blue-900">
                {analytics.itemsSold}
              </div>
              <div className="text-xs text-blue-600">
                total items
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Performance Chart */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-blue-500" />
              <div>
                <h3 className="text-lg font-semibold text-blue-900">Weekly Performance</h3>
                <p className="text-sm text-blue-600">Sales trend over the last 7 days</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.weeklyTrend} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                  <XAxis 
                    dataKey="day" 
                    tick={{ fontSize: 12, fill: '#1e40af' }}
                    axisLine={{ stroke: '#3b82f6' }}
                    tickLine={{ stroke: '#3b82f6' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: '#1e40af' }}
                    axisLine={{ stroke: '#3b82f6' }}
                    tickLine={{ stroke: '#3b82f6' }}
                    tickFormatter={(value) => `₱${value}`}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #3b82f6',
                      borderRadius: '8px',
                      color: '#1e40af'
                    }}
                    formatter={(value: number) => [formatCurrency(value), 'Sales']}
                    labelStyle={{ color: '#1e40af' }}
                  />
                  <Bar 
                    dataKey="sales" 
                    fill="url(#colorGradient)"
                    radius={[4, 4, 0, 0]}
                  />
                  <defs>
                    <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#1d4ed8" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-blue-500" />
              <div>
                <h3 className="text-lg font-semibold text-blue-900">Recent Transactions</h3>
                <p className="text-sm text-blue-600">Latest 5 transactions</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.recentTransactions.length > 0 ? (
              <div className="space-y-4">
                {analytics.recentTransactions.map((transaction, index) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-bold text-sm">
                          #{index + 1}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-blue-900">{transaction.items} items</h4>
                        <p className="text-sm text-blue-600">{transaction.time}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-blue-900">
                        {formatCurrency(transaction.total)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-blue-400 mx-auto mb-3" />
                <p className="text-blue-500">No recent transactions</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Category Performance */}
      {analytics.topCategories.length > 0 && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3">
              <Target className="h-5 w-5 text-blue-500" />
              <div>
                <h3 className="text-lg font-semibold text-blue-900">Category Performance</h3>
                <p className="text-sm text-blue-600">Sales by category breakdown</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.topCategories.map((category, index) => (
                <div key={category.category} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-700">{category.category}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-blue-900">
                        {formatCurrency(category.sales)}
                      </span>
                      <span className="text-xs text-blue-600">
                        ({category.percentage.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                  <Progress 
                    value={category.percentage} 
                    className="h-2"
                    style={{
                      background: `linear-gradient(to right, ${CATEGORY_COLORS[index % CATEGORY_COLORS.length]}, ${CATEGORY_COLORS[index % CATEGORY_COLORS.length]}88)`
                    }}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
