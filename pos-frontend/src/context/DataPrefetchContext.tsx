import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { productsAPI, transactionsAPI, analyticsAPI, notificationsAPI } from '@/lib/api';
import { Product, Transaction } from '@/types';

interface PrefetchedData {
  products: Product[];
  transactions: Transaction[];
  analytics: any;
  pendingCount: number;
  lastUpdated: {
    products: Date | null;
    transactions: Date | null;
    analytics: Date | null;
    pendingCount: Date | null;
  };
}

interface DataPrefetchContextType {
  data: PrefetchedData;
  isLoading: {
    products: boolean;
    transactions: boolean;
    analytics: boolean;
    pendingCount: boolean;
  };
  errors: {
    products: string | null;
    transactions: string | null;
    analytics: string | null;
    pendingCount: string | null;
  };
  refreshData: (keys?: Array<keyof PrefetchedData>) => Promise<void>;
  prefetchAll: () => Promise<void>;
  clearAllCaches: () => void;
}

// Initialize with sessionStorage cache for persistence across page switches
const getInitialData = (): PrefetchedData => {
  try {
    const cached = sessionStorage.getItem('prefetchedData');
    if (cached) {
      const parsedCache = JSON.parse(cached);
      // Convert date strings back to Date objects
      if (parsedCache.lastUpdated) {
        Object.keys(parsedCache.lastUpdated).forEach(key => {
          if (parsedCache.lastUpdated[key]) {
            parsedCache.lastUpdated[key] = new Date(parsedCache.lastUpdated[key]);
          }
        });
      }
      return parsedCache;
    }
  } catch (error) {
    console.warn('Failed to parse cached data:', error);
  }
  
  return {
    products: [],
    transactions: [],
    analytics: null,
    pendingCount: 0,
    lastUpdated: {
      products: null,
      transactions: null,
      analytics: null,
      pendingCount: null,
    }
  };
};

const initialData: PrefetchedData = getInitialData();

const DataPrefetchContext = createContext<DataPrefetchContextType | undefined>(undefined);

