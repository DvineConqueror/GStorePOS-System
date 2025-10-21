import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { transactionsAPI } from '@/lib/api';
import { formatCurrency } from '@/utils/format';
import { WeeklyTrendChart } from '@/components/analytics/WeeklyTrendChart';
import { CategoryBreakdownChart } from '@/components/analytics/CategoryBreakdownChart';
import { useProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';

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
import { Line } from 'react-chartjs-2';
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
  TrendingUp as TrendingUpIcon
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

const CATEGORY_COLORS = ['#107146', '#16a34a', '#22c55e', '#4ade80', '#86efac', '#bbf7d0'];

export function ModernCashierAnalyticsV3() {
  const { user } = useAuth();
  const [analyticsData, setAnalyticsData] = useState<RawAnalyticsData | null>(null);
  
  // React Query hooks for products and categories
  const { data: productsData } = useProducts();
  const { data: categoriesData } = useCategories();
  
  // Extract data from API responses
  const products = productsData?.data || [];
  const categories = categoriesData?.data || [];
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

    // Calculate previous period for comparison (last 30 days vs previous 30 days)
    const now = new Date();
    const currentPeriodStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
    const previousPeriodStart = new Date(currentPeriodStart.getTime() - 30 * 24 * 60 * 60 * 1000); // Previous 30 days
    const previousPeriodEnd = currentPeriodStart;

    // Filter transactions for previous period
    const previousTransactions = transactions.filter((t: any) => {
      const txDate = new Date(t.createdAt || t.timestamp);
      return t.status === 'completed' && 
             t.cashierId === user.id &&
             txDate >= previousPeriodStart && 
             txDate < previousPeriodEnd;
    });

    // Previous period metrics
    const previousTotalSales = previousTransactions.reduce((sum: number, t: any) => sum + t.total, 0);
    const previousTotalTransactions = previousTransactions.length;
    const previousAvgTransaction = previousTotalTransactions > 0 ? previousTotalSales / previousTotalTransactions : 0;

    // Today's metrics
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

    // Calculate percentage changes
    const salesGrowth = previousTotalSales > 0 
      ? ((totalSales - previousTotalSales) / previousTotalSales) * 100 
      : totalSales > 0 ? 100 : 0;
    
    const avgTransactionGrowth = previousAvgTransaction > 0 
      ? ((avgTransaction - previousAvgTransaction) / previousAvgTransaction) * 100 
      : avgTransaction > 0 ? 100 : 0;
    
    const todaySalesGrowth = yesterdaySales > 0 
      ? ((todaySales - yesterdaySales) / yesterdaySales) * 100 
      : todaySales > 0 ? 100 : 0;

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

    // Monthly cumulative sales (current month)
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    
    // Get all transactions for the current month
    const monthTransactions = userTransactions.filter((t: any) => {
      const txDate = new Date(t.createdAt || t.timestamp);
      return txDate >= firstDayOfMonth && txDate <= currentDate;
    });
    
    const monthTotalSales = monthTransactions.reduce((sum: number, t: any) => sum + t.total, 0);
    
    // Calculate cumulative daily sales
    const monthlyCumulativeData = [];
    let cumulativeSales = 0;
    
    for (let day = 1; day <= currentDate.getDate(); day++) {
      const dayTransactions = monthTransactions.filter((t: any) => {
        const txDate = new Date(t.createdAt || t.timestamp);
        return txDate.getDate() === day;
      });
      const daySales = dayTransactions.reduce((sum: number, t: any) => sum + t.total, 0);
      cumulativeSales += daySales;
      
      monthlyCumulativeData.push({
        day: day.toString(),
        sales: cumulativeSales,
        dailySales: daySales
      });
    }

    // Calculate previous month's sales for comparison
    const firstDayOfPrevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const lastDayOfPrevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);
    
    const prevMonthTransactions = transactions.filter((t: any) => {
      const txDate = new Date(t.createdAt || t.timestamp);
      return t.status === 'completed' && 
             t.cashierId === user.id &&
             txDate >= firstDayOfPrevMonth && 
             txDate <= lastDayOfPrevMonth;
    });
    
    const prevMonthTotalSales = prevMonthTransactions.reduce((sum: number, t: any) => sum + t.total, 0);
    const monthGrowth = prevMonthTotalSales > 0 
      ? ((monthTotalSales - prevMonthTotalSales) / prevMonthTotalSales) * 100 
      : monthTotalSales > 0 ? 100 : 0;

    // Recent transactions (last 5) with item details
    const recentTransactions = userTransactions
      .sort((a: any, b: any) => new Date(b.createdAt || b.timestamp).getTime() - new Date(a.createdAt || a.timestamp).getTime())
      .slice(0, 5)
      .map((t: any) => ({
        id: t.id,
        total: t.total,
        items: t.items.reduce((sum: number, item: any) => sum + item.quantity, 0),
        itemDetails: t.items.map((item: any) => ({
          name: item.productName,
          quantity: item.quantity,
          price: item.totalPrice
        })),
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

    // Top categories using backend categories (like manager analytics)
    const categorySales = new Map();
    
    // Initialize all categories with 0 sales
    categories.forEach(category => {
      categorySales.set(category, 0);
    });
    
    // Calculate sales for each category from transactions
    userTransactions.forEach((t: any) => {
      t.items.forEach((item: any) => {
        // Find the product to get its actual category
        const product = products.find((p: any) => p._id === item.productId);
        const category = product?.category || inferCategoryFromProductName(item.productName);
        const current = categorySales.get(category) || 0;
        categorySales.set(category, current + item.totalPrice);
      });
    });
    
    const topCategories = Array.from(categorySales.entries())
      .map(([category, sales]) => ({
        category,
        sales,
        percentage: totalSales > 0 ? (sales / totalSales) * 100 : 0
      }))
      .sort((a, b) => b.sales - a.sales);

    return {
      totalSales,
      todaySales,
      avgTransaction,
      itemsSold,
      totalTransactions,
      todayTransactions: todayTransactions.length,
      monthTotalSales,
      salesGrowth: Number(salesGrowth.toFixed(1)),
      avgTransactionGrowth: Number(avgTransactionGrowth.toFixed(1)),
      todaySalesGrowth: Number(todaySalesGrowth.toFixed(1)),
      monthGrowth: Number(monthGrowth.toFixed(1)),
      weeklyTrend: weeklyData,
      monthlyCumulativeData,
      recentTransactions,
      hourlyPerformance,
      topCategories
    };
  }, [analyticsData, user, products, categories]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      // Fetch transactions asynchronously with optimized parameters
      const response = await transactionsAPI.getTransactions({
        limit: 1000, // Get more transactions for better analytics
        sort: 'createdAt',
        order: 'desc'
      });
      
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
    color
  }: { 
    title: string; 
    value: string; 
    subtitle: string; 
    icon: any; 
    color: string;
  }) => {
    return (
      <Card className="relative overflow-hidden">
        <div className={`absolute top-0 right-0 w-32 h-32 ${color} opacity-10 rounded-full -translate-y-16 translate-x-16`} />
        <CardContent className="p-6 relative">
          <div className="flex items-center justify-between mb-4">
            <Icon className="h-6 w-6 text-green-600" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-gray-700">{title}</h3>
            <div className="text-3xl font-bold text-gray-900">{value}</div>
            <p className="text-sm text-gray-600">{subtitle}</p>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-8">
      {/* Main Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Sales"
          value={formatCurrency(analytics.totalSales)}
          subtitle={`${analytics.totalTransactions} transactions`}
          icon={DollarSign}
          color="bg-green-100"
        />
        <StatCard
          title="Today's Sales"
          value={formatCurrency(analytics.todaySales)}
          subtitle={`${analytics.todayTransactions} transactions today`}
          icon={Calendar}
          color="bg-green-100"
        />
        
        {/* This Month's Sales - Cumulative Chart */}
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-100 opacity-30 rounded-full -translate-y-16 translate-x-16" />
          <CardContent className="p-6 relative">
            <div className="flex items-center justify-between mb-4">
              <Target className="h-6 w-6 text-green-600" />
            </div>
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-medium text-gray-700">This Month's Sales</h3>
                <div className="text-3xl font-bold text-gray-900">
                  {formatCurrency(analytics.monthTotalSales || 0)}
                </div>
                <p className="text-sm text-gray-600">
                  {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </p>
              </div>
              
              {/* Cumulative Line Chart */}
              <div className="h-24 w-full">
                <Line 
                  data={{
                    labels: analytics.monthlyCumulativeData?.map((item: any) => item.day) || [],
                    datasets: [{
                      label: 'Cumulative Sales',
                      data: analytics.monthlyCumulativeData?.map((item: any) => item.sales) || [],
                      borderColor: '#16a34a',
                      backgroundColor: 'rgba(22, 163, 74, 0.1)',
                      borderWidth: 2,
                      fill: true,
                      tension: 0.4,
                      pointRadius: 0,
                      pointHoverRadius: 6,
                      pointHoverBackgroundColor: '#16a34a',
                      pointHoverBorderColor: '#ffffff',
                      pointHoverBorderWidth: 2,
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                        titleColor: '#f1f5f9',
                        bodyColor: '#f1f5f9',
                        borderColor: '#475569',
                        borderWidth: 1,
                        cornerRadius: 8,
                        displayColors: false,
                        padding: 10,
                        callbacks: {
                          title: (context: any) => `Day ${context[0].label}`,
                          label: (context: any) => `₱${context.parsed.y.toLocaleString()}`
                        }
                      }
                    },
                    scales: {
                      x: {
                        display: false,
                        grid: { display: false }
                      },
                      y: {
                        display: false,
                        beginAtZero: true,
                        grid: { display: false }
                      }
                    },
                    interaction: {
                      intersect: false,
                      mode: 'index' as const
                    }
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
              <div className="h-80 overflow-y-auto space-y-3 pr-2">
                {analytics.recentTransactions.map((transaction, index) => (
                  <div key={transaction.id} className={`flex flex-col gap-3 p-4 rounded-xl ${
                    index % 2 === 0 ? "bg-white" : "bg-gray-50"
                  }`}>
                    {/* Transaction Header */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <span className="text-green-600 font-bold text-sm">
                          {index + 1}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 text-sm truncate">{transaction.items} items</h4>
                        <p className="text-xs text-gray-600 truncate">{transaction.time}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-lg font-bold text-gray-900">
                          {formatCurrency(transaction.total)}
                        </div>
                      </div>
                    </div>
                    
                    {/* Item Details */}
                    <div className="ml-13 space-y-1">
                      {transaction.itemDetails.slice(0, 3).map((item: any, itemIndex: number) => (
                        <div key={itemIndex} className="flex justify-between items-center text-xs bg-gray-50 p-2 rounded">
                          <span className="truncate flex-1">{item.name}</span>
                          <span className="ml-2 text-gray-600">×{item.quantity}</span>
                          <span className="ml-2 font-medium text-gray-900">{formatCurrency(item.price)}</span>
                        </div>
                      ))}
                      {transaction.itemDetails.length > 3 && (
                        <div className="text-xs text-gray-500 text-center py-1">
                          +{transaction.itemDetails.length - 3} more items
                        </div>
                      )}
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

        {/* Category Breakdown */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3">
              <Target className="h-5 w-5 text-green-600" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Top Categories</h3>
                <p className="text-sm text-gray-600">Sales breakdown</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryBreakdownChart 
              data={analytics.topCategories} 
              loading={loading}
            />
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
          <WeeklyTrendChart 
            data={analytics.weeklyTrend} 
            loading={loading}
          />
        </CardContent>
      </Card>
    </div>
  );
}
