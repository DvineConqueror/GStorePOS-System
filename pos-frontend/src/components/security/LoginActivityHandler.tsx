import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { 
  Activity, 
  User, 
  Monitor, 
  MapPin, 
  Clock,
  X,
  LogIn,
  LogOut,
  UserCheck,
  Globe
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';

interface LoginActivityData {
  activityType: 'login_success' | 'login_failed' | 'logout' | 'session_expired' | 'password_reset';
  userId: string;
  username: string;
  email: string;
  role: string;
  deviceInfo: {
    ip: string;
    userAgent: string;
    location?: string;
    browser?: string;
    os?: string;
  };
  timestamp: string;
  success: boolean;
  metadata?: {
    attemptCount?: number;
    sessionDuration?: string;
    reason?: string;
    previousLogin?: string;
  };
}

interface LoginActivityHandlerProps {
  maxActivities?: number;
  autoHideDelay?: number;
  showOnlyFailures?: boolean;
}

export default function LoginActivityHandler({ 
  maxActivities = 10, 
  autoHideDelay = 12000,
  showOnlyFailures = false
}: LoginActivityHandlerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activities, setActivities] = useState<LoginActivityData[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);

  // Only show for superadmins
  const canViewLoginActivity = user?.role === 'superadmin';

  useEffect(() => {
    if (!canViewLoginActivity) return;

    const handleLoginActivity = (event: CustomEvent) => {
      const activityData: LoginActivityData = event.detail;
      
      // Filter based on preferences
      if (showOnlyFailures && activityData.success) return;

      setActivities(prev => {
        const newActivities = [activityData, ...prev].slice(0, maxActivities);
        return newActivities;
      });

      // Show toast notification for important events
      if (!activityData.success || activityData.activityType === 'login_failed') {
        toast({
          title: "🔐 Login Activity",
          description: `${getActivityMessage(activityData.activityType)} - ${activityData.username}`,
          variant: !activityData.success ? 'destructive' : 'default',
        });
      }

      // Auto-hide after delay
      if (autoHideDelay > 0) {
        setTimeout(() => {
          setActivities(prev => prev.filter(activity => 
            activity.timestamp !== activityData.timestamp || activity.userId !== activityData.userId
          ));
        }, autoHideDelay);
      }
    };

    window.addEventListener('loginActivity', handleLoginActivity as EventListener);

    return () => {
      window.removeEventListener('loginActivity', handleLoginActivity as EventListener);
    };
  }, [canViewLoginActivity, maxActivities, autoHideDelay, showOnlyFailures, toast]);

  const getActivityMessage = (activityType: string) => {
    switch (activityType) {
      case 'login_success':
        return 'Successful login';
      case 'login_failed':
        return 'Failed login attempt';
      case 'logout':
        return 'User logged out';
      case 'session_expired':
        return 'Session expired';
      case 'password_reset':
        return 'Password reset';
      default:
        return 'Login activity';
    }
  };

  const getActivityIcon = (activityType: string, success: boolean) => {
    if (!success) {
      return <X className="h-4 w-4 text-red-500" />;
    }
    
    switch (activityType) {
      case 'login_success':
        return <LogIn className="h-4 w-4 text-green-500" />;
      case 'logout':
        return <LogOut className="h-4 w-4 text-blue-500" />;
      case 'session_expired':
        return <Clock className="h-4 w-4 text-orange-500" />;
      case 'password_reset':
        return <UserCheck className="h-4 w-4 text-purple-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActivityColor = (activityType: string, success: boolean) => {
    if (!success) return 'bg-red-500 text-white';
    
    switch (activityType) {
      case 'login_success':
        return 'bg-green-500 text-white';
      case 'logout':
        return 'bg-blue-500 text-white';
      case 'session_expired':
        return 'bg-orange-500 text-white';
      case 'password_reset':
        return 'bg-purple-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const dismissActivity = (activityToRemove: LoginActivityData) => {
    setActivities(prev => prev.filter(activity => 
      activity.timestamp !== activityToRemove.timestamp || activity.userId !== activityToRemove.userId
    ));
  };

  const dismissAllActivities = () => {
    setActivities([]);
  };

  if (!canViewLoginActivity) {
    return null;
  }

  if (activities.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 max-w-sm">
      <Card className="w-full shadow-lg bg-white border-l-4 border-l-blue-500">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-1 bg-blue-100 rounded-full">
                <Activity className="h-4 w-4 text-blue-600" />
              </div>
              <CardTitle className="text-sm font-semibold text-blue-900">
                Login Activity Monitor
              </CardTitle>
            </div>
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
                className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
              >
                {isMinimized ? '↑' : '↓'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={dismissAllActivities}
                className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Badge variant="outline" className="w-fit text-xs">
            {activities.length} Recent {activities.length === 1 ? 'Activity' : 'Activities'}
          </Badge>
        </CardHeader>
        
        {!isMinimized && (
          <CardContent className="pt-0 max-h-96 overflow-y-auto space-y-2">
            {activities.map((activity, index) => (
              <div 
                key={`${activity.userId}-${activity.timestamp}-${index}`} 
                className="p-3 bg-gray-50 rounded-lg border"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {getActivityIcon(activity.activityType, activity.success)}
                    <div>
                      <p className="text-xs font-medium">
                        {getActivityMessage(activity.activityType)}
                      </p>
                      <Badge className={`text-xs ${getActivityColor(activity.activityType, activity.success)}`}>
                        {activity.success ? 'SUCCESS' : 'FAILED'}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => dismissActivity(activity)}
                    className="h-5 w-5 p-0 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>

                <div className="space-y-1 text-xs text-gray-600">
                  <div className="flex items-center space-x-1">
                    <User className="h-3 w-3" />
                    <span className="font-medium">{activity.username}</span>
                    <span>({activity.role})</span>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <Globe className="h-3 w-3" />
                    <span>IP: {activity.deviceInfo.ip}</span>
                    {activity.deviceInfo.location && (
                      <span>| {activity.deviceInfo.location}</span>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <Monitor className="h-3 w-3" />
                    <span className="truncate text-xs">
                      {activity.deviceInfo.browser || 'Unknown Browser'} on {activity.deviceInfo.os || 'Unknown OS'}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{format(new Date(activity.timestamp), 'MMM dd, HH:mm:ss')}</span>
                  </div>
                </div>

                {activity.metadata && (
                  <div className="mt-2 p-2 bg-white rounded text-xs border">
                    {activity.metadata.attemptCount && (
                      <p>Attempts: <span className="font-medium text-red-600">{activity.metadata.attemptCount}</span></p>
                    )}
                    {activity.metadata.sessionDuration && (
                      <p>Session Duration: <span className="font-medium">{activity.metadata.sessionDuration}</span></p>
                    )}
                    {activity.metadata.reason && (
                      <p>Reason: <span className="font-medium">{activity.metadata.reason}</span></p>
                    )}
                    {activity.metadata.previousLogin && (
                      <p>Previous Login: <span className="font-medium">{format(new Date(activity.metadata.previousLogin), 'MMM dd, HH:mm')}</span></p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        )}
      </Card>
    </div>
  );
}

/**
 * Hook for listening to login activity
 * Can be used in other components to react to login events
 */
export function useLoginActivity() {
  const [activities, setActivities] = useState<LoginActivityData[]>([]);
  const { user } = useAuth();
  
  const canViewLoginActivity = user?.role === 'superadmin';

  useEffect(() => {
    if (!canViewLoginActivity) return;

    const handleLoginActivity = (event: CustomEvent) => {
      const activityData: LoginActivityData = event.detail;
      setActivities(prev => [activityData, ...prev]);
    };

    window.addEventListener('loginActivity', handleLoginActivity as EventListener);

    return () => {
      window.removeEventListener('loginActivity', handleLoginActivity as EventListener);
    };
  }, [canViewLoginActivity]);

  return { activities, canViewLoginActivity };
}