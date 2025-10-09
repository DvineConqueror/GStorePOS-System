import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  UserCheck, 
  UserPlus, 
  Shield, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  Activity
} from 'lucide-react';
import { SystemStats } from '@/types/superadmin';

interface SystemStatsCardProps {
  stats: SystemStats | null;
  loading?: boolean;
}

export const SystemStatsCard: React.FC<SystemStatsCardProps> = ({ stats, loading = false }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-8 bg-gray-200 rounded w-12"></div>
                </div>
                <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>Failed to load system statistics</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const statItems = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: 'All registered users'
    },
    {
      title: 'Active Users',
      value: stats.activeUsers,
      icon: UserCheck,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: 'Currently active'
    },
    {
      title: 'Approved Users',
      value: stats.approvedUsers,
      icon: CheckCircle,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      description: 'Fully approved'
    },
    {
      title: 'Pending Approvals',
      value: stats.pendingApprovals,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      description: 'Awaiting approval'
    },
    {
      title: 'Superadmins',
      value: stats.superadminCount,
      icon: Shield,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      description: 'System administrators'
    },
    {
      title: 'Managers',
      value: stats.managerCount,
      icon: BarChart3,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      description: 'Store managers'
    },
    {
      title: 'Cashiers',
      value: stats.cashierCount,
      icon: Activity,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
      description: 'Point of sale staff'
    },
    {
      title: 'Growth Rate',
      value: '+12%',
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: 'This month'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statItems.map((item) => {
        const Icon = item.icon;
        return (
          <Card key={item.title} className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-green-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-600">{item.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{item.value}</p>
                  <p className="text-xs text-gray-500">{item.description}</p>
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
