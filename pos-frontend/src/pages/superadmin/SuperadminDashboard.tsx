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
  status: 'active' | 'inactive' | 'deleted';
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
        return 'bg-slate-600 hover:bg-slate-700';
    }
  };

  const getStatusIcon = (status: string, isApproved: boolean) => {
    if (status !== 'active') return <AlertTriangle className="h-4 w-4 text-red-500" />;
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
    <div className="min-h-screen bg-slate-950">
      <div className="space-y-8 p-6">
        {/* Authority Header */}
        <div className="border-b border-slate-800 pb-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-red-600 to-red-700 rounded-2xl flex items-center justify-center shadow-2xl shadow-red-500/25">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white tracking-tight">SuperAdmin Control Panel</h1>
              <p className="text-slate-400 text-lg mt-1">System Administration & User Management</p>
            </div>
          </div>
        </div>

        {/* Authority Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="bg-slate-900/50 border-slate-800 hover:border-amber-500/50 transition-all duration-300 group">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/25">
                  <UserCheck className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-white text-lg">Review Approvals</CardTitle>
                  <p className="text-amber-400 text-sm font-medium">{stats?.pendingApprovals || 0} pending</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400 text-sm mb-4">Review and approve pending user registrations</p>
              <Button 
                onClick={() => navigate('/superadmin/approvals')}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold"
              >
                Review Now
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800 hover:border-red-500/50 transition-all duration-300 group">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/25">
                  <UserPlus className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-white text-lg">Create Manager</CardTitle>
                  <p className="text-red-400 text-sm font-medium">Add new manager</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400 text-sm mb-4">Create new manager accounts with full permissions</p>
              <Button 
                onClick={() => navigate('/superadmin/create-manager')}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold"
              >
                Create Manager
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800 hover:border-slate-500/50 transition-all duration-300 group md:col-span-2 lg:col-span-1">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-slate-600 rounded-xl flex items-center justify-center shadow-lg shadow-slate-500/25">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-white text-lg">Manage Users</CardTitle>
                  <p className="text-slate-400 text-sm font-medium">{stats?.totalUsers || 0} total users</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400 text-sm mb-4">View and manage all system users and permissions</p>
              <Button 
                onClick={() => navigate('/superadmin/users')}
                className="w-full bg-slate-600 hover:bg-slate-700 text-white font-semibold"
              >
                Manage Users
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* System Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">
                Total Users
              </CardTitle>
              <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-slate-300" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {stats?.totalUsers || 0}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                All registered users
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800 hover:border-green-500/50 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">
                Active Users
              </CardTitle>
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {stats?.activeUsers || 0}
              </div>
              <p className="text-xs text-green-400 mt-1">
                Currently active
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800 hover:border-amber-500/50 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">
                Pending Approvals
              </CardTitle>
              <div className="w-10 h-10 bg-amber-600 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {stats?.pendingApprovals || 0}
              </div>
              <p className="text-xs text-amber-400 mt-1">
                Awaiting approval
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800 hover:border-red-500/50 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">
                Managers
              </CardTitle>
              <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                <Shield className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {stats?.managerCount || 0}
              </div>
              <p className="text-xs text-red-400 mt-1">
                Manager accounts
              </p>
            </CardContent>
          </Card>
        </div>

        {/* System Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Roles Distribution */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center text-xl">
                <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center mr-3">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                User Roles Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Managers</p>
                    <p className="text-slate-400 text-sm">Administrative users</p>
                  </div>
                </div>
                <Badge className="bg-red-600 text-white px-3 py-1 text-sm font-semibold">
                  {stats?.managerCount || 0}
                </Badge>
              </div>
              <div className="flex justify-between items-center p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Cashiers</p>
                    <p className="text-slate-400 text-sm">Point of sale users</p>
                  </div>
                </div>
                <Badge className="bg-green-600 text-white px-3 py-1 text-sm font-semibold">
                  {stats?.cashierCount || 0}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Recent Users */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center text-xl">
                <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center mr-3">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                Recent Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentUsers.length > 0 ? (
                  recentUsers.map((user) => (
                    <div key={user._id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700 hover:bg-slate-800/70 transition-colors">
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        <div className="flex-shrink-0">
                          {getStatusIcon(user.status, user.isApproved)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-white font-medium truncate">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-slate-400 text-sm truncate">
                            @{user.username}
                          </div>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <Badge className={`${getRoleBadgeColor(user.role)} text-xs px-2 py-1 font-semibold`}>
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-slate-400 py-8">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No recent users found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
