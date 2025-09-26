import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  UserCheck, 
  UserX, 
  Search, 
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Mail,
  Calendar,
  Shield
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { superadminAPI } from '@/lib/api';
import { useRefresh } from '@/context/RefreshContext';

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

interface UserApprovalProps {
  onApprovalChange?: () => void;
}

export default function UserApproval({ onApprovalChange }: UserApprovalProps) {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [bulkAction, setBulkAction] = useState<'approve' | 'delete' | ''>('');
  const { toast } = useToast();
  const { triggerRefresh } = useRefresh();

  useEffect(() => {
    fetchPendingUsers();
  }, [searchTerm, roleFilter]);

  const fetchPendingUsers = async () => {
    try {
      setLoading(true);
      const params: any = {};
      
      if (roleFilter !== 'all') {
        params.role = roleFilter;
      }
      
      const response = await superadminAPI.getPendingApprovals(params);

      if (response.success) {
        let users = response.data;
        
        // Client-side search filter
        if (searchTerm) {
          users = users.filter((user: PendingUser) =>
            user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.lastName.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }
        
        setPendingUsers(users);
      } else {
        throw new Error('Failed to fetch pending users');
      }
    } catch (error) {
      console.error('Error fetching pending users:', error);
      toast({
        title: "Error",
        description: "Failed to load pending users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveUser = async (userId: string) => {
    try {
      const response = await superadminAPI.approveUser(userId, true);

      if (response.success) {
        toast({
          title: "Success",
          description: "User approved successfully",
        });
        fetchPendingUsers();
        triggerRefresh(); // Refresh quick stats
        onApprovalChange?.();
      } else {
        throw new Error(response.message || 'Failed to approve user');
      }
    } catch (error) {
      console.error('Error approving user:', error);
      toast({
        title: "Error",
        description: "Failed to approve user",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const response = await superadminAPI.deleteUser(userId);

      if (response.success) {
        toast({
          title: "Success",
          description: "User deleted successfully",
        });
        fetchPendingUsers();
        triggerRefresh(); // Refresh quick stats
        onApprovalChange?.();
      } else {
        throw new Error(response.message || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  const handleBulkAction = async () => {
    if (selectedUsers.length === 0 || !bulkAction) {
      toast({
        title: "Warning",
        description: "Please select users and an action",
        variant: "destructive",
      });
      return;
    }

    try {
      let response;
      
      if (bulkAction === 'approve') {
        response = await superadminAPI.bulkApproveUsers(selectedUsers, true);
      } else if (bulkAction === 'delete') {
        response = await superadminAPI.bulkDeleteUsers(selectedUsers);
      }

      if (response && response.success) {
        const action = bulkAction === 'approve' ? 'approved' : 'deleted';
        toast({
          title: "Success",
          description: `${response.data.summary.successful} users ${action} successfully`,
        });
        setSelectedUsers([]);
        setBulkAction('');
        fetchPendingUsers();
        triggerRefresh(); // Refresh quick stats
        onApprovalChange?.();
      } else {
        throw new Error(response?.message || 'Failed to process bulk action');
      }
    } catch (error) {
      console.error('Error processing bulk action:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process bulk action",
        variant: "destructive",
      });
    }
  };

  const handleSelectUser = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers([...selectedUsers, userId]);
    } else {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(pendingUsers.map(user => user._id));
    } else {
      setSelectedUsers([]);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'manager':
        return 'bg-red-600 hover:bg-red-700';
      case 'cashier':
        return 'bg-green-600 hover:bg-green-700';
      default:
        return 'bg-slate-600 hover:bg-slate-700';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="space-y-8 p-6">
        {/* Authority Header */}
        <div className="border-b border-slate-800 pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-600 to-amber-700 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/25">
                <UserCheck className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white tracking-tight">Pending User Approvals</h1>
                <p className="text-slate-400 text-lg mt-1">Review and approve new user registrations</p>
              </div>
            </div>
            <Badge variant="outline" className="text-amber-300 border-amber-600 text-sm px-4 py-2">
              <Clock className="h-4 w-4 mr-2" />
              {pendingUsers.length} Pending
            </Badge>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center text-lg">
              <Filter className="h-5 w-5 mr-2" />
              Search & Filter Approvals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search by name, email, or username..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder-slate-400 focus:border-slate-600"
                  />
                </div>
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-48 bg-slate-800/50 border-slate-700 text-white">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="cashier">Cashier</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Bulk Actions */}
        {selectedUsers.length > 0 && (
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center text-lg">
                <Shield className="h-5 w-5 mr-2" />
                Bulk Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-white text-lg font-medium">
                    {selectedUsers.length} user(s) selected
                  </span>
                  <div className="flex gap-3">
                    <Select value={bulkAction} onValueChange={(value: 'approve' | 'delete' | '') => setBulkAction(value)}>
                      <SelectTrigger className="w-32 bg-slate-800/50 border-slate-700 text-white">
                        <SelectValue placeholder="Action" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="approve">Approve</SelectItem>
                        <SelectItem value="delete">Delete</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={handleBulkAction}
                      disabled={!bulkAction}
                      className={`${bulkAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} font-semibold`}
                    >
                      {bulkAction === 'approve' ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve All
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 mr-2" />
                          Delete All
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => setSelectedUsers([])}
                  className="text-slate-400 hover:text-white"
                >
                  Clear Selection
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pending Users List */}
        <div className="space-y-4">
          {pendingUsers.length === 0 ? (
            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="p-12 text-center">
                <UserCheck className="h-16 w-16 text-slate-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Pending Approvals</h3>
                <p className="text-slate-400 text-lg">
                  All users have been reviewed and approved.
                </p>
              </CardContent>
            </Card>
          ) : (
            pendingUsers.map((user) => (
              <Card key={user._id} className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 min-w-0 flex-1">
                      <Checkbox
                        checked={selectedUsers.includes(user._id)}
                        onCheckedChange={(checked) => handleSelectUser(user._id, checked as boolean)}
                        className="flex-shrink-0"
                      />
                      <div className="w-12 h-12 bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
                        <User className="h-6 w-6 text-slate-300" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-white font-semibold text-lg truncate">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-slate-400 text-sm truncate">
                          @{user.username}
                        </div>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-slate-400">
                          <div className="flex items-center">
                            <Mail className="h-4 w-4 mr-2" />
                            <span className="truncate">{user.email}</span>
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2" />
                            {format(new Date(user.createdAt), 'MMM dd, yyyy')}
                          </div>
                        </div>
                        {user.createdBy && (
                          <div className="text-xs text-slate-500 mt-2">
                            Created by: {user.createdBy.firstName} {user.createdBy.lastName}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <Badge className={`${getRoleBadgeColor(user.role)} text-xs px-2 py-1 font-semibold`}>
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </Badge>
                      </div>

                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => handleApproveUser(user._id)}
                          className="bg-green-600 hover:bg-green-700 text-white font-semibold"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteUser(user._id)}
                          className="bg-red-600 hover:bg-red-700 font-semibold"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
