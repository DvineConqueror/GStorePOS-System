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
        return 'bg-green-600 hover:bg-green-700';
      case 'cashier':
        return 'bg-green-600 hover:bg-green-700';
      default:
        return 'bg-slate-600 hover:bg-slate-700';
    }
  };

  const getStatusBadge = (user: AllUser) => {
    if (user.status === 'deleted') {
      return <Badge variant="destructive" className="bg-red-600 hover:bg-red-700 text-white">Deleted</Badge>;
    }
    if (user.status === 'inactive') {
      return <Badge variant="destructive" className="bg-red-600 hover:bg-red-700 text-white">Inactive</Badge>;
    }
    if (!user.isApproved) {
      return <Badge variant="secondary" className="bg-yellow-500 hover:bg-yellow-600 text-white">Pending</Badge>;
    }
    return <Badge variant="default" className="bg-green-600 hover:bg-green-700 text-white">Active</Badge>;
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
    <div className="min-h-screen bg-[#ececec]">
      <div className="space-y-8 p-6">
        {/* Authority Header */}
        <div className="border-b border-gray-200 pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/25">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-black tracking-tight">All Users</h1>
                <p className="text-gray-600 text-lg mt-1">Manage all system users and permissions</p>
              </div>
            </div>
            <Badge variant="outline" className="text-green-700 border-green-600 text-sm px-4 py-2 bg-white">
              <Users className="h-4 w-4 mr-2 text-green-600" />
              {totalUsers} Total Users
            </Badge>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="bg-white border-green-200">
          <CardHeader>
            <CardTitle className="text-black flex items-center text-lg">
              <Filter className="h-5 w-5 mr-2 text-green-600" />
              Search & Filter Users
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
              <div className="flex gap-3">
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-40 bg-white border-gray-300 text-black">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-300">
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="manager">Managers</SelectItem>
                    <SelectItem value="cashier">Cashiers</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40 bg-white border-gray-300 text-black">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-300">
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

        {/* Users List */}
        <Card className="bg-white border-green-200">
          <CardHeader>
            <CardTitle className="text-black flex items-center text-xl">
              <Users className="h-5 w-5 mr-3 text-green-600" />
              Users ({filteredUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">No users found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredUsers.map((user, index) => (
                  <div
                    key={user._id}
                    className={`flex items-center justify-between p-4 rounded-lg border border-green-200 hover:bg-green-50 transition-colors "bg-white"
                    }`}
                  >
                    <div className="flex items-center space-x-4 min-w-0 flex-1">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                          <User className="h-6 w-6 text-green-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <p className="text-black font-medium text-lg truncate">
                            {user.firstName} {user.lastName}
                          </p>
                          <div className="flex gap-2">
                            <Badge className={`${getRoleBadgeColor(user.role)} text-xs px-2 py-1 font-semibold text-white`}>
                              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                            </Badge>
                            {getStatusBadge(user)}
                          </div>
                        </div>
                        <div className="flex items-center space-x-6 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Mail className="h-4 w-4 mr-2 text-green-600" />
                            <span className="truncate">{user.email}</span>
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-green-600" />
                            {format(new Date(user.createdAt), 'MMM dd, yyyy')}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-600 hover:text-green-600 hover:bg-green-100"
                      >
                        <MoreHorizontal className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-green-200">
                <div className="text-sm text-gray-600">
                  Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, totalUsers)} of {totalUsers} users
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
