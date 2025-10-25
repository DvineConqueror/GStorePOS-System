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
  const [approvingUsers, setApprovingUsers] = useState<Set<string>>(new Set());
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [bulkAction, setBulkAction] = useState<'approve' | 'delete' | ''>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const { toast } = useToast();
  const { triggerRefresh } = useRefresh();

  useEffect(() => {
    fetchPendingUsers();
  }, [searchTerm, roleFilter, currentPage]);

  const fetchPendingUsers = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        limit: 5,
        sort: 'createdAt',
        order: 'desc'
      };
      
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
        setTotalPages(response.pagination?.pages || 1);
        setTotalUsers(response.pagination?.total || users.length);
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
    // Prevent multiple approval attempts for the same user
    if (approvingUsers.has(userId)) {
      return;
    }

    try {
      setApprovingUsers(prev => new Set(prev).add(userId));
      const response = await superadminAPI.approveUser(userId, true);

      if (response.success) {
        toast({
          title: "Success",
          description: "User approved successfully",
          variant: "success",
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
    } finally {
      setApprovingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
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
          variant: "success",
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
          variant: "success",
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
        return 'bg-green-600 hover:bg-green-700';
      case 'cashier':
        return 'bg-green-600 hover:bg-green-700';
      default:
        return 'bg-gray-600 hover:bg-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-teal-50">
      <div className="space-y-8 p-6">
        {/* Authority Header */}
        <div className="border-b border-gray-200 pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl hidden sm:flex items-center justify-center shadow-lg shadow-green-500/25">
                <UserCheck className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-black tracking-tight">Pending User Approvals</h1>
                <p className="text-gray-600 text-lg mt-1">Review and approve new user registrations</p>
              </div>
            </div>
            <Badge variant="outline" className="text-green-700 border-green-600 text-sm px-4 py-2 bg-white">
              <Clock className="h-4 w-4 mr-2 text-green-600" />
              {pendingUsers.length} Pending
            </Badge>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="bg-white border-green-200">
          <CardHeader>
            <CardTitle className="text-black flex items-center text-lg">
              <Filter className="h-5 w-5 mr-2 text-green-600" />
              Search & Filter Approvals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by name, email, or username..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white border-gray-300 text-black placeholder-gray-400 focus:border-green-500"
                  />
                </div>
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-48 bg-white border-gray-300 text-black">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-300">
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
          <Card className="bg-white border-green-200">
            <CardHeader>
              <CardTitle className="text-black flex items-center text-lg">
                <Shield className="h-5 w-5 mr-2 text-green-600" />
                Bulk Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-black text-lg font-medium">
                    {selectedUsers.length} user(s) selected
                  </span>
                  <div className="flex gap-3">
                    <Select value={bulkAction} onValueChange={(value: 'approve' | 'delete' | '') => setBulkAction(value)}>
                      <SelectTrigger className="w-32 bg-white border-gray-300 text-black">
                        <SelectValue placeholder="Action" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-gray-300">
                        <SelectItem value="approve">Approve</SelectItem>
                        <SelectItem value="delete">Delete</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={handleBulkAction}
                      disabled={!bulkAction}
                      className={`${bulkAction === 'approve' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'} font-semibold`}
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
                  className="text-gray-600 hover:text-black hover:bg-gray-100"
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
            <Card className="bg-white border-green-200">
              <CardContent className="p-12 text-center">
                <UserCheck className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-black mb-2">No Pending Approvals</h3>
                <p className="text-gray-600 text-lg">
                  All users have been reviewed and approved.
                </p>
              </CardContent>
            </Card>
          ) : (
            pendingUsers.map((user, index) => (
              <Card key={user._id} className={`border-green-200 hover:border-green-300 transition-colors  "bg-white"
              }`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 min-w-0 flex-1">
                      <Checkbox
                        checked={selectedUsers.includes(user._id)}
                        onCheckedChange={(checked) => handleSelectUser(user._id, checked as boolean)}
                        className="flex-shrink-0"
                      />
                      <div className="w-12 h-12 bg-green-100 rounded-lg hidden sm:flex items-center justify-center flex-shrink-0">
                        <User className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-black font-semibold text-lg truncate">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-gray-600 text-sm truncate">
                          @{user.username}
                        </div>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Mail className="h-4 w-4 mr-2 text-green-600 hidden sm:block" />
                            <span className="truncate">{user.email}</span>
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-green-600 hidden sm:block" />
                            {format(new Date(user.createdAt), 'MMM dd, yyyy')}
                          </div>
                        </div>
                        {user.createdBy && (
                          <div className="text-xs text-gray-500 mt-2">
                            Created by: {user.createdBy.firstName} {user.createdBy.lastName}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <Badge className={`${getRoleBadgeColor(user.role)} text-xs px-2 py-1 font-semibold text-white`}>
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </Badge>
                      </div>

                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => handleApproveUser(user._id)}
                          disabled={approvingUsers.has(user._id)}
                          className="bg-green-600 hover:bg-green-700 text-white font-semibold disabled:opacity-50"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          {approvingUsers.has(user._id) ? 'Approving...' : 'Approve'}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteUser(user._id)}
                          className="bg-red-600 hover:bg-red-700 font-semibold text-white"
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
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-green-200">
              <div className="text-sm text-gray-600">
                Showing {((currentPage - 1) * 5) + 1} to {Math.min(currentPage * 5, totalUsers)} of {totalUsers} users
              </div>
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="bg-white border-green-300 text-green-700 hover:bg-green-50"
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600 px-3">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="bg-white border-green-300 text-green-700 hover:bg-green-50"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
