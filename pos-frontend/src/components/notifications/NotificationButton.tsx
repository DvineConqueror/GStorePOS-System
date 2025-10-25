import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  BellRing, 
  Users, 
  Package,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getColorScheme } from '@/utils/colorSchemes';
import { useSocket } from '@/context/SocketContext';
import { useRefresh } from '@/context/RefreshContext';
import NotificationDialog from './NotificationDialog';

interface PendingUser {
  _id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  createdAt: string;
}

interface LowStockProduct {
  _id: string;
  name: string;
  stock: number;
  minStock: number;
  sku: string;
  category?: string;
}

interface NotificationData {
  pendingApprovals: {
    count: number;
    users: PendingUser[];
    enabled: boolean;
  };
  lowStockAlerts: {
    count: number;
    products: LowStockProduct[];
    enabled: boolean;
  };
  totalNotifications: number;
}

interface NotificationButtonProps {
  className?: string;
}

export default function NotificationButton({ className }: NotificationButtonProps) {
  const { user } = useAuth();
  const colors = getColorScheme();
  const { isConnected } = useSocket();
  const { refreshTrigger } = useRefresh();
  
  const [notificationData, setNotificationData] = useState<NotificationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showNotificationDialog, setShowNotificationDialog] = useState(false);

  const fetchAllNotifications = async () => {
    try {
      setIsLoading(true);
      
      // Import API dynamically to avoid circular dependencies
      const { notificationsAPI } = await import('@/lib/api');
      
      const response = await notificationsAPI.getAllNotifications();
      
      if (response.success) {
        setNotificationData(response.data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllNotifications();
    
    // Listen for real-time updates from WebSocket
    const handleNotificationUpdate = () => {
      fetchAllNotifications();
    };
    
    window.addEventListener('pendingApprovalsUpdate', handleNotificationUpdate);
    window.addEventListener('lowStockUpdate', handleNotificationUpdate);
    
    // Fallback polling every 30 seconds if WebSocket is not connected
    const interval = setInterval(() => {
      if (!isConnected) {
        fetchAllNotifications();
      }
    }, 30000);
    
    return () => {
      window.removeEventListener('pendingApprovalsUpdate', handleNotificationUpdate);
      window.removeEventListener('lowStockUpdate', handleNotificationUpdate);
      clearInterval(interval);
    };
  }, [user?.role, isConnected, refreshTrigger]);

  // Listen for WebSocket notifications and refresh data
  useEffect(() => {
    const handleNotification = (event: CustomEvent) => {
      const notification = event.detail;
      if (notification.type === 'new_user_registration' || notification.type === 'low_stock_alert') {
        fetchAllNotifications();
      }
    };

    window.addEventListener('notification' as any, handleNotification);
    
    return () => {
      window.removeEventListener('notification' as any, handleNotification);
    };
  }, []);

  const handleNotificationClick = () => {
    setShowNotificationDialog(true);
  };

  // Only show for superadmin and manager roles
  if (!user || (user.role !== 'superadmin' && user.role !== 'manager')) {
    return null;
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleNotificationClick}
        disabled={isLoading}
        className={`relative p-2 h-8 w-8 ${colors.primaryText} hover:bg-gray-100 ${className}`}
      >
        {(notificationData?.totalNotifications || 0) > 0 ? (
          <BellRing className=" h-4 w-4" />
        ) : (
          <Bell className="h-4 w-4" />
        )}
        
        {(notificationData?.totalNotifications || 0) > 0 && (
          <Badge 
            className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-red-500 hover:bg-red-600"
          >
            {(notificationData?.totalNotifications || 0) > 9 ? '9+' : notificationData?.totalNotifications}
          </Badge>
        )}
      </Button>

      <NotificationDialog
        open={showNotificationDialog}
        onClose={() => setShowNotificationDialog(false)}
        notificationData={notificationData || undefined}
        isLoading={isLoading}
      />
    </>
  );
}
