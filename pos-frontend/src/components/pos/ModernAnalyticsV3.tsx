import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useDataPrefetch } from '@/context/DataPrefetchContext';
import { useRealtimeAnalytics } from '@/hooks/useRealtimeAnalytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { transactionsAPI, productsAPI } from '@/lib/api';
import { formatCurrency } from '@/utils/format';

// Category inference function (matching backend logic)
const inferCategoryFromProductName = (productName: string): string => {
  const name = productName.toLowerCase();
  
  if (name.includes('cracker') || name.includes('chips') || name.includes('snack')) {
    return 'Snacks';
  } else if (name.includes('milk') || name.includes('cheese') || name.includes('yogurt')) {
    return 'Dairy';
  } else if (name.includes('bread') || name.includes('cake') || name.includes('cookie')) {
    return 'Bakery';
  } else if (name.includes('apple') || name.includes('banana') || name.includes('fruit')) {
    return 'Fruits';
  } else if (name.includes('vegetable') || name.includes('carrot') || name.includes('lettuce')) {
    return 'Vegetables';
  } else if (name.includes('meat') || name.includes('chicken') || name.includes('beef')) {
    return 'Meat';
  } else if (name.includes('drink') || name.includes('juice') || name.includes('soda')) {
    return 'Beverages';
  } else if (name.includes('cereal') || name.includes('rice') || name.includes('pasta')) {
    return 'Grains';
  } else {
    return 'General';
  }
};
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

const CATEGORY_COLORS = ['#107146', '#16a34a', '#22c55e', '#4ade80', '#86efac', '#bbf7d0'];

