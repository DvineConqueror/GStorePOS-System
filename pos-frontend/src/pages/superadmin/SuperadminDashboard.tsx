import React from 'react';
import { SuperadminLogo } from '@/components/ui/BrandLogo';
import { useSuperadminDashboard } from '@/hooks/useSuperadminDashboard';
import { SystemStatsCard } from '@/components/superadmin/SystemStatsCard';
import { QuickActionsCard } from '@/components/superadmin/QuickActionsCard';
import { RecentUsersCard } from '@/components/superadmin/RecentUsersCard';

export default function SuperadminDashboard() {
  const { stats, recentUsers, loading } = useSuperadminDashboard();

  return (
    <div className="min-h-screen bg-cream-50">
      <div className="space-y-8 p-6 py-0">
        {/* Authority Header */}
        <div className="border-b border-gray-300 pb-6">
          <div className="flex items-center space-x-4">
            <SuperadminLogo size="lg" />
          </div>
        </div>

        {/* System Statistics */}
        <SystemStatsCard stats={stats} loading={loading} />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Quick Actions */}
          <QuickActionsCard />

          {/* Recent Users */}
          <RecentUsersCard recentUsers={recentUsers} loading={loading} />
        </div>
      </div>
    </div>
  );
}