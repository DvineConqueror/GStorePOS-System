import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DollarSign, 
  ShoppingCart, 
  TrendingUp,
  Clock,
  Target,
  Award
} from 'lucide-react';
import { transactionsAPI } from '@/lib/api';

interface PersonalStats {
  totalSales: number;
  totalTransactions: number;
  totalItems: number;
  averageTransaction: number;
  todaySales: number;
  todayTransactions: number;
}

export function CashierDashboard() {
  const [stats, setStats] = useState<PersonalStats>({
    totalSales: 0,
    totalTransactions: 0,
    totalItems: 0,
    averageTransaction: 0,
    todaySales: 0,
    todayTransactions: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPersonalStats();
  }, []);

  const fetchPersonalStats = async () => {
    try {
      setLoading(true);
      
      // Get today's date range
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

      // Fetch today's transactions
      const todayResponse = await transactionsAPI.getTransactions({
        startDate: startOfDay.toISOString(),
        endDate: endOfDay.toISOString(),
        page: 1,
        limit: 1000
      });

      if (todayResponse.success) {
        const todayTransactions = todayResponse.data;
        const todaySales = todayTransactions.reduce((sum: number, t: any) => sum + t.total, 0);
        const todayTransactionCount = todayTransactions.length;
        const totalItems = todayTransactions.reduce((sum: number, t: any) => 
          sum + t.items.reduce((itemSum: number, item: any) => itemSum + item.quantity, 0), 0
        );

        setStats({
          totalSales: todaySales,
          totalTransactions: todayTransactionCount,
          totalItems,
          averageTransaction: todayTransactionCount > 0 ? todaySales / todayTransactionCount : 0,
          todaySales,
          todayTransactions: todayTransactionCount
        });
      }
    } catch (error) {
      console.error('Error fetching personal stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-black">Cashier Dashboard</h1>
        <p className="text-gray-600 mt-2">Your daily performance and quick actions</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Today's Sales */}
        <Card className="bg-white border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Today's Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-black">${stats.todaySales.toFixed(2)}</div>
            <p className="text-xs text-gray-600">
              {stats.todayTransactions} transactions today
            </p>
          </CardContent>
        </Card>

        {/* Total Transactions */}
        <Card className="bg-green-50 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Transactions</CardTitle>
            <ShoppingCart className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{stats.todayTransactions}</div>
            <p className="text-xs text-green-600">
              Completed today
            </p>
          </CardContent>
        </Card>

        {/* Items Sold */}
        <Card className="bg-purple-50 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-800">Items Sold</CardTitle>
            <Target className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">{stats.totalItems}</div>
            <p className="text-xs text-purple-600">
              Products sold today
            </p>
          </CardContent>
        </Card>

        {/* Average Transaction */}
        <Card className="bg-orange-50 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">Avg Transaction</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">${stats.averageTransaction.toFixed(2)}</div>
            <p className="text-xs text-orange-600">
              Per transaction
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-green-800">
              <ShoppingCart className="mr-2 h-5 w-5" />
              Start New Transaction
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Begin processing a new customer purchase
            </p>
            <Button className="w-full bg-green-600 hover:bg-green-700">
              Open POS System
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-green-800">
              <TrendingUp className="mr-2 h-5 w-5" />
              View My Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Check your sales analytics and performance metrics
            </p>
            <Button className="w-full bg-green-600 hover:bg-green-700">
              View Analytics
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Award className="mr-2 h-5 w-5" />
            Today's Performance Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-800">${stats.todaySales.toFixed(2)}</div>
              <div className="text-sm text-green-600">Total Sales</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-800">{stats.todayTransactions}</div>
              <div className="text-sm text-green-600">Transactions</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-800">{stats.totalItems}</div>
              <div className="text-sm text-purple-600">Items Sold</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
