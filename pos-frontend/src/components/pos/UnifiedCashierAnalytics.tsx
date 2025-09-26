import { useState } from 'react';
import { ModernCashierAnalyticsV1 } from './ModernCashierAnalyticsV1';
import { ModernCashierAnalyticsV2 } from './ModernCashierAnalyticsV2';
import { ModernCashierAnalyticsV3 } from './ModernCashierAnalyticsV3';
import { 
  List,
  Grid,
  LayoutGrid
} from 'lucide-react';

export function UnifiedCashierAnalytics() {
  const [activeDesign, setActiveDesign] = useState('v1');

  const designVariants = [
    {
      id: 'v1',
      name: 'Compact',
      description: 'Minimalist design with embedded sparkline charts',
      icon: List,
      color: 'blue'
    },
    {
      id: 'v2',
      name: 'Modern',
      description: 'Contemporary layout with growth indicators',
      icon: Grid,
      color: 'blue'
    },
    {
      id: 'v3',
      name: 'Infographic',
      description: 'Rich visual design with radial charts',
      icon: LayoutGrid,
      color: 'blue'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Windows 11 Style Layout Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-blue-900">My Performance Analytics</h2>
          <p className="text-blue-600 mt-1">Choose your preferred layout style</p>
        </div>
        
        {/* Windows 11 Style Button Group */}
        <div className="flex items-center bg-blue-100 rounded-lg p-1">
          {designVariants.map((variant) => {
            const Icon = variant.icon;
            const isActive = activeDesign === variant.id;
            
            return (
              <button
                key={variant.id}
                onClick={() => setActiveDesign(variant.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-200 ${
                  isActive
                    ? 'bg-white shadow-sm text-blue-900'
                    : 'text-blue-600 hover:text-blue-900 hover:bg-blue-50'
                }`}
                title={variant.description}
              >
                <Icon className="h-4 w-4" />
                <span className="text-sm font-medium">{variant.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Analytics Content */}
      <div>
        {activeDesign === 'v1' && <ModernCashierAnalyticsV1 />}
        {activeDesign === 'v2' && <ModernCashierAnalyticsV2 />}
        {activeDesign === 'v3' && <ModernCashierAnalyticsV3 />}
      </div>
    </div>
  );
}
