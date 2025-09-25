import { useState, useEffect } from 'react';
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

export const useAdminStats = () => {
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

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return {
    userStats,
    salesStats,
    loading,
    fetchDashboardData
  };
};
