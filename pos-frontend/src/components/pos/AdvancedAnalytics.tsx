import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  ScatterChart,
  Scatter
} from 'recharts';
import { TrendingUp, TrendingDown, Clock, Target, Zap } from 'lucide-react';

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
  const [hourlySales, setHourlySales] = useState<HourlySales[]>([]);
  const [categoryPerformance, setCategoryPerformance] = useState<CategoryPerformance[]>([]);
  const [topProducts, setTopProducts] = useState<ProductPerformance[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAdvancedAnalytics = async () => {
    try {
      setLoading(true);
      
      // Get transactions
      const transactionsResponse = await transactionsAPI.getTransactions();
      const productsResponse = await productsAPI.getProducts();
      
      if (transactionsResponse.success && productsResponse.success) {
        const transactions = transactionsResponse.data.filter((t: any) => 
          t.status === 'completed' && 
          (user?.role === 'manager' || t.cashierId === user?.id)
        );
        
        // Calculate hourly sales
        const hourlyMap = new Map<string, { sales: number; transactions: number }>();
        transactions.forEach((transaction: any) => {
          const hour = new Date(transaction.createdAt || transaction.timestamp).getHours();
          const hourKey = `${hour}:00`;
          const current = hourlyMap.get(hourKey) || { sales: 0, transactions: 0 };
          hourlyMap.set(hourKey, {
            sales: current.sales + transaction.total,
            transactions: current.transactions + 1
          });
        });
        
        const hourlyData = Array.from(hourlyMap.entries())
          .map(([hour, data]) => ({ hour, ...data }))
          .sort((a, b) => parseInt(a.hour) - parseInt(b.hour));
        setHourlySales(hourlyData);
        
        // Calculate category performance
        const categoryMap = new Map<string, { sales: number; items: number }>();
        transactions.forEach((transaction: any) => {
          transaction.items.forEach((item: any) => {
            const category = item.category || 'Others';
            const current = categoryMap.get(category) || { sales: 0, items: 0 };
            categoryMap.set(category, {
              sales: current.sales + (item.totalPrice || item.price * item.quantity),
              items: current.items + item.quantity
            });
          });
        });
        
        const totalSales = Array.from(categoryMap.values()).reduce((sum, cat) => sum + cat.sales, 0);
        const categoryData = Array.from(categoryMap.entries())
          .map(([category, data]) => ({
            category,
            sales: data.sales,
            items: data.items,
            percentage: (data.sales / totalSales) * 100
          }))
          .sort((a, b) => b.sales - a.sales)
          .slice(0, 6);
        setCategoryPerformance(categoryData);
        
        // Calculate top products
        const productMap = new Map<string, { sales: number; quantity: number; revenue: number }>();
        transactions.forEach((transaction: any) => {
          transaction.items.forEach((item: any) => {
            const productName = item.productName || item.name;
            const current = productMap.get(productName) || { sales: 0, quantity: 0, revenue: 0 };
            productMap.set(productName, {
              sales: current.sales + 1,
              quantity: current.quantity + item.quantity,
              revenue: current.revenue + (item.totalPrice || item.price * item.quantity)
            });
          });
        });
        
        const topProductsData = Array.from(productMap.entries())
          .map(([name, data]) => ({ name, ...data }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 8);
        setTopProducts(topProductsData);
        
        // Calculate trend data (last 14 days)
        const trendMap = new Map<string, { sales: number; transactions: number; totalAmount: number }>();
        transactions.forEach((transaction: any) => {
          const date = new Date(transaction.createdAt || transaction.timestamp).toLocaleDateString();
          const current = trendMap.get(date) || { sales: 0, transactions: 0, totalAmount: 0 };
          trendMap.set(date, {
            sales: current.sales + 1,
            transactions: current.transactions + 1,
            totalAmount: current.totalAmount + transaction.total
          });
        });
        
        const trendData = Array.from(trendMap.entries())
          .map(([date, data]) => ({
            date,
            sales: data.totalAmount,
            transactions: data.transactions,
            avgTransaction: data.totalAmount / data.transactions
          }))
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .slice(-14);
        setTrendData(trendData);
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
      <Card className="bg-transparent border-0 shadow-none">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl text-blue-800">Advanced Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="text-blue-500">Loading advanced analytics...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-transparent border-0 shadow-none">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg sm:text-xl text-blue-800 flex items-center gap-2">
          <Zap className="h-5 w-5 text-blue-600" />
          Advanced Analytics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 sm:space-y-8">
        {/* Hourly Sales Pattern */}
        <div>
          <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-blue-800 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Hourly Sales Pattern
          </h3>
          <div className="h-48 sm:h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlySales} margin={{ top: 20, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                <XAxis 
                  dataKey="hour" 
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
                  formatter={(value: number) => [formatCurrency(value), 'Sales']}
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
        </div>

        {/* Category Performance */}
        <div>
          <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-blue-800 flex items-center gap-2">
            <Target className="h-4 w-4" />
            Category Performance
          </h3>
          <div className="h-48 sm:h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryPerformance}
                  dataKey="sales"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={60}
                  fill="#8884d8"
                  label={({ category, percentage }) => `${category} (${percentage.toFixed(1)}%)`}
                >
                  {categoryPerformance.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => formatCurrency(value as number)}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #3b82f6',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products */}
        <div>
          <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-blue-800 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Top Performing Products
          </h3>
          <div className="h-48 sm:h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts} margin={{ top: 20, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 8, fill: '#1e40af' }}
                  axisLine={{ stroke: '#3b82f6' }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
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
                  formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                />
                <Bar 
                  dataKey="revenue" 
                  fill="#3b82f6" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sales Trend */}
        <div>
          <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-blue-800 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Sales Trend (Last 14 Days)
          </h3>
          <div className="h-48 sm:h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 20, right: 20, left: 10, bottom: 5 }}>
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
                    name === 'sales' ? 'Sales' : name === 'transactions' ? 'Transactions' : 'Avg Transaction'
                  ]}
                />
                <Line 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="transactions" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
