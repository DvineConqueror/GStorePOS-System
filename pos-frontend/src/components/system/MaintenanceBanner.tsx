import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Wrench, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSocket } from '@/context/SocketContext';
import { systemSettingsAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export function MaintenanceBanner() {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [dismissed, setDismissed] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    // Don't show banner for superadmin
    if (user?.role === 'superadmin') {
      return;
    }

    // Fetch maintenance status on mount
    fetchMaintenanceStatus();

    // Listen for maintenance mode updates via WebSocket
    const handleMaintenanceUpdate = (event: CustomEvent) => {
      const data = event.detail.data;
      setMaintenanceMode(data.maintenanceMode);
      setMaintenanceMessage(data.maintenanceMessage || 'System is currently under maintenance. Some features may be unavailable.');
      setDismissed(false); // Reset dismissed state on update
    };

    window.addEventListener('system:maintenance' as any, handleMaintenanceUpdate);

    return () => {
      window.removeEventListener('system:maintenance' as any, handleMaintenanceUpdate);
    };
  }, [user]);

  const fetchMaintenanceStatus = async () => {
    try {
      const response = await systemSettingsAPI.getMaintenanceStatus();
      if (response.data.success && response.data.data) {
        setMaintenanceMode(response.data.data.maintenanceMode);
        setMaintenanceMessage(response.data.data.maintenanceMessage || 'System is currently under maintenance. Some features may be unavailable.');
      }
    } catch (error) {
      console.error('Failed to fetch maintenance status:', error);
    }
  };

  if (!maintenanceMode || dismissed || user?.role === 'superadmin') {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 p-4">
      <Alert className="bg-yellow-50 border-yellow-300 shadow-lg">
        <div className="flex items-start gap-3">
          <Wrench className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <AlertTitle className="text-yellow-900 font-semibold">
              {user?.role === 'manager' ? 'Maintenance Mode Active' : 'System Under Maintenance'}
            </AlertTitle>
            <AlertDescription className="text-yellow-800 mt-1">
              {maintenanceMessage}
            </AlertDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDismissed(true)}
            className="text-yellow-700 hover:text-yellow-900 hover:bg-yellow-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </Alert>
    </div>
  );
}

