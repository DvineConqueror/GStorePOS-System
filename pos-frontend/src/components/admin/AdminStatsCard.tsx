import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Package, 
  DollarSign, 
  TrendingUp,
  ShoppingCart,
  UserPlus,
  UserCheck,
  Clock
} from 'lucide-react';
import { UserStats, SalesStats, ApprovalStats } from '@/types/admin';

interface AdminStatsCardProps {
  userStats: UserStats;
  salesStats: SalesStats;
  approvalStats: ApprovalStats;
  loading?: boolean;
}

export const AdminStatsCard: React.FC<AdminStatsCardProps> = ({
  userStats,
  salesStats,
  approvalStats,
  loading = false
}) => {
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

  const statItems = [
    // User Stats
    {
      title: 'Total Users',
      value: userStats.totalUsers,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: 'All registered users'
    },
    {
      title: 'Active Users',
      value: userStats.activeUsers,
      icon: UserCheck,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: 'Currently active'
    },
    {
      title: 'Cashiers',
      value: userStats.cashierUsers,
      icon: ShoppingCart,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      description: 'Point of sale staff'
    },
    {
      title: 'Pending Approvals',
      value: approvalStats.pendingApprovals,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      description: 'Awaiting approval'
    },
    // Sales Stats
    {
      title: 'Total Sales',
      value: `$${salesStats.totalSales.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      description: 'All time sales'
    },
    {
      title: 'Transactions',
      value: salesStats.totalTransactions,
      icon: Package,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      description: 'Total transactions'
    },
    {
      title: 'Avg Transaction',
      value: `$${salesStats.averageTransactionValue.toFixed(2)}`,
      icon: TrendingUp,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
      description: 'Average value'
    },
    {
      title: 'Approved Today',
      value: approvalStats.approvedToday,
      icon: UserPlus,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: 'New approvals'
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