export function DataPrefetchProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [data, setData] = useState<PrefetchedData>(initialData);
  const [isLoading, setIsLoading] = useState({
    products: false,
    transactions: false,
    analytics: false,
    pendingCount: false,
  });

  // Cache data to sessionStorage whenever it changes
  useEffect(() => {
    try {
      sessionStorage.setItem('prefetchedData', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to cache data to sessionStorage:', error);
    }
  }, [data]);
  const [errors, setErrors] = useState({
    products: null as string | null,
    transactions: null as string | null,
    analytics: null as string | null,
    pendingCount: null as string | null,
  });

  const updateLoadingState = (key: keyof typeof isLoading, loading: boolean) => {
    setIsLoading(prev => ({ ...prev, [key]: loading }));
  };

  const updateError = (key: keyof typeof errors, error: string | null) => {
    setErrors(prev => ({ ...prev, [key]: error }));
  };

  const fetchProducts = useCallback(async () => {
    if (!user) return;
    
    updateLoadingState('products', true);
    updateError('products', null);
    
    try {
      const response = await productsAPI.getProducts({ isActive: true });
      
      if (response.success) {
        setData(prev => ({
          ...prev,
          products: response.data,
          lastUpdated: { ...prev.lastUpdated, products: new Date() }
        }));
      } else {
        throw new Error(response.message || 'Failed to fetch products');
      }
    } catch (error: any) {
      updateError('products', error.message);
      console.error('Error prefetching products:', error);
    } finally {
      updateLoadingState('products', false);
    }
  }, [user]);

  const fetchTransactions = useCallback(async () => {
    if (!user) return;
    
    updateLoadingState('transactions', true);
    updateError('transactions', null);
    
    try {
      const response = await transactionsAPI.getTransactions({
        limit: 1000,
        sort: 'createdAt',
        order: 'desc'
      });
      
      if (response.success) {
        setData(prev => ({
          ...prev,
          transactions: response.data,
          lastUpdated: { ...prev.lastUpdated, transactions: new Date() }
        }));
      } else {
        throw new Error(response.message || 'Failed to fetch transactions');
      }
    } catch (error: any) {
      updateError('transactions', error.message);
      console.error('Error prefetching transactions:', error);
    } finally {
      updateLoadingState('transactions', false);
    }
  }, [user]);

  const fetchAnalytics = useCallback(async () => {
    if (!user || (user.role !== 'manager' && user.role !== 'superadmin')) return;
    
    updateLoadingState('analytics', true);
    updateError('analytics', null);
    
    try {
      const response = await analyticsAPI.getDashboard();
      
      if (response.success) {
        setData(prev => ({
          ...prev,
          analytics: response.data,
          lastUpdated: { ...prev.lastUpdated, analytics: new Date() }
        }));
      } else {
        throw new Error(response.message || 'Failed to fetch analytics');
      }
    } catch (error: any) {
      updateError('analytics', error.message);
      console.error('Error prefetching analytics:', error);
    } finally {
      updateLoadingState('analytics', false);
    }
  }, [user]);

  const fetchPendingCount = useCallback(async () => {
    if (!user || (user.role !== 'manager' && user.role !== 'superadmin')) return;
    
    updateLoadingState('pendingCount', true);
    updateError('pendingCount', null);
    
    try {
      const response = await notificationsAPI.getPendingCount();
      
      if (response.success) {
        setData(prev => ({
          ...prev,
          pendingCount: response.data?.count || 0,
          lastUpdated: { ...prev.lastUpdated, pendingCount: new Date() }
        }));
      } else {
        throw new Error(response.message || 'Failed to fetch pending count');
      }
    } catch (error: any) {
      updateError('pendingCount', error.message);
      console.error('Error prefetching pending count:', error);
    } finally {
      updateLoadingState('pendingCount', false);
    }
  }, [user]);

  const refreshData = useCallback(async (keys?: Array<keyof PrefetchedData>) => {
    if (!user) return;

    const keysToRefresh = keys || ['products', 'transactions', 'analytics', 'pendingCount'];
    
    const promises = [];
    
    if (keysToRefresh.includes('products')) {
      promises.push(fetchProducts());
    }
    if (keysToRefresh.includes('transactions')) {
      promises.push(fetchTransactions());
    }
    if (keysToRefresh.includes('analytics')) {
      promises.push(fetchAnalytics());
    }
    if (keysToRefresh.includes('pendingCount')) {
      promises.push(fetchPendingCount());
    }

    await Promise.allSettled(promises);
  }, [user, fetchProducts, fetchTransactions, fetchAnalytics, fetchPendingCount]);

  const prefetchAll = useCallback(async () => {
    if (!user) return;

    // Start all prefetch operations in parallel for better performance
    const promises = [
      fetchProducts(),
      fetchTransactions(),
    ];

    // Only fetch analytics and pending count for managers and superadmins
    if (user.role === 'manager' || user.role === 'superadmin') {
      promises.push(fetchAnalytics());
      promises.push(fetchPendingCount());
    }

    await Promise.allSettled(promises);
  }, [user, fetchProducts, fetchTransactions, fetchAnalytics, fetchPendingCount]);

  // Prefetch data when user logs in
  useEffect(() => {
    if (user) {
      prefetchAll();
    } else {
      // Clear data when user logs out
      setData(initialData);
      setIsLoading({
        products: false,
        transactions: false,
        analytics: false,
        pendingCount: false,
      });
      setErrors({
        products: null,
        transactions: null,
        analytics: null,
        pendingCount: null,
      });
    }
  }, [user, prefetchAll]);

  // Set up periodic refresh for real-time data with intelligent caching
  useEffect(() => {
    if (!user) return;

    // Refresh critical data every 2 minutes (less frequent)
    const interval = setInterval(() => {
      // Only refresh if data is older than 2 minutes
      const now = new Date().getTime();
      const shouldRefreshProducts = !data.lastUpdated.products || 
        (now - data.lastUpdated.products.getTime()) > 120000; // 2 minutes
      const shouldRefreshTransactions = !data.lastUpdated.transactions || 
        (now - data.lastUpdated.transactions.getTime()) > 120000; // 2 minutes
      const shouldRefreshPending = !data.lastUpdated.pendingCount || 
        (now - data.lastUpdated.pendingCount.getTime()) > 120000; // 2 minutes

      const toRefresh = [];
      if (shouldRefreshProducts) toRefresh.push('products');
      if (shouldRefreshTransactions) toRefresh.push('transactions');
      if (shouldRefreshPending) toRefresh.push('pendingCount');

      if (toRefresh.length > 0) {
        refreshData(toRefresh as Array<keyof PrefetchedData>);
      }
    }, 120000); // 2 minutes

    // Refresh analytics even less frequently (every 5 minutes)
    const analyticsInterval = setInterval(() => {
      if (user.role === 'manager' || user.role === 'superadmin') {
        const now = new Date().getTime();
        const shouldRefreshAnalytics = !data.lastUpdated.analytics || 
          (now - data.lastUpdated.analytics.getTime()) > 300000; // 5 minutes
        
        if (shouldRefreshAnalytics) {
          refreshData(['analytics']);
        }
      }
    }, 300000); // 5 minutes

    return () => {
      clearInterval(interval);
      clearInterval(analyticsInterval);
    };
  }, [user, refreshData, data.lastUpdated]);

  // Clear all caches function
  const clearAllCaches = useCallback(() => {
    try {
      // Clear session storage
      sessionStorage.removeItem('prefetchedData');
      sessionStorage.removeItem('analyticsData');
      sessionStorage.removeItem('prefetchedAnalytics');
      sessionStorage.removeItem('realtimeAnalytics');
      
      // Reset state to initial values
      setData({
        products: [],
        transactions: [],
        analytics: null,
        pendingCount: 0,
        lastUpdated: {
          products: null,
          transactions: null,
          analytics: null,
          pendingCount: null,
        },
      });
      
      // Force immediate refresh for managers/superadmins
      if (user?.role === 'manager' || user?.role === 'superadmin') {
        refreshData(['transactions', 'products', 'analytics']);
      }
      
      console.log('All prefetch caches cleared');
    } catch (error) {
      console.error('Error clearing prefetch caches:', error);
    }
  }, [user?.role, refreshData]);

  return (
    <DataPrefetchContext.Provider
      value={{
        data,
        isLoading,
        errors,
        refreshData,
        prefetchAll,
        clearAllCaches,
      }}
    >
      {children}
    </DataPrefetchContext.Provider>
  );
}

export function useDataPrefetch() {
  const context = useContext(DataPrefetchContext);
  if (context === undefined) {
    throw new Error('useDataPrefetch must be used within a DataPrefetchProvider');
  }
  return context;
}