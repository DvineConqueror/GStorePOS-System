import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ModernAnalyticsV1 } from './ModernAnalyticsV1';
import { ModernAnalyticsV2 } from './ModernAnalyticsV2';
import { ModernAnalyticsV3 } from './ModernAnalyticsV3';
import { 
  Sparkles, 
  Grid3X3, 
  Layout,
  List,
  Grid,
  LayoutGrid
} from 'lucide-react';

export function UnifiedAnalytics() {
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
      color: 'green'
    },
    {
      id: 'v3',
      name: 'Infographic',
      description: 'Rich visual design with radial charts',
      icon: LayoutGrid,
      color: 'purple'
    }
  ];


  return (
    <div className="space-y-6">
      {/* Windows 11 Style Layout Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Analytics Dashboard</h2>
          <p className="text-slate-600 mt-1">Choose your preferred layout style</p>
        </div>
        
        {/* Windows 11 Style Button Group */}
        <div className="flex items-center bg-slate-100 rounded-lg p-1">
          {designVariants.map((variant) => {
            const Icon = variant.icon;
            const isActive = activeDesign === variant.id;
            
            return (
              <button
                key={variant.id}
                onClick={() => setActiveDesign(variant.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-200 ${
                  isActive
                    ? 'bg-white shadow-sm text-slate-900'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
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
        {activeDesign === 'v1' && <ModernAnalyticsV1 />}
        {activeDesign === 'v2' && <ModernAnalyticsV2 />}
        {activeDesign === 'v3' && <ModernAnalyticsV3 />}
      </div>
    </div>
  );
}
