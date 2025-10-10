import { ModernAnalyticsV3 } from './ModernAnalyticsV3';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Receipt, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { useDataPrefetch } from '@/context/DataPrefetchContext';

export function UnifiedAnalytics() {
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);
  const { clearAllCaches } = useDataPrefetch();

  const handleRefresh = () => {
    // Clear all caches and force refresh
    try {
      // Use the context's clearAllCaches function
      clearAllCaches();
      
      // Force component re-render by changing key
      setRefreshKey(prev => prev + 1);
      
      console.log('Analytics data refreshed - all caches cleared');
    } catch (error) {
      console.error('Error refreshing analytics:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with View All Transactions Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            onClick={handleRefresh}
            variant="outline"
            className="flex items-center gap-2 border-green-300 text-green-700 hover:bg-green-50"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Data
          </Button>
          <Button
            onClick={() => navigate('/transactions')}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
          >
            <Receipt className="h-4 w-4" />
            View All Transactions
          </Button>
        </div>
      </div>

      {/* Analytics Content */}
      <div>
        <ModernAnalyticsV3 key={refreshKey} />
      </div>
    </div>
  );
}