import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ShoppingCart, 
  LogOut, 
  BarChart3, 
  History,
  User,
  Zap
} from 'lucide-react';

interface CashierLayoutProps {
  children?: React.ReactNode;
}

export function CashierLayout({ children }: CashierLayoutProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    signOut();
  };

  const navigationItems = [
    { id: 'pos', label: 'POS System', icon: ShoppingCart, path: '/cashier/pos' },
    { id: 'analytics', label: 'My Analytics', icon: BarChart3, path: '/cashier/analytics' },
    { id: 'history', label: 'Transaction History', icon: History, path: '/cashier/history' },
    { id: 'profile', label: 'Profile', icon: User, path: '/cashier/profile' },
  ];

  return (
    <div className="min-h-screen bg-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <ShoppingCart className="h-8 w-8 text-blue-600" />
                <h1 className="text-xl font-bold text-gray-900">Cashier POS</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-gray-700">
                <User className="h-4 w-4" />
                <span className="text-sm font-medium">Cashier: {user?.firstName} {user?.lastName}</span>
                <Badge variant="secondary" className="ml-2">Active</Badge>
              </div>
              <Button onClick={handleLogout} variant="outline" size="sm">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-sm min-h-screen">
          <nav className="mt-8">
            <div className="px-4 space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => navigate(item.path)}
                    className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-blue-50 hover:text-blue-700 transition-colors"
                  >
                    <Icon className="mr-3 h-5 w-5" />
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
    </div>
  );
}
