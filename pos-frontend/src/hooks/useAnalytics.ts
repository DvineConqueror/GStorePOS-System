import { useQuery } from '@tanstack/react-query';
import { apiService, queryKeys } from '@/services/apiService';

// Hook for fetching analytics dashboard data
export const useAnalyticsDashboard = () => {
  return useQuery({
    queryKey: queryKeys.analyticsDashboard(),
    queryFn: () => apiService.analytics.getDashboard(),
    staleTime: 2 * 60 * 1000, // 2 minutes (analytics change frequently)
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
};
