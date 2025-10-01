import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { superadminAPI, usersAPI } from '@/lib/api';

interface PendingUser {
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
}

interface UseApprovalProps {
  userRole: 'superadmin' | 'manager';
}

export const useApproval = ({ userRole }: UseApprovalProps) => {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [approvingUsers, setApprovingUsers] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState({
    totalPending: 0,
    pendingManagers: 0,
    pendingCashiers: 0,
  });
  const { toast } = useToast();

  const fetchPendingUsers = async (filters: {
    role?: string;
    page?: number;
    limit?: number;
  } = {}) => {
    try {
      setLoading(true);
      let response;
      
      if (userRole === 'superadmin') {
        response = await superadminAPI.getPendingApprovals(filters);
      } else {
        // Managers can only see pending cashiers
        response = await usersAPI.getUsers({
          ...filters,
          role: 'cashier',
        });
      }
      
      if (response.success) {
        setPendingUsers(response.data);
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to fetch pending users');
      }
    } catch (error) {
      console.error('Error fetching pending users:', error);
      toast({
        title: "Error",
        description: "Failed to load pending users",
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  const approveUser = async (userId: string, reason?: string) => {
    // Prevent multiple approval attempts for the same user
    if (approvingUsers.has(userId)) {
      return false;
    }

    try {
      setApprovingUsers(prev => new Set(prev).add(userId));
      
      let response;
      
      if (userRole === 'superadmin') {
        response = await superadminAPI.approveUser(userId, true, reason);
      } else {
        // Managers can only approve cashiers - use superadmin API for approval
        response = await superadminAPI.approveUser(userId, true, reason);
      }
      
      if (response.success) {
        toast({
          title: "Success",
          description: "User approved successfully",
        });
        
        // Refresh the pending users list
        await fetchPendingUsers();
        return true;
      } else {
        throw new Error(response.message || 'Failed to approve user');
      }
    } catch (error) {
      console.error('Error approving user:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to approve user',
        variant: "destructive",
      });
      return false;
    } finally {
      setApprovingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const rejectUser = async (userId: string, reason?: string) => {
    // Prevent multiple rejection attempts for the same user
    if (approvingUsers.has(userId)) {
      return false;
    }

    try {
      setApprovingUsers(prev => new Set(prev).add(userId));
      
      let response;
      
      if (userRole === 'superadmin') {
        response = await superadminAPI.approveUser(userId, false, reason);
      } else {
        // Managers can only reject cashiers - use superadmin API for rejection
        response = await superadminAPI.approveUser(userId, false, reason);
      }
      
      if (response.success) {
        toast({
          title: "Success",
          description: "User rejected successfully",
        });
        
        // Refresh the pending users list
        await fetchPendingUsers();
        return true;
      } else {
        throw new Error(response.message || 'Failed to reject user');
      }
    } catch (error) {
      console.error('Error rejecting user:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to reject user',
        variant: "destructive",
      });
      return false;
    } finally {
      setApprovingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const bulkApproveUsers = async (userIds: string[], approved: boolean, reason?: string) => {
    try {
      if (userRole === 'superadmin') {
        const response = await superadminAPI.bulkApproveUsers(userIds, approved, reason);
        
        if (response.success) {
          const action = approved ? 'approved' : 'rejected';
          toast({
            title: "Success",
            description: `${response.data.summary.successful} users ${action} successfully`,
          });
          
          // Refresh the pending users list
          await fetchPendingUsers();
          return true;
        } else {
          throw new Error(response.message || 'Failed to process bulk action');
        }
      } else {
        // For managers, process each user individually
        let successCount = 0;
        for (const userId of userIds) {
          const success = approved 
            ? await approveUser(userId, reason)
            : await rejectUser(userId, reason);
          if (success) successCount++;
        }
        
        const action = approved ? 'approved' : 'rejected';
        toast({
          title: "Success",
          description: `${successCount} users ${action} successfully`,
        });
        
        return successCount > 0;
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

  const fetchApprovalStats = async () => {
    try {
      let response;
      
      if (userRole === 'superadmin') {
        response = await superadminAPI.getSystemStats();
        if (response.success) {
          const stats = response.data.overview;
          setStats({
            totalPending: stats.pendingApprovals,
            pendingManagers: 0, // Will be calculated from role breakdown
            pendingCashiers: stats.pendingApprovals, // Simplified for now
          });
        }
      } else {
        // For managers, get cashier-specific stats
        response = await usersAPI.getUserStats();
        if (response.success) {
          setStats({
            totalPending: response.data.totalCashierUsers - response.data.activeCashierUsers,
            pendingManagers: 0,
            pendingCashiers: response.data.totalCashierUsers - response.data.activeCashierUsers,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching approval stats:', error);
    }
  };

  useEffect(() => {
    fetchApprovalStats();
  }, [userRole]);

  return {
    pendingUsers,
    loading,
    approvingUsers,
    stats,
    fetchPendingUsers,
    approveUser,
    rejectUser,
    bulkApproveUsers,
    fetchApprovalStats,
  };
};
