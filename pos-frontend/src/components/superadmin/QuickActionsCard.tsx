import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  UserCheck, 
  UserPlus, 
  Shield, 
  Settings,
  BarChart3
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { QuickAction } from '@/types/superadmin';

export const QuickActionsCard: React.FC = () => {
  const navigate = useNavigate();

  const quickActions: QuickAction[] = [
    {
      id: 'users',
      title: 'Manage Users',
      description: 'View and manage all system users',
      icon: Users,
      href: '/superadmin/users',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      id: 'approvals',
      title: 'User Approvals',
      description: 'Review and approve pending users',
      icon: UserCheck,
      href: '/superadmin/approvals',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      id: 'create-manager',
      title: 'Create Manager',
      description: 'Add new manager accounts',
      icon: UserPlus,
      href: '/superadmin/create-manager',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      id: 'settings',
      title: 'System Settings',
      description: 'Configure system parameters',
      icon: Settings,
      href: '/superadmin/settings',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50'
    }
  ];

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-green-600" />
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
