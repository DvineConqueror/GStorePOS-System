import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Clock, 
  X,
  AlertCircle,
  CheckCircle2,
  ArrowRight
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

interface NotificationAlertProps {
  onDismiss?: () => void;
  autoHide?: boolean;
  hideDelay?: number;
}

export default function NotificationAlert({ 
  onDismiss, 
  autoHide = true, 
  hideDelay = 10000 
}: NotificationAlertProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const colors = getColorScheme();
  const { isConnected } = useSocket();
  
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [lastNotificationTime, setLastNotificationTime] = useState<number>(0);
  const hasShownNotification = useRef<Set<string>>(new Set());
  
  // Check if alert has been dismissed (persistent across page refreshes, role-specific)
  const isAlertDismissed = localStorage.getItem(`notificationAlertDismissed_${user?.role}`) === 'true';

  // Only show for superadmin and manager roles
  if (!user || (user.role !== 'superadmin' && user.role !== 'manager')) {
    return null;
  }

  useEffect(() => {
    checkForPendingApprovals();
    
    // Listen for real-time WebSocket notifications
    const handleNotification = (event: CustomEvent) => {
      const notification = event.detail;
      if (notification.type === 'new_user_registration') {
        // Only show notification once per user registration
        const userId = notification.user?.id;
        if (userId && !hasShownNotification.current.has(userId)) {
          hasShownNotification.current.add(userId);
          checkForPendingApprovals();
        }
      }
    };

    window.addEventListener('notification' as any, handleNotification);
    
    // Fallback polling every 30 seconds if WebSocket is not connected
    const interval = setInterval(() => {
      if (!isConnected) {
        checkForPendingApprovals();
      }
    }, 30000);
    
    return () => {
      window.removeEventListener('notification' as any, handleNotification);
      clearInterval(interval);
    };
  }, [user?.role, isConnected]);

  useEffect(() => {
    if (showAlert && autoHide) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, hideDelay);
      
      return () => clearTimeout(timer);
    }
  }, [showAlert, autoHide, hideDelay]);

  const checkForPendingApprovals = async () => {
    try {
      setIsLoading(true);
      
      // Import API dynamically to avoid circular dependencies
      const { notificationsAPI } = await import('@/lib/api');
      
      const response = await notificationsAPI.getPendingUsers(3);
      
      if (response.success && response.data?.length > 0) {
        setPendingUsers(response.data);
        // Only show alert if it hasn't been dismissed
        if (!isAlertDismissed) {
          setShowAlert(true);
        }
      }
    } catch (error) {
      console.error('Error checking pending approvals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    setShowAlert(false);
    // Store dismissal state in localStorage to persist across page refreshes (role-specific)
    localStorage.setItem(`notificationAlertDismissed_${user?.role}`, 'true');
    onDismiss?.();
  };

  const handleViewApprovals = () => {
    setShowAlert(false);
    // Store dismissal state when viewing approvals (role-specific)
    localStorage.setItem(`notificationAlertDismissed_${user?.role}`, 'true');
    if (user.role === 'superadmin') {
      navigate('/superadmin/approvals');
    } else {
      navigate('/dashboard?highlight=pending');
    }
  };

  const handleUserClick = (userId: string) => {
    setShowAlert(false);
    // Store dismissal state when clicking on user (role-specific)
    localStorage.setItem(`notificationAlertDismissed_${user?.role}`, 'true');
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

  if (!showAlert || pendingUsers.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-16 right-32 z-50 max-w-md">
      <Card className="bg-white border-2 border-yellow-200 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="font-semibold text-gray-900">
                    Pending Approvals
                  </h3>
                  <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
                    {pendingUsers.length}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  {pendingUsers.length === 1 
                    ? '1 user is waiting for approval'
                    : `${pendingUsers.length} users are waiting for approval`
                  }
                </p>
                
                <div className="space-y-2">
                  {pendingUsers.map((pendingUser) => (
                    <div
                      key={pendingUser._id}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded-md hover:bg-gray-100 cursor-pointer transition-colors"
                      onClick={() => handleUserClick(pendingUser._id)}
                    >
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        <Users className="h-3 w-3 text-gray-500 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {pendingUser.firstName} {pendingUser.lastName}
                          </p>
                          <div className="flex items-center space-x-2">
                            <Badge className="bg-blue-100 text-blue-800 text-xs px-1.5 py-0.5">
                              {getRoleDisplayName(pendingUser.role)}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {formatTimeAgo(pendingUser.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="h-3 w-3 text-gray-400 flex-shrink-0" />
                    </div>
                  ))}
                </div>
                
                <div className="flex items-center space-x-2 mt-3">
                  <Button
                    onClick={handleViewApprovals}
                    size="sm"
                    className={`${colors.primaryButton} text-white text-xs px-3 py-1`}
                  >
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Review All
                  </Button>
                  <Button
                    onClick={handleDismiss}
                    variant="ghost"
                    size="sm"
                    className="text-xs px-3 py-1 text-gray-500 hover:text-gray-700"
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-6 w-6 p-0 hover:bg-transparent flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
