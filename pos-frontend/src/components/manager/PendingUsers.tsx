import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  UserCheck, 
  UserX, 
  Search, 
  CheckCircle,
  XCircle,
  Clock,
  User,
  Mail,
  Calendar,
  Users
} from 'lucide-react';
import { useApproval } from '@/hooks/useApproval';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';

interface PendingUsersProps {
  onApprovalChange?: () => void;
}

export default function PendingUsers({ onApprovalChange }: PendingUsersProps) {
  const { user } = useAuth();
  const {
    pendingUsers,
    loading,
    approvingUsers,
    stats,
    fetchPendingUsers,
    approveUser,
    rejectUser,
    bulkApproveUsers,
  } = useApproval({ userRole: user?.role as 'superadmin' | 'manager' });

  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [bulkAction, setBulkAction] = useState<'approve' | 'reject' | ''>('');

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const handleApproveUser = async (userId: string) => {
    const success = await approveUser(userId);
    if (success) {
      onApprovalChange?.();
    }
  };

  const handleRejectUser = async (userId: string) => {
    const success = await rejectUser(userId);
    if (success) {
      onApprovalChange?.();
    }
  };

  const handleBulkAction = async () => {
    if (selectedUsers.length === 0 || !bulkAction) {
      return;
    }

    const success = await bulkApproveUsers(selectedUsers, bulkAction === 'approve');
    if (success) {
      setSelectedUsers([]);
      setBulkAction('');
      onApprovalChange?.();
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

  // Filter users based on search term
  const filteredUsers = pendingUsers.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <h1 className="text-2xl font-bold text-white">Pending Cashier Approvals</h1>
          <p className="text-slate-400">
            Review and approve new cashier registrations
          </p>
        </div>
        <Badge variant="destructive" className="bg-yellow-600 hover:bg-yellow-700">
          <Clock className="h-3 w-3 mr-1" />
          {stats.totalPending} Pending
        </Badge>
      </div>

      {/* Search */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search cashiers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-700 border-slate-600 text-white"
            />
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
                  {selectedUsers.length} cashier(s) selected
                </span>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    onClick={() => setBulkAction('approve')}
                    className={`${bulkAction === 'approve' ? 'bg-green-600' : 'bg-slate-700'} hover:bg-green-700`}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Approve All
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setBulkAction('reject')}
                    className={`${bulkAction === 'reject' ? 'bg-red-600' : 'bg-slate-700'} hover:bg-red-700`}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Reject All
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleBulkAction}
                    disabled={!bulkAction}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Execute
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

      {/* Users List */}
      <div className="space-y-4">
        {filteredUsers.length === 0 ? (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-8 text-center">
              <UserCheck className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No Pending Approvals</h3>
              <p className="text-slate-400">
                All cashier accounts have been reviewed and approved.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Select All */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                  <span className="text-white font-medium">
                    Select All ({filteredUsers.length} cashiers)
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Individual Users */}
            {filteredUsers.map((user) => (
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
                        <Badge className="bg-green-600 hover:bg-green-700">
                          Cashier
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
                          disabled={approvingUsers.has(user._id)}
                          className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          {approvingUsers.has(user._id) ? 'Approving...' : 'Approve'}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRejectUser(user._id)}
                          disabled={approvingUsers.has(user._id)}
                          className="bg-red-600 hover:bg-red-700 disabled:opacity-50"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          {approvingUsers.has(user._id) ? 'Rejecting...' : 'Reject'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
