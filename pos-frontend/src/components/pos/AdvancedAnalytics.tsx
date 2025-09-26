import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { transactionsAPI, productsAPI } from '@/lib/api';
import { formatCurrency } from '@/utils/format';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { TrendingUp, TrendingDown, Clock, Target, Zap, Star, Award, Users, ShoppingCart, DollarSign, Calendar, AlertTriangle } from 'lucide-react';

interface HourlySales {
  hour: string;
  sales: number;
  transactions: number;
}

interface CategoryPerformance {
  category: string;
  sales: number;
  items: number;
  percentage: number;
}

interface ProductPerformance {
  name: string;
  sales: number;
  quantity: number;
  revenue: number;
}

interface TrendData {
  date: string;
  sales: number;
  transactions: number;
  avgTransaction: number;
}

const COLORS = ['#3b82f6', '#1d4ed8', '#1e40af', '#1e3a8a', '#312e81', '#7c3aed', '#a855f7'];

export function AdvancedAnalytics() {
  const { user } = useAuth();
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Enhanced analytics calculations
  const analytics = useMemo(() => {
    if (!analyticsData) return null;

    const { transactions, products } = analyticsData;
    const userTransactions = transactions.filter((t: any) => 
      t.status === 'completed' && 
      (user?.role === 'manager' || t.cashierId === user?.id)
    );

    // Personal performance metrics
    const totalSales = userTransactions.reduce((sum: number, t: any) => sum + t.total, 0);
    const totalTransactions = userTransactions.length;
    const avgTransaction = totalTransactions > 0 ? totalSales / totalTransactions : 0;
    const totalItems = userTransactions.reduce((sum: number, t: any) => 
      sum + t.items.reduce((itemSum: number, item: any) => itemSum + item.quantity, 0), 0
    );

    // Today's performance
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTransactions = userTransactions.filter((t: any) => 
      new Date(t.createdAt || t.timestamp) >= today
    );
    const todaySales = todayTransactions.reduce((sum: number, t: any) => sum + t.total, 0);
    const todayItems = todayTransactions.reduce((sum: number, t: any) => 
      sum + t.items.reduce((itemSum: number, item: any) => itemSum + item.quantity, 0), 0
    );

    // Peak performance hour
    const hourlySales = new Map();
    userTransactions.forEach((t: any) => {
      const hour = new Date(t.createdAt || t.timestamp).getHours();
      const current = hourlySales.get(hour) || { sales: 0, count: 0 };
      hourlySales.set(hour, { sales: current.sales + t.total, count: current.count + 1 });
    });
    const peakHour = Array.from(hourlySales.entries())
      .sort(([,a], [,b]) => b.sales - a.sales)[0];

    // Best selling category
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

    // Weekly performance trend
    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const dayTransactions = userTransactions.filter((t: any) => {
        const txDate = new Date(t.createdAt || t.timestamp);
        txDate.setHours(0, 0, 0, 0);
        return txDate.getTime() === date.getTime();
      });
      
      const daySales = dayTransactions.reduce((sum: number, t: any) => sum + t.total, 0);
      
      weeklyData.push({
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        sales: daySales,
        transactions: dayTransactions.length,
        items: dayTransactions.reduce((sum: number, t: any) => 
          sum + t.items.reduce((itemSum: number, item: any) => itemSum + item.quantity, 0), 0
        )
      });
    }

    // Performance insights
    const insights = [];
    if (peakHour) {
      insights.push({
        type: 'success',
        icon: Clock,
        title: 'Peak Performance',
        description: `Your best hour is ${peakHour[0]}:00 with ${formatCurrency(peakHour[1].sales)} in sales`
      });
    }
    
    if (topCategory) {
      insights.push({
        type: 'info',
        icon: Target,
        title: 'Top Category',
        description: `${topCategory[0]} is your best-selling category with ${formatCurrency(topCategory[1])}`
      });
    }

    if (avgTransaction > 50) {
      insights.push({
        type: 'success',
        icon: Star,
        title: 'High Value Sales',
        description: `Great job! Your average transaction is ${formatCurrency(avgTransaction)}`
      });
    }

    return {
      totalSales,
      totalTransactions,
      avgTransaction,
      totalItems,
      todaySales,
      todayTransactions,
      todayItems,
      peakHour: peakHour ? { hour: peakHour[0], sales: peakHour[1].sales } : null,
      topCategory: topCategory ? { name: topCategory[0], sales: topCategory[1] } : null,
      weeklyData,
      insights,
      hourlyData: Array.from(hourlySales.entries())
        .map(([hour, data]) => ({ hour: `${hour}:00`, sales: data.sales, transactions: data.count }))
        .sort((a, b) => parseInt(a.hour) - parseInt(b.hour))
    };
  }, [analyticsData, user]);

  const fetchAdvancedAnalytics = async () => {
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
      console.error('Error fetching advanced analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchAdvancedAnalytics();
    }
  }, [user?.id]);

  if (loading) {
    return (
      <Card className="bg-white border border-blue-200 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-blue-900">Personal Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="text-blue-600">Loading your performance data...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) {
    return (
      <Card className="bg-white border border-blue-200 shadow-lg">
        <CardContent className="p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-blue-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-blue-900 mb-2">No Data Available</h3>
          <p className="text-blue-600">No performance data available at the moment.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-white border border-blue-200 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-bold text-blue-900 flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Zap className="h-5 w-5 text-blue-600" />
            </div>
            Personal Performance Analytics
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Key Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white border border-blue-200 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600">Total Sales</p>
                <p className="text-2xl font-bold text-blue-900">{formatCurrency(analytics.totalSales)}</p>
                <p className="text-xs text-blue-500 mt-1">{analytics.totalTransactions} transactions</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-blue-200 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600">Today's Sales</p>
                <p className="text-2xl font-bold text-blue-900">{formatCurrency(analytics.todaySales)}</p>
                <p className="text-xs text-blue-500 mt-1">{analytics.todayTransactions} transactions</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-blue-200 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600">Avg Transaction</p>
                <p className="text-2xl font-bold text-blue-900">{formatCurrency(analytics.avgTransaction)}</p>
                <p className="text-xs text-blue-500 mt-1">per transaction</p>
              </div>
              <Target className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-blue-200 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600">Items Sold</p>
                <p className="text-2xl font-bold text-blue-900">{analytics.totalItems}</p>
                <p className="text-xs text-blue-500 mt-1">{analytics.todayItems} today</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Insights */}
      {analytics.insights.length > 0 && (
        <Card className="bg-white border border-blue-200 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-blue-900 flex items-center gap-2">
              <Star className="h-5 w-5 text-blue-600" />
              Performance Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analytics.insights.map((insight: any, index: number) => {
                const Icon = insight.icon;
                return (
                  <div key={index} className={`p-4 rounded-lg border ${
                    insight.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        insight.type === 'success' ? 'bg-green-100' : 'bg-blue-100'
                      }`}>
                        <Icon className={`h-4 w-4 ${
                          insight.type === 'success' ? 'text-green-600' : 'text-blue-600'
                        }`} />
                      </div>
                      <div>
                        <h4 className={`font-semibold ${
                          insight.type === 'success' ? 'text-green-900' : 'text-blue-900'
                        }`}>
                          {insight.title}
                        </h4>
                        <p className={`text-sm ${
                          insight.type === 'success' ? 'text-green-700' : 'text-blue-700'
                        }`}>
                          {insight.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Weekly Performance Chart */}
      <Card className="bg-white border border-blue-200 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-blue-900 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Weekly Performance Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.weeklyData} margin={{ top: 20, right: 20, left: 10, bottom: 5 }}>
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
                    name === 'sales' ? 'Sales' : name === 'transactions' ? 'Transactions' : 'Items'
                  ]}
                />
                <Area 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#3b82f6" 
                  fill="#3b82f6" 
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
