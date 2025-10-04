import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { 
  AlertTriangle, 
  Shield, 
  User, 
  Monitor, 
  MapPin, 
  Clock,
  X,
  Eye,
  UserX
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';

interface SecurityAlertData {
  alertType: 'suspicious_login' | 'concurrent_session' | 'unauthorized_access' | 'brute_force';
  userId: string;
  username: string;
  email: string;
  deviceInfo: {
    ip: string;
    userAgent: string;
    location?: string;
  };
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  metadata?: {
    sessionCount?: number;
    failedAttempts?: number;
    lastSeenLocation?: string;
  };
}

interface SecurityAlertHandlerProps {
  maxAlerts?: number;
  autoHideDelay?: number;
}

export default function SecurityAlertHandler({ 
  maxAlerts = 5, 
  autoHideDelay = 15000 
}: SecurityAlertHandlerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<SecurityAlertData[]>([]);

  // Only show for managers and superadmins
  const canViewSecurityAlerts = user?.role === 'manager' || user?.role === 'superadmin';

  useEffect(() => {
    if (!canViewSecurityAlerts) return;

    const handleSecurityAlert = (event: CustomEvent) => {
      const alertData: SecurityAlertData = event.detail;
      
      setAlerts(prev => {
        const newAlerts = [alertData, ...prev].slice(0, maxAlerts);
        return newAlerts;
      });

      // Show toast notification
      toast({
        title: " Security Alert",
        description: `${getAlertMessage(alertData.alertType)} - User: ${alertData.username}`,
        variant: alertData.severity === 'critical' || alertData.severity === 'high' 
          ? 'destructive' 
          : 'default',
      });

      // Auto-hide after delay
      if (autoHideDelay > 0) {
        setTimeout(() => {
          setAlerts(prev => prev.filter(alert => 
            alert.timestamp !== alertData.timestamp || alert.userId !== alertData.userId
          ));
        }, autoHideDelay);
      }
    };

    window.addEventListener('securityAlert', handleSecurityAlert as EventListener);

    return () => {
      window.removeEventListener('securityAlert', handleSecurityAlert as EventListener);
    };
  }, [canViewSecurityAlerts, maxAlerts, autoHideDelay, toast]);

  const getAlertMessage = (alertType: string) => {
    switch (alertType) {
      case 'suspicious_login':
        return 'Suspicious login detected';
      case 'concurrent_session':
        return 'Concurrent session detected';
      case 'unauthorized_access':
        return 'Unauthorized access attempt';
      case 'brute_force':
        return 'Brute force attack detected';
      default:
        return 'Security event detected';
    }
  };

  const getAlertIcon = (alertType: string) => {
    switch (alertType) {
      case 'suspicious_login':
        return <Shield className="h-4 w-4" />;
      case 'concurrent_session':
        return <User className="h-4 w-4" />;
      case 'unauthorized_access':
        return <UserX className="h-4 w-4" />;
      case 'brute_force':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500 text-white';
      case 'high':
        return 'bg-orange-500 text-white';
      case 'medium':
        return 'bg-yellow-500 text-white';
      case 'low':
        return 'bg-blue-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const dismissAlert = (alertToRemove: SecurityAlertData) => {
    setAlerts(prev => prev.filter(alert => 
      alert.timestamp !== alertToRemove.timestamp || alert.userId !== alertToRemove.userId
    ));
  };

  const dismissAllAlerts = () => {
    setAlerts([]);
  };

  if (!canViewSecurityAlerts || alerts.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md space-y-2">
      {alerts.length > 1 && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={dismissAllAlerts}
            className="text-xs"
          >
            Clear All ({alerts.length})
          </Button>
        </div>
      )}
      
      {alerts.map((alert, index) => (
        <Card key={`${alert.userId}-${alert.timestamp}-${index}`} className="w-full shadow-lg border-l-4 border-l-red-500 bg-white">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-1 bg-red-100 rounded-full">
                  {getAlertIcon(alert.alertType)}
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold text-red-900">
                    Security Alert
                  </CardTitle>
                  <Badge className={`text-xs ${getSeverityColor(alert.severity)}`}>
                    {alert.severity.toUpperCase()}
                  </Badge>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => dismissAlert(alert)}
                className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0 space-y-3">
            <div>
              <p className="text-sm font-medium text-gray-900">
                {getAlertMessage(alert.alertType)}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                User: <span className="font-medium">{alert.username}</span> ({alert.email})
              </p>
            </div>

            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex items-center space-x-2">
                <Monitor className="h-3 w-3" />
                <span className="truncate">{alert.deviceInfo.userAgent}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <MapPin className="h-3 w-3" />
                <span>IP: {alert.deviceInfo.ip}</span>
                {alert.deviceInfo.location && (
                  <span>| {alert.deviceInfo.location}</span>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <Clock className="h-3 w-3" />
                <span>{format(new Date(alert.timestamp), 'PPpp')}</span>
              </div>
            </div>

            {alert.metadata && (
              <div className="bg-gray-50 p-2 rounded text-xs">
                {alert.metadata.sessionCount && (
                  <p>Active Sessions: <span className="font-medium">{alert.metadata.sessionCount}</span></p>
                )}
                {alert.metadata.failedAttempts && (
                  <p>Failed Attempts: <span className="font-medium text-red-600">{alert.metadata.failedAttempts}</span></p>
                )}
                {alert.metadata.lastSeenLocation && (
                  <p>Last Seen: <span className="font-medium">{alert.metadata.lastSeenLocation}</span></p>
                )}
              </div>
            )}

            <div className="flex space-x-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
                onClick={() => {
                  // Could navigate to user management or security logs
                  console.log('View user details:', alert.userId);
                }}
              >
                <Eye className="h-3 w-3 mr-1" />
                View User
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/**
 * Hook for listening to security alerts
 * Can be used in other components to react to security events
 */
export function useSecurityAlerts() {
  const [alerts, setAlerts] = useState<SecurityAlertData[]>([]);
  const { user } = useAuth();
  
  const canViewSecurityAlerts = user?.role === 'manager' || user?.role === 'superadmin';

  useEffect(() => {
    if (!canViewSecurityAlerts) return;

    const handleSecurityAlert = (event: CustomEvent) => {
      const alertData: SecurityAlertData = event.detail;
      setAlerts(prev => [alertData, ...prev]);
    };

    window.addEventListener('securityAlert', handleSecurityAlert as EventListener);

    return () => {
      window.removeEventListener('securityAlert', handleSecurityAlert as EventListener);
    };
  }, [canViewSecurityAlerts]);

  return { alerts, canViewSecurityAlerts };
}