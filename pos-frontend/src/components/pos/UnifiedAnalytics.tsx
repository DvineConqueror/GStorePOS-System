import { ModernAnalyticsV3 } from './ModernAnalyticsV3';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Receipt, RefreshCw, Download } from 'lucide-react';
import { useState } from 'react';
import { useDataPrefetch } from '@/context/DataPrefetchContext';
import { exportAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export function UnifiedAnalytics() {
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const { clearAllCaches } = useDataPrefetch();
  const { toast } = useToast();

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

  const handleExport = async () => {
    try {
      setIsExporting(true);
      
      // Show loading toast
      toast({
        title: 'Exporting...',
        description: 'Preparing your CSV file...',
        variant: 'default',
      });

      // Export all transactions (no filters for now)
      await exportAPI.exportTransactions();

      // Show success toast
      toast({
        title: 'Export Successful',
        description: 'Your CSV file has been downloaded.',
        variant: 'success',
      });
    } catch (error: any) {
      console.error('Export error:', error);
      toast({
        title: 'Export Failed',
        description: error.message || 'Failed to export transactions.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Action Buttons */}
      <div className="flex items-center justify-end">
        <div className="flex items-center gap-3 flex-wrap">
          <Button
            onClick={handleRefresh}
            variant="outline"
            className="flex items-center gap-2 border-green-300 text-green-700 hover:bg-green-50"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Data
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting}
            variant="outline"
            className="flex items-center gap-2 border-green-300 text-green-700 hover:bg-green-50"
          >
            <Download className="h-4 w-4" />
            {isExporting ? 'Exporting...' : 'Export to CSV'}
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