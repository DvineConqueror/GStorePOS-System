import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { useUserManagement } from '@/hooks/useUserManagement';
import { useProductManagement } from '@/hooks/useProductManagement';
import { useAdminStats } from '@/hooks/useAdminStats';
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
import { Users, Package, BarChart3, ShoppingCart } from 'lucide-react';

const AdminPageContent = () => {
  const { user, signOut } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Custom hooks for different concerns
  const userManagement = useUserManagement();
  const productManagement = useProductManagement();
  const adminStats = useAdminStats();
  
  // Get highlight parameters from URL
  const shouldHighlightPending = searchParams.get('highlight') === 'pending';
  const highlightUserId = searchParams.get('userId');
  
  // State to control which tab is active
  const [activeTab, setActiveTab] = useState('users');
  
  // Switch to users tab when highlighting is active (one-time effect)
  useEffect(() => {
    if (shouldHighlightPending) {
      setActiveTab('users');
    }
  }, [shouldHighlightPending]);
  
  // Clear highlight parameters when navigating away from users tab
  useEffect(() => {
    if (shouldHighlightPending) {
      // Set a timeout to clear highlight after 10 seconds
      const timer = setTimeout(() => {
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.delete('highlight');
        newSearchParams.delete('userId');
        setSearchParams(newSearchParams, { replace: true });
      }, 10000); // 10 seconds
      
      return () => clearTimeout(timer);
    }
  }, [shouldHighlightPending, searchParams, setSearchParams]);

  // Function to clear highlight manually
  const handleClearHighlight = () => {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.delete('highlight');
    newSearchParams.delete('userId');
    setSearchParams(newSearchParams, { replace: true });
  };

  useEffect(() => {
    if (user?.role === 'manager' || user?.role === 'superadmin') {
      userManagement.fetchUsers();
      userManagement.fetchUserStats();
      productManagement.fetchProducts();
    }
  }, [user]);

  useEffect(() => {
    if (user?.role === 'manager' || user?.role === 'superadmin') {
      userManagement.fetchUsers();
    }
  }, [userManagement.searchTerm, userManagement.statusFilter]);


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
    <div className="min-h-screen bg-[#ececec] p-6">
      <div className="max-w-7xl mx-auto">
        <AdminHeader 
          userName={`${user?.firstName} ${user?.lastName}`}
          onLogout={signOut}
        />

        {/* Tabs for different admin sections */}
        <Tabs 
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 bg-white">
            <TabsTrigger value="users" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm data-[state=active]:bg-green-100 data-[state=active]:text-green-700">
              <Users className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
              <span className="hidden sm:inline">Cashier Management</span>
              <span className="sm:hidden">Cashiers</span>
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm data-[state=active]:bg-green-100 data-[state=active]:text-green-700">
              <Package className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
              <span className="hidden sm:inline">Product Management</span>
              <span className="sm:hidden">Products</span>
            </TabsTrigger>
            <TabsTrigger value="pos" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm data-[state=active]:bg-green-100 data-[state=active]:text-green-700">
              <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
              <span className="hidden sm:inline">POS System</span>
              <span className="sm:hidden">POS</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm data-[state=active]:bg-green-100 data-[state=active]:text-green-700">
              <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
              <span className="hidden sm:inline">Analytics</span>
              <span className="sm:hidden">Analytics</span>
            </TabsTrigger>
          </TabsList>

          {/* User Management Tab */}
          <TabsContent value="users" className="space-y-6">
            <UserManagement
              users={userManagement.users}
              userStats={userManagement.userStats}
              loading={userManagement.loading}
              searchTerm={userManagement.searchTerm}
              statusFilter={userManagement.statusFilter}
              filteredUsers={userManagement.filteredUsers}
              currentUserId={user?.id || ''}
              onSearchChange={userManagement.setSearchTerm}
              onStatusFilterChange={userManagement.setStatusFilter}
              onToggleUserStatus={userManagement.toggleUserStatus}
              onAddUser={userManagement.addUser}
              shouldHighlightPending={shouldHighlightPending}
              highlightUserId={highlightUserId}
              onClearHighlight={handleClearHighlight}
            />
          </TabsContent>

          {/* Product Management Tab */}
          <TabsContent value="products" className="space-y-6">
            <ProductManagement
              products={productManagement.products}
              loading={productManagement.loading}
              showAddProductForm={productManagement.showAddProductForm}
              newProduct={productManagement.newProduct}
              productSearchTerm={productManagement.productSearchTerm}
              productCategoryFilter={productManagement.productCategoryFilter}
              productStatusFilter={productManagement.productStatusFilter}
              filteredProducts={productManagement.filteredProducts}
              uniqueCategories={productManagement.getUniqueCategories()}
              onSearchChange={productManagement.setProductSearchTerm}
              onCategoryFilterChange={productManagement.setProductCategoryFilter}
              onStatusFilterChange={productManagement.setProductStatusFilter}
              onShowAddForm={productManagement.setShowAddProductForm}
              onNewProductChange={productManagement.setNewProduct}
              onImageChange={productManagement.handleImageChange}
              onAddProduct={productManagement.handleAddProduct}
              onToggleProductStatus={productManagement.handleToggleProductStatus}
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