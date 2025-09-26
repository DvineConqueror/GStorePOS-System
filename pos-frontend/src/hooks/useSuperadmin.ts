import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { superadminAPI } from '@/lib/api';

interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  approvedUsers: number;
  pendingApprovals: number;
  superadminCount: number;
  managerCount: number;
  cashierCount: number;
}

interface User {
  _id: string;
  username: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  status: 'active' | 'inactive' | 'deleted';
  isApproved: boolean;
  createdAt: string;
  createdBy?: {
    _id: string;
    username: string;
    firstName: string;
    lastName: string;
  };
  approvedBy?: {
    _id: string;
    username: string;
    firstName: string;
    lastName: string;
  };
}

interface UseSuperadminReturn {
  // System Stats
  systemStats: SystemStats | null;
  loadingStats: boolean;
  
  // Users Management
  allUsers: User[];
  loadingUsers: boolean;
  usersPagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  
  // Manager Creation
  creatingManager: boolean;
  
  // Actions
  fetchSystemStats: () => Promise<void>;
  fetchAllUsers: (params?: any) => Promise<void>;
  createManager: (managerData: any) => Promise<boolean>;
  approveUser: (userId: string, approved: boolean, reason?: string) => Promise<boolean>;
  bulkApproveUsers: (userIds: string[], approved: boolean, reason?: string) => Promise<boolean>;
}

export const useSuperadmin = (): UseSuperadminReturn => {
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [creatingManager, setCreatingManager] = useState(false);
  const [usersPagination, setUsersPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  
  const { toast } = useToast();

  const fetchSystemStats = async () => {
    try {
      setLoadingStats(true);
      const response = await superadminAPI.getSystemStats();
      
      if (response.success) {
        setSystemStats(response.data.overview);
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
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchAllUsers = async (params: any = {}) => {
    try {
      setLoadingUsers(true);
      const response = await superadminAPI.getAllUsers({
        page: usersPagination.page,
        limit: usersPagination.limit,
        ...params,
      });
      
      if (response.success) {
        setAllUsers(response.data);
        setUsersPagination(response.pagination);
      } else {
        throw new Error(response.message || 'Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  const createManager = async (managerData: {
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => {
    try {
      setCreatingManager(true);
      const response = await superadminAPI.createManager(managerData);
      
      if (response.success) {
        toast({
          title: "Success",
          description: `Manager account created successfully for ${response.data.user.firstName} ${response.data.user.lastName}`,
        });
        
        // Refresh system stats and users list
        await fetchSystemStats();
        await fetchAllUsers();
        
        return true;
      } else {
        throw new Error(response.message || 'Failed to create manager');
      }
    } catch (error) {
      console.error('Error creating manager:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to create manager account',
        variant: "destructive",
      });
      return false;
    } finally {
      setCreatingManager(false);
    }
  };

  const approveUser = async (userId: string, approved: boolean, reason?: string) => {
    try {
      const response = await superadminAPI.approveUser(userId, approved, reason);
      
      if (response.success) {
        const action = approved ? 'approved' : 'rejected';
        toast({
          title: "Success",
          description: `User ${action} successfully`,
        });
        
        // Refresh data
        await fetchSystemStats();
        await fetchAllUsers();
        
        return true;
      } else {
        throw new Error(response.message || 'Failed to process approval');
      }
    } catch (error) {
      console.error('Error processing approval:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to process approval',
        variant: "destructive",
      });
      return false;
    }
  };

  const bulkApproveUsers = async (userIds: string[], approved: boolean, reason?: string) => {
    try {
      const response = await superadminAPI.bulkApproveUsers(userIds, approved, reason);
      
      if (response.success) {
        const action = approved ? 'approved' : 'rejected';
        toast({
          title: "Success",
          description: `${response.data.summary.successful} users ${action} successfully`,
        });
        
        // Refresh data
        await fetchSystemStats();
        await fetchAllUsers();
        
        return true;
      } else {
        throw new Error(response.message || 'Failed to process bulk action');
      }
    } catch (error) {
      console.error('Error processing bulk action:', error);
      toast({
        title: "Error",
        description: "Failed to process bulk action",
        variant: "destructive",
      });
      return false;
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchSystemStats();
    fetchAllUsers();
  }, []);

  return {
    // System Stats
    systemStats,
    loadingStats,
    
    // Users Management
    allUsers,
    loadingUsers,
    usersPagination,
    
    // Manager Creation
    creatingManager,
    
    // Actions
    fetchSystemStats,
    fetchAllUsers,
    createManager,
    approveUser,
    bulkApproveUsers,
  };
};
