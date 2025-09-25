import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  X,
  User,
  Mail
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface ApprovalStatusNotificationProps {
  onDismiss?: () => void;
}

export default function ApprovalStatusNotification({ onDismiss }: ApprovalStatusNotificationProps) {
  const { user } = useAuth();
  const [showNotification, setShowNotification] = useState(false);
  const [notificationType, setNotificationType] = useState<'pending' | 'approved' | 'rejected' | null>(null);

  useEffect(() => {
    // Don't show approval notifications for superadmin (they are always approved)
    if (user && user.role === 'superadmin') {
      return;
    }
    
    if (user && !user.isApproved) {
      setNotificationType('pending');
      setShowNotification(true);
    } else if (user && user.isApproved) {
      // Check if this is a newly approved user (could be stored in localStorage)
      const wasPending = localStorage.getItem('user_was_pending');
      if (wasPending === 'true') {
        setNotificationType('approved');
        setShowNotification(true);
        localStorage.removeItem('user_was_pending');
      }
    }
  }, [user]);

  const handleDismiss = () => {
    setShowNotification(false);
    onDismiss?.();
  };

  const getNotificationContent = () => {
    switch (notificationType) {
      case 'pending':
        return {
          icon: <Clock className="h-5 w-5 text-yellow-600" />,
          title: 'Account Pending Approval',
          message: 'Your account is waiting for manager approval. You will be notified once approved.',
          bgColor: 'bg-yellow-50 border-yellow-200',
          textColor: 'text-yellow-800',
          badge: <Badge className="bg-yellow-600 hover:bg-yellow-700">Pending</Badge>
        };
      case 'approved':
        return {
          icon: <CheckCircle className="h-5 w-5 text-green-600" />,
          title: 'Account Approved!',
          message: 'Your account has been approved. You can now access all features.',
          bgColor: 'bg-green-50 border-green-200',
          textColor: 'text-green-800',
          badge: <Badge className="bg-green-600 hover:bg-green-700">Approved</Badge>
        };
      case 'rejected':
        return {
          icon: <XCircle className="h-5 w-5 text-red-600" />,
          title: 'Account Rejected',
          message: 'Your account has been rejected. Please contact your manager for more information.',
          bgColor: 'bg-red-50 border-red-200',
          textColor: 'text-red-800',
          badge: <Badge className="bg-red-600 hover:bg-red-700">Rejected</Badge>
        };
      default:
        return null;
    }
  };

  if (!showNotification || !notificationType) {
    return null;
  }

  const content = getNotificationContent();
  if (!content) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <Card className={`${content.bgColor} border-2 shadow-lg`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              {content.icon}
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className={`font-semibold ${content.textColor}`}>
                    {content.title}
                  </h3>
                  {content.badge}
                </div>
                <p className={`text-sm ${content.textColor} opacity-90`}>
                  {content.message}
                </p>
                {notificationType === 'pending' && (
                  <div className="mt-3 flex items-center space-x-2 text-xs text-yellow-700">
                    <User className="h-3 w-3" />
                    <span>Account: {user?.firstName} {user?.lastName}</span>
                  </div>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-6 w-6 p-0 hover:bg-transparent"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Hook to manage approval status notifications
export const useApprovalNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<string[]>([]);

  const addNotification = (message: string) => {
    setNotifications(prev => [...prev, message]);
  };

  const removeNotification = (index: number) => {
    setNotifications(prev => prev.filter((_, i) => i !== index));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Check for approval status changes
  useEffect(() => {
    if (user) {
      const lastApprovalStatus = localStorage.getItem('last_approval_status');
      const currentStatus = user.isApproved ? 'approved' : 'pending';
      
      if (lastApprovalStatus && lastApprovalStatus !== currentStatus) {
        if (currentStatus === 'approved') {
          addNotification('Your account has been approved!');
        } else if (currentStatus === 'pending') {
          addNotification('Your account is pending approval.');
        }
      }
      
      localStorage.setItem('last_approval_status', currentStatus);
    }
  }, [user?.isApproved]);

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
  };
};
