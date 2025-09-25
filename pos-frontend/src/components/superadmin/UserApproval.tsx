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

interface PendingUser {
  _id: string;
  username: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
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
  const [bulkAction, setBulkAction] = useState<'approve' | 'reject' | ''>('');
  const { toast } = useToast();

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

  const handleRejectUser = async (userId: string) => {
    try {
      const response = await superadminAPI.approveUser(userId, false);

      if (response.success) {
        toast({
          title: "Success",
          description: "User rejected successfully",
        });
        fetchPendingUsers();
        onApprovalChange?.();
      } else {
        throw new Error(response.message || 'Failed to reject user');
      }
    } catch (error) {
      console.error('Error rejecting user:', error);
      toast({
        title: "Error",
        description: "Failed to reject user",
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
      const token = localStorage.getItem('auth_token');
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1'}/superadmin/bulk-approve`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userIds: selectedUsers,
            approved: bulkAction === 'approve',
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Success",
          description: `${data.data.summary.successful} users ${bulkAction === 'approve' ? 'approved' : 'rejected'} successfully`,
        });
        setSelectedUsers([]);
        setBulkAction('');
        fetchPendingUsers();
        onApprovalChange?.();
      } else {
        throw new Error('Failed to process bulk action');
      }
    } catch (error) {
      console.error('Error processing bulk action:', error);
      toast({
        title: "Error",
        description: "Failed to process bulk action",
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
        return 'bg-blue-600 hover:bg-blue-700';
      case 'cashier':
        return 'bg-green-600 hover:bg-green-700';
      default:
        return 'bg-gray-600 hover:bg-gray-700';
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Pending User Approvals</h1>
          <p className="text-slate-400">
            Review and approve new user registrations
          </p>
        </div>
        <Badge variant="destructive" className="bg-yellow-600 hover:bg-yellow-700">
          <Clock className="h-3 w-3 mr-1" />
          {pendingUsers.length} Pending
        </Badge>
      </div>

      {/* Filters and Search */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full md:w-48 bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
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
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-white">
                  {selectedUsers.length} user(s) selected
                </span>
                <Select value={bulkAction} onValueChange={(value: 'approve' | 'reject' | '') => setBulkAction(value)}>
                  <SelectTrigger className="w-32 bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approve">Approve</SelectItem>
                    <SelectItem value="reject">Reject</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleBulkAction}
                  disabled={!bulkAction}
                  className={bulkAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                >
                  {bulkAction === 'approve' ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve All
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject All
                    </>
                  )}
                </Button>
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

      {/* Users List */}
      <div className="space-y-4">
        {pendingUsers.length === 0 ? (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-8 text-center">
              <UserCheck className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No Pending Approvals</h3>
              <p className="text-slate-400">
                All users have been reviewed and approved.
              </p>
            </CardContent>
          </Card>
        ) : (
          pendingUsers.map((user) => (
            <Card key={user._id} className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Checkbox
                      checked={selectedUsers.includes(user._id)}
                      onCheckedChange={(checked) => handleSelectUser(user._id, checked as boolean)}
                    />
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-slate-300" />
                      </div>
                      <div>
                        <div className="text-white font-semibold">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-sm text-slate-400">
                          @{user.username}
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <Mail className="h-3 w-3 text-slate-500" />
                          <span className="text-xs text-slate-500">{user.email}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <Badge className={getRoleBadgeColor(user.role)}>
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </Badge>
                      <div className="flex items-center space-x-1 mt-1">
                        <Calendar className="h-3 w-3 text-slate-500" />
                        <span className="text-xs text-slate-500">
                          {format(new Date(user.createdAt), 'MMM dd, yyyy')}
                        </span>
                      </div>
                      {user.createdBy && (
                        <div className="text-xs text-slate-500 mt-1">
                          Created by: {user.createdBy.firstName} {user.createdBy.lastName}
                        </div>
                      )}
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={() => handleApproveUser(user._id)}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRejectUser(user._id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
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
  );
}
