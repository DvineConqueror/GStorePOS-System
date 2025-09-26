import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { transactionsAPI } from '@/lib/api';
import { formatCurrency } from '@/utils/format';
import { 
  LineChart, 
  Line, 
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip
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
  Award
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
}

const SPARKLINE_COLORS = {
  primary: '#3b82f6', // blue-500
  secondary: '#06b6d4', // cyan-500
  accent: '#8b5cf6', // violet-500
  success: '#10b981' // emerald-500
};

export function ModernCashierAnalyticsV1() {
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
      .slice(0, 4);

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
      topCategories
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
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-blue-100 animate-pulse rounded-lg" />
          ))}
        </div>
        <div className="h-64 bg-blue-100 animate-pulse rounded-lg" />
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

  return (
    <div className="space-y-4">
      {/* Compact KPI Cards with Sparklines */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Sales */}
        <Card className="relative overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium text-blue-700">Total Sales</span>
              </div>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-blue-900 mb-2">
              {formatCurrency(analytics.totalSales)}
            </div>
            <div className="h-8 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.weeklyTrend}>
                  <Area 
                    type="monotone" 
                    dataKey="sales" 
                    stroke={SPARKLINE_COLORS.primary} 
                    fill={SPARKLINE_COLORS.primary} 
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Today's Sales */}
        <Card className="relative overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium text-blue-700">Today's Sales</span>
              </div>
              <Star className="h-4 w-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-blue-900 mb-2">
              {formatCurrency(analytics.todaySales)}
            </div>
            <div className="h-8 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.weeklyTrend}>
                  <Line 
                    type="monotone" 
                    dataKey="sales" 
                    stroke={SPARKLINE_COLORS.secondary} 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Average Transaction */}
        <Card className="relative overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium text-blue-700">Avg Transaction</span>
              </div>
              <BarChart3 className="h-4 w-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-blue-900 mb-2">
              {formatCurrency(analytics.avgTransaction)}
            </div>
            <div className="h-8 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.weeklyTrend}>
                  <Area 
                    type="monotone" 
                    dataKey="sales" 
                    stroke={SPARKLINE_COLORS.accent} 
                    fill={SPARKLINE_COLORS.accent} 
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Items Sold */}
        <Card className="relative overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium text-blue-700">Items Sold</span>
              </div>
              <Award className="h-4 w-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-blue-900 mb-2">
              {analytics.itemsSold}
            </div>
            <div className="h-8 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.weeklyTrend}>
                  <Area 
                    type="monotone" 
                    dataKey="sales" 
                    stroke={SPARKLINE_COLORS.success} 
                    fill={SPARKLINE_COLORS.success} 
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Weekly Performance Chart */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-blue-900">
              <Calendar className="h-5 w-5 text-blue-500" />
              Last 7 Days Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.weeklyTrend} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                  <Area 
                    type="monotone" 
                    dataKey="sales" 
                    stroke="#3b82f6" 
                    fill="#3b82f6" 
                    fillOpacity={0.3}
                    strokeWidth={2}
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
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-blue-900">
              <Clock className="h-5 w-5 text-blue-500" />
              Recent Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.recentTransactions.length > 0 ? (
              <div className="space-y-3">
                {analytics.recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <ShoppingCart className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-blue-900">
                          {transaction.items} items
                        </div>
                        <div className="text-xs text-blue-600">
                          {transaction.time}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-blue-900">
                        {formatCurrency(transaction.total)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-blue-500 text-sm">No recent transactions</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Categories */}
      {analytics.topCategories.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-blue-900">
              <Target className="h-5 w-5 text-blue-500" />
              Top Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {analytics.topCategories.map((category, index) => (
                <div key={category.category} className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-blue-600 font-bold text-lg">
                      {index + 1}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-blue-900 mb-1">
                    {category.category}
                  </div>
                  <div className="text-lg font-bold text-blue-900">
                    {formatCurrency(category.sales)}
                  </div>
                  <div className="text-xs text-blue-600">
                    {category.percentage.toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
