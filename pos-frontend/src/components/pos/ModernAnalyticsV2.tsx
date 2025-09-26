import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { transactionsAPI, productsAPI } from '@/lib/api';
import { formatCurrency } from '@/utils/format';
import { 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Target, 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Award,
  Activity,
  BarChart3,
  PieChart as PieChartIcon,
  Zap,
  Star,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

interface RawAnalyticsData {
  transactions: any[];
  products: any[];
}

interface AnalyticsData {
  totalSales: number;
  totalTransactions: number;
  avgTransaction: number;
  peakHour: { hour: number; sales: number } | null;
  topPerformer: { name: string; sales: number; transactions: number } | null;
  topCategory: { name: string; sales: number } | null;
  hourlyData: Array<{ hour: string; sales: number }>;
  categoryData: Array<{ category: string; sales: number; percentage: number }>;
  weeklyTrend: Array<{ day: string; sales: number }>;
  growthMetrics: {
    salesGrowth: number;
    transactionGrowth: number;
    avgTransactionGrowth: number;
  };
}

const CATEGORY_COLORS = ['#60a5fa', '#4ade80', '#fbbf24', '#f87171', '#a78bfa', '#22d3ee'];

export function ModernAnalyticsV2() {
  const { user } = useAuth();
  const [analyticsData, setAnalyticsData] = useState<RawAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const analytics = useMemo(() => {
    if (!analyticsData) return null;

    const { transactions, products } = analyticsData;
    const userTransactions = transactions.filter((t: any) => 
      t.status === 'completed' && 
      (user?.role === 'manager' || t.cashierId === user?.id)
    );

    // Core metrics
    const totalSales = userTransactions.reduce((sum: number, t: any) => sum + t.total, 0);
    const totalTransactions = userTransactions.length;
    const avgTransaction = totalTransactions > 0 ? totalSales / totalTransactions : 0;

    // Peak hour analysis
    const hourlySales = new Map();
    userTransactions.forEach((t: any) => {
      const hour = new Date(t.createdAt || t.timestamp).getHours();
      const current = hourlySales.get(hour) || 0;
      hourlySales.set(hour, current + t.total);
    });
    const peakHour = Array.from(hourlySales.entries())
      .sort(([,a], [,b]) => b - a)[0];

    // Top performer
    const cashierPerformance = new Map();
    userTransactions.forEach((t: any) => {
      const cashier = t.cashierName || 'Unknown';
      const current = cashierPerformance.get(cashier) || { sales: 0, transactions: 0 };
      cashierPerformance.set(cashier, {
        sales: current.sales + t.total,
        transactions: current.transactions + 1
      });
    });
    const topPerformer = Array.from(cashierPerformance.entries())
      .sort(([,a], [,b]) => b.sales - a.sales)[0];

    // Category analysis
    const categorySales = new Map();
    userTransactions.forEach((t: any) => {
      t.items.forEach((item: any) => {
        const category = item.category || 'Others';
        const current = categorySales.get(category) || 0;
        categorySales.set(category, current + (item.price * item.quantity));
      });
    });
    const topCategory = Array.from(categorySales.entries())
      .sort(([,a], [,b]) => b - a)[0];

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
        sales: daySales
      });
    }

    // Growth calculations (mock data for demo)
    const growthMetrics = {
      salesGrowth: Math.random() * 20 - 10, // -10% to +10%
      transactionGrowth: Math.random() * 15 - 7.5,
      avgTransactionGrowth: Math.random() * 12 - 6
    };

    return {
      totalSales,
      totalTransactions,
      avgTransaction,
      peakHour: peakHour ? { hour: peakHour[0], sales: peakHour[1] } : null,
      topPerformer: topPerformer ? { name: topPerformer[0], ...topPerformer[1] } : null,
      topCategory: topCategory ? { name: topCategory[0], sales: topCategory[1] } : null,
      hourlyData: Array.from(hourlySales.entries())
        .map(([hour, sales]) => ({ hour: `${hour}:00`, sales }))
        .sort((a, b) => parseInt(a.hour) - parseInt(b.hour)),
      categoryData: Array.from(categorySales.entries())
        .map(([category, sales]) => ({
          category,
          sales,
          percentage: (sales / totalSales) * 100
        }))
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 6),
      weeklyTrend: weeklyData,
      growthMetrics
    };
  }, [analyticsData, user]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const transactionsResponse = await transactionsAPI.getTransactions();
      const productsResponse = await productsAPI.getProducts();
      
      if (transactionsResponse.success && productsResponse.success) {
        setAnalyticsData({
          transactions: transactionsResponse.data,
          products: productsResponse.data
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
            <div key={i} className="h-32 bg-slate-200 animate-pulse rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-slate-200 animate-pulse rounded-xl" />
          <div className="h-80 bg-slate-200 animate-pulse rounded-xl" />
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <Activity className="h-12 w-12 text-slate-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 mb-2">No Data Available</h3>
        <p className="text-slate-600">No analytics data available at the moment.</p>
      </div>
    );
  }

  const GrowthIndicator = ({ value, label }: { value: number; label: string }) => {
    const isPositive = value >= 0;
    const Icon = isPositive ? ArrowUpRight : ArrowDownRight;
    
    return (
      <div className="flex items-center gap-1">
        <Icon className={`h-3 w-3 ${isPositive ? 'text-green-500' : 'text-red-500'}`} />
        <span className={`text-xs font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
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
              <DollarSign className="h-6 w-6 text-green-400" />
              <GrowthIndicator value={analytics.growthMetrics.salesGrowth} label="Sales" />
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-slate-600">Total Sales</h3>
              <div className="text-3xl font-bold text-slate-900">
                {formatCurrency(analytics.totalSales)}
              </div>
              <div className="text-xs text-slate-500">
                {analytics.totalTransactions} transactions
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transactions */}
        <Card className="relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <ShoppingCart className="h-6 w-6 text-blue-400" />
              <GrowthIndicator value={analytics.growthMetrics.transactionGrowth} label="Transactions" />
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-slate-600">Transactions</h3>
              <div className="text-3xl font-bold text-slate-900">
                {analytics.totalTransactions}
              </div>
              <div className="text-xs text-slate-500">
                {formatCurrency(analytics.avgTransaction)} avg
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Peak Hour */}
        <Card className="relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Clock className="h-6 w-6 text-blue-400" />
              <Star className="h-4 w-4 text-blue-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-slate-600">Peak Hour</h3>
              <div className="text-3xl font-bold text-slate-900">
                {analytics.peakHour ? `${analytics.peakHour.hour}:00` : 'N/A'}
              </div>
              <div className="text-xs text-slate-500">
                {analytics.peakHour ? formatCurrency(analytics.peakHour.sales) : 'No data'}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Category */}
        <Card className="relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Target className="h-6 w-6 text-green-400" />
              <Badge className="bg-green-600 text-white border-green-500">
                Top
              </Badge>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-slate-600">Top Category</h3>
              <div className="text-lg font-bold text-slate-900 truncate">
                {analytics.topCategory?.name || 'N/A'}
              </div>
              <div className="text-xs text-slate-500">
                {analytics.topCategory && analytics.topCategory.sales > 0 ? formatCurrency(analytics.topCategory.sales) : 'No data'}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performer Card */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3">
              <Users className="h-5 w-5 text-blue-400" />
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Top Performer</h3>
                <p className="text-sm text-slate-600">Leading cashier this period</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.topPerformer ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg">
                        {analytics.topPerformer.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900">{analytics.topPerformer.name}</h4>
                      <p className="text-sm text-slate-600">Cashier</p>
                    </div>
                  </div>
                  <Badge className="bg-blue-600 text-white">
                    #1
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-slate-50 rounded-lg">
                    <div className="text-2xl font-bold text-slate-900">
                      {formatCurrency(analytics.topPerformer.sales)}
                    </div>
                    <div className="text-sm text-slate-600">Total Sales</div>
                  </div>
                  <div className="text-center p-4 bg-slate-50 rounded-lg">
                    <div className="text-2xl font-bold text-slate-900">
                      {analytics.topPerformer.transactions}
                    </div>
                    <div className="text-sm text-slate-600">Transactions</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-500">No performance data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category Performance */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3">
              <PieChartIcon className="h-5 w-5 text-green-400" />
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Category Performance</h3>
                <p className="text-sm text-slate-600">Sales by category breakdown</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.categoryData.length > 0 ? (
              <div className="space-y-4">
                {analytics.categoryData.map((category, index) => (
                  <div key={category.category} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-600">{category.category}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900">
                          {formatCurrency(category.sales)}
                        </span>
                        <span className="text-xs text-slate-500">
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
            ) : (
              <div className="text-center py-8">
                <PieChartIcon className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-500">No category data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Hourly Performance Chart */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3">
            <BarChart3 className="h-5 w-5 text-blue-400" />
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Hourly Performance</h3>
              <p className="text-sm text-slate-600">Sales distribution throughout the day</p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.hourlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                <XAxis 
                  dataKey="hour" 
                  tick={{ fontSize: 12, fill: '#94a3b8' }}
                  axisLine={{ stroke: '#475569' }}
                  tickLine={{ stroke: '#475569' }}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: '#94a3b8' }}
                  axisLine={{ stroke: '#475569' }}
                  tickLine={{ stroke: '#475569' }}
                  tickFormatter={(value) => `₱${value}`}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '8px',
                    color: '#f1f5f9'
                  }}
                  formatter={(value: number) => [formatCurrency(value), 'Sales']}
                  labelStyle={{ color: '#f1f5f9' }}
                />
                <Bar 
                  dataKey="sales" 
                  fill="url(#colorGradient)"
                  radius={[4, 4, 0, 0]}
                />
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#60a5fa" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
