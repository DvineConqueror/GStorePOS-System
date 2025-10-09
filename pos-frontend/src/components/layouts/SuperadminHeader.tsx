import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Menu, LogOut } from 'lucide-react';
import { SuperadminLogo } from '@/components/ui/BrandLogo';
import NotificationButton from '@/components/notifications/NotificationButton';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface SuperadminHeaderProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export const SuperadminHeader: React.FC<SuperadminHeaderProps> = ({
  sidebarOpen,
  onToggleSidebar,
}) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    signOut();
    navigate('/login');
  };

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-green-200/50 shadow-lg shadow-green-100/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={onToggleSidebar}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <SuperadminLogo size="md" />
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <Badge variant="destructive" className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-xs">
              <Shield className="h-3 w-3 mr-1" />
              <span className="hidden sm:inline">Superadmin</span>
            </Badge>
            <span className="text-sm text-gray-700 hidden sm:inline font-medium">
              {user?.firstName} {user?.lastName}
            </span>
            <NotificationButton />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-gray-600 hover:text-red-600"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
