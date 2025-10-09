import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Clock, CheckCircle, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { RecentUser } from '@/types/superadmin';
import { useNavigate } from 'react-router-dom';

interface RecentUsersCardProps {
  recentUsers: RecentUser[];
  loading?: boolean;
}

export const RecentUsersCard: React.FC<RecentUsersCardProps> = ({ recentUsers, loading = false }) => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 5;
  
  const totalPages = Math.ceil(recentUsers.length / usersPerPage);
  const startIndex = (currentPage - 1) * usersPerPage;
  const endIndex = startIndex + usersPerPage;
  const currentUsers = recentUsers.slice(startIndex, endIndex);

  const getStatusIcon = (status: string, isApproved: boolean) => {
    if (status === 'deleted') {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
    if (isApproved) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    return <Clock className="h-4 w-4 text-orange-500" />;
  };

  const getStatusBadge = (status: string, isApproved: boolean) => {
    if (status === 'deleted') {
      return <Badge variant="destructive" className="text-xs">Deleted</Badge>;
    }
    if (isApproved) {
      return <Badge variant="default" className="bg-green-100 text-green-800 text-xs">Approved</Badge>;
    }
    return <Badge variant="secondary" className="bg-orange-100 text-orange-800 text-xs">Pending</Badge>;
  };

  const getRoleBadge = (role: string) => {
    const roleColors = {
      superadmin: 'bg-purple-100 text-purple-800',
      manager: 'bg-blue-100 text-blue-800',
      cashier: 'bg-green-100 text-green-800'
    };
    
    return (
      <Badge variant="outline" className={`text-xs ${roleColors[role as keyof typeof roleColors] || 'bg-gray-100 text-gray-800'}`}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-green-600" />
            Recent Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3 animate-pulse">
                <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="h-6 bg-gray-200 rounded w-16"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-green-600" />
            Recent Users
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/superadmin/users')}
          >
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {recentUsers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>No recent users found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {currentUsers.map((user) => (
              <div key={user._id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                    {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user.firstName} {user.lastName}
                    </p>
                    {getStatusIcon(user.status, user.isApproved)}
                  </div>
                  
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    {getRoleBadge(user.role)}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {getStatusBadge(user.status, user.isApproved)}
                    <p className="text-xs text-gray-400">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-500">
                  Showing {startIndex + 1} to {Math.min(endIndex, recentUsers.length)} of {recentUsers.length} users
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        variant={page === currentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className="w-8 h-8 p-0"
                      >
                        {page}
                      </Button>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
