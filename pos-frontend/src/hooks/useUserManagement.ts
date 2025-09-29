import { useState, useEffect } from 'react';
import { usersAPI } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';

interface UserProfile {
  _id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'manager' | 'cashier';
  status: 'active' | 'inactive' | 'deleted';
  createdAt: string;
}

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  managerUsers: number;
  cashierUsers: number;
  totalCashierUsers: number;
  activeCashierUsers: number;
}

export const useUserManagement = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    managerUsers: 0,
    cashierUsers: 0,
    totalCashierUsers: 0,
    activeCashierUsers: 0
  });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const { toast } = useToast();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params: any = {};
      
      if (searchTerm) params.search = searchTerm;
      if (statusFilter !== 'all') params.status = statusFilter;
      
      const response = await usersAPI.getUsers(params);
      
      if (response.success) {
        setUsers(response.data);
      } else {
        throw new Error(response.message || 'Failed to fetch users');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive"
      });
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      const response = await usersAPI.getUserStats();
      
      if (response.success) {
        setUserStats(response.data);
      }
    } catch (error: any) {
      console.error('Error fetching user stats:', error);
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      if (currentStatus) {
        await usersAPI.deactivateUser(userId);
        toast({
          title: "Success",
          description: "User deactivated successfully",
        });
      } else {
        await usersAPI.reactivateUser(userId);
        toast({
          title: "Success",
          description: "User activated successfully",
        });
      }
      fetchUsers(); // Refresh the list
      fetchUserStats(); // Refresh stats
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive"
      });
      console.error('Error updating user status:', error);
    }
  };

  const addUser = () => {
    // Navigate to user creation form or open modal
    toast({
      title: "Feature Coming Soon",
      description: "User creation form will be implemented in the next phase",
    });
  };

  // Filter users for display (only cashiers now)
  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm || 
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && user.status === 'active') ||
      (statusFilter === 'inactive' && user.status === 'inactive') ||
      (statusFilter === 'deleted' && user.status === 'deleted');
    
    return matchesSearch && matchesStatus;
  });

  return {
    // State
    users,
    userStats,
    loading,
    searchTerm,
    statusFilter,
    filteredUsers,
    
    // Actions
    fetchUsers,
    fetchUserStats,
    toggleUserStatus,
    addUser,
    
    // Setters
    setSearchTerm,
    setStatusFilter
  };
};
