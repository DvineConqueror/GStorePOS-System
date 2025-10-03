import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ShoppingCart, 
  LogOut, 
  BarChart3, 
  History,
  User,
  Menu,
  X
} from 'lucide-react';
import { MaintenanceBanner } from '@/components/system/MaintenanceBanner';
import { cn } from '@/lib/utils';

interface CashierLayoutProps {
  children?: React.ReactNode;
}

export function CashierLayout({ children }: CashierLayoutProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    signOut();
  };

  const navigationItems = [
    { id: 'pos', label: 'POS System', icon: ShoppingCart, path: '/cashier/pos' },
    { id: 'analytics', label: 'My Analytics', icon: BarChart3, path: '/cashier/analytics' },
    { id: 'history', label: 'Transaction History', icon: History, path: '/cashier/history' },
    { id: 'profile', label: 'Profile', icon: User, path: '/cashier/profile' },
  ];

  const currentPath = location.pathname.replace('/cashier/', '');

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
                <ShoppingCart className="h-8 w-8 text-green-600" />
                <h1 className="text-xl font-bold text-black">Cashier POS</h1>
              </div>
            </div>

            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center space-x-2">
              <ShoppingCart className="h-6 w-6 text-green-600" />  
              <h1 className="text-lg font-bold text-black">Cashier</h1>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="hidden sm:flex items-center space-x-2 text-gray-700">
                <User className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium hidden md:inline">
                  Cashier: {user?.firstName} {user?.lastName}
                </span>
                <span className="text-sm font-medium md:hidden">
                  {user?.firstName}
                </span>
                <Badge variant="secondary" className="ml-2 text-xs">Active</Badge>
              </div>
              <Button 
                onClick={handleLogout} 
                variant="outline" 
                size="sm"
                className="border-green-200 text-green-700 hover:bg-green-50 px-2 sm:px-4"
              >
                <LogOut className="mr-1 h-4 w-4" />
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
                <ShoppingCart className="h-6 w-6 text-green-600" />
                <h2 className="text-lg font-bold text-black">Cashier Menu</h2>
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
              {/* Page Header for Mobile */}
              <div className="lg:hidden mb-6">
                <h1 className="text-2xl font-bold text-black">Point of Sale</h1>
                <p className="text-gray-600 mt-1">Process sales and manage transactions</p>
              </div>
              
              {children || <Outlet />}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}