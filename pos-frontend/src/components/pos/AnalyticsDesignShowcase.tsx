import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Zap
} from 'lucide-react';

export function AnalyticsDesignShowcase() {
  const [activeTab, setActiveTab] = useState('v1');

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
    <div className="space-y-6">
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
          const isActive = activeTab === variant.id;
          
          return (
            <Card 
              key={variant.id}
              className={`cursor-pointer transition-all duration-200 ${
                isActive 
                  ? `${colors.bg} ${colors.border} border-2 shadow-lg` 
                  : 'hover:shadow-md border-slate-200'
              }`}
              onClick={() => setActiveTab(variant.id)}
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
                  {designVariants.find(v => v.id === activeTab)?.name} Implementation
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
            {activeTab === 'v1' && <ModernAnalyticsV1 />}
            {activeTab === 'v2' && <ModernAnalyticsV2 />}
            {activeTab === 'v3' && <ModernAnalyticsV3 />}
          </div>
        </CardContent>
      </Card>

      {/* Design Philosophy */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
              <Zap className="h-4 w-4 text-white" />
            </div>
            Design Philosophy & Goals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-slate-900 mb-3">Key Improvements</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2" />
                  <span>Removed irrelevant "efficiency performance scores"</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2" />
                  <span>Compact but readable layouts for quick scanning</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2" />
                  <span>Modern visual elements: gradients, shadows, rounded corners</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2" />
                  <span>Sparkline charts for trend visualization</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2" />
                  <span>Visual indicators for growth and performance</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-3">Data Points Preserved</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2" />
                  <span>Total Sales with trend indicators</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2" />
                  <span>Transaction count and average</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2" />
                  <span>Peak hour identification</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2" />
                  <span>Top performer metrics</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2" />
                  <span>Category performance breakdown</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2" />
                  <span>Hourly and weekly trends</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
