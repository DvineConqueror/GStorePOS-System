import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Package, 
  BarChart3, 
  ShoppingCart,
  Settings,
  UserPlus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AdminQuickActionsCard: React.FC = () => {
  const navigate = useNavigate();

  const quickActions = [
    {
      id: 'users',
      title: 'Manage Users',
      description: 'View and manage cashier accounts',
      icon: Users,
      href: '/admin/cashiers',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      id: 'products',
      title: 'Product Catalog',
      description: 'Manage inventory and products',
      icon: Package,
      href: '/admin/products',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      id: 'analytics',
      title: 'Analytics',
      description: 'View sales and performance data',
      icon: BarChart3,
      href: '/admin/analytics',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      id: 'pos',
      title: 'POS System',
      description: 'Access point of sale interface',
      icon: ShoppingCart,
      href: '/admin/pos',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      id: 'settings',
      title: 'Settings',
      description: 'Configure system settings',
      icon: Settings,
      href: '/admin/settings',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50'
    }
  ];

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-green-600" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.id}
                variant="outline"
                className="h-auto p-4 justify-start hover:shadow-md transition-all duration-200"
                onClick={() => navigate(action.href)}
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${action.bgColor}`}>
                    <Icon className={`h-5 w-5 ${action.color}`} />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-sm">{action.title}</div>
                    <div className="text-xs text-gray-500">{action.description}</div>
                  </div>
                </div>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