export function ModernAnalyticsV3() {
  const { user } = useAuth();
  const { data: prefetchedData, isLoading: prefetchLoading } = useDataPrefetch();
  const { analytics: realtimeAnalytics, loading: realtimeLoading, error: realtimeError, isConnected } = useRealtimeAnalytics();
  const [analyticsData, setAnalyticsData] = useState<RawAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const analytics = useMemo(() => {
    // First, check if we have analytics data from API (which has growth data)
    if (analyticsData && analyticsData.transactions && analyticsData.transactions.length > 0) {
      // Use the fallback calculation which properly includes growth percentages
      const { transactions, products } = analyticsData;
      const userTransactions = transactions.filter((t: any) => 
        t.status === 'completed' && 
        (user?.role === 'manager' || user?.role === 'superadmin' || t.cashierId === user?.id)
      );

      // Core metrics
      const totalSales = userTransactions.reduce((sum: number, t: any) => sum + t.total, 0);
      const totalTransactions = userTransactions.length;
      const avgTransaction = totalTransactions > 0 ? totalSales / totalTransactions : 0;

      // Calculate previous period for comparison (same period length)
      const now = new Date();
      const currentPeriodStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
      const previousPeriodStart = new Date(currentPeriodStart.getTime() - 30 * 24 * 60 * 60 * 1000); // Previous 30 days
      const previousPeriodEnd = currentPeriodStart;

      // Filter transactions for previous period
      const previousTransactions = transactions.filter((t: any) => {
        const txDate = new Date(t.createdAt || t.timestamp);
        return t.status === 'completed' && 
               (user?.role === 'manager' || user?.role === 'superadmin' || t.cashierId === user?.id) &&
               txDate >= previousPeriodStart && 
               txDate < previousPeriodEnd;
      });

      // Previous period metrics
      const previousTotalSales = previousTransactions.reduce((sum: number, t: any) => sum + t.total, 0);
      const previousTotalTransactions = previousTransactions.length;
      const previousAvgTransaction = previousTotalTransactions > 0 ? previousTotalSales / previousTotalTransactions : 0;

      // Calculate today's metrics
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayTransactions = userTransactions.filter((t: any) => {
        const txDate = new Date(t.createdAt || t.timestamp);
        return txDate >= today;
      });
      const todaySales = todayTransactions.reduce((sum: number, t: any) => sum + t.total, 0);

      // Calculate yesterday's metrics for today's comparison
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayEnd = new Date(yesterday);
      yesterdayEnd.setHours(23, 59, 59, 999);
      
      const yesterdayTransactions = userTransactions.filter((t: any) => {
        const txDate = new Date(t.createdAt || t.timestamp);
        return txDate >= yesterday && txDate <= yesterdayEnd;
      });
      const yesterdaySales = yesterdayTransactions.reduce((sum: number, t: any) => sum + t.total, 0);

      // Calculate percentage changes with proper fallback
      const salesGrowth = previousTotalSales > 0 
        ? ((totalSales - previousTotalSales) / previousTotalSales) * 100 
        : totalSales > 0 ? 100 : 0;
      
      const avgTransactionGrowth = previousAvgTransaction > 0 
        ? ((avgTransaction - previousAvgTransaction) / previousAvgTransaction) * 100 
        : avgTransaction > 0 ? 100 : 0;
      
      const todaySalesGrowth = yesterdaySales > 0 
        ? ((todaySales - yesterdaySales) / yesterdaySales) * 100 
        : todaySales > 0 ? 100 : 0;

      console.log('Calculated growth percentages:', { 
        salesGrowth: Number(salesGrowth.toFixed(1)), 
        avgTransactionGrowth: Number(avgTransactionGrowth.toFixed(1)),
        todaySalesGrowth: Number(todaySalesGrowth.toFixed(1))
      });

      // Additional analytics data
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
          const category = inferCategoryFromProductName(item.productName);
          const current = categorySales.get(category) || 0;
          categorySales.set(category, current + item.totalPrice);
        });
      });

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

      // Recent transactions
      const recentTransactions = userTransactions
        .sort((a: any, b: any) => new Date(b.createdAt || b.timestamp).getTime() - new Date(a.createdAt || a.timestamp).getTime())
        .slice(0, 5)
        .map((t: any) => ({
          id: t._id,
          items: t.items.length,
          total: t.total,
          time: new Date(t.createdAt || t.timestamp).toLocaleTimeString(),
          cashierName: t.cashierName
        }));

      return {
        totalSales,
        totalTransactions,
        avgTransaction,
        todaySales,
        todayTransactions: todayTransactions.length,
        salesGrowth: Number(salesGrowth.toFixed(1)),
        avgTransactionGrowth: Number(avgTransactionGrowth.toFixed(1)),
        todaySalesGrowth: Number(todaySalesGrowth.toFixed(1)),
        topPerformer: topPerformer ? { name: topPerformer[0], ...topPerformer[1] } : null,
        categoryData: Array.from(categorySales.entries())
          .map(([category, sales]) => ({
            category,
            sales,
            percentage: (sales / totalSales) * 100
          }))
          .sort((a, b) => b.sales - a.sales)
          .slice(0, 6),
        weeklyTrend: weeklyData,
        recentTransactions
      } as any;
    }
    
    // Fallback to real-time analytics if available
    if (realtimeAnalytics) {
      const rtData = realtimeAnalytics as any;
      console.log('Using real-time analytics:', rtData);
      
      return {
        totalSales: rtData.sales?.totalSales || 0,
        totalTransactions: rtData.sales?.totalTransactions || 0,
        avgTransaction: rtData.sales?.averageTransactionValue || 0,
        todaySales: rtData.daily?.sales?.totalSales || 0,
        todayTransactions: rtData.daily?.sales?.totalTransactions || 0,
        salesGrowth: rtData.growth?.salesGrowth || 0,
        avgTransactionGrowth: rtData.growth?.avgTransactionGrowth || 0,
        todaySalesGrowth: rtData.growth?.todaySalesGrowth || 0,
        formattedMetrics: realtimeAnalytics.formattedMetrics,
        salesByCategory: realtimeAnalytics.salesByCategory || [],
        hourlySales: realtimeAnalytics.hourlySales || [],
        topPerformer: realtimeAnalytics.topPerformer,
        weeklyTrend: realtimeAnalytics.weeklyTrend || []
      };
    }
    
    return null;
  }, [analyticsData, realtimeAnalytics, user]);

  const fetchAnalytics = async () => {
    // Always fetch data asynchronously, even if real-time data is available
    // This ensures we have the latest data and provides fallback
    try {
      setLoading(true);
      
      // Fetch data in parallel for better performance
      const [transactionsResponse, productsResponse] = await Promise.all([
        transactionsAPI.getTransactions({
          limit: 1000, // Get more transactions for better analytics
          sort: 'createdAt',
          order: 'desc'
        }),
        productsAPI.getProducts()
      ]);
      
      if (transactionsResponse.success && productsResponse.success) {
        const analyticsData = {
          transactions: transactionsResponse.data,
          products: productsResponse.data
        };
        
        setAnalyticsData(analyticsData);
        
        // Cache the analytics data for faster subsequent loads
        try {
          sessionStorage.setItem('analyticsData', JSON.stringify({
            data: analyticsData,
            timestamp: Date.now()
          }));
        } catch (error) {
          console.warn('Failed to cache analytics data:', error);
        }
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      // Prioritize real-time data, then prefetched data, then fetch
      if (realtimeAnalytics) {
        setLoading(false);
        return;
      }

      // Use prefetched data if available (instant loading)
      if (prefetchedData.transactions.length > 0 && prefetchedData.products.length > 0) {
        setAnalyticsData({
          transactions: prefetchedData.transactions,
          products: prefetchedData.products
        });
        setLoading(false);
        return;
      }
      
      // Check sessionStorage for cached analytics data
      try {
        const cachedAnalytics = sessionStorage.getItem('analyticsData');
        if (cachedAnalytics) {
          const parsed = JSON.parse(cachedAnalytics);
          const cacheAge = Date.now() - parsed.timestamp;
          // Use cached data if less than 5 minutes old
          if (cacheAge < 300000) { // 5 minutes
            setAnalyticsData(parsed.data);
            setLoading(false);
            return;
          }
        }
      } catch (error) {
        console.warn('Failed to load cached analytics:', error);
      }

      // Only fetch as last resort if no cached data available
      if (!prefetchLoading.transactions && !prefetchLoading.products) {
        fetchAnalytics();
      }
    }
  }, [user?.id, realtimeAnalytics, prefetchedData, prefetchLoading.transactions, prefetchLoading.products]);

  // Show loading only on initial load without any cached data
  const isInitialLoad = (loading && !analytics) || (realtimeLoading && !realtimeAnalytics && !analyticsData);
  
  if (isInitialLoad) {
    return (
      <div className="space-y-8">
        {/* Subtle loading indicator */}
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
          <span className="ml-2 text-sm text-gray-600">Loading analytics...</span>
        </div>
        
        {/* Main Stats Row Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 bg-slate-100 animate-pulse rounded-2xl" />
          ))}
        </div>
        
        {/* Performance Overview Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-80 bg-slate-100 animate-pulse rounded-2xl" />
          ))}
        </div>
        
        {/* Weekly Trend Chart Skeleton */}
        <div className="h-80 bg-slate-100 animate-pulse rounded-2xl" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data Available</h3>
        <p className="text-gray-600">No analytics data available at the moment.</p>
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
            <Icon className="h-6 w-6 text-green-600" />
            {trend !== undefined && (
              <div className={`flex items-center gap-1 ${trendColor}`}>
                <TrendIcon className="h-4 w-4" />
                <span className="text-sm font-medium">{Math.abs(trend).toFixed(1)}%</span>
              </div>
            )}
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-gray-600">{title}</h3>
            <div className="text-3xl font-bold text-gray-900">{value}</div>
            <p className="text-sm text-gray-500">{subtitle}</p>
          </div>
        </CardContent>
      </Card>
    );
  };

  const radialData = [
    { name: 'Sales', value: 75, fill: '#16a34a' },
    { name: 'Transactions', value: 60, fill: '#22c55e' },
    { name: 'Efficiency', value: 85, fill: '#4ade80' }
  ];

  return (
    <div className="space-y-8">
      {/* Subtle background loading indicator */}
      {(loading || realtimeLoading) && analytics && (
        <div className="fixed bottom-4 right-4 z-50 bg-green-100 border border-green-300 rounded-lg px-3 py-2 shadow-sm">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-2"></div>
            <span className="text-sm text-green-800">Updating data...</span>
          </div>
        </div>
      )}
      
      {/* Main Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Sales"
          value={realtimeAnalytics?.formattedMetrics?.totalSales?.formatted || formatCurrency(analytics.totalSales)}
          subtitle={`${analytics.totalTransactions} transactions`}
          icon={DollarSign}
          color="bg-green-700"
          trend={analytics.salesGrowth}
        />
        <StatCard
          title="Today's Sales"
          value={formatCurrency(analytics.todaySales)}
          subtitle={`${analytics.todayTransactions} transactions today`}
          icon={Calendar}
          color="bg-green-700"
          trend={analytics.todaySalesGrowth}
        />
        <StatCard
          title="Avg Transaction"
          value={realtimeAnalytics?.formattedMetrics?.averageTransactionValue?.formatted || formatCurrency(analytics.avgTransaction)}
          subtitle="Per transaction"
          icon={Target}
          color="bg-green-700"
          trend={analytics.avgTransactionGrowth}
        />
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Performer */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3">
              <Award className="h-5 w-5 text-green-600" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Top Performer</h3>
                <p className="text-sm text-gray-600">Leading cashier</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(realtimeAnalytics?.topPerformer || analytics.topPerformer) ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                  <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center">
                    <span className="text-white font-bold text-xl">
                      {(realtimeAnalytics?.topPerformer?.name || analytics.topPerformer?.name)?.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 text-lg">{realtimeAnalytics?.topPerformer?.name || analytics.topPerformer?.name}</h4>
                    <p className="text-sm text-gray-600">Cashier</p>
                    <Badge className="bg-green-600 text-white mt-1">
                      #1 Performer
                    </Badge>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 bg-gray-50 rounded-xl">
                    <div className="text-xl font-bold text-gray-900">
                      {formatCurrency(realtimeAnalytics?.topPerformer?.amount || analytics.topPerformer?.sales || 0)}
                    </div>
                    <div className="text-xs text-gray-600">Sales</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-xl">
                    <div className="text-xl font-bold text-gray-900">
                      {realtimeAnalytics?.topPerformer?.count || analytics.topPerformer?.transactions || 0}
                    </div>
                    <div className="text-xs text-gray-600">Transactions</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No performance data</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3">
              <PieChartIcon className="h-5 w-5 text-green-600" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Categories</h3>
                <p className="text-sm text-gray-600">Sales breakdown</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {((realtimeAnalytics?.salesByCategory && realtimeAnalytics.salesByCategory.length > 0) || analytics.categoryData.length > 0) ? (
              <div className="space-y-3">
                {(realtimeAnalytics?.salesByCategory || analytics.categoryData).slice(0, 4).map((category: any, index: number) => (
                  <div key={category.category} className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: CATEGORY_COLORS[index % CATEGORY_COLORS.length] }}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600">{category.category}</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {formatCurrency(category.amount || category.sales)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
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
                <PieChartIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No category data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-green-600" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
                <p className="text-sm text-gray-600">Latest activity</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.recentTransactions.length > 0 ? (
              <div className="space-y-4">
                {analytics.recentTransactions.map((transaction, index) => (
                  <div key={transaction.id} className={`flex items-center gap-4 p-4 rounded-2xl ${
                    index % 2 === 0 ? "bg-white" : "bg-gray-50"
                  }`}>
                    <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">
                      <span className="text-green-600 font-bold text-lg">
                        {index + 1}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 text-lg">{transaction.items} items</h4>
                      <p className="text-sm text-gray-600">{transaction.cashierName} • {transaction.time}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-gray-900">
                        {formatCurrency(transaction.total)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No recent transactions</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Weekly Trend Chart */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3">
            <TrendingUpIcon className="h-5 w-5 text-green-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Weekly Trend</h3>
              <p className="text-sm text-gray-600">Sales performance over the last 7 days</p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={realtimeAnalytics?.weeklyTrend || analytics.weeklyTrend} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <Line 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#16a34a" 
                  strokeWidth={4}
                  dot={{ fill: '#16a34a', strokeWidth: 2, r: 6 }}
                  activeDot={{ r: 8, stroke: '#16a34a', strokeWidth: 2 }}
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

      {/* Real-time Connection Status */}
      {isConnected && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium">Live Analytics</span>
        </div>
      )}
    </div>
  );
}
