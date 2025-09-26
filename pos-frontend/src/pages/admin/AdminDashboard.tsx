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
  ShoppingCart,
  UserPlus,
  UserCheck,
  Clock
} from 'lucide-react';
import { usersAPI, analyticsAPI } from '@/lib/api';
import { useApproval } from '@/hooks/useApproval';
import { useAuth } from '@/context/AuthContext';

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  managerUsers: number;
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
  const { user } = useAuth();
  const { stats: approvalStats } = useApproval({ userRole: user?.role as 'superadmin' | 'manager' });
  
  const [userStats, setUserStats] = useState<UserStats>({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    managerUsers: 0,
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white">Manager Dashboard</h1>
        <p className="text-slate-400 text-sm sm:text-base mt-2">Overview of your store operations and performance</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Cashiers */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Total Cashiers</CardTitle>
            <Users className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-white">{userStats.totalCashierUsers || 0}</div>
            <p className="text-xs text-slate-400">
              {userStats.activeCashierUsers || 0} active, {userStats.inactiveUsers || 0} inactive
            </p>
          </CardContent>
        </Card>

        {/* Active Cashiers */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Active Cashiers</CardTitle>
            <Shield className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-white">{userStats.activeCashierUsers || 0}</div>
            <p className="text-xs text-slate-400">
              Currently working
            </p>
          </CardContent>
        </Card>

        {/* Total Sales */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Total Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-white">${salesStats.totalSales?.toFixed(2) || '0.00'}</div>
            <p className="text-xs text-slate-400">
              {salesStats.totalTransactions || 0} transactions
            </p>
          </CardContent>
        </Card>

        {/* Average Transaction */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Avg Transaction</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-white">${salesStats.averageTransactionValue?.toFixed(2) || '0.00'}</div>
            <p className="text-xs text-slate-400">
              Per transaction
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Approvals Alert */}
      {approvalStats.totalPending > 0 && (
        <Card className="bg-yellow-900/20 border-yellow-600/50">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-yellow-400 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-yellow-400 text-sm sm:text-base">Pending Cashier Approvals</h3>
                  <p className="text-xs sm:text-sm text-yellow-300">
                    {approvalStats.totalPending} cashier account(s) waiting for your approval
                  </p>
                </div>
              </div>
              <Button 
                className="bg-yellow-600 hover:bg-yellow-700 text-white text-xs sm:text-sm"
                onClick={() => window.location.href = '/admin/approvals'}
              >
                <UserCheck className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                Review Approvals
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center text-base sm:text-lg">
              <UserPlus className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              Create Cashier
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs sm:text-sm text-slate-400 mb-3 sm:mb-4">
              Create new cashier accounts with automatic approval
            </p>
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm"
              onClick={() => window.location.href = '/admin/cashiers/create'}
            >
              Create Cashier
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center text-base sm:text-lg">
              <UserCheck className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              Pending Approvals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs sm:text-sm text-slate-400 mb-3 sm:mb-4">
              Review and approve new cashier registrations
            </p>
            <Button 
              className="w-full bg-yellow-600 hover:bg-yellow-700 text-white text-xs sm:text-sm"
              onClick={() => window.location.href = '/admin/approvals'}
            >
              <Badge variant="destructive" className="mr-2 bg-yellow-600">
                {approvalStats.totalPending}
              </Badge>
              Review Approvals
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center text-base sm:text-lg">
              <Users className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              Manage Cashiers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs sm:text-sm text-slate-400 mb-3 sm:mb-4">
              Manage existing cashier accounts and permissions
            </p>
            <Button 
              className="w-full bg-slate-600 hover:bg-slate-700 text-white text-xs sm:text-sm"
              onClick={() => window.location.href = '/admin/cashiers'}
            >
              Manage Cashiers
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center text-base sm:text-lg">
              <Package className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              Product Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs sm:text-sm text-slate-400 mb-3 sm:mb-4">
              Add, edit, and manage your product inventory
            </p>
            <Button 
              className="w-full bg-slate-600 hover:bg-slate-700 text-white text-xs sm:text-sm"
              onClick={() => window.location.href = '/admin/products'}
            >
              Manage Products
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Additional Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center text-base sm:text-lg">
              <ShoppingCart className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              POS System
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs sm:text-sm text-slate-400 mb-3 sm:mb-4">
              Access the point of sale system for transactions
            </p>
            <Button 
              className="w-full bg-slate-600 hover:bg-slate-700 text-white text-xs sm:text-sm"
              onClick={() => window.location.href = '/admin/pos'}
            >
              Open POS
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center text-base sm:text-lg">
              <TrendingUp className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs sm:text-sm text-slate-400 mb-3 sm:mb-4">
              View detailed analytics and reports
            </p>
            <Button 
              className="w-full bg-slate-600 hover:bg-slate-700 text-white text-xs sm:text-sm"
              onClick={() => window.location.href = '/admin/analytics'}
            >
              View Analytics
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
