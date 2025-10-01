import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  BellRing, 
  Users, 
  Clock,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { getColorScheme } from '@/utils/colorSchemes';
import { useSocket } from '@/context/SocketContext';

interface PendingUser {
  _id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  createdAt: string;
}

interface NotificationButtonProps {
  className?: string;
}

export default function NotificationButton({ className }: NotificationButtonProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const colors = getColorScheme();
  const { isConnected } = useSocket();
  
  const [pendingCount, setPendingCount] = useState(0);
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Only show for superadmin and manager roles
  if (!user || (user.role !== 'superadmin' && user.role !== 'manager')) {
    return null;
  }

  useEffect(() => {
    fetchPendingApprovals();
    
    // Listen for real-time updates from WebSocket
    const handlePendingApprovalsUpdate = () => {
      fetchPendingApprovals();
    };
    
    window.addEventListener('pendingApprovalsUpdate', handlePendingApprovalsUpdate);
    
    // Fallback polling every 30 seconds if WebSocket is not connected
    const interval = setInterval(() => {
      if (!isConnected) {
        fetchPendingApprovals();
      }
    }, 30000);
    
    return () => {
      window.removeEventListener('pendingApprovalsUpdate', handlePendingApprovalsUpdate);
      clearInterval(interval);
    };
  }, [user?.role, isConnected]);

  // Listen for WebSocket notifications and refresh count only (no toast - NotificationAlert handles that)
  useEffect(() => {
    const handleNotification = (event: CustomEvent) => {
      const notification = event.detail;
      if (notification.type === 'new_user_registration') {
        // Only refresh pending approvals count, no toast notification
        // NotificationAlert component will handle the toast
        fetchPendingApprovals();
      }
    };

    window.addEventListener('notification' as any, handleNotification);
    
    return () => {
      window.removeEventListener('notification' as any, handleNotification);
    };
  }, []);

  const fetchPendingApprovals = async () => {
    try {
      setIsLoading(true);
      
      // Import API dynamically to avoid circular dependencies
      const { notificationsAPI } = await import('@/lib/api');
      
      // Fetch both count and users for consistency
      const [countResponse, usersResponse] = await Promise.all([
        notificationsAPI.getPendingCount(),
        notificationsAPI.getPendingUsers(5)
      ]);
      
      if (countResponse.success && usersResponse.success) {
        const count = countResponse.data?.count || 0;
        const users = usersResponse.data || [];
        
        setPendingCount(count);
        setPendingUsers(users);
      }
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationClick = () => {
    if (pendingCount === 0) {
      toast({
        title: "No Pending Approvals",
        description: "There are no users waiting for approval.",
      });
      return;
    }

    // Only show dropdown on manual click, not on WebSocket updates
    setShowDropdown(!showDropdown);
  };

  const handleViewAll = () => {
    setShowDropdown(false);
    if (user.role === 'superadmin') {
      navigate('/superadmin/approvals');
    } else {
      navigate('/dashboard?highlight=pending');
    }
  };

  const handleUserClick = (userId: string) => {
    setShowDropdown(false);
    if (user.role === 'superadmin') {
      navigate('/superadmin/approvals');
    } else {
      navigate(`/dashboard?highlight=pending&userId=${userId}`);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'cashier': return 'Cashier';
      case 'manager': return 'Manager';
      default: return role;
    }
  };

  return (
    <div className={`relative ${className}`}>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleNotificationClick}
        disabled={isLoading}
        className={`relative p-2 h-8 w-8 ${colors.primaryText} hover:bg-gray-100`}
      >
        {pendingCount > 0 ? (
          <BellRing className="h-4 w-4" />
        ) : (
          <Bell className="h-4 w-4" />
        )}
        
        {pendingCount > 0 && (
          <Badge 
            className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-red-500 hover:bg-red-600"
          >
            {pendingCount > 9 ? '9+' : pendingCount}
          </Badge>
        )}
      </Button>

      {showDropdown && pendingCount > 0 && (
        <div className="absolute right-0 top-10 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-600" />
                Pending Approvals
              </h3>
              <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
                {pendingCount}
              </Badge>
            </div>
          </div>
          
          <div className="max-h-64 overflow-y-auto">
            {pendingUsers.map((pendingUser) => (
              <div
                key={pendingUser._id}
                className="p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => handleUserClick(pendingUser._id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="h-3 w-3 text-gray-500" />
                      <span className="font-medium text-sm text-gray-900 truncate">
                        {pendingUser.firstName} {pendingUser.lastName}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 truncate">
                      {pendingUser.email}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className="bg-blue-100 text-blue-800 text-xs px-1.5 py-0.5">
                        {getRoleDisplayName(pendingUser.role)}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {formatTimeAgo(pendingUser.createdAt)}
                      </span>
                    </div>
                  </div>
                  <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                </div>
              </div>
            ))}
          </div>
          
          <div className="p-3 border-t border-gray-200">
            <Button
              onClick={handleViewAll}
              className={`w-full ${colors.primaryButton} text-white text-sm`}
            >
              View All Approvals
            </Button>
          </div>
        </div>
      )}

      {/* Backdrop to close dropdown */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
}
