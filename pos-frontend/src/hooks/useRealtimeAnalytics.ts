import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

interface RealtimeAnalyticsData {
  period: string;
  metrics: {
    totalSales: number;
    totalTransactions: number;
    averageTransactionValue: number;
    refundedCount: number;
    refundedAmount: number;
  };
  summary: {
    period: string;
    startDate: string;
    endDate: string;
    totalSales: number;
    totalTransactions: number;
    averageTransactionValue: number;
    refundedCount: number;
    refundedAmount: number;
  };
  normalized: {
    sales: number;
    transactions: number;
    averageTransaction: number;
    refundedTransactions: number;
  };
  growthDelta: {
    sales: number;
    transactions: number;
    averageTransaction: number;
  };
  formattedMetrics: {
    totalSales: {
      value: number;
      formatted: string;
      trend: number;
      trendFormatted: string;
    };
    totalTransactions: {
      value: number;
      formatted: string;
      trend: number;
      trendFormatted: string;
    };
    averageTransactionValue: {
      value: number;
      formatted: string;
      trend: number;
      trendFormatted: string;
    };
  };
  salesByCategory?: Array<{
    category: string;
    amount: number;
    count: number;
  }>;
  hourlySales?: Array<{
    hour: number;
    amount: number;
    count: number;
  }>;
  topPerformer?: {
    name: string;
    amount: number;
    count: number;
    average: number;
  } | null;
  weeklyTrend?: Array<{
    date: string;
    day: string;
    sales: number;
    transactions: number;
  }>;
  weekly?: any;
  daily?: any;
}

interface UseRealtimeAnalyticsOptions {
  fallbackToAPI?: boolean;
  refreshInterval?: number;
}

export const useRealtimeAnalytics = (options: UseRealtimeAnalyticsOptions = {}) => {
  const { user } = useAuth();
  const [realtimeData, setRealtimeData] = useState<RealtimeAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const { fallbackToAPI = true, refreshInterval = 30000 } = options;

  useEffect(() => {
    if (!user || (user.role !== 'manager' && user.role !== 'superadmin')) {
      setLoading(false);
      return;
    }

    // Listen for real-time analytics updates
    const handleAnalyticsUpdate = (event: CustomEvent) => {
      setRealtimeData(event.detail);
      setLastUpdated(new Date());
      setLoading(false);
      setError(null);
    };

    // Listen for manager analytics updates
    const handleManagerAnalyticsUpdate = (event: CustomEvent) => {
      setRealtimeData(event.detail);
      setLastUpdated(new Date());
      setLoading(false);
      setError(null);
    };

    // Listen for cashier analytics updates (if user is a cashier)
    const handleCashierAnalyticsUpdate = (event: CustomEvent) => {
      setRealtimeData(event.detail);
      setLastUpdated(new Date());
      setLoading(false);
      setError(null);
    };

    // Add event listeners
    window.addEventListener('analyticsUpdate', handleAnalyticsUpdate as EventListener);
    window.addEventListener('manager:analytics:update', handleManagerAnalyticsUpdate as EventListener);
    window.addEventListener('cashier:analytics:update', handleCashierAnalyticsUpdate as EventListener);

    // Fallback to API if no real-time data received within timeout
    let fallbackTimeout: NodeJS.Timeout;
    if (fallbackToAPI) {
      fallbackTimeout = setTimeout(() => {
        if (!realtimeData) {
          setError('Real-time connection unavailable, using cached data');
          setLoading(false);
        }
      }, 5000); // 5 second timeout
    }

    // Periodic refresh fallback
    let refreshIntervalId: NodeJS.Timeout;
    if (refreshInterval > 0) {
      refreshIntervalId = setInterval(() => {
        if (!realtimeData) {
          setError('Real-time connection unavailable');
        }
      }, refreshInterval);
    }

    // Cleanup
    return () => {
      window.removeEventListener('analyticsUpdate', handleAnalyticsUpdate as EventListener);
      window.removeEventListener('manager:analytics:update', handleManagerAnalyticsUpdate as EventListener);
      window.removeEventListener('cashier:analytics:update', handleCashierAnalyticsUpdate as EventListener);
      
      if (fallbackTimeout) {
        clearTimeout(fallbackTimeout);
      }
      
      if (refreshIntervalId) {
        clearInterval(refreshIntervalId);
      }
    };
  }, [user, fallbackToAPI, refreshInterval, realtimeData]);

  // Format data for consumption
  const analytics = realtimeData ? {
    period: realtimeData.period,
    metrics: realtimeData.metrics,
    summary: realtimeData.summary,
    normalized: realtimeData.normalized,
    growthDelta: realtimeData.growthDelta,
    formattedMetrics: realtimeData.formattedMetrics,
    salesByCategory: realtimeData.salesByCategory || [],
    hourlySales: realtimeData.hourlySales || [],
    topPerformer: realtimeData.topPerformer,
    weeklyTrend: realtimeData.weeklyTrend || [],
    weekly: realtimeData.weekly,
    daily: realtimeData.daily
  } : null;

  return {
    analytics,
    realtimeData,
    loading,
    error,
    lastUpdated,
    isConnected: !!realtimeData,
    hasData: !!analytics
  };
};
