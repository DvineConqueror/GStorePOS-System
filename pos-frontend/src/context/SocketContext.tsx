import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  notifications: any[];
  clearNotifications: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

interface SocketProviderProps {
  children: ReactNode;
}

export function SocketProvider({ children }: SocketProviderProps) {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (!user || (user.role !== 'superadmin' && user.role !== 'manager')) {
      return;
    }

    // Initialize socket connection
    const newSocket = io(import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:5000', {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log(`🔌 FRONTEND: Connected to WebSocket as ${user.role} (${user.username})`);
      
      // Join role-based room for targeted notifications
      console.log(`👥 FRONTEND: Joining role room: role-${user.role}`);
      newSocket.emit('join-role-room', user.role);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
    });

    // Listen for notifications
    newSocket.on('notification', (notification) => {
      setNotifications(prev => [notification, ...prev.slice(0, 9)]); // Keep last 10 notifications
      
      // Dispatch custom event for components to listen to
      window.dispatchEvent(new CustomEvent('notification', { detail: notification }));
    });

    // Listen for pending approvals updates
    newSocket.on('pending_approvals_update', (data) => {
      // This will trigger a re-fetch in NotificationButton
      window.dispatchEvent(new CustomEvent('pendingApprovalsUpdate', { detail: data }));
    });

    // Listen for analytics updates
    newSocket.on('analytics:update', (analyticsData) => {
      // Dispatch custom event for components to listen to
      window.dispatchEvent(new CustomEvent('analyticsUpdate', { detail: analyticsData }));
    });

    // Listen for manager analytics updates
    newSocket.on('manager:analytics:update', (analyticsData) => {
      // Dispatch custom event for components to listen to
      window.dispatchEvent(new CustomEvent('manager:analytics:update', { detail: analyticsData }));
    });

    // Listen for cashier analytics updates
    newSocket.on('cashier:analytics:update', (analyticsData) => {
      // Dispatch custom event for components to listen to
      window.dispatchEvent(new CustomEvent('cashier:analytics:update', { detail: analyticsData }));
    });

    // Listen for maintenance mode updates
    newSocket.on('system:maintenance', (data) => {
      console.log('Received maintenance mode update:', data);
      // Dispatch custom event for maintenance mode update
      window.dispatchEvent(new CustomEvent('system:maintenance', { detail: data }));
    });

    // Listen for session termination (forced logout due to concurrent login)
    newSocket.on('session_terminated', (data) => {
      console.warn('Session terminated:', data);
      
      // Show user notification about session termination
      window.dispatchEvent(new CustomEvent('sessionTerminated', { detail: data }));
      
      // Dispatch to parent browser window for potential logout handling
      if (window.parent !== window) {
        window.parent.postMessage({ type: 'sessionTerminated', data }, '*');
      }
    });

    // Listen for security alerts (for managers/superadmins)
    newSocket.on('security_alert', (alertData) => {
      console.warn('Security alert received:', alertData);
      
      // Dispatch custom event for security alert handling
      window.dispatchEvent(new CustomEvent('securityAlert', { detail: alertData }));
      
      // Show browser notification if permission granted
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`🚨 Security Alert - ${alertData.alertType}`, {
          body: `User: ${alertData.username} from ${alertData.ipAddress}`,
          icon: '/favicon.ico',
          tag: `security-alert-${alertData.userId}`,
          requireInteraction: true
        });
      }
    });

    // Listen for login activity notifications (for superadmins)
    newSocket.on('login_activity', (activityData) => {
      console.log('Login activity received:', activityData);
      
      // Dispatch custom event for login activity tracking
      window.dispatchEvent(new CustomEvent('loginActivity', { detail: activityData }));
    });

    // Listen for system alerts (security alerts, etc.)
    newSocket.on('system_alert', (alertData) => {
      console.log('🚨 FRONTEND: System alert received:', alertData);
      console.log('🔔 Adding to notifications state...');
      
      // Add to notifications for the notification system
      setNotifications(prev => {
        const updated = [alertData, ...prev.slice(0, 9)];
        console.log('📝 Updated notifications:', updated);
        return updated;
      });
      
      // Dispatch custom event for other components
      window.dispatchEvent(new CustomEvent('systemAlert', { detail: alertData }));
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
      setSocket(null);
      setIsConnected(false);
    };
  }, [user]);

  const clearNotifications = () => {
    setNotifications([]);
  };

  const value: SocketContextType = {
    socket,
    isConnected,
    notifications,
    clearNotifications
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
