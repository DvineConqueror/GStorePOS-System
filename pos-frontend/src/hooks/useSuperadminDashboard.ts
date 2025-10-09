import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { superadminAPI } from '@/lib/api';
import { useSocket } from '@/context/SocketContext';
import { SystemStats, RecentUser } from '@/types/superadmin';

export const useSuperadminDashboard = () => {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { notifications } = useSocket();

  const fetchSystemStats = async () => {
    try {
      const response = await superadminAPI.getSystemStats();
      if (response.success) {
        setStats(response.data.overview);
      } else {
        throw new Error(response.message || 'Failed to fetch system stats');
      }
    } catch (error) {
      console.error('Error fetching system stats:', error);
      toast({
        title: "Error",
        description: "Failed to load system statistics",
        variant: "destructive",
      });
    }
  };

  const fetchRecentUsers = async () => {
    try {
      const response = await superadminAPI.getAllUsers({ 
        page: 1, 
        limit: 5, 
        sort: 'createdAt', 
        order: 'desc' 
      });
      if (response.success) {
        setRecentUsers(response.data?.users || []);
      } else {
        throw new Error(response.message || 'Failed to fetch recent users');
      }
    } catch (error) {
      console.error('Error fetching recent users:', error);
      toast({
        title: "Error",
        description: "Failed to load recent users",
        variant: "destructive",
      });
    }
  };

  const refreshData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchSystemStats(), fetchRecentUsers()]);
    } finally {
      setLoading(false);
    }
  };

  // Initialize data
  useEffect(() => {
    refreshData();
  }, []);

  // Listen for real-time notifications and refresh data
  useEffect(() => {
    const handleNotification = (event: CustomEvent) => {
      const notification = event.detail;
      if (notification.type === 'new_user_registration' || notification.type === 'user_approval') {
        // Refresh dashboard data when new user registers or is approved
        fetchSystemStats();
        fetchRecentUsers();
        
        // Only show toast for user approval, not new registration (NotificationAlert handles that)
        if (notification.type === 'user_approval') {
          toast({
            title: 'User Status Updated',
            description: notification.message,
            variant: "success",
          });
          // Reload the page to update notification icon and other UI elements
          setTimeout(() => {
            window.location.reload();
          }, 1000); // Small delay to show the toast first
        }
      }
    };

    window.addEventListener('notification' as any, handleNotification);
    
    return () => {
      window.removeEventListener('notification' as any, handleNotification);
    };
  }, [toast]);

  return {
    stats,
    recentUsers,
    loading,
    refreshData,
  };
};
