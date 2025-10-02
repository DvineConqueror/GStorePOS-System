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
  growth?: {
    salesGrowth: number;
    transactionGrowth: number;
    avgTransactionGrowth: number;
    todaySalesGrowth?: number;
  };
  daily?: {
    totalSales: number;
    totalTransactions: number;
    averageTransactionValue: number;
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

  const { fallbackToAPI = true, refreshInterval = 60000 } = options; // Changed to 60 seconds

  useEffect(() => {
    if (!user || (user.role !== 'manager' && user.role !== 'superadmin')) {
      setLoading(false);
      return;
    }

    // Listen for real-time analytics updates
    const handleAnalyticsUpdate = (event: CustomEvent) => {
      setRealtimeData(prev => {
        // Only update if data has actually changed
        if (JSON.stringify(prev) !== JSON.stringify(event.detail)) {
          setLastUpdated(new Date());
          setError(null);
          return event.detail;
        }
        return prev;
      });
      setLoading(false);
    };

    // Listen for manager analytics updates
    const handleManagerAnalyticsUpdate = (event: CustomEvent) => {
      const newData = event.detail;
      
      // Handle background updates gracefully without UI disruption
      if (newData.backgroundUpdate || newData.cacheRefreshed) {
        console.log('Background analytics update received');
        
        // For background updates, only update data if user is not actively using the page
        // Check if the user has been inactive or if this is truly background
        setRealtimeData(prev => {
          if (!prev) {
            setLastUpdated(new Date());
            setError(null);
            return newData;
          }
          
          // Smoothly merge new data without causing re-renders that disrupt UI
          const mergedData = {
            ...prev,
            // Only update metrics if they have significantly changed (> 5% difference)
            metrics: newData.metrics && prev.metrics ? {
              ...prev.metrics,
              ...Object.keys(newData.metrics).reduce((acc, key) => {
                const newVal = newData.metrics[key];
                const oldVal = prev.metrics[key];
                // Only update if change is significant or if it's a new metric
                if (typeof newVal === 'number' && typeof oldVal === 'number') {
                  const percentChange = Math.abs((newVal - oldVal) / oldVal);
                  if (percentChange > 0.05 || oldVal === 0) { // 5% threshold
                    acc[key] = newVal;
                  } else {
                    acc[key] = oldVal; // Keep old value to prevent flashing
                  }
                } else {
                  acc[key] = newVal;
                }
                return acc;
              }, {} as any)
            } : newData.metrics,
            // Update other non-visual data
            lastUpdated: new Date().toISOString(),
            backgroundUpdate: true
          };
          
          setLastUpdated(new Date());
          setError(null);
          return mergedData;
        });
      } else {
        // Regular updates - only update if data has actually changed
        setRealtimeData(prev => {
          if (JSON.stringify(prev) !== JSON.stringify(newData)) {
            setLastUpdated(new Date());
            setError(null);
            return newData;
          }
          return prev;
        });
      }
      
      setLoading(false);
    };

    // Listen for cashier analytics updates (if user is a cashier)
    const handleCashierAnalyticsUpdate = (event: CustomEvent) => {
      setRealtimeData(prev => {
        // Only update if data has actually changed
        if (JSON.stringify(prev) !== JSON.stringify(event.detail)) {
          setLastUpdated(new Date());
          setError(null);
          return event.detail;
        }
        return prev;
      });
      setLoading(false);
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
