import { ModernAnalyticsV3 } from './ModernAnalyticsV3';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Receipt } from 'lucide-react';

export function UnifiedAnalytics() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Header with View All Transactions Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
          <p className="text-gray-600">Real-time insights and performance metrics</p>
        </div>
        <Button
          onClick={() => navigate('/transactions')}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
        >
          <Receipt className="h-4 w-4" />
          View All Transactions
        </Button>
      </div>

      {/* Analytics Content */}
      <div>
        <ModernAnalyticsV3 />
      </div>
    </div>
  );
}