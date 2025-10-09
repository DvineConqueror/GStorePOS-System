import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate, useLocation } from 'react-router-dom';
import { NavigationItem, QuickStats } from '@/types/layout';

interface SuperadminSidebarProps {
  sidebarOpen: boolean;
  onCloseSidebar: () => void;
  quickStats: QuickStats | null;
  loadingStats: boolean;
}

export const SuperadminSidebar: React.FC<SuperadminSidebarProps> = ({
  sidebarOpen,
  onCloseSidebar,
  quickStats,
  loadingStats,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const navigationItems: NavigationItem[] = [
    {
      name: 'Dashboard',
      href: '/superadmin',
      icon: BarChart3,
      description: 'System overview and statistics'
    },
    {
      name: 'All Users',
      href: '/superadmin/users',
      icon: Shield,
      description: 'Manage all system users'
    },
    {
      name: 'Pending Approvals',
      href: '/superadmin/approvals',
      icon: Shield,
      description: 'Review and approve new users'
    },
    {
      name: 'Create Manager',
      href: '/superadmin/create-manager',
      icon: Shield,
      description: 'Create new manager accounts'
    },
    {
      name: 'System Settings',
      href: '/superadmin/settings',
      icon: Shield,
      description: 'Configure system settings'
    }
  ];

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onCloseSidebar}
        />
      )}

      {/* Sidebar Navigation */}
      <div className={cn(
        "fixed lg:static inset-y-0 left-0 z-50 lg:z-auto w-80 lg:w-64 transform transition-transform duration-300 ease-in-out lg:transform-none",
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="h-full overflow-y-auto lg:overflow-visible">
          <div className="p-4 lg:p-0">
            <Card className="bg-white/70 backdrop-blur-md border-green-200/50 shadow-xl shadow-green-100/30 ring-1 ring-green-100/50">
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
                          ? "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg shadow-green-200/50 ring-1 ring-green-300/30"
                          : "bg-white/50 text-gray-800 hover:text-green-900 hover:bg-green-50/80 hover:shadow-md transition-all duration-200"
                      )}
                      onClick={() => {
                        navigate(item.href);
                        onCloseSidebar();
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

          </div>
        </div>
      </div>
    </>
  );
};
