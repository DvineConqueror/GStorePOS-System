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
  BarChart3
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
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Superadmin Dashboard</h1>
            <p className="text-red-100">
              Complete system administration and user management
            </p>
          </div>
          <Shield className="h-16 w-16 text-red-200" />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button
          onClick={() => navigate('/superadmin/approvals')}
          className="h-20 bg-yellow-600 hover:bg-yellow-700 text-white"
        >
          <div className="text-center">
            <UserCheck className="h-6 w-6 mx-auto mb-2" />
            <div className="font-semibold">Review Approvals</div>
            <div className="text-xs opacity-90">
              {stats?.pendingApprovals || 0} pending
            </div>
          </div>
        </Button>

        <Button
          onClick={() => navigate('/superadmin/create-manager')}
          className="h-20 bg-blue-600 hover:bg-blue-700 text-white"
        >
          <div className="text-center">
            <UserPlus className="h-6 w-6 mx-auto mb-2" />
            <div className="font-semibold">Create Manager</div>
            <div className="text-xs opacity-90">Add new manager</div>
          </div>
        </Button>

        <Button
          onClick={() => navigate('/superadmin/users')}
          className="h-20 bg-green-600 hover:bg-green-700 text-white"
        >
          <div className="text-center">
            <Users className="h-6 w-6 mx-auto mb-2" />
            <div className="font-semibold">Manage Users</div>
            <div className="text-xs opacity-90">
              {stats?.totalUsers || 0} total users
            </div>
          </div>
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">
              Total Users
            </CardTitle>
            <Users className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
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
            <div className="text-2xl font-bold text-white">
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
            <div className="text-2xl font-bold text-white">
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
            <div className="text-2xl font-bold text-white">
              {stats?.managerCount || 0}
            </div>
            <p className="text-xs text-slate-400">
              Manager accounts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Role Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              User Roles Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Badge className="bg-blue-600 hover:bg-blue-700">Manager</Badge>
              </div>
              <span className="text-white font-semibold">
                {stats?.managerCount || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Badge className="bg-green-600 hover:bg-green-700">Cashier</Badge>
              </div>
              <span className="text-white font-semibold">
                {stats?.cashierCount || 0}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Recent Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentUsers.length > 0 ? (
                recentUsers.map((user) => (
                  <div key={user._id} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(user.isActive, user.isApproved)}
                      <div>
                        <div className="text-white font-medium">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-xs text-slate-400">
                          @{user.username}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getRoleBadgeColor(user.role)}>
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
    </div>
  );
}
