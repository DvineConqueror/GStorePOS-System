import React from 'react';
import { ManagerLogo } from '@/components/ui/BrandLogo';
import { useAdminDashboard } from '@/hooks/useAdminDashboard';
import { AdminStatsCard } from '@/components/admin/AdminStatsCard';
import { AdminQuickActionsCard } from '@/components/admin/AdminQuickActionsCard';

export function AdminDashboard() {
  const { userStats, salesStats, approvalStats, loading, error } = useAdminDashboard();

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
          <p className="text-sm">{error}</p>
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
    </div>
  );
}