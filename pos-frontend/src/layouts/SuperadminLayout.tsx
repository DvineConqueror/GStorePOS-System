import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  UserCheck, 
  UserPlus, 
  BarChart3, 
  Settings, 
  LogOut,
  Shield,
  AlertCircle,
  Menu,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { superadminAPI } from '@/lib/api';
import { useRefresh } from '@/context/RefreshContext';
import NotificationButton from '@/components/notifications/NotificationButton';
import NotificationAlert from '@/components/notifications/NotificationAlert';

interface SuperadminLayoutProps {
  children?: React.ReactNode;
}

interface QuickStats {
  totalUsers: number;
  pendingApprovals: number;
  managerCount: number;
  cashierCount: number;
}

export default function SuperadminLayout({ children }: SuperadminLayoutProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshTrigger } = useRefresh();
  const [quickStats, setQuickStats] = useState<QuickStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    signOut();
    navigate('/login');
  };

  const fetchQuickStats = async () => {
    try {
      setLoadingStats(true);
      const response = await superadminAPI.getSystemStats();
      if (response.success) {
        setQuickStats(response.data.overview);
      }
    } catch (error) {
      console.error('Error fetching quick stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchQuickStats();
  }, [refreshTrigger]);

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/superadmin',
      icon: BarChart3,
      description: 'System overview and statistics'
    },
    {
      name: 'All Users',
      href: '/superadmin/users',
      icon: Users,
      description: 'Manage all system users'
    },
    {
      name: 'Pending Approvals',
      href: '/superadmin/approvals',
      icon: UserCheck,
      description: 'Review and approve new users'
    },
    {
      name: 'Create Manager',
      href: '/superadmin/create-manager',
      icon: UserPlus,
      description: 'Create new manager accounts'
    },
    {
      name: 'System Settings',
      href: '/superadmin/settings',
      icon: Settings,
      description: 'Configure system settings'
    }
  ];

  return (
        <div className="min-h-screen bg-[#ececec]">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm border-b border-green-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden text-green-700 hover:text-green-900 hover:bg-green-50"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                {sidebarOpen ? <X className="h-5 w-5 text-green-600" /> : <Menu className="h-5 w-5 text-green-600" />}
              </Button>
              
              <div className="flex items-center space-x-2">
                <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                <div>
                  <h1 className="text-lg sm:text-xl font-bold text-black">Superadmin Panel</h1>
                  <p className="text-xs text-gray-600 hidden sm:block">System Administration</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="flex items-center space-x-2">
                <Badge variant="destructive" className="bg-green-600 hover:bg-red-700 text-xs">
                  <Shield className="h-3 w-3 mr-1" />
                  <span className="hidden sm:inline">Superadmin</span>
                </Badge>
                <span className="text-sm text-green-700 hidden sm:inline">
                  {user?.firstName} {user?.lastName}
                </span>
              </div>
              <NotificationButton />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-green-700 hover:text-green-900 hover:bg-green-50"
              >
                <LogOut className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-8">
          {/* Mobile Sidebar Overlay */}
          {sidebarOpen && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Sidebar Navigation */}
          <div className={cn(
            "lg:col-span-1",
            sidebarOpen 
              ? "fixed inset-y-0 left-0 z-50 w-80 bg-background/95 backdrop-blur-sm lg:relative lg:inset-y-0 lg:z-auto lg:w-auto lg:bg-transparent"
              : "hidden lg:block"
          )}>
            <div className="h-full overflow-y-auto lg:overflow-visible">
              <div className="p-4 lg:p-0">
                <Card className="bg-background border-green-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-black flex items-center text-sm sm:text-base">
                      <Shield className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-green-600" />
                      Navigation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 sm:space-y-2">
                    {navigationItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = location.pathname === item.href;
                      
                      return (
                        <Button
                          key={item.name}
                          variant={isActive ? "default" : "ghost"}
                          className={cn(
                            "w-full justify-start text-left h-auto p-2 sm:p-3",
                            isActive 
                              ? "bg-green-600 hover:bg-green-700 text-white" 
                              : "bg-[#ececec] text-black hover:text-green-900 hover:bg-green-50"
                          )}
                          onClick={() => {
                            navigate(item.href);
                            setSidebarOpen(false);
                          }}
                        >
                          <Icon className="h-4 w-4 mr-2 sm:mr-3 flex-shrink-0" />
                          <div className="min-w-0">
                            <div className="font-medium text-sm sm:text-base truncate">{item.name}</div>
                            <div className="text-xs opacity-75 truncate">{item.description}</div>
                          </div>
                        </Button>
                      );
                    })}
                  </CardContent>
                </Card>

                {/* Quick Stats */}
                <Card className="bg-background border-green-200 mt-4 sm:mt-6">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-black flex items-center text-sm sm:text-base">
                      <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-green-600" />
                      Quick Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 sm:space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-black text-xs sm:text-sm">Total Users</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                        {loadingStats ? 'Loading...' : (quickStats?.totalUsers || 0)}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-black text-xs sm:text-sm">Pending Approvals</span>
                      <Badge variant="destructive" className="bg-green-600 text-xs">
                        {loadingStats ? 'Loading...' : (quickStats?.pendingApprovals || 0)}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-black text-xs sm:text-sm">Active Managers</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                        {loadingStats ? 'Loading...' : (quickStats?.managerCount || 0)}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-black text-xs sm:text-sm">Active Cashiers</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                        {loadingStats ? 'Loading...' : (quickStats?.cashierCount || 0)}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="space-y-4 sm:space-y-6">

              {/* Page Content */}
              <div className="min-h-[400px] sm:min-h-[600px]">
                {children || <Outlet />}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Notification Alert */}
      <NotificationAlert />
    </div>
  );
}
