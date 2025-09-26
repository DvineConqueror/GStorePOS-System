import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { transactionsAPI, productsAPI } from '@/lib/api';
import { formatCurrency } from '@/utils/format';
import { 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer,
  AreaChart,
  Area,
  Tooltip,
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
  PieChart as PieChartIcon
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
}

const SPARKLINE_COLORS = {
  primary: '#3b82f6', // blue-500
  secondary: '#10b981', // emerald-500
  accent: '#8b5cf6', // violet-500
  danger: '#ef4444' // red-500
};

export function ModernAnalyticsV1() {
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
        .slice(0, 5),
      weeklyTrend: weeklyData
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
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-slate-100 animate-pulse rounded-lg" />
          ))}
        </div>
        <div className="h-64 bg-slate-100 animate-pulse rounded-lg" />
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
                <span className="text-sm font-medium text-slate-600">Total Sales</span>
              </div>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mb-2">
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

        {/* Transactions */}
        <Card className="relative overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-emerald-500" />
                <span className="text-sm font-medium text-slate-600">Transactions</span>
              </div>
              <Activity className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mb-2">
              {analytics.totalTransactions}
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
                <Target className="h-4 w-4 text-violet-500" />
                <span className="text-sm font-medium text-slate-600">Avg Transaction</span>
              </div>
              <BarChart3 className="h-4 w-4 text-violet-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mb-2">
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

        {/* Peak Hour */}
        <Card className="relative overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium text-slate-600">Peak Hour</span>
              </div>
              <Award className="h-4 w-4 text-red-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mb-2">
              {analytics.peakHour ? `${analytics.peakHour.hour}:00` : 'N/A'}
            </div>
            <div className="h-8 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.hourlyData}>
                  <Area 
                    type="monotone" 
                    dataKey="sales" 
                    stroke={SPARKLINE_COLORS.danger} 
                    fill={SPARKLINE_COLORS.danger} 
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
        {/* Top Performer */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-slate-900">
              <Users className="h-5 w-5 text-blue-500" />
              Top Performer
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.topPerformer ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-slate-900">{analytics.topPerformer.name}</h4>
                    <p className="text-sm text-slate-600">Leading cashier</p>
                  </div>
                  <Badge className="bg-green-600 text-white border-green-500">
                    #1 Performer
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-slate-50 rounded-lg">
                    <div className="text-lg font-bold text-slate-900">
                      {formatCurrency(analytics.topPerformer.sales)}
                    </div>
                    <div className="text-xs text-slate-600">Total Sales</div>
                  </div>
                  <div className="text-center p-3 bg-slate-50 rounded-lg">
                    <div className="text-lg font-bold text-slate-900">
                      {analytics.topPerformer.transactions}
                    </div>
                    <div className="text-xs text-slate-600">Transactions</div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-slate-500 text-sm">No performance data available</p>
            )}
          </CardContent>
        </Card>

        {/* Top Category */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-slate-900">
              <PieChartIcon className="h-5 w-5 text-emerald-500" />
              Top Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.topCategory && analytics.topCategory.sales > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-slate-900">{analytics.topCategory.name}</h4>
                    <p className="text-sm text-slate-600">Best selling category</p>
                  </div>
                  <Badge className="bg-blue-600 text-white border-blue-500">
                    Top Seller
                  </Badge>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-lg">
                  <div className="text-2xl font-bold text-slate-900 mb-1">
                    {formatCurrency(analytics.topCategory.sales)}
                  </div>
                  <div className="text-sm text-slate-600">Total Revenue</div>
                </div>
                {/* Mini category breakdown */}
                {analytics.categoryData.length > 0 && (
                  <div className="space-y-2">
                    {analytics.categoryData.slice(0, 3).map((cat, index) => (
                      <div key={cat.category} className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">{cat.category}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-400 rounded-full"
                              style={{ width: `${cat.percentage}%` }}
                            />
                          </div>
                          <span className="text-slate-900 font-medium w-12 text-right">
                            {cat.percentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-slate-500 text-sm">No category data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Hourly Performance Chart */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2 text-slate-900">
            <Clock className="h-5 w-5 text-blue-500" />
            Hourly Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.hourlyData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
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
                    backgroundColor: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '8px',
                    color: '#f1f5f9'
                  }}
                  formatter={(value: number) => [formatCurrency(value), 'Sales']}
                  labelStyle={{ color: '#f1f5f9' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
