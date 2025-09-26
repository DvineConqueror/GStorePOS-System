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
  Users, 
  Award,
  Activity,
  BarChart3,
  PieChart as PieChartIcon,
  Zap,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  TrendingUp as TrendingUpIcon,
  Minus
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
  efficiency: {
    salesPerHour: number;
    transactionsPerHour: number;
    avgItemsPerTransaction: number;
  };
}

const CATEGORY_COLORS = ['#60a5fa', '#4ade80', '#fbbf24', '#f87171', '#a78bfa', '#22d3ee'];

export function ModernAnalyticsV3() {
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

    // Efficiency metrics
    const totalItems = userTransactions.reduce((sum: number, t: any) => 
      sum + t.items.reduce((itemSum: number, item: any) => itemSum + item.quantity, 0), 0
    );
    const totalHours = 24; // Assuming 24-hour operation
    const efficiency = {
      salesPerHour: totalSales / totalHours,
      transactionsPerHour: totalTransactions / totalHours,
      avgItemsPerTransaction: totalTransactions > 0 ? totalItems / totalTransactions : 0
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
      efficiency
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 bg-slate-200 animate-pulse rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 bg-slate-200 animate-pulse rounded-2xl" />
          <div className="h-80 bg-slate-200 animate-pulse rounded-2xl" />
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
    const trendColor = trend && trend > 0 ? 'text-green-400' : trend && trend < 0 ? 'text-red-400' : 'text-slate-400';
    
    return (
      <Card className="relative overflow-hidden">
        <div className={`absolute top-0 right-0 w-32 h-32 ${color} opacity-10 rounded-full -translate-y-16 translate-x-16`} />
        <CardContent className="p-6 relative">
          <div className="flex items-center justify-between mb-4">
            <Icon className="h-6 w-6 text-blue-400" />
            {trend !== undefined && (
              <div className={`flex items-center gap-1 ${trendColor}`}>
                <TrendIcon className="h-4 w-4" />
                <span className="text-sm font-medium">{Math.abs(trend).toFixed(1)}%</span>
              </div>
            )}
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-slate-600">{title}</h3>
            <div className="text-3xl font-bold text-slate-900">{value}</div>
            <p className="text-sm text-slate-500">{subtitle}</p>
          </div>
        </CardContent>
      </Card>
    );
  };

  const radialData = [
    { name: 'Sales', value: 75, fill: '#60a5fa' },
    { name: 'Transactions', value: 60, fill: '#4ade80' },
    { name: 'Efficiency', value: 85, fill: '#fbbf24' }
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
          color="bg-slate-700"
          trend={12.5}
        />
        <StatCard
          title="Peak Hour"
          value={analytics.peakHour ? `${analytics.peakHour.hour}:00` : 'N/A'}
          subtitle={analytics.peakHour ? formatCurrency(analytics.peakHour.sales) : 'No data'}
          icon={Clock}
          color="bg-slate-700"
        />
        <StatCard
          title="Avg Transaction"
          value={formatCurrency(analytics.avgTransaction)}
          subtitle="Per transaction"
          icon={Target}
          color="bg-slate-700"
          trend={-2.3}
        />
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Performer */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3">
              <Award className="h-5 w-5 text-blue-400" />
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Top Performer</h3>
                <p className="text-sm text-slate-600">Leading cashier</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.topPerformer ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
                  <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center">
                    <span className="text-white font-bold text-xl">
                      {analytics.topPerformer.name.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-900 text-lg">{analytics.topPerformer.name}</h4>
                    <p className="text-sm text-slate-600">Cashier</p>
                    <Badge className="bg-blue-600 text-white mt-1">
                      #1 Performer
                    </Badge>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 bg-slate-50 rounded-xl">
                    <div className="text-xl font-bold text-slate-900">
                      {formatCurrency(analytics.topPerformer.sales)}
                    </div>
                    <div className="text-xs text-slate-600">Sales</div>
                  </div>
                  <div className="text-center p-3 bg-slate-50 rounded-xl">
                    <div className="text-xl font-bold text-slate-900">
                      {analytics.topPerformer.transactions}
                    </div>
                    <div className="text-xs text-slate-600">Transactions</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-500">No performance data</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3">
              <PieChartIcon className="h-5 w-5 text-green-400" />
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Categories</h3>
                <p className="text-sm text-slate-600">Sales breakdown</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.categoryData.length > 0 ? (
              <div className="space-y-3">
                {analytics.categoryData.slice(0, 4).map((category, index) => (
                  <div key={category.category} className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: CATEGORY_COLORS[index % CATEGORY_COLORS.length] }}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-600">{category.category}</span>
                        <span className="text-sm font-semibold text-slate-900">
                          {formatCurrency(category.sales)}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 mt-1">
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
                <PieChartIcon className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-500">No category data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3">
              <Zap className="h-5 w-5 text-blue-400" />
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Efficiency</h3>
                <p className="text-sm text-slate-600">Performance metrics</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="80%" data={radialData}>
                  <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                  <RadialBar dataKey="value" cornerRadius={8} fill="#60a5fa" />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-4">
              <div className="text-center">
                <div className="text-lg font-bold text-slate-900">
                  {formatCurrency(analytics.efficiency.salesPerHour)}
                </div>
                <div className="text-xs text-slate-600">Sales/hr</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-slate-900">
                  {analytics.efficiency.transactionsPerHour.toFixed(1)}
                </div>
                <div className="text-xs text-slate-600">Txns/hr</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-slate-900">
                  {analytics.efficiency.avgItemsPerTransaction.toFixed(1)}
                </div>
                <div className="text-xs text-slate-600">Items/txn</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Trend Chart */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3">
            <TrendingUpIcon className="h-5 w-5 text-blue-400" />
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Weekly Trend</h3>
              <p className="text-sm text-slate-600">Sales performance over the last 7 days</p>
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
                  stroke="#60a5fa" 
                  strokeWidth={4}
                  dot={{ fill: '#60a5fa', strokeWidth: 2, r: 6 }}
                  activeDot={{ r: 8, stroke: '#60a5fa', strokeWidth: 2 }}
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
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
