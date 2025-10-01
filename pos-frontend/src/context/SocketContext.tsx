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
      
      // Join role-based room for targeted notifications
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
