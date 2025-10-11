import React from 'react';
import { ManagerLogo } from '@/components/ui/BrandLogo';
import { AdminStatsCard } from '@/components/admin/AdminStatsCard';
import { AdminQuickActionsCard } from '@/components/admin/AdminQuickActionsCard';
import { useUsers } from '@/hooks/useUsers';
import { useAnalyticsDashboard } from '@/hooks/useAnalytics';
import NotificationAlert from '@/components/notifications/NotificationAlert';

export function AdminDashboard() {
  // React Query hooks
  const { data: usersData, isLoading: usersLoading, error: usersError } = useUsers();
  const { data: analyticsData, isLoading: analyticsLoading, error: analyticsError } = useAnalyticsDashboard();
  
  // Extract data from API responses
  const users = usersData?.data || [];
  const analytics = analyticsData?.data || {};
  const loading = usersLoading || analyticsLoading;
  const error = usersError || analyticsError;
  
  // Transform data to match expected format
  const userStats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.status === 'active').length,
    inactiveUsers: users.filter(u => u.status === 'inactive').length,
    cashierUsers: users.filter(u => u.role === 'cashier').length,
    managerUsers: users.filter(u => u.role === 'manager').length,
    totalCashierUsers: users.filter(u => u.role === 'cashier').length,
    activeCashierUsers: users.filter(u => u.role === 'cashier' && u.status === 'active').length,
  };
  
  const salesStats = {
    totalSales: analytics.totalSales || 0,
    totalTransactions: analytics.totalTransactions || 0,
    avgTransaction: analytics.avgTransaction || 0,
    averageTransactionValue: analytics.avgTransaction || 0,
  };
  
  const approvalStats = {
    totalPending: users.filter(u => !u.isApproved).length,
    pendingManagers: users.filter(u => u.role === 'manager' && !u.isApproved).length,
    pendingCashiers: users.filter(u => u.role === 'cashier' && !u.isApproved).length,
    pendingApprovals: users.filter(u => !u.isApproved).length,
    approvedToday: 0, // Not available in current API
    rejectedToday: 0, // Not available in current API
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-red-600">
          <p className="text-lg font-medium">Error loading dashboard</p>
          <p className="text-sm">{error?.message || 'Unknown error'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-6">
        <ManagerLogo size="lg" />
        <div>
          <p className="text-gray-600 text-sm sm:text-base mt-1">Comprehensive store operations and performance insights</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <AdminStatsCard 
        userStats={userStats}
        salesStats={salesStats}
        approvalStats={approvalStats}
        loading={loading}
      />

      {/* Quick Actions */}
      <AdminQuickActionsCard />
      
      {/* Notification Alert */}
      <NotificationAlert />
    </div>
  );
}