import React from 'react';
import { SystemStatsCard } from '@/components/superadmin/SystemStatsCard';
import { RecentUsersCard } from '@/components/superadmin/RecentUsersCard';
import { useUsers } from '@/hooks/useUsers';
import { useAnalyticsDashboard } from '@/hooks/useAnalytics';

export default function SuperadminDashboard() {
  // React Query hooks
  const { data: usersData, isLoading: usersLoading } = useUsers({ limit: 50, sort: 'createdAt', order: 'desc' });
  const { data: analyticsData, isLoading: analyticsLoading } = useAnalyticsDashboard();
  
  // Extract data from API responses
  const recentUsers = usersData?.data || [];
  const analytics = analyticsData?.data || {};
  const loading = usersLoading || analyticsLoading;
  
  // Transform data to match expected format
  const stats = {
    totalUsers: analytics.totalUsers || recentUsers.length,
    activeUsers: recentUsers.filter(u => u.status === 'active').length,
    approvedUsers: recentUsers.filter(u => u.isApproved).length,
    pendingApprovals: recentUsers.filter(u => !u.isApproved).length,
    superadminCount: recentUsers.filter(u => u.role === 'superadmin').length,
    managerCount: recentUsers.filter(u => u.role === 'manager').length,
    cashierCount: recentUsers.filter(u => u.role === 'cashier').length,
    totalTransactions: analytics.totalTransactions || 0,
    totalSales: analytics.totalSales || 0,
    growthRate: analytics.growthRate || '+0%',
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* System Statistics */}
      <SystemStatsCard stats={stats} loading={loading} />

      {/* Recent Users - Full Width */}
      <RecentUsersCard recentUsers={recentUsers} loading={loading} />
    </div>
  );
}