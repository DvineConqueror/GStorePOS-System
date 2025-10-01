import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  LogOut, 
  Users, 
  Package, 
  BarChart3, 
  ShoppingCart,
  Zap,
  Settings
} from 'lucide-react';
import NotificationButton from '@/components/notifications/NotificationButton';
import NotificationAlert from '@/components/notifications/NotificationAlert';

interface AdminLayoutProps {
  children?: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    signOut();
  };

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, path: '/admin/dashboard' },
    { id: 'cashiers', label: 'Cashier Management', icon: Users, path: '/admin/cashiers' },
    { id: 'products', label: 'Product Management', icon: Package, path: '/admin/products' },
    { id: 'pos', label: 'POS System', icon: ShoppingCart, path: '/admin/pos' },
    { id: 'analytics', label: 'Analytics', icon: Zap, path: '/admin/analytics' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/admin/settings' },
  ];

  return (
        <div className="min-h-screen bg-[#ececec]">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-green-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Shield className="h-8 w-8 text-green-600" />
                <h1 className="text-xl font-bold text-black">Manager Dashboard</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-gray-700">
                <Shield className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Manager: {user?.firstName} {user?.lastName}</span>
              </div>
              <NotificationButton />
              <Button onClick={handleLogout} variant="outline" size="sm" className="border-green-300 text-gray-700 hover:bg-green-50">
                <LogOut className="mr-2 h-4 w-4 text-green-600" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
            <aside className="w-64 bg-white shadow-sm min-h-screen border-r border-green-200">
          <nav className="mt-8">
            <div className="px-4 space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => navigate(item.path)}
                    className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-green-50 hover:text-gray-900 transition-colors"
                  >
                    <Icon className="mr-3 h-5 w-5 text-green-600" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {children || <Outlet />}
          </div>
        </main>
      </div>
      
      {/* Notification Alert */}
      <NotificationAlert />
    </div>
  );
}
