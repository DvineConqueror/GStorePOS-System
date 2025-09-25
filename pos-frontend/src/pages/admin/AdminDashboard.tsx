import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Package, 
  DollarSign, 
  TrendingUp,
  Shield,
  ShoppingCart
} from 'lucide-react';
import { usersAPI, analyticsAPI } from '@/lib/api';

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  adminUsers: number;
  cashierUsers: number;
  totalCashierUsers: number;
  activeCashierUsers: number;
}

interface SalesStats {
  totalSales: number;
  totalTransactions: number;
  averageTransactionValue: number;
}

export function AdminDashboard() {
  const [userStats, setUserStats] = useState<UserStats>({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    adminUsers: 0,
    cashierUsers: 0,
    totalCashierUsers: 0,
    activeCashierUsers: 0
  });
  const [salesStats, setSalesStats] = useState<SalesStats>({
    totalSales: 0,
    totalTransactions: 0,
    averageTransactionValue: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch user statistics
      const userStatsResponse = await usersAPI.getUserStats();
      if (userStatsResponse.success) {
        setUserStats(userStatsResponse.data);
      }

      // Fetch sales analytics
      const salesResponse = await analyticsAPI.getDashboard();
      if (salesResponse.success) {
        setSalesStats(salesResponse.data.sales);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Manager Dashboard</h1>
        <p className="text-gray-600 mt-2">Overview of your store operations and performance</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Cashiers */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cashiers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.totalCashierUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              {userStats.activeCashierUsers || 0} active, {userStats.inactiveUsers || 0} inactive
            </p>
          </CardContent>
        </Card>

        {/* Active Cashiers */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Cashiers</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.activeCashierUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              Currently working
            </p>
          </CardContent>
        </Card>

        {/* Total Sales */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${salesStats.totalSales?.toFixed(2) || '0.00'}</div>
            <p className="text-xs text-muted-foreground">
              {salesStats.totalTransactions || 0} transactions
            </p>
          </CardContent>
        </Card>

        {/* Average Transaction */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Transaction</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${salesStats.averageTransactionValue?.toFixed(2) || '0.00'}</div>
            <p className="text-xs text-muted-foreground">
              Per transaction
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Cashier Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Manage cashier accounts, permissions, and status
            </p>
            <Button className="w-full">Manage Cashiers</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="mr-2 h-5 w-5" />
              Product Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Add, edit, and manage your product inventory
            </p>
            <Button className="w-full">Manage Products</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ShoppingCart className="mr-2 h-5 w-5" />
              POS System
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Access the point of sale system for transactions
            </p>
            <Button className="w-full">Open POS</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
