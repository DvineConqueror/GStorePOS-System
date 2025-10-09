import { useState, useEffect } from 'react';
import { superadminAPI } from '@/lib/api';
import { useRefresh } from '@/context/RefreshContext';
import { QuickStats } from '@/types/layout';

export const useSuperadminLayout = () => {
  const { refreshTrigger } = useRefresh();
  const [quickStats, setQuickStats] = useState<QuickStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fetchQuickStats = async () => {
    try {
      setLoadingStats(true);
      const response = await superadminAPI.getSystemStats();
      if (response.success) {
        setQuickStats(response.data.overview);
      }
    } catch (error) {
      console.error('Error fetching quick stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchQuickStats();
  }, [refreshTrigger]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return {
    quickStats,
    loadingStats,
    sidebarOpen,
    toggleSidebar,
    closeSidebar,
    refreshStats: fetchQuickStats,
  };
};
