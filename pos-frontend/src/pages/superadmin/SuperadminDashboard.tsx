import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  Activity,
  UserCog
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { superadminAPI } from '@/lib/api';

interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  approvedUsers: number;
  pendingApprovals: number;
  superadminCount: number;
  managerCount: number;
  cashierCount: number;
}

interface RecentUser {
  _id: string;
  username: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  isApproved: boolean;
  createdAt: string;
}

export default function SuperadminDashboard() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchSystemStats();
    fetchRecentUsers();
  }, []);

  const fetchSystemStats = async () => {
    try {
      const response = await superadminAPI.getSystemStats();
      if (response.success) {
        setStats(response.data.overview);
      } else {
        throw new Error(response.message || 'Failed to fetch system stats');
      }
    } catch (error) {
      console.error('Error fetching system stats:', error);
      toast({
        title: "Error",
        description: "Failed to load system statistics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentUsers = async () => {
    try {
      const response = await superadminAPI.getAllUsers({
        limit: 5,
        sort: 'createdAt',
        order: 'desc'
      });
      if (response.success) {
        setRecentUsers(response.data);
      } else {
        throw new Error(response.message || 'Failed to fetch recent users');
      }
    } catch (error) {
      console.error('Error fetching recent users:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'superadmin':
        return 'bg-red-600 hover:bg-red-700';
      case 'manager':
        return 'bg-blue-600 hover:bg-blue-700';
      case 'cashier':
        return 'bg-green-600 hover:bg-green-700';
      default:
        return 'bg-gray-600 hover:bg-gray-700';
    }
  };

  const getStatusIcon = (isActive: boolean, isApproved: boolean) => {
    if (!isActive) return <AlertTriangle className="h-4 w-4 text-red-500" />;
    if (!isApproved) return <Clock className="h-4 w-4 text-yellow-500" />;
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Welcome Section - Responsive */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-lg p-4 sm:p-6 text-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Superadmin Dashboard</h1>
            <p className="text-red-100 text-sm sm:text-base">
              Complete system administration and user management
            </p>
          </div>
          <Shield className="h-12 w-12 sm:h-16 sm:w-16 text-red-200 flex-shrink-0" />
        </div>
      </div>

      {/* Quick Actions - Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <Button
          onClick={() => navigate('/superadmin/approvals')}
          className="h-16 sm:h-20 bg-yellow-600 hover:bg-yellow-700 text-white p-3 sm:p-4"
        >
          <div className="text-center w-full">
            <UserCheck className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-1 sm:mb-2" />
            <div className="font-semibold text-sm sm:text-base">Review Approvals</div>
            <div className="text-xs opacity-90">
              {stats?.pendingApprovals || 0} pending
            </div>
          </div>
        </Button>

        <Button
          onClick={() => navigate('/superadmin/create-manager')}
          className="h-16 sm:h-20 bg-blue-600 hover:bg-blue-700 text-white p-3 sm:p-4"
        >
          <div className="text-center w-full">
            <UserPlus className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-1 sm:mb-2" />
            <div className="font-semibold text-sm sm:text-base">Create Manager</div>
            <div className="text-xs opacity-90">Add new manager</div>
          </div>
        </Button>

        <Button
          onClick={() => navigate('/superadmin/users')}
          className="h-16 sm:h-20 bg-green-600 hover:bg-green-700 text-white p-3 sm:p-4 sm:col-span-2 lg:col-span-1"
        >
          <div className="text-center w-full">
            <Users className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-1 sm:mb-2" />
            <div className="font-semibold text-sm sm:text-base">Manage Users</div>
            <div className="text-xs opacity-90">
              {stats?.totalUsers || 0} total users
            </div>
          </div>
        </Button>
      </div>

      {/* Statistics Cards - Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">
              Total Users
            </CardTitle>
            <Users className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-white">
              {stats?.totalUsers || 0}
            </div>
            <p className="text-xs text-slate-400">
              All registered users
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">
              Active Users
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-white">
              {stats?.activeUsers || 0}
            </div>
            <p className="text-xs text-slate-400">
              Currently active
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">
              Pending Approvals
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-white">
              {stats?.pendingApprovals || 0}
            </div>
            <p className="text-xs text-slate-400">
              Awaiting approval
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">
              Managers
            </CardTitle>
            <Shield className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-white">
              {stats?.managerCount || 0}
            </div>
            <p className="text-xs text-slate-400">
              Manager accounts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Compact User Roles Distribution - Like Quick Stats */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-white flex items-center text-base sm:text-lg">
            <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            User Roles Distribution
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-slate-300 text-sm">Managers</span>
            <Badge variant="secondary" className="bg-blue-600 text-white">
              {stats?.managerCount || 0}
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-300 text-sm">Cashiers</span>
            <Badge variant="secondary" className="bg-green-600 text-white">
              {stats?.cashierCount || 0}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Recent Users - Responsive */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center text-base sm:text-lg">
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            Recent Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 sm:space-y-3">
            {recentUsers.length > 0 ? (
              recentUsers.map((user) => (
                <div key={user._id} className="flex items-center justify-between p-2 sm:p-3 bg-slate-700/50 rounded-lg">
                  <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                    {getStatusIcon(user.isActive, user.isApproved)}
                    <div className="min-w-0 flex-1">
                      <div className="text-white font-medium text-sm sm:text-base truncate">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="text-xs text-slate-400 truncate">
                        @{user.username}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <Badge className={`${getRoleBadgeColor(user.role)} text-xs`}>
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-slate-400 py-4">
                No recent users found
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
