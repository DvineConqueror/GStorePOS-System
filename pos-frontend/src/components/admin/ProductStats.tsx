import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { ProductStats as ProductStatsType } from '@/types/product';

interface ProductStatsProps {
  stats: ProductStatsType;
  loading?: boolean;
}

export const ProductStats: React.FC<ProductStatsProps> = ({ stats, loading = false }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statItems = [
    {
      title: 'Total Products',
      value: stats.total,
      icon: Package,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Active Products',
      value: stats.active,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Inactive Products',
      value: stats.inactive,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      title: 'Low Stock',
      value: stats.lowStock,
      icon: AlertTriangle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {statItems.map((item) => {
        const Icon = item.icon;
        return (
          <Card key={item.title} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{item.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{item.value}</p>
                </div>
                <div className={`p-3 rounded-full ${item.bgColor}`}>
                  <Icon className={`h-6 w-6 ${item.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
