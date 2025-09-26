import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { transactionsAPI } from '@/lib/api';
import { formatCurrency } from '@/utils/format';
import { 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
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
  Award,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  TrendingUp as TrendingUpIcon,
  Minus
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
  efficiency: {
    salesPerHour: number;
    transactionsPerHour: number;
    avgItemsPerTransaction: number;
  };
}

const CATEGORY_COLORS = ['#3b82f6', '#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

export function ModernCashierAnalyticsV3() {
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

    // Efficiency metrics
    const totalHours = 24; // Assuming 24-hour operation
    const efficiency = {
      salesPerHour: totalSales / totalHours,
      transactionsPerHour: totalTransactions / totalHours,
      avgItemsPerTransaction: totalTransactions > 0 ? itemsSold / totalTransactions : 0
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
      efficiency
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
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 bg-blue-100 animate-pulse rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 bg-blue-100 animate-pulse rounded-2xl" />
          <div className="h-80 bg-blue-100 animate-pulse rounded-2xl" />
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

  const StatCard = ({ 
    title, 
    value, 
    subtitle, 
    icon: Icon, 
    color, 
    trend 
  }: { 
    title: string; 
    value: string; 
    subtitle: string; 
    icon: any; 
    color: string; 
    trend?: number;
  }) => {
    const TrendIcon = trend && trend > 0 ? ArrowUpRight : trend && trend < 0 ? ArrowDownRight : Minus;
    const trendColor = trend && trend > 0 ? 'text-emerald-500' : trend && trend < 0 ? 'text-red-500' : 'text-blue-400';
    
    return (
      <Card className="relative overflow-hidden">
        <div className={`absolute top-0 right-0 w-32 h-32 ${color} opacity-10 rounded-full -translate-y-16 translate-x-16`} />
        <CardContent className="p-6 relative">
          <div className="flex items-center justify-between mb-4">
            <Icon className="h-6 w-6 text-blue-500" />
            {trend !== undefined && (
              <div className={`flex items-center gap-1 ${trendColor}`}>
                <TrendIcon className="h-4 w-4" />
                <span className="text-sm font-medium">{Math.abs(trend).toFixed(1)}%</span>
              </div>
            )}
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-blue-700">{title}</h3>
            <div className="text-3xl font-bold text-blue-900">{value}</div>
            <p className="text-sm text-blue-600">{subtitle}</p>
          </div>
        </CardContent>
      </Card>
    );
  };

  const radialData = [
    { name: 'Sales', value: 75, fill: '#3b82f6' },
    { name: 'Transactions', value: 60, fill: '#06b6d4' },
    { name: 'Efficiency', value: 85, fill: '#8b5cf6' }
  ];

  return (
    <div className="space-y-8">
      {/* Main Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Sales"
          value={formatCurrency(analytics.totalSales)}
          subtitle={`${analytics.totalTransactions} transactions`}
          icon={DollarSign}
          color="bg-blue-100"
          trend={12.5}
        />
        <StatCard
          title="Today's Sales"
          value={formatCurrency(analytics.todaySales)}
          subtitle={`${analytics.todayTransactions} transactions today`}
          icon={Calendar}
          color="bg-blue-100"
        />
        <StatCard
          title="Avg Transaction"
          value={formatCurrency(analytics.avgTransaction)}
          subtitle="Per transaction"
          icon={Target}
          color="bg-blue-100"
          trend={-2.3}
        />
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-blue-500" />
              <div>
                <h3 className="text-lg font-semibold text-blue-900">Recent Transactions</h3>
                <p className="text-sm text-blue-600">Latest activity</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.recentTransactions.length > 0 ? (
              <div className="space-y-4">
                {analytics.recentTransactions.map((transaction, index) => (
                  <div key={transaction.id} className="flex items-center gap-4 p-4 bg-blue-50 rounded-2xl">
                    <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                      <span className="text-blue-600 font-bold text-lg">
                        {index + 1}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-blue-900 text-lg">{transaction.items} items</h4>
                      <p className="text-sm text-blue-600">{transaction.time}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-blue-900">
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

        {/* Category Breakdown */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3">
              <Target className="h-5 w-5 text-blue-500" />
              <div>
                <h3 className="text-lg font-semibold text-blue-900">Top Categories</h3>
                <p className="text-sm text-blue-600">Sales breakdown</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.topCategories.length > 0 ? (
              <div className="space-y-3">
                {analytics.topCategories.map((category, index) => (
                  <div key={category.category} className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: CATEGORY_COLORS[index % CATEGORY_COLORS.length] }}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-blue-700">{category.category}</span>
                        <span className="text-sm font-semibold text-blue-900">
                          {formatCurrency(category.sales)}
                        </span>
                      </div>
                      <div className="w-full bg-blue-200 rounded-full h-2 mt-1">
                        <div 
                          className="h-2 rounded-full"
                          style={{ 
                            width: `${category.percentage}%`,
                            backgroundColor: CATEGORY_COLORS[index % CATEGORY_COLORS.length]
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Target className="h-12 w-12 text-blue-400 mx-auto mb-3" />
                <p className="text-blue-500">No category data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3">
              <Zap className="h-5 w-5 text-blue-500" />
              <div>
                <h3 className="text-lg font-semibold text-blue-900">Efficiency</h3>
                <p className="text-sm text-blue-600">Performance metrics</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="80%" data={radialData}>
                  <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                  <RadialBar dataKey="value" cornerRadius={8} fill="#3b82f6" />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-4">
              <div className="text-center">
                <div className="text-lg font-bold text-blue-900">
                  {formatCurrency(analytics.efficiency.salesPerHour)}
                </div>
                <div className="text-xs text-blue-600">Sales/hr</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-blue-900">
                  {analytics.efficiency.transactionsPerHour.toFixed(1)}
                </div>
                <div className="text-xs text-blue-600">Txns/hr</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-blue-900">
                  {analytics.efficiency.avgItemsPerTransaction.toFixed(1)}
                </div>
                <div className="text-xs text-blue-600">Items/txn</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Trend Chart */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3">
            <TrendingUpIcon className="h-5 w-5 text-blue-500" />
            <div>
              <h3 className="text-lg font-semibold text-blue-900">Weekly Trend</h3>
              <p className="text-sm text-blue-600">Sales performance over the last 7 days</p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.weeklyTrend} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <Line 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#3b82f6" 
                  strokeWidth={4}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 6 }}
                  activeDot={{ r: 8, stroke: '#3b82f6', strokeWidth: 2 }}
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
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
