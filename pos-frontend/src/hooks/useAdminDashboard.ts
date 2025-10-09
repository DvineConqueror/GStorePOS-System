import { useState, useEffect } from 'react';
import { usersAPI, analyticsAPI } from '@/lib/api';
import { useApproval } from '@/hooks/useApproval';
import { useAuth } from '@/context/AuthContext';
import { UserStats, SalesStats, ApprovalStats } from '@/types/admin';

export const useAdminDashboard = () => {
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
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch user statistics
      const userStatsResponse = await usersAPI.getUserStats();
      if (userStatsResponse.success) {
        setUserStats(userStatsResponse.data);
      } else {
        throw new Error(userStatsResponse.message || 'Failed to fetch user stats');
      }

      // Fetch sales analytics
      const salesResponse = await analyticsAPI.getDashboard();
      if (salesResponse.success) {
        setSalesStats(salesResponse.data.sales);
      } else {
        throw new Error(salesResponse.message || 'Failed to fetch sales stats');
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Transform approval stats to match our interface
  const transformedApprovalStats: ApprovalStats = {
    pendingApprovals: approvalStats?.totalPending || 0,
    approvedToday: 0, // Not available in current API
    rejectedToday: 0, // Not available in current API
  };

  return {
    userStats,
    salesStats,
    approvalStats: transformedApprovalStats,
    loading,
    error,
    refreshData: fetchDashboardData,
  };
};
