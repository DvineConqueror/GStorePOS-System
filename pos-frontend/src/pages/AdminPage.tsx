import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { UserManagement } from '@/components/admin/UserManagement';
import { ProductManagement } from '@/components/admin/ProductManagement';
import NotificationAlert from '@/components/notifications/NotificationAlert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UnifiedAnalytics } from '@/components/pos/UnifiedAnalytics';
import { TransactionHistory } from '@/components/pos/TransactionHistory';
import { CashierProductCatalog } from '@/components/pos/CashierProductCatalog';
import { Cart } from '@/components/pos/Cart';
import { CheckoutDialog } from '@/components/pos/CheckoutDialog';
import { PosProvider } from '@/context/PosContext';
import { Users, Package, BarChart3, ShoppingCart, LogOut} from 'lucide-react';
import { ManagerLogo } from '@/components/ui/BrandLogo';
import { Button } from '@/components/ui/button';
import { useUsers } from '@/hooks/useUsers';
import NotificationButton from '@/components/notifications/NotificationButton';

const AdminPageContent = () => {
  const { user, signOut } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // React Query hooks
  const { data: usersData, isLoading: usersLoading } = useUsers();
  
  // Local state for user management
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Extract data from API response
  const users = usersData?.data || [];
  
  // Filter users based on search term and status
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.username.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });
  
  // Calculate user stats
  const userStats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.status === 'active').length,
    inactiveUsers: users.filter(u => u.status === 'inactive').length,
    cashierUsers: users.filter(u => u.role === 'cashier').length,
    managerUsers: users.filter(u => u.role === 'manager').length,
    activeCashierUsers: users.filter(u => u.role === 'cashier' && u.status === 'active').length,
  };
  
  // Get highlight parameters from URL
  const shouldHighlightPending = searchParams.get('highlight') === 'pending';
  const highlightUserId = searchParams.get('userId');
  const shouldHighlightLowStock = searchParams.get('highlight') === 'low-stock';
  const highlightProductId = searchParams.get('productId');
  const highlightAllLowStock = shouldHighlightLowStock && !highlightProductId; // View All Products mode
  
  // State to control which tab is active
  const [activeTab, setActiveTab] = useState('users');
  
  // Switch to users tab when highlighting pending users
  useEffect(() => {
    if (shouldHighlightPending) {
      setActiveTab('users');
    }
  }, [shouldHighlightPending]);

  // Switch to products tab when highlighting low stock products (single or all)
  useEffect(() => {
    if (shouldHighlightLowStock) {
      setActiveTab('products');
    }
  }, [shouldHighlightLowStock]);
  
  // Clear highlight parameters for pending users after 10 seconds
  useEffect(() => {
    if (shouldHighlightPending) {
      const timer = setTimeout(() => {
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.delete('highlight');
        newSearchParams.delete('userId');
        setSearchParams(newSearchParams, { replace: true });
      }, 10000); // 10 seconds
      
      return () => clearTimeout(timer);
    }
  }, [shouldHighlightPending, searchParams, setSearchParams]);

  // Clear highlight parameters for low stock products after 10 seconds (both single and all modes)
  useEffect(() => {
    if (shouldHighlightLowStock) {
      const timer = setTimeout(() => {
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.delete('highlight');
        newSearchParams.delete('productId');
        setSearchParams(newSearchParams, { replace: true });
      }, 10000); // 10 seconds
      
      return () => clearTimeout(timer);
    }
  }, [shouldHighlightLowStock, searchParams, setSearchParams]);

  // Function to clear highlight manually
  const handleClearHighlight = () => {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.delete('highlight');
    newSearchParams.delete('userId');
    newSearchParams.delete('productId');
    setSearchParams(newSearchParams, { replace: true });
  };



  if (!user || (user.role !== 'manager' && user.role !== 'superadmin')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Access Denied</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">You don't have manager privileges.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <ManagerLogo size="lg" />
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-gray-700">
              <Users className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">{user?.firstName} {user?.lastName}</span>
            </div>
            <NotificationButton />
            <Button
              variant="ghost"
              size="icon"
              onClick={signOut}
              className=" text-green-600 hover:text-red-600"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Tabs for different admin sections */}
        <Tabs 
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 bg-white">
            <TabsTrigger value="users" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm bg-white text-gray-700 hover:bg-green-50 data-[state=active]:bg-green-100 data-[state=active]:text-green-700">
              <Users className="h-3 w-3 sm:h-4 sm:w-4 text-gray-700" />
              <span className="hidden sm:inline text-gray-700">Cashier Management</span>
              <span className="sm:hidden text-gray-700">Cashiers</span>
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm bg-white text-gray-700 hover:bg-green-50 data-[state=active]:bg-green-100 data-[state=active]:text-green-700">
              <Package className="h-3 w-3 sm:h-4 sm:w-4 text-gray-700" />
              <span className="hidden sm:inline text-gray-700">Product Management</span>
              <span className="sm:hidden text-gray-700">Products</span>
            </TabsTrigger>
            <TabsTrigger value="pos" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm bg-white text-gray-700 hover:bg-green-50 data-[state=active]:bg-green-100 data-[state=active]:text-green-700">
              <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4 text-gray-700" />
              <span className="hidden sm:inline text-gray-700">POS System</span>
              <span className="sm:hidden text-gray-700">POS</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm bg-white text-gray-700 hover:bg-green-50 data-[state=active]:bg-green-100 data-[state=active]:text-green-700">
              <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 text-gray-700" />
              <span className="hidden sm:inline text-gray-700">Analytics</span>
              <span className="sm:hidden text-gray-700">Analytics</span>
            </TabsTrigger>
          </TabsList>

          {/* User Management Tab */}
          <TabsContent value="users" className="space-y-6">
            <UserManagement
              users={users}
              userStats={userStats}
              loading={usersLoading}
              searchTerm={searchTerm}
              statusFilter={statusFilter}
              filteredUsers={filteredUsers}
              currentUserId={user?.id || ''}
              onSearchChange={setSearchTerm}
              onStatusFilterChange={setStatusFilter}
              onToggleUserStatus={() => {}} // TODO: Implement with React Query mutation
              onAddUser={() => {}} // TODO: Implement with React Query mutation
              shouldHighlightPending={shouldHighlightPending}
              highlightUserId={highlightUserId}
              onClearHighlight={handleClearHighlight}
            />
          </TabsContent>

          {/* Product Management Tab */}
          <TabsContent value="products" className="space-y-6">
            <ProductManagement 
              highlightProductId={shouldHighlightLowStock ? highlightProductId : undefined}
              highlightAllLowStock={highlightAllLowStock}
              onClearHighlight={handleClearHighlight}
            />
          </TabsContent>

          {/* POS System Tab */}
          <TabsContent value="pos" className="space-y-6">
            <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:space-x-6">
              <div className="flex-1 md:w-2/3 bg-white rounded-xl shadow-sm border border-gray-100 p-4 min-h-0">
                <CashierProductCatalog />
              </div>
              <div className="w-full md:w-1/3 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <Cart />
              </div>
              <CheckoutDialog />
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <UnifiedAnalytics />
          </TabsContent>

        </Tabs>
      </div>
      
      {/* Edit Product Form - Now handled internally by ProductManagement */}
      
      {/* Notification Alert */}
      <NotificationAlert />
    </div>
  );
};

const AdminPage = () => {
  return (
    <PosProvider>
      <AdminPageContent />
    </PosProvider>
  );
};

export default AdminPage;