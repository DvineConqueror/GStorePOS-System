import React from 'react';
import { useSuperadminDashboard } from '@/hooks/useSuperadminDashboard';
import { SystemStatsCard } from '@/components/superadmin/SystemStatsCard';
import { RecentUsersCard } from '@/components/superadmin/RecentUsersCard';

export default function SuperadminDashboard() {
  const { stats, recentUsers, loading } = useSuperadminDashboard();

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* System Statistics */}
      <SystemStatsCard stats={stats} loading={loading} />

      {/* Recent Users - Full Width */}
      <RecentUsersCard recentUsers={recentUsers} loading={loading} />
    </div>
  );
}