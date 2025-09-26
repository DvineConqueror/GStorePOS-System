import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useUserManagement } from '@/hooks/useUserManagement';
import { useProductManagement } from '@/hooks/useProductManagement';
import { useAdminStats } from '@/hooks/useAdminStats';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { UserManagement } from '@/components/admin/UserManagement';
import { ProductManagement } from '@/components/admin/ProductManagement';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnalyticsCharts } from '@/components/pos/AnalyticsCharts';
import { CashierAnalytics } from '@/components/pos/CashierAnalytics';
import { TransactionHistory } from '@/components/pos/TransactionHistory';
import { CashierProductCatalog } from '@/components/pos/CashierProductCatalog';
import { Cart } from '@/components/pos/Cart';
import { CheckoutDialog } from '@/components/pos/CheckoutDialog';
import { PosProvider } from '@/context/PosContext';
import { Users, Package, BarChart3, ShoppingCart } from 'lucide-react';

const AdminPageContent = () => {
  const { user, signOut } = useAuth();
  
  // Custom hooks for different concerns
  const userManagement = useUserManagement();
  const productManagement = useProductManagement();
  const adminStats = useAdminStats();

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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <AdminHeader 
          userName={`${user?.firstName} ${user?.lastName}`}
          onLogout={signOut}
        />

        {/* Tabs for different admin sections */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
            <TabsTrigger value="users" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <Users className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Cashier Management</span>
              <span className="sm:hidden">Cashiers</span>
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <Package className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Product Management</span>
              <span className="sm:hidden">Products</span>
            </TabsTrigger>
            <TabsTrigger value="pos" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">POS System</span>
              <span className="sm:hidden">POS</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div className="col-span-1 lg:col-span-2">
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Sales Analytics</CardTitle>
                  </CardHeader>
                  <CardContent className="bg-slate-800">
                    <AnalyticsCharts />
                  </CardContent>
                </Card>
              </div>
              <div className="col-span-1">
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Cashier Performance</CardTitle>
                  </CardHeader>
                  <CardContent className="bg-slate-800">
                    <CashierAnalytics />
                  </CardContent>
                </Card>
              </div>
              <div className="col-span-1">
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Transaction History</CardTitle>
                  </CardHeader>
                  <CardContent className="bg-slate-800">
                    <TransactionHistory />
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

        </Tabs>
      </div>
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