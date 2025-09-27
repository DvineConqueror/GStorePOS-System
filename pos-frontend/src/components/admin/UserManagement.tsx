import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, UserCheck, UserX, Search, Plus } from 'lucide-react';

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

interface UserManagementProps {
  users: UserProfile[];
  userStats: UserStats;
  loading: boolean;
  searchTerm: string;
  statusFilter: string;
  filteredUsers: UserProfile[];
  currentUserId: string;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onToggleUserStatus: (userId: string, currentStatus: boolean) => void;
  onAddUser: () => void;
}

export const UserManagement: React.FC<UserManagementProps> = ({
  users,
  userStats,
  loading,
  searchTerm,
  statusFilter,
  filteredUsers,
  currentUserId,
  onSearchChange,
  onStatusFilterChange,
  onToggleUserStatus,
  onAddUser
}) => {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm text-gray-600 font-medium">Total Cashiers</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-black font-bold">{userStats.totalCashierUsers || userStats.cashierUsers || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm text-gray-600 font-medium">Active Cashiers</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-black font-bold">{userStats.activeCashierUsers || userStats.cashierUsers || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm text-gray-600 font-medium">Managers</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-black font-bold">{userStats.managerUsers || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Cashier Management</CardTitle>
            <Button onClick={onAddUser} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Add Cashier
            </Button>
          </div>
          
          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search cashiers..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 text-black"
              />
            </div>
            <Select value={statusFilter} onValueChange={onStatusFilterChange}>
              <SelectTrigger className="w-full sm:w-40 bg-white border-gray-300 text-black">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="all" className="text-black">All Status</SelectItem>
                <SelectItem value="active" className="text-black">Active</SelectItem>
                <SelectItem value="inactive" className="text-black">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No cashiers found matching your criteria
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((userProfile, index) => (
                    <TableRow key={userProfile._id} className={index % 2 === 0 ? "bg-[#ececec]" : "bg-white"}>
                      <TableCell className="font-medium text-black">
                        {userProfile.firstName} {userProfile.lastName}
                      </TableCell>
                      <TableCell className="text-gray-700">{userProfile.username}</TableCell>
                      <TableCell className="text-gray-700">{userProfile.email}</TableCell>
                      <TableCell>
                        {userProfile.status === 'active' ? (
                          <Badge className="bg-green-600 text-white hover:bg-green-700">
                            Active
                          </Badge>
                        ) : userProfile.status === 'inactive' ? (
                          <span className="text-gray-600 px-2 py-1 text-sm">
                            Inactive
                          </span>
                        ) : (
                          <Badge className="bg-green-800 text-white hover:bg-green-900">
                            Deleted
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {new Date(userProfile.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onToggleUserStatus(userProfile._id, userProfile.status === 'active')}
                            disabled={userProfile._id === currentUserId} // Prevent admin from deactivating themselves
                          >
                            {userProfile.status === 'active' ? (
                              <>
                                <UserX className="mr-2 h-4 w-4" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <UserCheck className="mr-2 h-4 w-4" />
                                Activate
                              </>
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
