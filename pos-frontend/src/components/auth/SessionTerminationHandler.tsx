import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { AlertTriangle, LogOut, RefreshCw } from 'lucide-react';

interface SessionTerminationHandlerProps {
  className?: string;
}

/**
 * Session Terminination Handler Component
 * Handles forced logout scenarios due to concurrent logins or security breaches
 */
export function SessionTerminationHandler({ className }: SessionTerminationHandlerProps) {
  const [terminationData, setTerminationData] = React.useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const { signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleSessionTermination = (event: CustomEvent) => {
      console.log('Session termination detected:', event.detail);
      setTerminationData(event.detail);
      setIsDialogOpen(true);
    };

    // Listen for session termination events
    window.addEventListener('sessionTerminated', handleSessionTermination as EventListener);

    return () => {
      window.removeEventListener('sessionTerminated', handleSessionTermination as EventListener);
    };
  }, []);

  const handleForcedLogout = async () => {
    setIsDialogOpen(false);
    
    try {
      // Clear local storage/session storage
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      sessionStorage.clear();
      
      // Sign out through auth context
      await signOut();
      
      // Navigate to login page
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Error during forced logout:', error);
      // Force navigation even if signOut fails
      window.location.href = '/login';
    }
  };

  const handleRefreshSession = () => {
    // Try to refresh the page to reconnect
    window.location.reload();
  };

  const getTerminationMessage = () => {
    if (!terminationData) return 'Your session has been terminated.';
    
    if (terminationData.type === 'concurrent_login') {
      return 'Your session has been terminated due to a new login from another device.';
    }
    
    if (terminationData.reason === 'security_breach') {
      return 'Your session has been terminated for security reasons.';
    }
    
    return terminationData.message || 'Your session has been terminated.';
  };

  const getTerminationIcon = () => {
    if (terminationData?.type === 'concurrent_login') {
      return <LogOut className="h-6 w-6 text-orange-500" />;
    }
    return <AlertTriangle className="h-6 w-6 text-red-500" />;
  };

  const getTerminationTitle = () => {
    if (terminationData?.type === 'concurrent_login') {
      return 'Session Terminated - Concurrent Login';
    }
    
    if (terminationData?.reason === 'security_breach') {
      return 'Session Terminated - Security Alert';
    }
    
    return 'Session Terminated';
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getTerminationIcon()}
            {getTerminationTitle()}
          </DialogTitle>
          <DialogDescription className="text-left">
            <div className="space-y-2">
              <p>{getTerminationMessage()}</p>
              
              {terminationData?.timestamp && (
                <p className="text-sm text-muted-foreground">
                  Time: {new Date(terminationData.timestamp).toLocaleString()}
                </p>
              )}
              
              {terminationData?.metadata?.newDeviceInfo && (
                <div className="mt-3 p-3 bg-gray-50 rounded-md">
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    New Login Details:
                  </p>
                  <div className="text-xs text-gray-600 space-y-1">
                    <p>IP: {terminationData.metadata.newDeviceInfo.ip}</p>
                    <p>Device: {terminationData.metadata.newDeviceInfo.userAgent}</p>
                  </div>
                </div>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="flex flex-col gap-2 sm:flex-row">
          <Button 
            variant="outline" 
            onClick={handleRefreshSession}
            className="w-full sm:w-auto"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Session
          </Button>
          <Button 
            onClick={handleForcedLogout}
            className="w-full sm:w-auto"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Log In Again
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Hook for handling session termination
 * Can be used in any component to listen for session termination events
 */
export function useSessionTermination() {
  const [terminationData, setTerminationData] = React.useState<any>(null);

  useEffect(() => {
    const handleSessionTermination = (event: CustomEvent) => {
      setTerminationData(event.detail);
    };

    window.addEventListener('sessionTerminated', handleSessionTermination as EventListener);

    return () => {
      window.removeEventListener('sessionTerminated', handleSessionTermination as EventListener);
    };
  }, []);

  return { terminationData };
}
