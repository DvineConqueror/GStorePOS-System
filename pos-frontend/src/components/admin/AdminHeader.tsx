import React from 'react';
import { Button } from '@/components/ui/button';
import { Shield, LogOut } from 'lucide-react';
import NotificationButton from '@/components/notifications/NotificationButton';
import NotificationAlert from '@/components/notifications/NotificationAlert';

interface AdminHeaderProps {
  userName: string;
  onLogout: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ userName, onLogout }) => {
  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-3xl font-bold text-black hidden sm:block">Manager Dashboard</h1>
        <p className="text-gray-600 mt-2 hidden sm:block">Manage cashiers, products, and system settings</p>
      </div>
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 text-gray-700">
          <Shield className="h-4 w-4 text-green-600" />
          <span className="text-sm font-medium">Manager: {userName}</span>
        </div>
        <NotificationButton />
        <Button onClick={onLogout} variant="outline" className="bg-white hover:bg-green-50 border-green-200">
          <LogOut className="mr-2 h-4 w-4 text-green-600" />
          Logout
        </Button>
      </div>
    </div>
  );
};
