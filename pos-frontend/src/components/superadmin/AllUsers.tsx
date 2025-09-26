import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, 
  Search, 
  Filter,
  UserCheck,
  UserX,
  Shield,
  User,
  Mail,
  Calendar,
  MoreHorizontal
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { superadminAPI } from '@/lib/api';

interface AllUser {
  _id: string;
  username: string;
  email: string;
  role: 'manager' | 'cashier';
  firstName: string;
  lastName: string;
  status: 'active' | 'inactive' | 'deleted';
  isApproved: boolean;
  approvedBy?: {
    username: string;
    firstName: string;
    lastName: string;
  };
  approvedAt?: string;
  createdBy?: {
    username: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  lastLogin?: string;
}

interface AllUsersProps {
  onUserChange?: () => void;
}

export default function AllUsers({ onUserChange }: AllUsersProps) {
  const [users, setUsers] = useState<AllUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    fetchAllUsers();
  }, [searchTerm, roleFilter, statusFilter, currentPage]);

  const fetchAllUsers = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        limit: 10,
        sort: 'createdAt',
        order: 'desc'
      };
      
      if (roleFilter !== 'all') {
        params.role = roleFilter;
      }
      
      if (statusFilter !== 'all') {
        if (statusFilter === 'active') {
          params.status = 'active';
        } else if (statusFilter === 'inactive') {
          params.status = 'inactive';
        } else if (statusFilter === 'deleted') {
          params.status = 'deleted';
        }
      }
      
      if (searchTerm) {
        params.search = searchTerm;
      }
      
      const response = await superadminAPI.getAllUsers(params);

      if (response.success) {
        setUsers(response.data);
        setTotalPages(response.pagination?.pages || 1);
        setTotalUsers(response.pagination?.total || 0);
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
      setLoading(false);
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

  const getStatusBadge = (user: AllUser) => {
    if (user.status === 'deleted') {
      return <Badge variant="destructive" className="bg-red-800 hover:bg-red-900">Deleted</Badge>;
    }
    if (user.status === 'inactive') {
      return <Badge variant="destructive">Inactive</Badge>;
    }
    if (!user.isApproved) {
      return <Badge variant="secondary" className="bg-yellow-600 hover:bg-yellow-700">Pending</Badge>;
    }
    return <Badge variant="default" className="bg-green-600 hover:bg-green-700">Active</Badge>;
  };

  const filteredUsers = users.filter(user => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        user.username.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        user.firstName.toLowerCase().includes(searchLower) ||
        user.lastName.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Header - Responsive */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">All Users</h2>
          <p className="text-slate-400 text-sm sm:text-base">Manage all system users (excluding superadmin)</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-slate-300 border-slate-600 text-xs sm:text-sm">
            <Users className="h-3 w-3 mr-1" />
            {totalUsers} Total Users
          </Badge>
        </div>
      </div>

      {/* Filters - Responsive */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder-slate-400"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full sm:w-32 bg-slate-700/50 border-slate-600 text-white">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="manager">Managers</SelectItem>
                  <SelectItem value="cashier">Cashiers</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-32 bg-slate-700/50 border-slate-600 text-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="deleted">Deleted</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table - Responsive */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-white flex items-center text-base sm:text-lg">
            <Users className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            Users ({filteredUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No users found</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {filteredUsers.map((user) => (
                <div
                  key={user._id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-slate-700/30 rounded-lg border border-slate-600/50 hover:bg-slate-700/50 transition-colors gap-3 sm:gap-0"
                >
                  <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-600 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 sm:h-5 sm:w-5 text-slate-300" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 mb-1">
                        <p className="text-sm font-medium text-white truncate">
                          {user.firstName} {user.lastName}
                        </p>
                        <div className="flex flex-wrap gap-1 sm:gap-2">
                          <Badge className={`${getRoleBadgeColor(user.role)} text-xs`}>
                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                          </Badge>
                          {getStatusBadge(user)}
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 text-xs text-slate-400">
                        <div className="flex items-center">
                          <Mail className="h-3 w-3 mr-1" />
                          <span className="truncate">{user.email}</span>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {format(new Date(user.createdAt), 'MMM dd, yyyy')}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-end sm:justify-start space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-slate-400 hover:text-white hover:bg-slate-600"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination - Responsive */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4">
              <div className="text-xs sm:text-sm text-slate-400 text-center sm:text-left">
                Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, totalUsers)} of {totalUsers} users
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="bg-slate-700/50 border-slate-600 text-white hover:bg-slate-600 text-xs sm:text-sm"
                >
                  Previous
                </Button>
                <span className="text-xs sm:text-sm text-slate-400">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="bg-slate-700/50 border-slate-600 text-white hover:bg-slate-600 text-xs sm:text-sm"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
