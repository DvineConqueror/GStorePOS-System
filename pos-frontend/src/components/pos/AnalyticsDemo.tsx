import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ModernAnalyticsV1 } from './ModernAnalyticsV1';
import { ModernAnalyticsV2 } from './ModernAnalyticsV2';
import { ModernAnalyticsV3 } from './ModernAnalyticsV3';
import { 
  Sparkles, 
  Grid3X3, 
  Layout, 
  Eye,
  Code,
  Palette,
  Zap,
  CheckCircle
} from 'lucide-react';

export function AnalyticsDemo() {
  const [activeDesign, setActiveDesign] = useState('v1');

  const designVariants = [
    {
      id: 'v1',
      name: 'Compact Sparklines',
      description: 'Minimalist design with embedded sparkline charts for quick data visualization',
      icon: Sparkles,
      features: ['Sparkline charts', 'Compact cards', 'Quick-glance metrics', 'Minimal design'],
      color: 'blue'
    },
    {
      id: 'v2',
      name: 'Modern Grid',
      description: 'Contemporary layout with gradient cards and visual growth indicators',
      icon: Grid3X3,
      features: ['Gradient backgrounds', 'Growth indicators', 'Visual progress bars', 'Modern aesthetics'],
      color: 'green'
    },
    {
      id: 'v3',
      name: 'Infographic Style',
      description: 'Rich visual design with radial charts and comprehensive performance metrics',
      icon: Layout,
      features: ['Radial charts', 'Rich infographics', 'Performance metrics', 'Visual hierarchy'],
      color: 'purple'
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-700',
        icon: 'text-blue-600',
        badge: 'bg-blue-100 text-blue-800'
      },
      green: {
        bg: 'bg-green-50',
        border: 'border-green-200',
        text: 'text-green-700',
        icon: 'text-green-600',
        badge: 'bg-green-100 text-green-800'
      },
      purple: {
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        text: 'text-purple-700',
        icon: 'text-purple-600',
        badge: 'bg-purple-100 text-purple-800'
      }
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-slate-50 to-slate-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Palette className="h-5 w-5 text-white" />
            </div>
            Manager Dashboard Analytics - Design Concepts
          </CardTitle>
          <p className="text-slate-600 mt-2">
            Three completely new design approaches for modern POS analytics. Each concept prioritizes 
            different aspects: compactness, visual appeal, and comprehensive data presentation.
          </p>
        </CardHeader>
      </Card>

      {/* Design Variant Selector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {designVariants.map((variant) => {
          const colors = getColorClasses(variant.color);
          const Icon = variant.icon;
          const isActive = activeDesign === variant.id;
          
          return (
            <Card 
              key={variant.id}
              className={`cursor-pointer transition-all duration-200 ${
                isActive 
                  ? `${colors.bg} ${colors.border} border-2 shadow-lg` 
                  : 'hover:shadow-md border-slate-200'
              }`}
              onClick={() => setActiveDesign(variant.id)}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 ${colors.bg} rounded-lg flex items-center justify-center`}>
                    <Icon className={`h-5 w-5 ${colors.icon}`} />
                  </div>
                  <div>
                    <h3 className={`font-semibold ${colors.text}`}>{variant.name}</h3>
                    <Badge className={`${colors.badge} text-xs`}>
                      {isActive ? 'Active' : 'Preview'}
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-slate-600 mb-3">{variant.description}</p>
                <div className="space-y-1">
                  {variant.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 text-xs text-slate-500">
                      <div className="w-1 h-1 bg-slate-400 rounded-full" />
                      {feature}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Design Implementation */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                <Eye className="h-4 w-4 text-slate-600" />
              </div>
              <div>
                <CardTitle className="text-lg">
                  {designVariants.find(v => v.id === activeDesign)?.name} Implementation
                </CardTitle>
                <p className="text-sm text-slate-600">
                  Live preview of the selected design concept
                </p>
              </div>
            </div>
            <Badge variant="outline" className="flex items-center gap-1">
              <Code className="h-3 w-3" />
              React Component
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border border-slate-200 rounded-lg p-6 bg-slate-50">
            {activeDesign === 'v1' && <ModernAnalyticsV1 />}
            {activeDesign === 'v2' && <ModernAnalyticsV2 />}
            {activeDesign === 'v3' && <ModernAnalyticsV3 />}
          </div>
        </CardContent>
      </Card>

      {/* Integration Status */}
      <Card className="border-0 shadow-lg bg-green-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-green-800">
            <CheckCircle className="h-6 w-6" />
            Integration Complete
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-green-700">
              ✅ All three analytics designs have been successfully integrated into your Manager Dashboard.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-800 mb-2">Admin Page</h4>
                <p className="text-sm text-green-700">
                  Navigate to Admin → Analytics tab to see the new unified analytics with design selector.
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-800 mb-2">POS Page</h4>
                <p className="text-sm text-green-700">
                  Navigate to POS → Analytics tab to see the new analytics for managers.
                </p>
              </div>
            </div>
            <div className="mt-4 p-4 bg-white rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-800 mb-2">How to Use</h4>
              <ol className="text-sm text-green-700 space-y-1">
                <li>1. Log in as a Manager account</li>
                <li>2. Go to either Admin or POS page</li>
                <li>3. Click on the "Analytics" tab</li>
                <li>4. Use the design selector at the top to switch between the three layouts</li>
                <li>5. Each design shows the same data but with different visual presentations</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
