import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { BarChart3, Users, Package, ShoppingCart, Zap, Settings, Menu, X, LogOut, Bell } from 'lucide-react';
import { MaintenanceBanner } from '@/components/system/MaintenanceBanner';
import NotificationAlert from '@/components/notifications/NotificationAlert';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AdminLayoutProps {
  children?: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  const currentPath = location.pathname.replace('/admin/', '');

  return (
    <div className="min-h-screen bg-[#ececec]">
      {/* Maintenance Banner */}
      <MaintenanceBanner />
      
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-green-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 lg:h-16">
            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>

            {/* Desktop Logo */}
            <div className="hidden lg:flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-8 w-8 text-green-600" />
                <h1 className="text-xl font-bold text-black">Manager Dashboard</h1>
              </div>
            </div>

            {/* Mobile/Desktop Right Side - Manager info and actions */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Manager Name */}
              <div className="flex items-center space-x-2 text-gray-700">
                <Users className="h-4 w-4 text-green-600 hidden sm:block" />
                <span className="text-sm font-medium">
                  Manager: {user?.firstName} {user?.lastName}
                </span>
              </div>
              
              {/* Notification Bell */}
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5 text-gray-600" />
              </Button>

              {/* Logout Button */}
              <Button 
                onClick={handleLogout} 
                variant="outline" 
                size="sm"
                className="bg-white hover:bg-green-50 border-green-200 text-green-700 px-2 sm:px-4"
              >
                <LogOut className="mr-1 h-4 w-4 text-green-600" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex relative">
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 lg:z-auto w-80 lg:w-64 bg-white shadow-lg lg:shadow-sm border-r border-green-200 transform transition-transform duration-300 ease-in-out lg:transform-none",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}>
          <div className="flex flex-col h-full">
            {/* Sidebar Header */}
            <div className="flex items-center justify-between p-4 border-b border-green-200 lg:border-b-0">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-6 w-6 text-green-600" />
                <h2 className="text-lg font-bold text-black">Manager Menu</h2>
              </div>
              <button
                className="lg:hidden p-1 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4">
              <div className="px-4 space-y-1">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPath === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        navigate(item.path);
                        setSidebarOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors",
                        isActive 
                          ? "bg-green-100 text-green-900 border-r-2 border-green-600" 
                          : "text-gray-700 hover:bg-green-50 hover:text-gray-900"
                      )}
                    >
                      <Icon className={cn(
                        "mr-3 h-5 w-5",
                        isActive ? "text-green-600" : "text-green-600"
                      )} />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <div className="p-4 sm:p-6">
            <div className="max-w-7xl mx-auto">
              
              {children || <Outlet />}
            </div>
          </div>
        </main>
      </div>
      
      {/* Notification Alert */}
      <NotificationAlert />
    </div>
  );
}