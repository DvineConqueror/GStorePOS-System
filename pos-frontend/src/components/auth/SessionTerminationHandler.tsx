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
  const [countdown, setCountdown] = React.useState(10);
  const { signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleSessionTermination = (event: CustomEvent) => {
      console.log('SessionTerminationHandler: Received session termination event', event.detail);
      setTerminationData(event.detail);
      setIsDialogOpen(true);
      setCountdown(3);
      
      // Start countdown
      const countdownInterval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            handleForcedLogout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
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
      
      // Clear cookies directly to avoid AuthContext showing generic logout toast
      const cookies = document.cookie.split(";");
      for (let cookie of cookies) {
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
      }
      
      // Set user to null to trigger logout state
      // We'll do this manually to avoid the generic logout toast
      window.dispatchEvent(new CustomEvent('manualLogout'));
      
      // Navigate to login page
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Error during forced logout:', error);
      // Force navigation even if logout fails
      window.location.href = '/login';
    }
  };

  const handleRefreshSession = () => {
    // Try to refresh the page to reconnect
    window.location.reload();
  };

  const getTerminationMessage = () => {
    if (!terminationData) return 'You have been logged out due to a new login on your account.';
    
    if (terminationData.type === 'concurrent_login') {
      return 'You have been logged out. There\'s a new login on your account from another device.';
    }
    
    if (terminationData.reason === 'security_breach') {
      return 'You have been logged out for security reasons.';
    }
    
    return terminationData.message || 'You have been logged out. There\'s a new login on your account.';
  };

  const getTerminationIcon = () => {
    if (terminationData?.type === 'concurrent_login') {
      return <LogOut className="h-5 w-5 text-orange-500" />;
    }
    return <AlertTriangle className="h-5 w-5 text-red-500" />;
  };

  const getTerminationTitle = () => {
    if (terminationData?.type === 'concurrent_login') {
      return 'You have been logged out';
    }
    
    if (terminationData?.reason === 'security_breach') {
      return 'Security Alert - Logged Out';
    }
    
    return 'You have been logged out';
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent className="max-w-md p-0">
        <DialogHeader className="px-4 pt-4 pb-2 border-b flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-lg text-black font-semibold">
            {getTerminationIcon()}
            {getTerminationTitle()}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col flex-1">
          <div className="flex-1">
            <div className="px-4 py-4 space-y-3">
              {/* Main Message */}
              <p className="text-sm text-gray-600 leading-relaxed">
                {getTerminationMessage()}
              </p>
              
              {/* Countdown Timer */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-center">
                <p className="text-sm text-orange-800 font-medium">
                  Redirecting to login page in {countdown} second{countdown !== 1 ? 's' : ''}...
                </p>
              </div>
              
              {/* Additional Info */}
              {terminationData?.timestamp && (
                <div className="text-xs text-gray-500">
                  <p>Time: {new Date(terminationData.timestamp).toLocaleString()}</p>
                </div>
              )}
              
              {terminationData?.metadata?.newDeviceInfo && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs font-medium text-gray-700 mb-2">
                    New Login Details:
                  </p>
                  <div className="text-xs text-gray-600 space-y-1">
                    <p>IP: {terminationData.metadata.newDeviceInfo.ip}</p>
                    <p>Device: {terminationData.metadata.newDeviceInfo.userAgent}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Footer */}
          <div className="px-4 py-3 border-t bg-gray-50 rounded-b-lg">
            <Button 
              onClick={handleForcedLogout}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Go to Login Now
            </Button>
          </div>
        </div>
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
