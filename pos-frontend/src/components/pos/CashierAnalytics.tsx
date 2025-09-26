import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { transactionsAPI } from '@/lib/api';
import { formatCurrency } from '@/utils/format';
import { TrendingUp, TrendingDown, Users, ShoppingCart, DollarSign, Clock, Target, Star, Award, Zap } from 'lucide-react';

interface CashierPerformance {
  cashier_name: string;
  total_sales: number;
  items_sold: number;
  transactions: number;
  avg_transaction: number;
  efficiency_score: number;
  today_sales: number;
  today_transactions: number;
  peak_hour: number;
  top_category: string;
}

export function CashierAnalytics() {
  const [cashierPerformance, setCashierPerformance] = useState<CashierPerformance[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCashierAnalytics = async () => {
    try {
      setLoading(true);
      const response = await transactionsAPI.getTransactions();
      
      if (response.success) {
        const transactions = response.data.filter((t: any) => t.status === 'completed');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Enhanced analytics calculation
        const performanceMap = new Map<string, any>();
        
        transactions.forEach((transaction: any) => {
          const cashierName = transaction.cashierName || 'Unknown';
          const txDate = new Date(transaction.timestamp);
          const isToday = txDate >= today;
          
          if (!performanceMap.has(cashierName)) {
            performanceMap.set(cashierName, {
              cashier_name: cashierName,
              total_sales: 0,
              items_sold: 0,
              transactions: 0,
              today_sales: 0,
              today_transactions: 0,
              hourly_sales: new Map(),
              category_sales: new Map()
            });
          }
          
          const cashier = performanceMap.get(cashierName);
          const itemsSold = transaction.items.reduce((sum: number, item: any) => sum + item.quantity, 0);
          
          // Update totals
          cashier.total_sales += transaction.total;
          cashier.items_sold += itemsSold;
          cashier.transactions += 1;
          
          // Update today's performance
          if (isToday) {
            cashier.today_sales += transaction.total;
            cashier.today_transactions += 1;
          }
          
          // Track hourly performance
          const hour = txDate.getHours();
          cashier.hourly_sales.set(hour, (cashier.hourly_sales.get(hour) || 0) + transaction.total);
          
          // Track category performance
          transaction.items.forEach((item: any) => {
            const category = item.category || 'Others';
            cashier.category_sales.set(category, (cashier.category_sales.get(category) || 0) + (item.price * item.quantity));
          });
        });
        
        // Calculate derived metrics
        const performanceData = Array.from(performanceMap.values()).map(cashier => {
          const avg_transaction = cashier.transactions > 0 ? cashier.total_sales / cashier.transactions : 0;
          
          // Calculate efficiency score (sales per hour worked, assuming 8-hour shifts)
          const efficiency_score = cashier.transactions > 0 ? (cashier.total_sales / cashier.transactions) * (cashier.transactions / 8) : 0;
          
          // Find peak hour
          const peak_hour = Array.from(cashier.hourly_sales.entries())
            .sort(([,a], [,b]) => b - a)[0]?.[0] || 0;
          
          // Find top category
          const top_category = Array.from(cashier.category_sales.entries())
            .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A';
          
          return {
            ...cashier,
            avg_transaction,
            efficiency_score,
            peak_hour,
            top_category
          };
        });
        
        const sortedPerformance = performanceData
          .sort((a, b) => b.total_sales - a.total_sales);
      
        setCashierPerformance(sortedPerformance);
      }
    } catch (error) {
      console.error('Error fetching cashier analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCashierAnalytics();
  }, []);

  const getPerformanceBadge = (index: number) => {
    if (index === 0) return { color: 'bg-yellow-500', icon: Award, text: 'Top Performer' };
    if (index === 1) return { color: 'bg-gray-400', icon: Star, text: 'Runner-up' };
    if (index === 2) return { color: 'bg-amber-600', icon: Target, text: 'Third Place' };
    return { color: 'bg-blue-500', icon: Users, text: 'Team Member' };
  };

  const getEfficiencyColor = (score: number) => {
    if (score >= 100) return 'text-green-600';
    if (score >= 75) return 'text-yellow-600';
    if (score >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <Card className="bg-white border border-blue-200 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-blue-900">Employee Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="text-blue-600">Loading performance data...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border border-blue-200 shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-bold text-blue-900 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <Users className="h-5 w-5 text-blue-600" />
          </div>
          Employee Sales Performance
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {cashierPerformance.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-blue-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-blue-900 mb-2">No Performance Data</h3>
            <p className="text-blue-600">No cashier performance data available at the moment.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {cashierPerformance.map((cashier, index) => {
              const badge = getPerformanceBadge(index);
              const BadgeIcon = badge.icon;
              
              return (
                <div key={cashier.cashier_name} className="bg-blue-50 border border-blue-200 rounded-lg p-4 hover:bg-blue-100 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${badge.color} rounded-full flex items-center justify-center text-white font-bold`}>
                        {index + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-blue-900">{cashier.cashier_name}</h3>
                          <Badge className={`${badge.color} text-white text-xs flex items-center gap-1`}>
                            <BadgeIcon className="h-3 w-3" />
                            {badge.text}
                          </Badge>
                        </div>
                        <p className="text-sm text-blue-600">
                          Peak: {cashier.peak_hour}:00 | Top: {cashier.top_category}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-blue-900">{formatCurrency(cashier.total_sales)}</div>
                      <div className="text-sm text-blue-600">Total Sales</div>
                    </div>
                  </div>

                  {/* Compact Metrics Row */}
                  <div className="grid grid-cols-4 gap-3">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <ShoppingCart className="h-4 w-4 text-blue-600" />
                        <span className="text-xs font-medium text-blue-800">Transactions</span>
                      </div>
                      <div className="text-lg font-bold text-blue-900">{cashier.transactions}</div>
                      <div className="text-xs text-blue-600">{cashier.today_transactions} today</div>
                    </div>

                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <DollarSign className="h-4 w-4 text-blue-600" />
                        <span className="text-xs font-medium text-blue-800">Avg Transaction</span>
                      </div>
                      <div className="text-lg font-bold text-blue-900">{formatCurrency(cashier.avg_transaction)}</div>
                      <div className="text-xs text-blue-600">per transaction</div>
                    </div>

                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Target className="h-4 w-4 text-blue-600" />
                        <span className="text-xs font-medium text-blue-800">Items Sold</span>
                      </div>
                      <div className="text-lg font-bold text-blue-900">{cashier.items_sold}</div>
                      <div className="text-xs text-blue-600">total items</div>
                    </div>

                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <span className="text-xs font-medium text-blue-800">Today's Sales</span>
                      </div>
                      <div className="text-lg font-bold text-blue-900">{formatCurrency(cashier.today_sales)}</div>
                      <div className="text-xs text-blue-600">{cashier.today_transactions} transactions</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}